/**
 * Photosensitivity guard (WCAG 2.3.1 "Three Flashes or Below Threshold").
 *
 * EVERY flicker in the app must go through one shared FlickerLimiter.
 * The limit is enforced here in code, so no scene config can exceed it:
 *  - at most MAX_FLASHES_PER_SECOND flashes in ANY sliding 1-second window
 *    (2, a safety margin below WCAG's 3);
 *  - at least MIN_GAP_MS between flash starts;
 *  - opacity dip depth clamped to MAX_DEPTH, so each flash is a small change;
 *  - gentle mode → no flashes at all.
 */
export const MAX_FLASHES_PER_SECOND = 2;
export const WCAG_LIMIT_PER_SECOND = 3;
export const MIN_GAP_MS = 1000 / MAX_FLASHES_PER_SECOND; // 500 ms
export const MAX_DEPTH = 0.35;
/** How long one flash (dip + return) lasts. Must be shorter than MIN_GAP_MS. */
export const FLASH_MS = 160;

// Compile-time sanity: our limit must stay under WCAG's.
if (MAX_FLASHES_PER_SECOND >= WCAG_LIMIT_PER_SECOND) throw new Error('Flicker limit must stay below 3 per second');

export class FlickerLimiter {
  private times: number[] = [];
  enabled = true;

  /** Ask permission to start a flash at `now` (ms). Returns false if it would break the limit. */
  tryFlash(now: number): boolean {
    if (!this.enabled) return false;
    this.times = this.times.filter((t) => now - t < 1000);
    const last = this.times[this.times.length - 1];
    if (last !== undefined && now - last < MIN_GAP_MS) return false;
    if (this.times.length >= MAX_FLASHES_PER_SECOND) return false;
    this.times.push(now);
    return true;
  }

  reset() {
    this.times = [];
  }
}

export function clampRate(flashesPerSecond: number): number {
  return Math.max(0, Math.min(flashesPerSecond, MAX_FLASHES_PER_SECOND));
}

export function clampDepth(depth: number): number {
  return Math.max(0, Math.min(depth, MAX_DEPTH));
}
