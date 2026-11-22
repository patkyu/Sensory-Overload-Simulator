import { useState } from 'react';
import { useT } from '../i18n';
import type { SceneConfig, StressorId } from '../scenes/types';

/**
 * Step 6 — one switch per stressor; switching off reveals the real-life accommodation.
 * Compact 2-column grid so it fits on one screen next to (or under) the scene.
 */
export function TogglePanel({
  scene,
  off,
  onTurnOff,
}: {
  scene: SceneConfig;
  off: StressorId[];
  onTurnOff: (id: StressorId) => void;
}) {
  const t = useT();
  const [announce, setAnnounce] = useState('');
  const total = scene.stressors.length;
  const allOff = off.length === total;

  return (
    <section aria-labelledby="toggle-h" className="space-y-2">
      <div className="flex items-baseline justify-between gap-2">
        <h2 id="toggle-h" className="text-lg font-bold sm:text-xl">
          {t('toggle.h')}
        </h2>
        <p className="shrink-0 text-sm font-semibold">{t('toggle.count', { n: off.length, total })}</p>
      </div>
      <p className="text-sm leading-snug short:hidden">{allOff ? t('toggle.allOff') : t('toggle.intro')}</p>
      <ul className="grid grid-cols-2 gap-2 tiny:grid-cols-3">
        {scene.stressors.map((s) => {
          const isOff = off.includes(s.id);
          const label = t(s.labelKey);
          return (
            <li key={s.id}>
              <button
                type="button"
                role="switch"
                aria-checked={!isOff}
                aria-labelledby={`sw-${s.id}-label`}
                aria-describedby={`sw-${s.id}-desc`}
                aria-disabled={isOff}
                onClick={() => {
                  if (isOff) return; // stressors never snap back on
                  onTurnOff(s.id);
                  setAnnounce(`${label}: ${t('toggle.helps')} ${t(s.accommodationKey)}`);
                }}
                className={`flex h-full min-h-[3rem] w-full flex-col gap-0.5 rounded-xl border-2 p-2 short:min-h-[2.75rem] short:py-1.5 text-left ${
                  isOff ? 'cursor-default border-calm bg-[#e8f3f0]' : 'border-ink bg-white hover:bg-[#f6f1e6]'
                }`}
              >
                <span className="flex w-full items-center justify-between gap-2">
                  <span id={`sw-${s.id}-label`} className="text-sm font-bold leading-tight sm:text-base">
                    {label}
                  </span>
                  {/* Visual switch: red = on, white = off */}
                  <span
                    aria-hidden="true"
                    className={`relative h-6 w-11 shrink-0 rounded-full border-2 border-ink transition-colors ${isOff ? 'bg-white' : 'bg-stop'}`}
                  >
                    <span
                      className={`absolute top-1/2 h-4 w-4 -translate-y-1/2 rounded-full border-2 border-ink bg-white transition-all ${
                        isOff ? 'left-0.5' : 'left-[calc(100%-1.15rem)]'
                      }`}
                    />
                  </span>
                </span>
                {/* Before: what the stressor is. After: the accommodation that does the same in real life. */}
                <span id={`sw-${s.id}-desc`} className={`text-xs leading-snug sm:text-sm short:text-xs ${isOff ? 'font-semibold text-ink' : 'hidden text-muted side:block short:hidden'}`}>
                  {isOff ? (
                    <>
                      <span className="text-calm short:hidden">{t('toggle.helps')} </span>
                      {t(s.accommodationKey)}
                    </>
                  ) : (
                    t(s.descKey)
                  )}
                </span>
              </button>
            </li>
          );
        })}
      </ul>
      <p role="status" className="sr-only">
        {announce}
      </p>
    </section>
  );
}
