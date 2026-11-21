/**
 * Scene data model. One config file per scene (jeepney.config.ts, mall.config.ts).
 * Tune timings, levels, which layers/sounds each stressor controls and which
 * text keys it shows here — no component edits needed.
 */

/** The six stressors from the plan's "Stressors and toggles" table. */
export type StressorId = 'noise' | 'light' | 'crowding' | 'smell' | 'social' | 'sudden';

export type SynthKind =
  | 'engine'
  | 'horn'
  | 'barker'
  | 'radio'
  | 'coins'
  | 'brake'
  | 'aircon'
  | 'music'
  | 'pa'
  | 'chatter'
  | 'alarm';

/** Visual properties a layer can take; interpolated by CSS transitions. */
export interface LayerLook {
  opacity?: number;
  scale?: number;
  /** percent of layer width/height */
  x?: number;
  y?: number;
  brightness?: number;
  saturate?: number;
  blur?: number; // px
}

export interface LayerDef {
  id: string;
  /** Art file. Replace the file at this path to swap in real art. */
  src: string;
  /** Optional calm variant (fewer people, softer colours). Cross-fades with `src` via a stressor. */
  calmSrc?: string;
  /** Idle motion; all motion is switched off in gentle mode. */
  motion?: 'none' | 'sway' | 'bob' | 'parallax';
  /** Look before any stressor touches it. */
  base?: LayerLook;
}

export interface SoundDef {
  id: string;
  /** Audio file. If it is missing or fails to decode, `synth` is used instead. */
  src: string;
  synth: SynthKind;
  /** Loops run continuously under their stressor's gain; one-shots are fired by events. */
  loop: boolean;
  /** Per-sound level inside its stressor (0–1). */
  gain: number;
  /** Caption shown while the sound is audible (i18n key). */
  captionKey: string;
}

export type EffectDef =
  /** Move a layer's look from its base toward `active` as the stressor rises. */
  | { type: 'layer'; layer: string; active: LayerLook }
  /** Cross-fade a layer from its calmSrc to its full src. */
  | { type: 'crowdSwap'; layer: string }
  /** Whole-scene colour/brightness shift. */
  | { type: 'scene'; active: LayerLook }
  /**
   * Flicker a layer. `flashesPerSecond` is CLAMPED in code to a safe maximum
   * (see effects/flicker.ts) — the config cannot exceed it. Off in gentle mode.
   */
  | { type: 'flicker'; layer: string; flashesPerSecond: number; depth: number }
  /** Recurring sudden event: one-shot sound + caption + (non-gentle) shake. */
  | {
      type: 'event';
      sound?: string;
      captionKey: string;
      everyMs: [number, number];
      shakePx: number;
      shakeMs: number;
    };

export interface CueDef {
  kind: 'smell' | 'touch' | 'speech';
  key: string;
}

export interface StressorDef {
  id: StressorId;
  /** Toggle label, e.g. "Noise". */
  labelKey: string;
  /** What the stressor is in this scene, e.g. "Engine, horns, barker, radio". */
  descKey: string;
  /** The real-life accommodation the toggle reveals. */
  accommodationKey: string;
  /** Sounds routed through this stressor's GainNode. */
  sounds: string[];
  effects: EffectDef[];
  /** On-screen text cues (smell, touch, speech), rotated while the stressor is on. */
  cues: CueDef[];
  cueEveryMs: number;
  /** When this stressor starts during the build-up, ms from build-up start. */
  startAtMs: number;
  /** How long it takes to rise to full, ms. */
  rampMs: number;
  /** Gain of this stressor's GainNode at full (0–1, before master cap). */
  peakGain: number;
}

export type TaskDef =
  | { type: 'countChange'; promptKey: string; fare: number; paid: number; options: number[] }
  | { type: 'findShop'; promptKey: string; shops: string[]; target: string };

export interface SceneConfig {
  id: 'jeepney' | 'mall';
  titleKey: string;
  /** Short text description of the scene for screen readers. */
  altKey: string;
  /** Back-to-front. */
  layers: LayerDef[];
  /** Ambient bed: plays from the calm start at normal level, never a stressor. */
  ambient: SoundDef;
  sounds: SoundDef[];
  stressors: StressorDef[];
  task: TaskDef;
  timings: {
    calmMs: number; // step 3, ~10 s
    buildupMs: number; // step 4, 60–90 s
    peakMs: number; // step 5
    /** Fade used when a stressor is switched off (1–2 s). */
    fadeOutMs: number;
  };
  /** Background colour behind the layers and on the share card. */
  bg: string;
}
