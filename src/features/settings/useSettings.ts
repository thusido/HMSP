import { useCallback, useEffect, useState } from 'react';
import type { AppTheme } from '../../types';

/** Reader typeface options (Phase 2 wires actual @font-face files). */
export type ReaderFont = 'pretendard' | 'noto-serif-kr' | 'suit' | 'ridibatang';
/** UI language ('en' lands in Phase 3; 'ja' later by union + dict). */
export type AppLanguage = 'ko';

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
  language: 'ko',
};

const READER_FONTS: ReaderFont[] = ['pretendard', 'noto-serif-kr', 'suit', 'ridibatang'];

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
      language: parsed.language === 'ko' ? 'ko' : DEFAULTS.language,
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

  useEffect(() => {
    const isDark =
      settings.theme === 'dark' ||
      (settings.theme === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches);
    document.documentElement.classList.toggle('dark', isDark);
  }, [settings.theme]);

  return { settings, updateSettings };
}
