import { useT } from '../i18n';

export interface CaptionItem {
  id: string;
  kind: 'sound' | 'smell' | 'touch' | 'speech';
  text: string;
  /** One-off events (a hard brake) are highlighted. */
  event?: boolean;
  /** For event captions: the stressor that caused it (cleared when it is switched off). */
  stressor?: string;
}

const icons: Record<CaptionItem['kind'], string> = { sound: '🔊', smell: '👃', touch: '✋', speech: '💬' };

/** Captions for every sound, plus on-screen text cues for smell, touch and speech. */
export function Captions({ items }: { items: CaptionItem[] }) {
  const t = useT();
  return (
    <section aria-labelledby="captions-h" className="rounded-2xl bg-ink p-3 text-white">
      <h2 id="captions-h" className="sr-only">
        {t('captions.h')}
      </h2>
      <ul aria-live="polite" aria-relevant="additions text" className="flex min-h-[3rem] flex-col gap-1.5">
        {items.length === 0 && <li className="text-white/80">{t('captions.quiet')}</li>}
        {items.map((c) => (
          <li
            key={c.id}
            className={`flex items-start gap-2 rounded-lg px-2 py-1 text-base leading-snug ${
              c.event ? 'bg-[#ffd166] font-semibold text-ink' : c.kind === 'sound' ? '' : 'bg-white/10'
            }`}
          >
            <span aria-hidden="true">{icons[c.kind]}</span>
            <span>
              <span className="sr-only">{t(`cue.kind.${c.kind}`)}: </span>
              {c.kind === 'sound' ? `[${c.text}]` : c.text}
            </span>
          </li>
        ))}
      </ul>
    </section>
  );
}
