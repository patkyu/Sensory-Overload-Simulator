import { useT } from '../i18n';
import { useSession, type Lang } from '../state/session';

/** Language switcher + gentle-mode toggle. Both persist for the session. */
/** `showMute`: during a scene the mute button lives here, so the scene gets the full height. */
export function Header({ showMute = false }: { showMute?: boolean }) {
  const t = useT();
  const { lang, setLang, gentle, setGentle, muted, setMuted } = useSession();
  const langs: Lang[] = ['en', 'tl'];
  return (
    <header className="sticky top-0 z-30 shrink-0 border-b-2 border-ink/10 bg-paper/95 backdrop-blur">
      <div className="mx-auto flex max-w-[1500px] items-center justify-between gap-2 px-4 py-2 short:py-1">
        <span className="min-w-0 truncate text-sm font-bold">{t('app.title')}</span>
        <div className="flex shrink-0 items-center gap-2">
          {showMute && (
            <button
              type="button"
              onClick={() => setMuted(!muted)}
              aria-pressed={muted}
              aria-label={muted ? t('header.unmute') : t('header.mute')}
              title={muted ? t('header.unmute') : t('header.mute')}
              className="min-h-tap min-w-tap rounded-lg border-2 border-ink bg-white px-2 text-lg short:min-h-[44px]"
            >
              <span aria-hidden="true">{muted ? '🔇' : '🔊'}</span>
            </button>
          )}
          <div role="group" aria-label={t('header.lang')} className="flex overflow-hidden rounded-lg border-2 border-ink">
            {langs.map((l) => (
              <button
                key={l}
                type="button"
                lang={l}
                aria-pressed={lang === l}
                onClick={() => setLang(l)}
                className={`min-h-tap min-w-tap px-2 text-sm font-bold short:min-h-[44px] ${lang === l ? 'bg-ink text-white' : 'bg-white text-ink'}`}
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
            className={`min-h-tap rounded-lg border-2 border-ink px-3 text-sm font-bold short:min-h-[44px] ${gentle ? 'bg-calm text-white' : 'bg-white text-ink'}`}
          >
            {t('header.gentle')}
            <span aria-hidden="true">{gentle ? ' ✓' : ''}</span>
          </button>
        </div>
      </div>
    </header>
  );
}
