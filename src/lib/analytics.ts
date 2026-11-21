/**
 * Analytics stub. Collects NO personal data: no IDs, no cookies, no free text.
 * Wire this to Plausible or Umami later, e.g.
 *   window.plausible?.(event, { props });
 *   window.umami?.track(event, props);
 */
export type TrackProps = Record<string, string | number | boolean>;

export type TrackEvent =
  | 'comfort_start'
  | 'scene_start'
  | 'phase'
  | 'stop_pressed'
  | 'toggle_off'
  | 'task_answer'
  | 'reflection_reached'
  | 'reflection_answer'
  | 'share'
  | 'share_download'
  | 'restart';

export function track(event: TrackEvent, props?: TrackProps): void {
  if (import.meta.env.DEV) {
    // eslint-disable-next-line no-console
    console.debug('[track]', event, props ?? {});
  }
}
