import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { ScreenHeading } from '../components/ui';
import { SceneView, type ShakeRequest } from '../components/SceneView';
import { Captions, type CaptionItem } from '../components/Captions';
import { Task } from '../components/Task';
import { TogglePanel } from '../components/TogglePanel';
import { StopButton } from '../components/StopButton';
import { useT } from '../i18n';
import { useSession } from '../state/session';
import type { SceneId, SceneResult } from '../state/flow';
import type { SceneConfig, StressorId } from '../scenes/types';
import { loadScene } from '../scenes';
import { audio } from '../audio/engine';
import { track } from '../lib/analytics';
import { timeScale } from '../lib/params';

type Phase = 'loading' | 'calm' | 'buildup' | 'peak' | 'toggle';

/** Stop must reach silence + blank within 1 s. */
const STOP_FADE_MS = 800;
/** How long one-off event captions stay up. */
const EVENT_CAPTION_MS = 5000;

function preloadImages(srcs: string[]): Promise<void> {
  return Promise.all(
    srcs.map(
      (src) =>
        new Promise<void>((resolve) => {
          const img = new Image();
          img.onload = img.onerror = () => resolve();
          img.src = src;
        }),
    ),
  ).then(() => undefined);
}

export default function SceneRunner(props: { sceneId: SceneId; onStop: (r: SceneResult) => void; onDone: (r: SceneResult) => void }) {
  const [scene, setScene] = useState<SceneConfig | null>(null);
  const [error, setError] = useState(false);
  const t = useT();

  useEffect(() => {
    let alive = true;
    loadScene(props.sceneId).then(
      (s) => alive && setScene(s),
      () => alive && setError(true),
    );
    return () => {
      alive = false;
    };
  }, [props.sceneId]);

  if (error) return <p role="alert">{t('scene.loading')}</p>;
  if (!scene)
    return (
      <p role="status" className="py-10 text-center">
        {t('scene.loading')}
      </p>
    );
  return <Running scene={scene} {...props} />;
}

function Running({ scene, onStop, onDone }: { scene: SceneConfig; onStop: (r: SceneResult) => void; onDone: (r: SceneResult) => void }) {
  const t = useT();
  const { gentle, muted, setMuted } = useSession();
  const scale = useMemo(timeScale, []);
  const ids = useMemo(() => scene.stressors.map((s) => s.id), [scene]);
  const zero = useMemo(() => Object.fromEntries(ids.map((id) => [id, 0])) as Record<StressorId, number>, [ids]);

  const [phase, setPhase] = useState<Phase>('loading');
  const [levels, setLevels] = useState(zero);
  const [rampMs, setRampMs] = useState<Record<StressorId, number>>(() => ({ ...zero }));
  const [off, setOff] = useState<StressorId[]>([]);
  const [stopping, setStopping] = useState(false);
  const [shake, setShake] = useState<ShakeRequest | null>(null);
  const [events, setEvents] = useState<CaptionItem[]>([]);
  const [latest, setLatest] = useState<StressorId | null>(null);
  const [clock, setClock] = useState(0);

  const offRef = useRef<StressorId[]>([]);
  const stoppingRef = useRef(false);

  /** Raise or lower a stressor. Once switched off it can never come back. */
  const setLevel = useCallback(
    (id: StressorId, level: number, ms: number) => {
      if (level > 0 && offRef.current.includes(id)) return;
      if (stoppingRef.current) return;
      setLevels((l) => ({ ...l, [id]: level }));
      setRampMs((r) => ({ ...r, [id]: ms }));
      audio.setStressor(id, level, ms);
    },
    [],
  );

  // Load: art for the calm start + ambient bed first; stressor sounds stream in during the calm start.
  useEffect(() => {
    let alive = true;
    const srcs = scene.layers.flatMap((l) => (l.calmSrc ? [l.calmSrc, l.src] : [l.src]));
    Promise.all([preloadImages(srcs), audio.startScene(scene)]).then(() => {
      if (!alive) return;
      setPhase('calm');
      track('scene_start', { scene: scene.id, gentle });
    });
    return () => {
      alive = false;
      audio.endScene(300);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [scene]);

  // Phase timeline: calm → build-up → peak → toggle.
  useEffect(() => {
    if (stopping) return;
    const timers: number[] = [];
    const at = (ms: number, fn: () => void) => timers.push(window.setTimeout(fn, ms * scale));
    const { calmMs, buildupMs, peakMs } = scene.timings;
    if (phase !== 'loading') track('phase', { scene: scene.id, phase });
    if (phase === 'calm') at(calmMs, () => setPhase('buildup'));
    if (phase === 'buildup') {
      for (const s of scene.stressors) {
        at(s.startAtMs, () => {
          setLevel(s.id, 1, s.rampMs * scale);
          setLatest(s.id);
        });
      }
      at(buildupMs, () => setPhase('peak'));
    }
    if (phase === 'peak') {
      // Everything at once: anything not yet at full rises now.
      for (const s of scene.stressors) setLevel(s.id, 1, 2000 * scale);
      at(peakMs, () => setPhase('toggle'));
    }
    return () => timers.forEach(clearTimeout);
  }, [phase, scene, scale, setLevel, stopping]);

  // A 1 s clock to rotate smell/touch/speech cues.
  useEffect(() => {
    const id = window.setInterval(() => setClock((c) => c + 1), 1000);
    return () => clearInterval(id);
  }, []);

  // Sudden-change events (hard brake, alarm) while their stressor is on.
  useEffect(() => {
    if (stopping) return;
    const timers: number[] = [];
    for (const s of scene.stressors) {
      if ((levels[s.id] ?? 0) <= 0) continue;
      for (const e of s.effects) {
        if (e.type !== 'event') continue;
        const schedule = () => {
          const [min, max] = e.everyMs;
          timers.push(
            window.setTimeout(() => {
              if (stoppingRef.current || offRef.current.includes(s.id)) return;
              if (e.sound) void audio.playOneShot(e.sound);
              if (e.shakePx > 0) setShake({ id: Date.now(), px: e.shakePx, ms: e.shakeMs });
              const cap: CaptionItem = { id: `ev-${s.id}-${Date.now()}`, kind: 'sound', text: e.captionKey, event: true, stressor: s.id };
              setEvents((ev) => [...ev, cap]);
              timers.push(window.setTimeout(() => setEvents((ev) => ev.filter((x) => x.id !== cap.id)), EVENT_CAPTION_MS));
              schedule();
            }, (min + Math.random() * (max - min)) * scale),
          );
        };
        // First event comes soon after the stressor starts.
        timers.push(window.setTimeout(schedule, 0));
      }
    }
    return () => timers.forEach(clearTimeout);
    // Only re-plan when a stressor turns on/off, not on every level object change.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [scene, stopping, scale, ids.map((id) => (levels[id] > 0 ? 1 : 0)).join('')]);

  useEffect(() => audio.setGentle(gentle), [gentle]);
  useEffect(() => audio.setMuted(muted), [muted]);

  const result = useCallback(
    (stopped: boolean): SceneResult => ({ sceneId: scene.id, turnedOff: offRef.current, all: ids, stopped }),
    [scene, ids],
  );

  const stop = useCallback(() => {
    if (stoppingRef.current) return;
    stoppingRef.current = true;
    setStopping(true);
    audio.endScene(STOP_FADE_MS);
    track('stop_pressed', { scene: scene.id, phase });
    window.setTimeout(() => onStop(result(true)), STOP_FADE_MS + 100);
  }, [onStop, result, scene, phase]);

  // Esc = Stop, from anywhere on the page.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') stop();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [stop]);

  const turnOff = (id: StressorId) => {
    if (offRef.current.includes(id)) return;
    setLevel(id, 0, scene.timings.fadeOutMs);
    offRef.current = [...offRef.current, id];
    setOff(offRef.current);
    track('toggle_off', { scene: scene.id, stressor: id, n: offRef.current.length });
  };

  const finish = () => {
    audio.endScene(1500);
    onDone(result(false));
  };

  // Captions: ambient + every audible loop + current text cue for each active stressor + recent events.
  const captions: CaptionItem[] = [];
  if (!stopping && phase !== 'loading') {
    captions.push({ id: 'ambient', kind: 'sound', text: t(scene.ambient.captionKey) });
    for (const s of scene.stressors) {
      if ((levels[s.id] ?? 0) <= 0) continue;
      for (const sid of s.sounds) {
        const def = scene.sounds.find((d) => d.id === sid);
        if (def?.loop) captions.push({ id: `snd-${sid}`, kind: 'sound', text: t(def.captionKey) });
      }
      if (s.cues.length && s.cueEveryMs > 0) {
        const i = Math.floor((clock * 1000) / (s.cueEveryMs * scale)) % s.cues.length;
        const cue = s.cues[i];
        captions.push({ id: `cue-${s.id}`, kind: cue.kind, text: t(cue.key) });
      }
    }
    // Keep only the latest event caption per stressor, and drop it once that stressor is off.
    const latestEvent = new Map<string, CaptionItem>();
    for (const e of events) if (e.stressor && !off.includes(e.stressor as StressorId)) latestEvent.set(e.stressor, e);
    for (const e of latestEvent.values()) captions.push({ ...e, text: t(e.text) });
  }

  const phaseLabel = phase === 'loading' ? t('scene.loading') : t(`scene.phase.${phase}`);

  return (
    <div className="space-y-3">
      <div className="flex items-start justify-between gap-3">
        <div>
          <ScreenHeading className="text-2xl">{t(scene.titleKey)}</ScreenHeading>
          <p role="status" className="font-semibold text-muted">
            {phaseLabel}
            {phase === 'buildup' && latest && <> · {t('scene.stressorStarts', { name: t(`stressor.${latest}`) })}</>}
          </p>
        </div>
        <button
          type="button"
          onClick={() => setMuted(!muted)}
          aria-pressed={muted}
          className="min-h-tap min-w-tap shrink-0 rounded-xl border-2 border-ink bg-white px-3 font-semibold"
        >
          <span aria-hidden="true">{muted ? '🔇 ' : '🔊 '}</span>
          {muted ? t('header.unmute') : t('header.mute')}
        </button>
      </div>

      <SceneView
        scene={scene}
        levels={levels}
        rampMs={rampMs}
        gentle={gentle}
        stopping={stopping}
        shake={shake}
        label={t(scene.altKey)}
      />

      <Captions items={captions} />

      {(phase === 'buildup' || phase === 'peak') && <Task task={scene.task} sceneId={scene.id} />}
      {phase === 'toggle' && <TogglePanel scene={scene} off={off} onTurnOff={turnOff} onContinue={finish} />}

      <StopButton onStop={stop} stopping={stopping} />
    </div>
  );
}
