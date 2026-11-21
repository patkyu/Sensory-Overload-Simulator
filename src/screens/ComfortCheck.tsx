import { Button, Card, ScreenHeading, Switch, Txt } from '../components/ui';
import { useT } from '../i18n';
import { useSession, type Lang } from '../state/session';
import { audio } from '../audio/engine';
import { track } from '../lib/analytics';

/** Step 1 — content + flashing-light warning, headphones tip, gentle mode, language. */
export function ComfortCheck({ onStart }: { onStart: () => void }) {
  const t = useT();
  const { lang, setLang, gentle, setGentle } = useSession();
  const reduced = typeof window !== 'undefined' && window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;

  const start = () => {
    // Must run inside the click handler: this is the user gesture that unlocks audio (iOS Safari).
    audio.unlock();
    track('comfort_start', { lang, gentle });
    onStart();
  };

  return (
    <div className="space-y-5">
      <ScreenHeading>{t('comfort.h')}</ScreenHeading>
      <p className="text-lg">{t('comfort.intro')}</p>

      <Card className="border-[#b06d00] bg-[#fff8e6]">
        <h2 className="flex items-center gap-2 text-xl font-bold">
          <span aria-hidden="true">⚠️</span>
          {t('comfort.warnPhotoH')}
        </h2>
        <p className="mt-1">{t('comfort.warnPhoto')}</p>
      </Card>

      <Card>
        <h2 className="flex items-center gap-2 text-xl font-bold">
          <span aria-hidden="true">🎧</span>
          {t('comfort.warnSoundH')}
        </h2>
        <p className="mt-1">{t('comfort.warnSound')}</p>
      </Card>

      <Card>
        <Switch
          id="gentle-comfort"
          checked={gentle}
          onChange={setGentle}
          label={t('header.gentle')}
          description={
            <>
              {t('comfort.gentleDesc')}
              {reduced && gentle && <span className="mt-1 block">{t('comfort.gentleAuto')}</span>}
            </>
          }
        />
      </Card>

      <Card>
        <h2 id="lang-h" className="text-xl font-bold">
          {t('comfort.langH')}
        </h2>
        <div role="radiogroup" aria-labelledby="lang-h" className="mt-3 grid grid-cols-2 gap-3">
          {(['en', 'tl'] as Lang[]).map((l) => (
            <button
              key={l}
              type="button"
              role="radio"
              aria-checked={lang === l}
              lang={l}
              onClick={() => setLang(l)}
              className={`min-h-tap rounded-xl border-2 border-ink px-4 py-3 text-lg font-semibold ${
                lang === l ? 'bg-ink text-white' : 'bg-white'
              }`}
            >
              {t(`lang.${l}.name`)}
            </button>
          ))}
        </div>
      </Card>

      <p className="font-medium">{t('comfort.stopNote')}</p>
      <Txt as="p" className="block text-muted">{t('common.oneExample')}</Txt>

      <div>
        <Button block onClick={start} className="text-xl">
          {t('comfort.start')}
        </Button>
        <p className="mt-2 text-center text-sm text-muted">{t('comfort.startHint')}</p>
      </div>
    </div>
  );
}
