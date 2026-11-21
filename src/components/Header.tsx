import { useT } from '../i18n';
import { useSession, type Lang } from '../state/session';

/** Language switcher + gentle-mode toggle. Both persist for the session. */
export function Header() {
  const t = useT();
  const { lang, setLang, gentle, setGentle } = useSession();
  const langs: Lang[] = ['en', 'tl'];
  return (
    <header className="sticky top-0 z-30 border-b-2 border-ink/10 bg-paper/95 backdrop-blur">
      <div className="mx-auto flex max-w-3xl items-center justify-between gap-2 px-4 py-2">
        <span className="min-w-0 truncate text-sm font-bold">{t('app.title')}</span>
        <div className="flex shrink-0 items-center gap-2">
          <div role="group" aria-label={t('header.lang')} className="flex overflow-hidden rounded-lg border-2 border-ink">
            {langs.map((l) => (
              <button
                key={l}
                type="button"
                lang={l}
                aria-pressed={lang === l}
                onClick={() => setLang(l)}
                className={`min-h-tap min-w-tap px-2 text-sm font-bold ${lang === l ? 'bg-ink text-white' : 'bg-white text-ink'}`}
              >
                {t(`lang.${l}.short`)}
                <span className="sr-only"> — {t(`lang.${l}.name`)}</span>
              </button>
            ))}
          </div>
          <button
            type="button"
            role="switch"
            aria-checked={gentle}
            onClick={() => setGentle(!gentle)}
            className={`min-h-tap rounded-lg border-2 border-ink px-3 text-sm font-bold ${gentle ? 'bg-calm text-white' : 'bg-white text-ink'}`}
          >
            {t('header.gentle')}
            <span aria-hidden="true">{gentle ? ' ✓' : ''}</span>
          </button>
        </div>
      </div>
    </header>
  );
}
