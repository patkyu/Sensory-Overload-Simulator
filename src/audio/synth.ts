/**
 * Placeholder sounds, synthesized as raw samples. Used only when the real file
 * (public/audio/<scene>/<name>.mp3) is missing or fails to decode.
 * Every generator returns mono samples; loops are built to repeat seamlessly.
 */
import type { SynthKind } from '../scenes/types';

type Gen = (sr: number) => Float32Array;

/** Deterministic PRNG so placeholders sound the same every time. */
function rng(seed: number) {
  let s = seed >>> 0;
  return () => {
    s = (s * 1664525 + 1013904223) >>> 0;
    return s / 4294967296;
  };
}

/** RBJ biquad filter, applied in place. */
function biquad(x: Float32Array, sr: number, type: 'lowpass' | 'bandpass' | 'highpass', f: number, q = 0.707) {
  const w = (2 * Math.PI * f) / sr;
  const cos = Math.cos(w);
  const alpha = Math.sin(w) / (2 * q);
  let b0: number, b1: number, b2: number;
  if (type === 'lowpass') {
    b0 = (1 - cos) / 2;
    b1 = 1 - cos;
    b2 = b0;
  } else if (type === 'highpass') {
    b0 = (1 + cos) / 2;
    b1 = -(1 + cos);
    b2 = b0;
  } else {
    b0 = alpha;
    b1 = 0;
    b2 = -alpha;
  }
  const a0 = 1 + alpha;
  const a1 = -2 * cos;
  const a2 = 1 - alpha;
  let x1 = 0,
    x2 = 0,
    y1 = 0,
    y2 = 0;
  // Two passes so the filter state is "warm" at the loop seam.
  for (let pass = 0; pass < 2; pass++) {
    for (let i = 0; i < x.length; i++) {
      const xi = x[i];
      const y = (b0 * xi + b1 * x1 + b2 * x2 - a1 * y1 - a2 * y2) / a0;
      x2 = x1;
      x1 = xi;
      y2 = y1;
      y1 = y;
      if (pass === 1) x[i] = y;
    }
  }
  return x;
}

function noise(n: number, seed: number) {
  const r = rng(seed);
  const a = new Float32Array(n);
  for (let i = 0; i < n; i++) a[i] = r() * 2 - 1;
  return a;
}

function normalize(x: Float32Array, peak: number) {
  let m = 0;
  for (let i = 0; i < x.length; i++) m = Math.max(m, Math.abs(x[i]));
  if (m > 0) for (let i = 0; i < x.length; i++) x[i] *= peak / m;
  return x;
}

function mix(into: Float32Array, src: Float32Array, at: number, gain = 1) {
  for (let i = 0; i < src.length && at + i < into.length; i++) into[at + i] += src[i] * gain;
}

/** A short tone with attack/decay envelope. */
function tone(sr: number, dur: number, freqs: number[], opts: { attack?: number; decay?: number; shape?: 'sine' | 'soft-square' } = {}) {
  const n = Math.floor(dur * sr);
  const a = new Float32Array(n);
  const att = (opts.attack ?? 0.01) * sr;
  const dec = (opts.decay ?? 0.05) * sr;
  for (let i = 0; i < n; i++) {
    const t = i / sr;
    let v = 0;
    for (const f of freqs) {
      v += Math.sin(2 * Math.PI * f * t);
      if (opts.shape === 'soft-square') v += Math.sin(2 * Math.PI * 3 * f * t) / 3 + Math.sin(2 * Math.PI * 5 * f * t) / 6;
    }
    const env = Math.min(1, i / att, (n - i) / dec);
    a[i] = (v / freqs.length) * env;
  }
  return a;
}

/** Voice-like syllables: a buzzy source through two formant filters. */
function babble(sr: number, dur: number, syllables: [number, number, number][], seed: number) {
  const n = Math.floor(dur * sr);
  const out = new Float32Array(n);
  const r = rng(seed);
  for (const [start, len, f0] of syllables) {
    const m = Math.floor(len * sr);
    const src = new Float32Array(m);
    let ph = 0;
    for (let i = 0; i < m; i++) {
      const f = f0 * (1 + 0.15 * Math.sin((Math.PI * i) / m)); // pitch arc
      ph += f / sr;
      const saw = 2 * (ph - Math.floor(ph)) - 1;
      const env = Math.sin((Math.PI * i) / m) ** 0.6;
      src[i] = (saw + (r() * 2 - 1) * 0.15) * env;
    }
    const f1 = biquad(src.slice(), sr, 'bandpass', 500 + r() * 400, 4);
    const f2 = biquad(src.slice(), sr, 'bandpass', 1400 + r() * 900, 5);
    for (let i = 0; i < m; i++) src[i] = f1[i] + 0.6 * f2[i];
    mix(out, src, Math.floor(start * sr));
  }
  return out;
}

const gens: Record<SynthKind, Gen> = {
  // Jeepney ambient: diesel rumble + road noise. 4 s, 48 Hz → whole cycles.
  engine: (sr) => {
    const n = 4 * sr;
    const road = biquad(noise(n, 1), sr, 'lowpass', 300);
    const a = new Float32Array(n);
    for (let i = 0; i < n; i++) {
      const t = i / sr;
      const wob = 1 + 0.15 * Math.sin(2 * Math.PI * 2 * t);
      a[i] = wob * (Math.sin(2 * Math.PI * 48 * t) + 0.5 * Math.sin(2 * Math.PI * 96 * t) + 0.3 * Math.sin(2 * Math.PI * 144 * t)) * 0.4 + road[i] * 2;
    }
    return normalize(a, 0.5);
  },
  // Mall ambient: air-con hiss + faint 60 Hz hum.
  aircon: (sr) => {
    const n = 4 * sr;
    const a = biquad(noise(n, 2), sr, 'lowpass', 900);
    for (let i = 0; i < n; i++) a[i] = a[i] * 3 + 0.08 * Math.sin((2 * Math.PI * 60 * i) / sr);
    return normalize(a, 0.4);
  },
  horn: (sr) => {
    const a = new Float32Array(6 * sr);
    const honk = (d: number) => tone(sr, d, [415, 523], { attack: 0.02, decay: 0.04, shape: 'soft-square' });
    mix(a, honk(0.45), Math.floor(0.3 * sr));
    mix(a, honk(0.18), Math.floor(3.0 * sr));
    mix(a, honk(0.18), Math.floor(3.3 * sr));
    mix(a, tone(sr, 0.6, [349, 440], { shape: 'soft-square', attack: 0.03, decay: 0.1 }), Math.floor(4.6 * sr), 0.7);
    return normalize(a, 0.6);
  },
  // "Cu-bao! Cu-bao! Sa-kay na!"
  barker: (sr) => {
    const syl: [number, number, number][] = [
      [0.2, 0.18, 210], [0.4, 0.35, 250],
      [0.9, 0.18, 210], [1.1, 0.35, 250],
      [1.8, 0.15, 200], [1.97, 0.15, 220], [2.15, 0.4, 260],
    ];
    return normalize(babble(sr, 4, syl, 3), 0.6);
  },
  // Tinny radio: a looping 8-note riff through a narrow band, plus hiss.
  radio: (sr) => {
    const n = 4 * sr;
    const a = new Float32Array(n);
    const notes = [523, 659, 784, 659, 587, 698, 880, 698];
    notes.forEach((f, k) => mix(a, tone(sr, 0.45, [f, f / 2], { shape: 'soft-square', decay: 0.1 }), Math.floor(k * 0.5 * sr)));
    for (let k = 0; k < 8; k++) mix(a, biquad(noise(Math.floor(0.08 * sr), 10 + k), sr, 'highpass', 3000), Math.floor((k * 0.5 + 0.25) * sr), 0.6);
    biquad(a, sr, 'bandpass', 1200, 0.8);
    const h = biquad(noise(n, 4), sr, 'highpass', 2000);
    for (let i = 0; i < n; i++) a[i] += h[i] * 0.03;
    return normalize(a, 0.5);
  },
  coins: (sr) => {
    const a = new Float32Array(3 * sr);
    const r = rng(5);
    for (const at of [0.2, 0.34, 1.3, 1.42, 1.5, 2.4]) {
      const f = 2400 + r() * 1500;
      const m = Math.floor(0.12 * sr);
      const c = new Float32Array(m);
      for (let i = 0; i < m; i++) {
        const t = i / sr;
        c[i] = Math.exp(-t * 40) * (Math.sin(2 * Math.PI * f * t) + 0.6 * Math.sin(2 * Math.PI * f * 1.48 * t) + 0.3 * Math.sin(2 * Math.PI * f * 2.1 * t));
      }
      mix(a, c, Math.floor(at * sr));
    }
    return normalize(a, 0.5);
  },
  // One-shot: tyre screech (softened) + a thump.
  brake: (sr) => {
    const n = Math.floor(1.6 * sr);
    const a = new Float32Array(n);
    const nz = biquad(noise(n, 6), sr, 'bandpass', 2200, 3);
    for (let i = 0; i < n; i++) {
      const t = i / sr;
      const env = Math.min(1, t / 0.08) * Math.max(0, 1 - t / 1.3);
      a[i] = env * (0.5 * Math.sin(2 * Math.PI * (1700 + 120 * Math.sin(2 * Math.PI * 7 * t)) * t) + nz[i] * 2);
      if (t > 1.2) a[i] += Math.exp(-(t - 1.2) * 12) * Math.sin(2 * Math.PI * 70 * t);
    }
    return normalize(a, 0.55);
  },
  // Upbeat mall pop: chords + kick at 120 bpm, 4 s = 2 bars.
  music: (sr) => {
    const a = new Float32Array(4 * sr);
    const chords = [
      [262, 330, 392], [349, 440, 523], [392, 494, 587], [262, 330, 392],
    ];
    chords.forEach((c, k) => {
      mix(a, tone(sr, 0.95, c, { attack: 0.02, decay: 0.3 }), Math.floor(k * sr), 0.5);
      mix(a, tone(sr, 0.2, [c[2] * 2], { decay: 0.1 }), Math.floor((k + 0.5) * sr), 0.25);
    });
    for (let b = 0; b < 8; b++) {
      const m = Math.floor(0.15 * sr);
      const kick = new Float32Array(m);
      for (let i = 0; i < m; i++) {
        const t = i / sr;
        kick[i] = Math.exp(-t * 25) * Math.sin(2 * Math.PI * (60 + 80 * Math.exp(-t * 40)) * t);
      }
      mix(a, kick, Math.floor(b * 0.5 * sr), 0.8);
    }
    return normalize(a, 0.55);
  },
  // Ding-dong chime, then muffled announcement.
  pa: (sr) => {
    const a = new Float32Array(6 * sr);
    mix(a, tone(sr, 0.7, [659], { decay: 0.6 }), 0, 0.6);
    mix(a, tone(sr, 0.9, [523], { decay: 0.8 }), Math.floor(0.55 * sr), 0.6);
    const syl: [number, number, number][] = [];
    const r = rng(7);
    let t = 1.7;
    while (t < 5.4) {
      const len = 0.12 + r() * 0.15;
      syl.push([t, len, 150 + r() * 40]);
      t += len + 0.03 + (r() < 0.15 ? 0.25 : 0);
    }
    const voice = biquad(babble(sr, 6, syl, 8), sr, 'bandpass', 1000, 0.7);
    mix(a, normalize(voice, 0.5), 0);
    return normalize(a, 0.55);
  },
  // Many overlapping voices.
  chatter: (sr) => {
    const a = new Float32Array(4 * sr);
    const r = rng(9);
    for (let v = 0; v < 7; v++) {
      const syl: [number, number, number][] = [];
      let t = r() * 0.5;
      const f0 = 120 + r() * 140;
      while (t < 3.7) {
        const len = 0.1 + r() * 0.18;
        syl.push([t, len, f0 * (0.9 + r() * 0.2)]);
        t += len + 0.05 + (r() < 0.2 ? 0.4 : 0);
      }
      mix(a, babble(sr, 4, syl, 20 + v), 0, 0.4 + r() * 0.4);
    }
    return normalize(a, 0.5);
  },
  // One-shot: four soft-square beeps (not piercing), then a chime.
  alarm: (sr) => {
    const a = new Float32Array(Math.floor(2.8 * sr));
    for (let k = 0; k < 4; k++) mix(a, tone(sr, 0.22, [880], { shape: 'soft-square', attack: 0.01, decay: 0.03 }), Math.floor(k * 0.4 * sr));
    mix(a, tone(sr, 0.8, [784, 988], { decay: 0.6 }), Math.floor(1.8 * sr), 0.6);
    return normalize(a, 0.5);
  },
};

export function synthesize(ctx: BaseAudioContext, kind: SynthKind): AudioBuffer {
  const data = gens[kind](ctx.sampleRate);
  const buf = ctx.createBuffer(1, data.length, ctx.sampleRate);
  buf.getChannelData(0).set(data);
  return buf;
}
