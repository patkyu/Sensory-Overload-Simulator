import { Button, ScreenHeading, Txt } from '../components/ui';
import { useT } from '../i18n';

/** Shown after "Stop / I need a break". Quiet, no audio, no motion. */
export function BreakScreen({ onReflection, onRestart }: { onReflection: () => void; onRestart: () => void }) {
  const t = useT();
  return (
    <div className="space-y-5">
      <ScreenHeading>{t('break.h')}</ScreenHeading>
      <p className="text-lg">{t('break.body')}</p>
      <Txt as="p">{t('break.tooMuch')}</Txt>
      <div className="grid gap-3 sm:grid-cols-2">
        <Button onClick={onReflection}>{t('break.toReflection')}</Button>
        <Button variant="secondary" onClick={onRestart}>
          {t('break.restart')}
        </Button>
      </div>
    </div>
  );
}
