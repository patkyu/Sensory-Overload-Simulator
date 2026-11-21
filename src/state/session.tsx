import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import { readSession, writeSession } from '../lib/storage';

export type Lang = 'en' | 'tl';

interface SessionValue {
  lang: Lang;
  setLang: (l: Lang) => void;
  /** Gentle mode: lower intensity, no flicker, no shake, no motion. */
  gentle: boolean;
  setGentle: (g: boolean) => void;
  muted: boolean;
  setMuted: (m: boolean) => void;
}

const SessionContext = createContext<SessionValue | null>(null);

function prefersReducedMotion(): boolean {
  try {
    return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  } catch {
    return false;
  }
}

/** Settings persist for this browser tab only (sessionStorage). Nothing personal is stored. */
export function SessionProvider({ children }: { children: ReactNode }) {
  const [lang, setLang] = useState<Lang>(() => readSession<Lang>('sos.lang', 'en'));
  // Reduced-motion users always start in gentle mode; they can still switch it off.
  const [gentle, setGentle] = useState<boolean>(() => readSession('sos.gentle', prefersReducedMotion()));
  const [muted, setMuted] = useState<boolean>(false);

  useEffect(() => writeSession('sos.lang', lang), [lang]);
  useEffect(() => writeSession('sos.gentle', gentle), [gentle]);
  useEffect(() => {
    document.documentElement.lang = lang === 'tl' ? 'tl' : 'en';
  }, [lang]);

  // If the OS setting turns on mid-session, follow it.
  useEffect(() => {
    let mq: MediaQueryList;
    try {
      mq = window.matchMedia('(prefers-reduced-motion: reduce)');
    } catch {
      return;
    }
    const onChange = () => mq.matches && setGentle(true);
    mq.addEventListener?.('change', onChange);
    return () => mq.removeEventListener?.('change', onChange);
  }, []);

  const value = useMemo(
    () => ({ lang, setLang, gentle, setGentle, muted, setMuted }),
    [lang, gentle, muted],
  );
  return <SessionContext.Provider value={value}>{children}</SessionContext.Provider>;
}

export function useSession(): SessionValue {
  const v = useContext(SessionContext);
  if (!v) throw new Error('useSession outside SessionProvider');
  return v;
}
