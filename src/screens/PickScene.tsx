import { Button, ScreenHeading } from '../components/ui';
import { useT } from '../i18n';
import type { SceneId } from '../state/flow';
import { audio } from '../audio/engine';
import { preloadScene } from '../scenes';

/** Step 2 — pick a scene. */
export function PickScene({ onPick, onBack }: { onPick: (id: SceneId) => void; onBack: () => void }) {
  const t = useT();
  const scenes: { id: SceneId; icon: string }[] = [
    { id: 'jeepney', icon: '🚌' },
    { id: 'mall', icon: '🛍️' },
  ];
  return (
    <div className="space-y-5">
      <ScreenHeading>{t('pick.h')}</ScreenHeading>
      <ul className="grid gap-4 sm:grid-cols-2">
        {scenes.map((s) => (
          <li key={s.id}>
            <button
              type="button"
              onPointerEnter={() => preloadScene(s.id)}
              onFocus={() => preloadScene(s.id)}
              onClick={() => {
                audio.unlock(); // re-assert the unlock inside this gesture too
                onPick(s.id);
              }}
              className="flex min-h-[8rem] w-full flex-col items-start gap-1 rounded-2xl border-2 border-ink bg-white p-5 text-left hover:bg-[#f0ebe0]"
            >
              <span aria-hidden="true" className="text-4xl">
                {s.icon}
              </span>
              <span className="text-2xl font-bold">{t(`pick.${s.id}.title`)}</span>
              <span>{t(`pick.${s.id}.desc`)}</span>
              <span className="text-sm text-muted">{t('pick.minutes')}</span>
            </button>
          </li>
        ))}
      </ul>
      <Button variant="ghost" onClick={onBack}>
        ← {t('common.back')}
      </Button>
    </div>
  );
}
