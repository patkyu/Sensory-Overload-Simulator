import { useState } from 'react';
import { Button } from './ui';
import { useT } from '../i18n';
import type { SceneConfig, StressorId } from '../scenes/types';

/** Step 6 — one switch per stressor; switching off reveals the real-life accommodation. */
export function TogglePanel({
  scene,
  off,
  onTurnOff,
  onContinue,
}: {
  scene: SceneConfig;
  off: StressorId[];
  onTurnOff: (id: StressorId) => void;
  onContinue: () => void;
}) {
  const t = useT();
  const [announce, setAnnounce] = useState('');
  const total = scene.stressors.length;
  const allOff = off.length === total;

  return (
    <section aria-labelledby="toggle-h" className="space-y-3">
      <div>
        <h2 id="toggle-h" className="text-2xl font-bold">
          {t('toggle.h')}
        </h2>
        <p>{t('toggle.intro')}</p>
        <p className="mt-1 font-semibold">{t('toggle.count', { n: off.length, total })}</p>
      </div>
      <ul className="grid gap-3 sm:grid-cols-2">
        {scene.stressors.map((s) => {
          const isOff = off.includes(s.id);
          const label = t(s.labelKey);
          return (
            <li key={s.id} className={`rounded-2xl border-2 p-4 ${isOff ? 'border-calm bg-[#e8f3f0]' : 'border-ink bg-white'}`}>
              <div className="flex items-center justify-between gap-3">
                <div className="min-w-0">
                  <span id={`sw-${s.id}-label`} className="block text-lg font-bold">
                    {label}
                  </span>
                  <span id={`sw-${s.id}-desc`} className="block text-sm text-muted">
                    {t(s.descKey)}
                  </span>
                </div>
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
                  className={`relative h-10 w-[4.5rem] shrink-0 rounded-full border-2 border-ink transition-colors ${
                    isOff ? 'cursor-default bg-white' : 'bg-stop'
                  }`}
                >
                  <span
                    aria-hidden="true"
                    className={`absolute top-1/2 h-7 w-7 -translate-y-1/2 rounded-full border-2 border-ink bg-white transition-all ${
                      isOff ? 'left-1' : 'left-[calc(100%-2.1rem)]'
                    }`}
                  />
                </button>
              </div>
              {isOff && (
                <p className="mt-3 rounded-xl bg-white p-3">
                  <span className="block text-sm font-bold text-calm">{t('toggle.helps')}</span>
                  <span className="text-lg font-semibold">{t(s.accommodationKey)}</span>
                </p>
              )}
            </li>
          );
        })}
      </ul>
      <p role="status" className="sr-only">
        {announce}
      </p>
      {allOff && <p className="rounded-xl bg-[#e8f3f0] p-3 text-lg font-semibold">{t('toggle.allOff')}</p>}
      <Button block onClick={onContinue} variant={allOff ? 'primary' : 'secondary'}>
        {t('toggle.continue')} →
      </Button>
    </section>
  );
}
