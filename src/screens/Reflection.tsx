import { useEffect, useState } from 'react';
import { Button, Card, ScreenHeading, Txt } from '../components/ui';
import { isTodo, useT } from '../i18n';
import type { SceneResult } from '../state/flow';
import { track } from '../lib/analytics';

type Answer = 'yes' | 'little' | 'no';

/**
 * Step 7 — reflection. All autism-related copy here is a TODO placeholder until
 * written/approved by autistic advisors (see README checklist).
 */
export function Reflection({ result, onShare, onRestart }: { result: SceneResult; onShare: () => void; onRestart: () => void }) {
  const t = useT();
  const [textOnly, setTextOnly] = useState(false);
  const [answer, setAnswer] = useState<Answer | null>(null);

  useEffect(() => {
    track('reflection_reached', { scene: result.sceneId, off: result.turnedOff.length, stopped: result.stopped });
  }, [result]);

  const n = result.turnedOff.length;
  const total = result.all.length;
  const intro = result.stopped && n === 0 ? t('reflection.stoppedNote') : t('reflection.youTurnedOff', { n, total });
  const doKeys = ['reflection.do1', 'reflection.do2', 'reflection.do3'];

  const answerQ = (a: Answer) => {
    if (answer) return;
    setAnswer(a);
    // Anonymous: one fixed-choice value, nothing else.
    track('reflection_answer', { value: a });
  };

  const question = (
    <section aria-labelledby="ask-h">
      <h2 id="ask-h" className="text-xl font-bold">
        {t('reflection.askQ')}
      </h2>
      <p className="text-sm text-muted">{t('reflection.askOptional')}</p>
      {answer ? (
        <p role="status" className="mt-2 font-semibold">
          {t('reflection.askThanks')}
        </p>
      ) : (
        <div className="mt-2 grid grid-cols-3 gap-2">
          {(['yes', 'little', 'no'] as Answer[]).map((a) => (
            <Button key={a} variant="secondary" onClick={() => answerQ(a)}>
              {t(`reflection.ask.${a}`)}
            </Button>
          ))}
        </div>
      )}
    </section>
  );

  const actions = (
    <div className="grid gap-3 sm:grid-cols-2">
      <Button onClick={onShare}>{t('reflection.toShare')}</Button>
      <Button variant="secondary" onClick={onRestart}>
        {t('reflection.restart')}
      </Button>
    </div>
  );

  const modeToggle = (
    <Button variant="ghost" className="text-base underline" aria-pressed={textOnly} onClick={() => setTextOnly(!textOnly)}>
      {textOnly ? t('reflection.fullVersion') : t('reflection.textOnly')}
    </Button>
  );

  if (textOnly) {
    // Short, plain, linear version for screen readers: headings, paragraphs and lists only.
    return (
      <article className="space-y-4">
        <ScreenHeading>{t('reflection.h')}</ScreenHeading>
        {modeToggle}
        <p>{t('common.oneExample')}</p>
        <h2 className="text-xl font-bold">{t('reflection.listH')}</h2>
        <p>{intro}</p>
        <ul className="list-disc pl-6">
          {result.all.map((id) => (
            <li key={id}>
              {t(`stressor.${id}`)}: {t(`acc.${id}`)}
              {!result.turnedOff.includes(id) && ` (${t('reflection.notTurnedOff')})`}
            </li>
          ))}
        </ul>
        <h2 className="text-xl font-bold">{t('reflection.quoteH')}</h2>
        <p>
          {t('reflection.quote')} — {t('reflection.quoteBy')}
        </p>
        <h2 className="text-xl font-bold">{t('reflection.doH')}</h2>
        <ol className="list-decimal pl-6">
          {doKeys.map((k) => (
            <li key={k}>{t(k)}</li>
          ))}
        </ol>
        <h2 className="text-xl font-bold">{t('reflection.differentH')}</h2>
        <p>{t('reflection.different')}</p>
        {question}
        {actions}
      </article>
    );
  }

  return (
    <div className="space-y-5">
      <ScreenHeading>{t('reflection.h')}</ScreenHeading>
      {modeToggle}
      {isTodo(t('common.oneExample')) ? (
        <Txt as="p" className="block text-lg font-semibold">{t('common.oneExample')}</Txt>
      ) : (
        <p className="rounded-2xl bg-ink p-4 text-lg font-semibold text-white">{t('common.oneExample')}</p>
      )}

      <Card>
        <h2 className="text-xl font-bold">{t('reflection.quoteH')}</h2>
        <figure className="mt-2">
          <Txt as="blockquote" className="block text-lg italic">
            {t('reflection.quote')}
          </Txt>
          <figcaption className="mt-2">
            — <Txt>{t('reflection.quoteBy')}</Txt>
          </figcaption>
        </figure>
      </Card>

      <section aria-labelledby="list-h">
        <h2 id="list-h" className="text-xl font-bold">
          {t('reflection.listH')}
        </h2>
        <p className="mt-1">{intro}</p>
        <ul className="mt-3 grid gap-2">
          {result.all.map((id) => {
            const isOff = result.turnedOff.includes(id);
            return (
              <li key={id} className={`rounded-xl border-2 p-3 ${isOff ? 'border-calm bg-[#e8f3f0]' : 'border-ink/20 bg-white'}`}>
                <span className="font-bold">
                  <span aria-hidden="true">{isOff ? '✓ ' : '○ '}</span>
                  {t(`stressor.${id}`)}
                </span>
                {!isOff && <span className="text-sm text-muted"> · {t('reflection.notTurnedOff')}</span>}
                <span className="block">{t(`acc.${id}`)}</span>
              </li>
            );
          })}
        </ul>
      </section>

      <Card>
        <h2 className="text-xl font-bold">{t('reflection.doH')}</h2>
        <ol className="mt-2 list-decimal space-y-2 pl-6">
          {doKeys.map((k) => (
            <Txt key={k} as="li">
              {t(k)}
            </Txt>
          ))}
        </ol>
      </Card>

      <Card>
        <h2 className="text-xl font-bold">{t('reflection.differentH')}</h2>
        <Txt as="p" className="mt-2 block">
          {t('reflection.different')}
        </Txt>
      </Card>

      <Card>{question}</Card>
      {actions}
    </div>
  );
}
