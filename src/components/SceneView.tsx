import { useEffect, useMemo, useRef } from 'react';
import type { LayerDef, LayerLook, SceneConfig, StressorId } from '../scenes/types';
import { FLASH_MS, FlickerLimiter, clampDepth, clampRate } from '../effects/flicker';

export interface ShakeRequest {
  id: number;
  px: number;
  ms: number;
}

const BASE: Required<LayerLook> = { opacity: 1, scale: 1, x: 0, y: 0, brightness: 1, saturate: 1, blur: 0 };
/** In gentle mode visual stressors reach only this fraction of their full effect. */
const GENTLE_VISUAL = 0.45;

function lerpLook(base: Required<LayerLook>, active: LayerLook, k: number): Required<LayerLook> {
  const out = { ...base };
  for (const key of Object.keys(active) as (keyof LayerLook)[]) {
    const target = active[key];
    if (target !== undefined) out[key] = base[key] + (target - base[key]) * k;
  }
  return out;
}

function filterOf(l: Required<LayerLook>) {
  return `brightness(${l.brightness}) saturate(${l.saturate}) blur(${l.blur}px)`;
}

/**
 * Renders the layered scene. Visual stressors are CSS transitions between a
 * base look and an "active" look, so fades are smooth and cheap on phones.
 */
export function SceneView({
  scene,
  levels,
  rampMs,
  gentle,
  stopping,
  shake,
  label,
}: {
  scene: SceneConfig;
  levels: Record<StressorId, number>;
  /** Transition duration per stressor (ramp up, fade out or stop). */
  rampMs: Record<StressorId, number>;
  gentle: boolean;
  stopping: boolean;
  shake: ShakeRequest | null;
  label: string;
}) {
  const k = gentle ? GENTLE_VISUAL : 1;
  const flickerRefs = useRef(new Map<string, HTMLDivElement>());
  const rootRef = useRef<HTMLDivElement>(null);
  const limiter = useMemo(() => new FlickerLimiter(), []);

  // Work out each layer's look from the stressors that touch it.
  const layerState = useMemo(() => {
    const map = new Map<string, { look: Required<LayerLook>; ms: number; crowd: number }>();
    for (const layer of scene.layers) map.set(layer.id, { look: { ...BASE, ...layer.base }, ms: 1500, crowd: 0 });
    let sceneLook = { ...BASE };
    let sceneMs = 1500;
    for (const s of scene.stressors) {
      const lvl = levels[s.id] ?? 0;
      for (const e of s.effects) {
        if (e.type === 'layer') {
          const st = map.get(e.layer);
          if (!st) continue;
          st.look = lerpLook(st.look, e.active, lvl * k);
          st.ms = Math.max(st.ms, rampMs[s.id] ?? 1500);
        } else if (e.type === 'crowdSwap') {
          const st = map.get(e.layer);
          if (!st) continue;
          st.crowd = lvl;
          st.ms = Math.max(st.ms, rampMs[s.id] ?? 1500);
        } else if (e.type === 'scene') {
          sceneLook = lerpLook(sceneLook, e.active, lvl * k);
          sceneMs = Math.max(sceneMs, rampMs[s.id] ?? 1500);
        }
      }
    }
    return { map, sceneLook, sceneMs };
  }, [scene, levels, rampMs, k]);

  // Flicker loop. All flashes share ONE limiter (WCAG 2.3.1), and none happen in gentle mode.
  useEffect(() => {
    limiter.enabled = !gentle && !stopping;
    if (!limiter.enabled) return;
    const flickers = scene.stressors.flatMap((s) =>
      (levels[s.id] ?? 0) > 0 ? s.effects.filter((e): e is Extract<typeof e, { type: 'flicker' }> => e.type === 'flicker') : [],
    );
    if (!flickers.length) return;
    const next = new Map<string, number>();
    const timers: number[] = [];
    const id = window.setInterval(() => {
      const now = performance.now();
      for (const f of flickers) {
        const rate = clampRate(f.flashesPerSecond);
        if (rate <= 0) continue;
        if (now < (next.get(f.layer) ?? 0)) continue;
        next.set(f.layer, now + (1000 / rate) * (0.8 + Math.random() * 0.6));
        const el = flickerRefs.current.get(f.layer);
        if (!el || !limiter.tryFlash(now)) continue;
        el.style.opacity = String(1 - clampDepth(f.depth));
        timers.push(window.setTimeout(() => (el.style.opacity = '1'), FLASH_MS / 2));
      }
    }, 50);
    return () => {
      clearInterval(id);
      timers.forEach(clearTimeout);
      flickerRefs.current.forEach((el) => (el.style.opacity = '1'));
    };
  }, [scene, levels, gentle, stopping, limiter]);

  // Shake (sudden changes). Never in gentle mode.
  useEffect(() => {
    if (!shake || gentle || stopping) return;
    const el = rootRef.current;
    if (!el?.animate) return;
    const p = shake.px;
    el.animate(
      [
        { transform: 'translate(0,0)' },
        { transform: `translate(${-p}px, ${p / 2}px)` },
        { transform: `translate(${p}px, ${-p / 3}px)` },
        { transform: `translate(${-p / 2}px, ${p / 4}px)` },
        { transform: 'translate(0,0)' },
      ],
      { duration: shake.ms, easing: 'ease-out' },
    );
  }, [shake, gentle, stopping]);

  const renderImg = (layer: LayerDef, src: string, extraStyle?: React.CSSProperties) =>
    layer.motion === 'parallax' && !gentle ? (
      <div className="m-parallax absolute inset-0 flex w-[200%]" style={extraStyle}>
        <img src={src} alt="" draggable={false} className="h-full w-1/2 object-cover" />
        <img src={src} alt="" draggable={false} className="h-full w-1/2 object-cover" />
      </div>
    ) : (
      <img src={src} alt="" draggable={false} className="absolute inset-0 h-full w-full object-cover" style={extraStyle} />
    );

  return (
    // The outer box takes whatever space the layout gives it; the scene is the
    // largest 4:3 rectangle that fits inside (container query units).
    <div className="flex h-full w-full items-center justify-center [container-type:size]">
    <div
      role="img"
      aria-label={label}
      className="relative aspect-[4/3] max-h-full max-w-full overflow-hidden rounded-2xl border-2 border-ink/20"
      style={{ background: scene.bg, width: 'min(100cqw, calc(100cqh * 4 / 3))' }}
    >
      <div
        ref={rootRef}
        className="absolute inset-0"
        style={{ filter: filterOf(layerState.sceneLook), transition: `filter ${layerState.sceneMs}ms linear` }}
      >
        {scene.layers.map((layer) => {
          const st = layerState.map.get(layer.id)!;
          const l = st.look;
          const motion = gentle || !layer.motion || layer.motion === 'none' || layer.motion === 'parallax' ? '' : `m-${layer.motion}`;
          return (
            <div
              key={layer.id}
              data-layer={layer.id}
              className="absolute -inset-[3%]"
              style={{
                opacity: l.opacity,
                transform: `translate(${l.x}%, ${l.y}%) scale(${l.scale})`,
                filter: filterOf(l),
                transition: `opacity ${st.ms}ms linear, transform ${st.ms}ms ease-in-out, filter ${st.ms}ms linear`,
              }}
            >
              <div
                ref={(el) => {
                  if (el) flickerRefs.current.set(layer.id, el);
                  else flickerRefs.current.delete(layer.id);
                }}
                className={`absolute inset-0 ${motion}`}
                style={{ transition: `opacity ${FLASH_MS / 2}ms ease-in-out` }}
              >
                <div className="absolute inset-0 overflow-hidden">
                  {layer.calmSrc ? (
                    <>
                      {renderImg(layer, layer.calmSrc, { opacity: 1 - st.crowd, transition: `opacity ${st.ms}ms linear` })}
                      {renderImg(layer, layer.src, { opacity: st.crowd, transition: `opacity ${st.ms}ms linear` })}
                    </>
                  ) : (
                    renderImg(layer, layer.src)
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
      {/* Stop: everything fades to a calm blank within 800 ms. */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 bg-paper"
        style={{ opacity: stopping ? 1 : 0, transition: 'opacity 800ms ease-out' }}
      />
    </div>
    </div>
  );
}
