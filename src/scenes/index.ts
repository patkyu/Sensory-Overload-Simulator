import type { SceneId } from '../state/flow';
import type { SceneConfig } from './types';

/** Each scene's config is its own chunk, loaded only when that scene is picked. */
const loaders: Record<SceneId, () => Promise<SceneConfig>> = {
  jeepney: () => import('./jeepney.config').then((m) => m.default),
  mall: () => import('./mall.config').then((m) => m.default),
};

const cache = new Map<SceneId, Promise<SceneConfig>>();

export function loadScene(id: SceneId): Promise<SceneConfig> {
  let p = cache.get(id);
  if (!p) {
    p = loaders[id]();
    cache.set(id, p);
  }
  return p;
}

/** Warm the config chunk when the visitor hovers/focuses a scene card. */
export function preloadScene(id: SceneId): void {
  loadScene(id).catch(() => cache.delete(id));
}
