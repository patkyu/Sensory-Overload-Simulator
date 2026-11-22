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
    <section aria-labelledby="captions-h" className="captions-box flex min-h-[3rem] shrink-0 flex-col overflow-hidden rounded-2xl bg-ink p-2 text-white sm:p-3 short:p-2">
      <h2 id="captions-h" className="sr-only">
        {t('captions.h')}
      </h2>
      <ul aria-live="polite" aria-relevant="additions text" className="captions-list flex max-h-[6.5rem] min-h-[2.25rem] flex-col gap-1 overflow-hidden short:max-h-[3.1rem] tiny:max-h-[2.9rem]">
        {items.length === 0 && <li className="text-white/80">{t('captions.quiet')}</li>}
        {items.map((c) => (
          <li
            key={c.id}
            className={`flex items-start gap-2 rounded-lg px-2 py-0.5 text-sm leading-snug sm:text-base ${
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
