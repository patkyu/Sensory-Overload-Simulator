import type { SceneConfig } from './types';

/**
 * Mall trip. Lazy-loaded only when picked. Tune everything here.
 * Art:   public/scenes/mall/*.svg   Audio: public/audio/mall/*.mp3
 */
const S = '/scenes/mall';
const A = '/audio/mall';

const mall: SceneConfig = {
  id: 'mall',
  titleKey: 'mall.title',
  altKey: 'mall.alt',
  bg: '#e9e4da',
  layers: [
    { id: 'shopfronts', src: `${S}/shopfronts.svg` },
    { id: 'escalator', src: `${S}/escalator.svg` },
    { id: 'ceiling-lights', src: `${S}/ceiling-lights.svg`, base: { opacity: 0.55 } },
    { id: 'led-signs', src: `${S}/led-signs.svg`, base: { brightness: 0.85, saturate: 0.7 } },
    { id: 'crowd', src: `${S}/crowd.svg`, calmSrc: `${S}/crowd-calm.svg`, motion: 'sway' },
  ],
  ambient: { id: 'ambient', src: `${A}/ambient.mp3`, synth: 'aircon', loop: true, gain: 0.5, captionKey: 'cap.mall.ambient' },
  sounds: [
    { id: 'music', src: `${A}/music.mp3`, synth: 'music', loop: true, gain: 0.6, captionKey: 'cap.mall.music' },
    { id: 'pa', src: `${A}/pa.mp3`, synth: 'pa', loop: true, gain: 0.7, captionKey: 'cap.mall.pa' },
    { id: 'chatter', src: `${A}/chatter.mp3`, synth: 'chatter', loop: true, gain: 0.8, captionKey: 'cap.mall.chatter' },
    { id: 'alarm', src: `${A}/alarm.mp3`, synth: 'alarm', loop: false, gain: 0.7, captionKey: 'cap.mall.alarm' },
  ],
  stressors: [
    {
      id: 'noise',
      labelKey: 'stressor.noise',
      descKey: 'mall.desc.noise',
      accommodationKey: 'acc.noise',
      sounds: ['music', 'pa', 'chatter'],
      effects: [],
      cues: [],
      cueEveryMs: 0,
      startAtMs: 0,
      rampMs: 15000,
      peakGain: 0.85,
    },
    {
      id: 'light',
      labelKey: 'stressor.light',
      descKey: 'mall.desc.light',
      accommodationKey: 'acc.light',
      sounds: [],
      effects: [
        { type: 'layer', layer: 'ceiling-lights', active: { opacity: 1, brightness: 1.2 } },
        { type: 'layer', layer: 'led-signs', active: { brightness: 1.45, saturate: 1.6 } },
        { type: 'scene', active: { brightness: 1.12, saturate: 1.15 } },
        // Failing fluorescent tube. Rate is clamped to ≤2/s in code.
        { type: 'flicker', layer: 'ceiling-lights', flashesPerSecond: 2, depth: 0.35 },
      ],
      cues: [],
      cueEveryMs: 0,
      startAtMs: 10000,
      rampMs: 12000,
      peakGain: 0,
    },
    {
      id: 'crowding',
      labelKey: 'stressor.crowding',
      descKey: 'mall.desc.crowding',
      accommodationKey: 'acc.crowding',
      sounds: [],
      effects: [
        { type: 'crowdSwap', layer: 'crowd' },
        { type: 'layer', layer: 'crowd', active: { scale: 1.12, y: 3 } },
      ],
      cues: [
        { kind: 'touch', key: 'cue.mall.touch1' },
        { kind: 'touch', key: 'cue.mall.touch2' },
      ],
      cueEveryMs: 8000,
      startAtMs: 22000,
      rampMs: 12000,
      peakGain: 0,
    },
    {
      id: 'smell',
      labelKey: 'stressor.smell',
      descKey: 'mall.desc.smell',
      accommodationKey: 'acc.smell',
      sounds: [],
      effects: [],
      cues: [
        { kind: 'smell', key: 'cue.mall.smell1' },
        { kind: 'smell', key: 'cue.mall.smell2' },
      ],
      cueEveryMs: 10000,
      startAtMs: 32000,
      rampMs: 8000,
      peakGain: 0,
    },
    {
      id: 'social',
      labelKey: 'stressor.social',
      descKey: 'mall.desc.social',
      accommodationKey: 'acc.social',
      // Captions only for now. Add a salesperson.mp3 + a sound entry here to give it a voice.
      sounds: [],
      effects: [],
      cues: [
        { kind: 'speech', key: 'cue.mall.speech1' },
        { kind: 'speech', key: 'cue.mall.speech2' },
      ],
      cueEveryMs: 5000,
      startAtMs: 42000,
      rampMs: 6000,
      peakGain: 0,
    },
    {
      id: 'sudden',
      labelKey: 'stressor.sudden',
      descKey: 'mall.desc.sudden',
      accommodationKey: 'acc.sudden',
      sounds: ['alarm'],
      effects: [{ type: 'event', sound: 'alarm', captionKey: 'cap.mall.alarm', everyMs: [10000, 16000], shakePx: 0, shakeMs: 0 }],
      cues: [],
      cueEveryMs: 0,
      startAtMs: 55000,
      rampMs: 2000,
      peakGain: 0.8,
    },
  ],
  task: {
    type: 'findShop',
    promptKey: 'task.mall.prompt',
    shops: ['pharmacy', 'shoes', 'phones', 'bakery', 'toys', 'clothes'],
    target: 'pharmacy',
  },
  timings: { calmMs: 10000, buildupMs: 75000, peakMs: 10000, fadeOutMs: 1500 },
};

export default mall;
