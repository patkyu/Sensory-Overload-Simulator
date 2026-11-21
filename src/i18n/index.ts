import en from './en.json';
import tl from './tl.json';
import { useCallback } from 'react';
import { useSession, type Lang } from '../state/session';

type Dict = Record<string, string>;
const dicts: Record<Lang, Dict> = { en: en as Dict, tl: tl as Dict };

export type TFn = (key: string, vars?: Record<string, string | number>) => string;

export function translate(lang: Lang, key: string, vars?: Record<string, string | number>): string {
  // Fallback chain: chosen language → English → the key itself (so missing strings are visible).
  let s = dicts[lang][key] ?? dicts.en[key] ?? key;
  if (vars) {
    for (const [k, v] of Object.entries(vars)) s = s.split(`{${k}}`).join(String(v));
  }
  return s;
}

export function useT(): TFn {
  const { lang } = useSession();
  return useCallback((key, vars) => translate(lang, key, vars), [lang]);
}

/** Strings that still need advisor-written copy start with "TODO". Rendered with a visible marker. */
export function isTodo(s: string): boolean {
  return s.startsWith('TODO');
}

export const allKeys = (lang: Lang) => Object.keys(dicts[lang]);
