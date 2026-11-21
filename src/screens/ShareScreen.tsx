import { useEffect, useState } from 'react';
import { Button, ScreenHeading } from '../components/ui';
import { useT } from '../i18n';
import type { SceneResult } from '../state/flow';
import { loadScene } from '../scenes';
import { canvasToBlob, downloadBlob, drawShareCard, shareFile, siteUrl, type CardText } from '../lib/shareCard';
import { track } from '../lib/analytics';

/** Step 8 — share card: "I turned off N stressors. Here's what helped." */
export default function ShareScreen({ result, onRestart }: { result: SceneResult; onRestart: () => void }) {
  const t = useT();
  const [blob, setBlob] = useState<Blob | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const n = result.turnedOff.length;
  const url = siteUrl();
  const card: CardText = {
    title: n === 0 ? t('share.cardNone') : n === 1 ? t('share.cardTitleOne') : t('share.cardTitle', { n }),
    sub: n === 0 ? t('share.cardSubAll') : t('share.cardSub'),
    items: (n === 0 ? result.all : result.turnedOff).map((id) => t(`acc.${id}`)),
    footer: t('share.cardFooter'),
    url,
  };
  const cardKey = JSON.stringify(card);

  useEffect(() => {
    let alive = true;
    let objectUrl: string | null = null;
    setBlob(null);
    loadScene(result.sceneId)
      .then((scene) => drawShareCard(scene, card))
      .then(canvasToBlob)
      .then((b) => {
        if (!alive) return;
        objectUrl = URL.createObjectURL(b);
        setBlob(b);
        setPreview(objectUrl);
      })
      .catch(() => undefined);
    return () => {
      alive = false;
      if (objectUrl) URL.revokeObjectURL(objectUrl);
    };
    // Redraw when the language changes.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cardKey, result.sceneId]);

  const share = async () => {
    if (!blob) return;
    const r = await shareFile(blob, t('app.title'), t('share.text', { n }), url);
    track('share', { scene: result.sceneId, outcome: r });
    if (r === 'unsupported') {
      downloadBlob(blob, 'sensory-overload-simulator.png');
      track('share_download', { scene: result.sceneId });
    }
  };

  const download = () => {
    if (!blob) return;
    downloadBlob(blob, 'sensory-overload-simulator.png');
    track('share_download', { scene: result.sceneId });
  };

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch {
      /* clipboard blocked */
    }
  };

  return (
    <div className="space-y-5">
      <ScreenHeading>{t('share.h')}</ScreenHeading>
      <div className="overflow-hidden rounded-2xl border-2 border-ink/20 bg-ink">
        {preview ? (
          <img
            src={preview}
            width={1200}
            height={630}
            className="h-auto w-full"
            alt={t('share.alt', { title: card.title, sub: card.sub, list: card.items.join(', ') })}
          />
        ) : (
          <p role="status" className="flex aspect-[1200/630] items-center justify-center text-white">
            {t('share.making')}
          </p>
        )}
      </div>
      <div className="grid gap-3 sm:grid-cols-3">
        <Button onClick={share} disabled={!blob}>
          {t('share.share')}
        </Button>
        <Button variant="secondary" onClick={download} disabled={!blob}>
          {t('share.download')}
        </Button>
        <Button variant="secondary" onClick={copy}>
          {copied ? `✓ ${t('share.copied')}` : t('share.copy')}
        </Button>
      </div>
      <p role="status" className="sr-only">
        {copied ? t('share.copied') : ''}
      </p>
      <Button variant="ghost" onClick={onRestart}>
        ← {t('share.restart')}
      </Button>
    </div>
  );
}
