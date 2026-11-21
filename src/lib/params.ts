/**
 * Dev/testing helpers read from the URL.
 *   ?speed=10  → run scene timings 10x faster (for testing the flow quickly)
 */
export function timeScale(): number {
  try {
    const v = Number(new URLSearchParams(window.location.search).get('speed'));
    return v > 0 && v <= 50 ? 1 / v : 1;
  } catch {
    return 1;
  }
}
