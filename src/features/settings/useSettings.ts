import { useCallback, useEffect, useState } from 'react';
import type { AppTheme } from '../../types';
import { type Lang, systemLang } from '../../i18n';

/** Reader typeface options (Phase 2 wires actual @font-face files). */
export type ReaderFont = 'pretendard' | 'noto-serif-kr' | 'suit' | 'ridibatang';
/** UI language ('ja' later: extend union + add dict, nothing else). */
export type AppLanguage = Lang;

export interface AppSettings {
  theme: AppTheme;
  readerFont: ReaderFont;
  fontSize: number;
  letterSpacing: number;
  lineHeight: number;
  language: AppLanguage;
}

export const SETTINGS_KEY = 'HMSP_V1_SETTINGS';

const DEFAULTS: AppSettings = {
  theme: 'light',
  readerFont: 'pretendard',
  fontSize: 16,
  letterSpacing: 0,
  lineHeight: 150,
  language: systemLang(),
};

const READER_FONTS: ReaderFont[] = ['pretendard', 'noto-serif-kr', 'suit', 'ridibatang'];

/** Display stacks for readerFont values (reader container only). */
export const READER_FONT_STACKS: Record<ReaderFont, string> = {
  pretendard: "'Pretendard', sans-serif",
  'noto-serif-kr': "'Noto Serif KR', serif",
  suit: "'SUIT', sans-serif",
  ridibatang: "'RIDIBatang', serif",
};

export const READER_DEFAULTS = {
  readerFont: DEFAULTS.readerFont,
  fontSize: DEFAULTS.fontSize,
  letterSpacing: DEFAULTS.letterSpacing,
  lineHeight: DEFAULTS.lineHeight,
};

function loadSettings(): AppSettings {
  try {
    const raw = localStorage.getItem(SETTINGS_KEY);
    if (!raw) return DEFAULTS;
    const parsed = JSON.parse(raw) as Partial<AppSettings>;
    return {
      theme: parsed.theme === 'dark' || parsed.theme === 'system' ? parsed.theme : 'light',
      readerFont: READER_FONTS.includes(parsed.readerFont as ReaderFont) ? (parsed.readerFont as ReaderFont) : DEFAULTS.readerFont,
      fontSize: typeof parsed.fontSize === 'number' ? parsed.fontSize : DEFAULTS.fontSize,
      letterSpacing: typeof parsed.letterSpacing === 'number' ? parsed.letterSpacing : DEFAULTS.letterSpacing,
      lineHeight: typeof parsed.lineHeight === 'number' ? parsed.lineHeight : DEFAULTS.lineHeight,
      language: parsed.language === 'en' ? 'en' : DEFAULTS.language,
    };
  } catch {
    return DEFAULTS;
  }
}

/**
 * Owns persisted app settings. Volume stays playback-owned; App merges it
 * into the same storage key on persist (single writer = App effect below).
 */
export function useSettings() {
  const [settings, setSettings] = useState<AppSettings>(loadSettings);
  const updateSettings = useCallback((patch: Partial<AppSettings>) => {
    setSettings((prev) => ({ ...prev, ...patch }));
  }, []);

  const resetReaderSettings = useCallback(() => {
    setSettings((prev) => ({ ...prev, ...READER_DEFAULTS }));
  }, []);

  useEffect(() => {
    const isDark =
      settings.theme === 'dark' ||
      (settings.theme === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches);
    document.documentElement.classList.toggle('dark', isDark);
    document.documentElement.lang = settings.language;
  }, [settings.theme, settings.language]);

  return { settings, updateSettings, resetReaderSettings };
}
