import type { SceneConfig } from './types';

/**
 * Jeepney ride. Tune everything here; no component changes needed.
 * Art:   public/scenes/jeepney/*.svg   Audio: public/audio/jeepney/*.mp3
 */
const S = '/scenes/jeepney';
const A = '/audio/jeepney';

const jeepney: SceneConfig = {
  id: 'jeepney',
  titleKey: 'jeepney.title',
  altKey: 'jeepney.alt',
  bg: '#2b6cb0',
  layers: [
    { id: 'background', src: `${S}/background.svg`, motion: 'parallax' },
    { id: 'body', src: `${S}/body.svg`, motion: 'bob' },
    { id: 'passengers', src: `${S}/passengers.svg`, calmSrc: `${S}/passengers-calm.svg`, motion: 'bob' },
    { id: 'signs', src: `${S}/signs.svg`, motion: 'sway' },
    { id: 'glare', src: `${S}/glare.svg`, base: { opacity: 0 } },
  ],
  ambient: { id: 'ambient', src: `${A}/ambient.mp3`, synth: 'engine', loop: true, gain: 0.55, captionKey: 'cap.jeepney.ambient' },
  sounds: [
    { id: 'horn', src: `${A}/horn.mp3`, synth: 'horn', loop: true, gain: 0.7, captionKey: 'cap.jeepney.horn' },
    { id: 'barker', src: `${A}/barker.mp3`, synth: 'barker', loop: true, gain: 0.8, captionKey: 'cap.jeepney.barker' },
    { id: 'radio', src: `${A}/radio.mp3`, synth: 'radio', loop: true, gain: 0.6, captionKey: 'cap.jeepney.radio' },
    { id: 'coins', src: `${A}/coins.mp3`, synth: 'coins', loop: true, gain: 0.7, captionKey: 'cap.jeepney.coins' },
    // Optional file: no brake.mp3 in the asset list yet, so this is synthesized unless you add one.
    { id: 'brake', src: `${A}/brake.mp3`, synth: 'brake', loop: false, gain: 0.8, captionKey: 'cap.jeepney.brake' },
  ],
  stressors: [
    {
      id: 'noise',
      labelKey: 'stressor.noise',
      descKey: 'jeepney.desc.noise',
      accommodationKey: 'acc.noise',
      sounds: ['horn', 'barker', 'radio'],
      effects: [],
      cues: [],
      cueEveryMs: 0,
      startAtMs: 0,
      rampMs: 15000,
      peakGain: 0.9,
    },
    {
      id: 'light',
      labelKey: 'stressor.light',
      descKey: 'jeepney.desc.light',
      accommodationKey: 'acc.light',
      sounds: [],
      effects: [
        { type: 'layer', layer: 'glare', active: { opacity: 0.85 } },
        { type: 'scene', active: { brightness: 1.15, saturate: 1.25 } },
        // Shadows of poles/trees passing the windows. Rate is clamped to ≤2/s in code.
        { type: 'flicker', layer: 'glare', flashesPerSecond: 1.5, depth: 0.3 },
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
      descKey: 'jeepney.desc.crowding',
      accommodationKey: 'acc.crowding',
      sounds: [],
      effects: [
        { type: 'crowdSwap', layer: 'passengers' },
        { type: 'layer', layer: 'passengers', active: { scale: 1.1, y: 4 } },
      ],
      cues: [
        { kind: 'touch', key: 'cue.jeepney.touch1' },
        { kind: 'touch', key: 'cue.jeepney.touch2' },
      ],
      cueEveryMs: 9000,
      startAtMs: 22000,
      rampMs: 12000,
      peakGain: 0,
    },
    {
      id: 'smell',
      labelKey: 'stressor.smell',
      descKey: 'jeepney.desc.smell',
      accommodationKey: 'acc.smell',
      sounds: [],
      effects: [{ type: 'layer', layer: 'background', active: { saturate: 0.7, blur: 1.5 } }],
      cues: [
        { kind: 'smell', key: 'cue.jeepney.smell1' },
        { kind: 'smell', key: 'cue.jeepney.smell2' },
      ],
      cueEveryMs: 10000,
      startAtMs: 32000,
      rampMs: 8000,
      peakGain: 0,
    },
    {
      id: 'social',
      labelKey: 'stressor.social',
      descKey: 'jeepney.desc.social',
      accommodationKey: 'acc.social',
      sounds: ['coins'],
      effects: [],
      cues: [
        { kind: 'speech', key: 'cue.jeepney.speech1' },
        { kind: 'speech', key: 'cue.jeepney.speech2' },
      ],
      cueEveryMs: 7000,
      startAtMs: 42000,
      rampMs: 8000,
      peakGain: 0.8,
    },
    {
      id: 'sudden',
      labelKey: 'stressor.sudden',
      descKey: 'jeepney.desc.sudden',
      accommodationKey: 'acc.sudden',
      sounds: ['brake'],
      effects: [{ type: 'event', sound: 'brake', captionKey: 'cap.jeepney.brake', everyMs: [9000, 15000], shakePx: 8, shakeMs: 600 }],
      cues: [],
      cueEveryMs: 0,
      startAtMs: 55000,
      rampMs: 2000,
      peakGain: 0.9,
    },
  ],
  task: { type: 'countChange', promptKey: 'task.jeepney.prompt', fare: 13, paid: 20, options: [5, 7, 8] },
  timings: { calmMs: 10000, buildupMs: 75000, peakMs: 10000, fadeOutMs: 1500 },
};

export default jeepney;
