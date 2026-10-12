import { en } from './en';
import { type Dict, ko } from './ko';

export type { Dict };

/** UI language ('ja' later: extend union + add dict, nothing else). */
export type Lang = 'ko' | 'en';

export const STRINGS: Record<Lang, Dict> = { ko, en };

/** System default: Korean devices get Korean, everything else English. */
export function systemLang(): Lang {
  if (typeof navigator === 'undefined') return 'ko';
  return navigator.language.toLowerCase().startsWith('ko') ? 'ko' : 'en';
}
