/**
 * Web Audio engine.
 *
 *   sound source ─┐
 *   sound source ─┼─► soundGain ─► stressorGain (one per stressor) ─┐
 *   ambient ──────────────────────► ambientGain ────────────────────┼─► bus ─► limiter ─► fade ─► cap ─► speakers
 *
 * - `cap` is the hard volume cap: it can never exceed MASTER_CAP (GENTLE_CAP in
 *   gentle mode, 0 when muted).
 * - `fade` is the start/stop envelope (0–1): audio starts low and rises over
 *   START_RAMP_MS; Stop takes it to 0 in under a second.
 * - The two are separate nodes so a gentle/mute change can never cut short the
 *   gentle start, and a Stop always wins.
 * - Every change is a 1–2 s linear ramp; nothing cuts in harshly.
 * - A missing/undecodable file falls back to a synthesized placeholder.
 */
import type { SceneConfig, SoundDef, StressorId } from '../scenes/types';
import { synthesize } from './synth';

/** Hard volume caps (linear gain on the master bus). */
export const MASTER_CAP = 0.5;
export const GENTLE_CAP = 0.28;
/** Stressor levels are scaled down in gentle mode. */
export const GENTLE_STRESSOR_SCALE = 0.5;
/** Master ramps from silence to the cap over this long at scene start. */
export const START_RAMP_MS = 4000;

type AC = typeof AudioContext;

interface SceneGraph {
  scene: SceneConfig;
  ambientGain: GainNode;
  stressorGains: Map<StressorId, GainNode>;
  soundStressor: Map<string, StressorId>;
  levels: Map<StressorId, number>;
  sources: AudioBufferSourceNode[];
  ended: boolean;
}

function decode(ctx: BaseAudioContext, data: ArrayBuffer): Promise<AudioBuffer> {
  // Callback form for older Safari.
  return new Promise((resolve, reject) => {
    const p = ctx.decodeAudioData(data, resolve, reject);
    if (p && typeof p.then === 'function') p.then(resolve, reject);
  });
}

class AudioEngine {
  ctx: AudioContext | null = null;
  private fade: GainNode | null = null;
  private master: GainNode | null = null;
  private bus: GainNode | null = null;
  private graph: SceneGraph | null = null;
  private buffers = new Map<string, Promise<AudioBuffer>>();
  private gentle = false;
  private muted = false;
  /** Which buffers came from the synth fallback (for the dev console / README checklist). */
  readonly placeholders = new Set<string>();

  /** Call synchronously inside a click/tap handler. Required by iOS Safari. */
  unlock(): void {
    try {
      if (!this.ctx) {
        const Ctor: AC = window.AudioContext ?? (window as unknown as { webkitAudioContext: AC }).webkitAudioContext;
        this.ctx = new Ctor();
        this.buildMasterChain();
        document.addEventListener('visibilitychange', () => {
          if (!this.ctx) return;
          if (document.hidden) void this.ctx.suspend();
          else void this.ctx.resume();
        });
      }
      if (this.ctx.state !== 'running') void this.ctx.resume();
      // Playing a 1-sample silent buffer inside the gesture is what fully unlocks iOS.
      const s = this.ctx.createBufferSource();
      s.buffer = this.ctx.createBuffer(1, 1, this.ctx.sampleRate);
      s.connect(this.ctx.destination);
      s.start(0);
    } catch {
      /* No Web Audio: the experience still works with captions. */
    }
  }

  private buildMasterChain() {
    const ctx = this.ctx!;
    this.master = ctx.createGain();
    this.master.gain.value = this.cap();
    this.fade = ctx.createGain();
    this.fade.gain.value = 0;
    const limiter = ctx.createDynamicsCompressor();
    limiter.threshold.value = -14;
    limiter.knee.value = 6;
    limiter.ratio.value = 20;
    limiter.attack.value = 0.003;
    limiter.release.value = 0.25;
    this.bus = ctx.createGain();
    this.bus.connect(limiter);
    limiter.connect(this.fade);
    this.fade.connect(this.master);
    this.master.connect(ctx.destination);
  }

  private cap(): number {
    if (this.muted) return 0;
    return Math.min(MASTER_CAP, this.gentle ? GENTLE_CAP : MASTER_CAP);
  }

  private ramp(param: AudioParam, target: number, ms: number) {
    const ctx = this.ctx;
    if (!ctx) return;
    const now = ctx.currentTime;
    param.cancelScheduledValues(now);
    param.setValueAtTime(param.value, now);
    param.linearRampToValueAtTime(target, now + Math.max(ms, 10) / 1000);
  }

  /** The cap stage never goes above the cap, whatever the caller asks for. */
  private applyCap(ms: number) {
    if (!this.master) return;
    this.ramp(this.master.gain, Math.max(0, Math.min(this.cap(), MASTER_CAP)), ms);
  }

  /** Start/stop envelope, 0–1. */
  private rampFade(target: number, ms: number) {
    if (!this.fade) return;
    this.ramp(this.fade.gain, Math.max(0, Math.min(1, target)), ms);
  }

  setGentle(g: boolean) {
    if (g === this.gentle) return;
    this.gentle = g;
    this.applyCap(800);
    if (this.graph && !this.graph.ended) for (const [id, lvl] of this.graph.levels) this.applyStressor(id, lvl, 800);
  }

  setMuted(m: boolean) {
    if (m === this.muted) return;
    this.muted = m;
    this.applyCap(300);
  }

  /** Fetch + decode a sound, falling back to the synthesized placeholder. Cached per src. */
  loadSound(def: SoundDef): Promise<AudioBuffer> {
    const ctx = this.ctx;
    if (!ctx) return Promise.reject(new Error('audio locked'));
    let p = this.buffers.get(def.src);
    if (!p) {
      p = (async () => {
        try {
          const res = await fetch(def.src);
          const type = res.headers.get('content-type') ?? '';
          // Dev servers answer missing files with index.html (200), so check the type too.
          if (!res.ok || type.includes('text/html')) throw new Error('missing');
          return await decode(ctx, await res.arrayBuffer());
        } catch {
          this.placeholders.add(def.src);
          return synthesize(ctx, def.synth);
        }
      })();
      this.buffers.set(def.src, p);
    }
    return p;
  }

  /**
   * Build the graph for a scene and start the ambient bed.
   * Resolves when the ambient bed is playing. Stressor loops start silently
   * (gain 0) as soon as each one has loaded, so they stay in sync.
   */
  async startScene(scene: SceneConfig): Promise<void> {
    this.endScene(0);
    const ctx = this.ctx;
    if (!ctx || !this.bus) return;
    const g: SceneGraph = {
      scene,
      ambientGain: ctx.createGain(),
      stressorGains: new Map(),
      soundStressor: new Map(),
      levels: new Map(),
      sources: [],
      ended: false,
    };
    g.ambientGain.gain.value = scene.ambient.gain;
    g.ambientGain.connect(this.bus);
    for (const s of scene.stressors) {
      const sg = ctx.createGain();
      sg.gain.value = 0;
      sg.connect(this.bus);
      g.stressorGains.set(s.id, sg);
      g.levels.set(s.id, 0);
      for (const snd of s.sounds) g.soundStressor.set(snd, s.id);
    }
    this.graph = g;

    // Start low and rise gently.
    const fg = this.fade!.gain;
    fg.cancelScheduledValues(ctx.currentTime);
    fg.setValueAtTime(0, ctx.currentTime);
    fg.linearRampToValueAtTime(1, ctx.currentTime + START_RAMP_MS / 1000);

    const amb = await this.loadSound(scene.ambient);
    if (g.ended) return;
    this.startLoop(amb, g.ambientGain, 1);

    // Fetch stressor sounds while the calm start plays.
    for (const def of scene.sounds) {
      if (!def.loop) {
        void this.loadSound(def);
        continue;
      }
      const sid = g.soundStressor.get(def.id);
      const sg = sid && g.stressorGains.get(sid);
      if (!sg) continue;
      void this.loadSound(def).then((buf) => {
        if (!g.ended) this.startLoop(buf, sg, def.gain);
      });
    }
  }

  private startLoop(buf: AudioBuffer, dest: AudioNode, gain: number) {
    const ctx = this.ctx!;
    const src = ctx.createBufferSource();
    src.buffer = buf;
    src.loop = true;
    const sg = ctx.createGain();
    sg.gain.value = gain;
    src.connect(sg).connect(dest);
    // Random offset so loops don't all line up.
    src.start(0, Math.random() * buf.duration);
    this.graph?.sources.push(src);
  }

  private applyStressor(id: StressorId, level: number, ms: number) {
    const g = this.graph;
    const node = g?.stressorGains.get(id);
    const def = g?.scene.stressors.find((s) => s.id === id);
    if (!g || !node || !def) return;
    const scale = this.gentle ? GENTLE_STRESSOR_SCALE : 1;
    this.ramp(node.gain, Math.max(0, Math.min(1, level)) * def.peakGain * scale, ms);
  }

  /** Set a stressor's level (0–1) with a ramp. */
  setStressor(id: StressorId, level: number, ms: number) {
    const g = this.graph;
    if (!g || g.ended) return;
    g.levels.set(id, level);
    this.applyStressor(id, level, ms);
  }

  /** Fire a one-shot sound (e.g. a hard brake) through its stressor's gain. */
  async playOneShot(soundId: string) {
    const g = this.graph;
    const def = g?.scene.sounds.find((s) => s.id === soundId);
    const sid = g?.soundStressor.get(soundId);
    const dest = sid && g?.stressorGains.get(sid);
    if (!g || !def || !dest || g.ended) return;
    const buf = await this.loadSound(def);
    if (g.ended) return;
    const ctx = this.ctx!;
    const src = ctx.createBufferSource();
    src.buffer = buf;
    const sg = ctx.createGain();
    sg.gain.value = def.gain;
    src.connect(sg).connect(dest);
    src.start();
    g.sources.push(src);
  }

  /** Fade everything to silence within `ms` (Stop button uses < 1000 ms). */
  fadeOutAll(ms: number) {
    this.rampFade(0, ms);
  }

  /** Fade out and tear down the scene graph. */
  endScene(ms = 800) {
    const g = this.graph;
    if (!g) return;
    g.ended = true;
    this.rampFade(0, ms);
    const stopAt = (this.ctx?.currentTime ?? 0) + ms / 1000 + 0.05;
    for (const s of g.sources) {
      try {
        s.stop(stopAt);
      } catch {
        /* already stopped */
      }
    }
    setTimeout(() => {
      g.ambientGain.disconnect();
      g.stressorGains.forEach((n) => n.disconnect());
    }, ms + 200);
    this.graph = null;
  }

  /** Effective output level = fade × cap (for tests / debugging). */
  get masterLevel(): number {
    return (this.fade?.gain.value ?? 0) * (this.master?.gain.value ?? 0);
  }
}

export const audio = new AudioEngine();
// Handy when tuning: window.__audio in the dev console.
if (import.meta.env.DEV && typeof window !== 'undefined') (window as unknown as { __audio: AudioEngine }).__audio = audio;
