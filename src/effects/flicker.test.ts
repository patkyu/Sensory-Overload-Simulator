import { describe, expect, it } from 'vitest';
import { FlickerLimiter, MAX_FLASHES_PER_SECOND, clampDepth, clampRate } from './flicker';

describe('FlickerLimiter', () => {
  it('never allows more than the limit in any 1-second window, even when hammered', () => {
    const l = new FlickerLimiter();
    const allowed: number[] = [];
    for (let t = 0; t < 10_000; t += 5) if (l.tryFlash(t)) allowed.push(t);
    for (let i = 0; i < allowed.length; i++) {
      const inWindow = allowed.filter((t) => t >= allowed[i] && t < allowed[i] + 1000).length;
      expect(inWindow).toBeLessThanOrEqual(MAX_FLASHES_PER_SECOND);
      expect(inWindow).toBeLessThan(3); // WCAG 2.3.1
    }
    expect(allowed.length).toBeGreaterThan(0);
  });

  it('allows nothing when disabled (gentle mode)', () => {
    const l = new FlickerLimiter();
    l.enabled = false;
    expect(l.tryFlash(0)).toBe(false);
  });

  it('clamps config values', () => {
    expect(clampRate(10)).toBe(MAX_FLASHES_PER_SECOND);
    expect(clampDepth(1)).toBeLessThanOrEqual(0.35);
  });
});
