import type { ReactNode } from 'react';
import { useT } from '../i18n';

/** Always visible during a scene. Fades everything out within 1 s. Also bound to Esc. */
export function StopButton({ onStop, stopping, children }: { onStop: () => void; stopping: boolean; children?: ReactNode }) {
  const t = useT();
  return (
    <div
      className="z-50 flex shrink-0 gap-2 pt-2 tiny:pt-1"
      style={{ paddingBottom: 'calc(0.5rem + env(safe-area-inset-bottom))' }}
    >
      <button
        type="button"
        onClick={onStop}
        disabled={stopping}
        aria-keyshortcuts="Escape"
        className="block min-h-[52px] flex-1 short:min-h-[46px] short:py-2 tiny:min-h-[44px] tiny:py-1 rounded-2xl border-[3px] border-white bg-stop px-5 py-3 text-lg font-bold text-white shadow-[0_4px_16px_rgba(0,0,0,0.35)] hover:bg-[#931f18]"
      >
        <span aria-hidden="true">✋ </span>
        {stopping ? t('stop.fading') : t('stop.label')}
        <kbd className="ml-2 hidden rounded border border-white/60 px-1 text-xs font-normal sm:inline">{t('stop.key')}</kbd>
      </button>
      {children}
    </div>
  );
}
