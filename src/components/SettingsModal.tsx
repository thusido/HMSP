import { ArrowDownTrayIcon, ArrowUpTrayIcon, ComputerDesktopIcon, MinusIcon, MoonIcon, PlusIcon, SunIcon, XMarkIcon } from '@heroicons/react/24/outline';
import type { AppTheme } from '../types';
import type { AppLanguage, AppSettings, ReaderFont } from '../features/settings/useSettings';
import { type Dict, type Lang, STRINGS } from '../i18n';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  theme: AppTheme;
  onChangeTheme: (theme: AppTheme) => void;
  readerFont: ReaderFont;
  fontSize: number;
  letterSpacing: number;
  lineHeight: number;
  onUpdateReader: (patch: Partial<Pick<AppSettings, 'readerFont' | 'fontSize' | 'letterSpacing' | 'lineHeight'>>) => void;
  onResetReader: () => void;
  language: AppLanguage;
  onChangeLanguage: (language: AppLanguage) => void;
  lang: Lang;
  onExportPlaylist: () => void;
  onImportPlaylist: () => void;
}

const FONT_VALUES: ReaderFont[] = ['pretendard', 'noto-serif-kr', 'suit', 'ridibatang'];

function fontLabel(t: Dict, value: ReaderFont): string {
  switch (value) {
    case 'noto-serif-kr': return t.settings.fontSerif;
    case 'suit': return t.settings.fontSuit;
    case 'ridibatang': return t.settings.fontRidi;
    default: return t.settings.fontDefault;
  }
}

function Stepper({ label, value, display, decreaseLabel, increaseLabel, onMinus, onPlus }: { label: string; value: string; display?: string; decreaseLabel: string; increaseLabel: string; onMinus: () => void; onPlus: () => void }) {
  const btn =
    'flex h-7 w-7 items-center justify-center rounded-md border border-fog text-graphite transition-colors hover:bg-paper-deep dark:border-white/10 dark:text-smoke dark:hover:bg-night-hover';
  return (
    <div className="flex items-center justify-between py-1">
      <span className="text-xs text-graphite dark:text-gray-400">{label}</span>
      <div className="flex items-center gap-2">
        <button type="button" onClick={onMinus} aria-label={decreaseLabel} className={btn}>
          <MinusIcon className="h-3.5 w-3.5" />
        </button>
        <span className="w-12 text-center text-xs font-medium text-ink dark:text-white">{display ?? value}</span>
        <button type="button" onClick={onPlus} aria-label={increaseLabel} className={btn}>
          <PlusIcon className="h-3.5 w-3.5" />
        </button>
      </div>
    </div>
  );
}

export function SettingsModal({ isOpen, onClose, theme, onChangeTheme, readerFont, fontSize, letterSpacing, lineHeight, onUpdateReader, onResetReader, language, onChangeLanguage, lang, onExportPlaylist, onImportPlaylist }: SettingsModalProps) {
  const t = STRINGS[lang];
  if (!isOpen) return null;

  const themeBtn = (active: boolean) =>
    `flex items-center justify-center gap-1.5 rounded-2xl border px-3 py-2 text-xs font-medium transition-colors ${
      active
        ? 'border-mint bg-mint/15 text-ink dark:bg-mint/15 dark:text-mint'
        : 'border-fog text-graphite hover:bg-paper-deep dark:border-white/10 dark:text-smoke dark:hover:bg-night-hover'
    }`;
  const backupBtn =
    'flex flex-1 items-center justify-center gap-1.5 rounded-2xl border border-fog bg-paper-deep px-3 py-2 text-xs font-medium text-graphite transition-colors hover:bg-paper-deep dark:border-white/10 dark:bg-night-card dark:text-white dark:hover:bg-night-hover';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="fixed inset-0 bg-black/60" onClick={onClose} aria-hidden="true" />
      <div className="relative z-50 w-full max-w-md rounded-3xl border border-fog bg-paper p-6 text-ink dark:border-white/10 dark:bg-night dark:text-white">
        <div className="flex items-center justify-between border-b border-fog pb-3 dark:border-white/10">
          <h2 className="text-base font-bold">{t.settings.title}</h2>
          <button
            type="button"
            onClick={onClose}
            aria-label={t.appBar.settings}
            className="rounded-md p-1 text-gray-400 transition-colors hover:bg-paper-deep hover:text-gray-700 dark:hover:bg-night-hover dark:hover:text-white"
          >
            <XMarkIcon className="h-5 w-5" />
          </button>
        </div>

        <div className="space-y-6 py-4">
          <div>
            <span className="mb-2 block text-xs font-semibold text-graphite dark:text-smoke">{t.settings.theme}</span>
            <div className="grid grid-cols-3 gap-2">
              <button type="button" onClick={() => onChangeTheme('light')} className={themeBtn(theme === 'light')}>
                <SunIcon className="h-3.5 w-3.5" />
                <span>{t.settings.light}</span>
              </button>
              <button type="button" onClick={() => onChangeTheme('dark')} className={themeBtn(theme === 'dark')}>
                <MoonIcon className="h-3.5 w-3.5" />
                <span>{t.settings.dark}</span>
              </button>
              <button type="button" onClick={() => onChangeTheme('system')} className={themeBtn(theme === 'system')}>
                <ComputerDesktopIcon className="h-3.5 w-3.5" />
                <span>{t.settings.system}</span>
              </button>
            </div>
          </div>

          <div>
            <div className="mb-2 flex items-center justify-between">
              <span className="text-xs font-semibold text-graphite dark:text-smoke">{t.settings.readerFont}</span>
              <button type="button" onClick={onResetReader} className="text-xs text-gray-400 transition-colors hover:text-gray-600 dark:hover:text-smoke">
                {t.settings.reset}
              </button>
            </div>
            <div className="grid grid-cols-4 gap-2">
              {FONT_VALUES.map((value) => (
                <button key={value} type="button" onClick={() => onUpdateReader({ readerFont: value })} className={themeBtn(readerFont === value)}>
                  <span>{fontLabel(t, value)}</span>
                </button>
              ))}
            </div>
            <div className="mt-2">
              <Stepper label={t.settings.size} value={`${fontSize}`} display={`${fontSize}px`} decreaseLabel={t.settings.decrease(t.settings.size)} increaseLabel={t.settings.increase(t.settings.size)} onMinus={() => onUpdateReader({ fontSize: Math.max(10, fontSize - 1) })} onPlus={() => onUpdateReader({ fontSize: Math.min(32, fontSize + 1) })} />
              <Stepper label={t.settings.letterSpacing} value={`${letterSpacing}%`} decreaseLabel={t.settings.decrease(t.settings.letterSpacing)} increaseLabel={t.settings.increase(t.settings.letterSpacing)} onMinus={() => onUpdateReader({ letterSpacing: Math.max(-5, letterSpacing - 1) })} onPlus={() => onUpdateReader({ letterSpacing: Math.min(20, letterSpacing + 1) })} />
              <Stepper label={t.settings.lineHeight} value={`${lineHeight}%`} decreaseLabel={t.settings.decrease(t.settings.lineHeight)} increaseLabel={t.settings.increase(t.settings.lineHeight)} onMinus={() => onUpdateReader({ lineHeight: Math.max(100, lineHeight - 5) })} onPlus={() => onUpdateReader({ lineHeight: Math.min(250, lineHeight + 5) })} />
            </div>
          </div>

          <div>
            <span className="mb-2 block text-xs font-semibold text-graphite dark:text-smoke">{t.settings.language}</span>
            <div className="grid grid-cols-2 gap-2">
              <button type="button" onClick={() => onChangeLanguage('ko')} className={themeBtn(language === 'ko')}>
                <span>{t.settings.langKo}</span>
              </button>
              <button type="button" onClick={() => onChangeLanguage('en')} className={themeBtn(language === 'en')}>
                <span>{t.settings.langEn}</span>
              </button>
            </div>
          </div>

          <div>
            <span className="mb-1 block text-xs font-semibold text-graphite dark:text-smoke">{t.settings.backupTitle}</span>
            <p className="mb-3 text-xs text-gray-500 dark:text-gray-400">
              {t.settings.backupDesc}
            </p>
            <div className="flex gap-2">
              <button type="button" onClick={onExportPlaylist} className={backupBtn}>
                <ArrowDownTrayIcon className="h-3.5 w-3.5" />
                <span>{t.settings.export}</span>
              </button>
              <button type="button" onClick={onImportPlaylist} className={backupBtn}>
                <ArrowUpTrayIcon className="h-3.5 w-3.5" />
                <span>{t.settings.import}</span>
              </button>
            </div>
          </div>
        </div>

        <div className="border-t border-gray-100 pt-3 dark:border-white/10">
          <p className="mb-2 text-left text-xs leading-relaxed text-gray-400 dark:text-gray-500">
            {t.settings.fontNotice}
          </p>
          <div className="text-right">
          <button
            type="button"
            onClick={onClose}
            className="rounded-2xl border border-fog px-4 py-1.5 text-xs font-medium text-ink transition-colors hover:bg-paper-deep dark:border-graphite dark:text-white dark:hover:bg-night-hover"
          >
            {t.settings.close}
          </button>
          </div>
        </div>
      </div>
    </div>
  );
}
