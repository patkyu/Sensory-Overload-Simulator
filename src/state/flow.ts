import type { StressorId } from '../scenes/types';

export type SceneId = 'jeepney' | 'mall';

export interface SceneResult {
  sceneId: SceneId;
  /** Stressors the visitor switched off, in order. */
  turnedOff: StressorId[];
  /** All stressor ids in the scene, in display order. */
  all: StressorId[];
  stopped: boolean;
}

export type Screen =
  | { name: 'comfort' } // step 1
  | { name: 'pick' } // step 2
  | { name: 'scene'; sceneId: SceneId } // steps 3–6
  | { name: 'break'; result: SceneResult }
  | { name: 'reflection'; result: SceneResult } // step 7
  | { name: 'share'; result: SceneResult }; // step 8

export const ALL_STRESSORS: StressorId[] = ['noise', 'light', 'crowding', 'smell', 'social', 'sudden'];
