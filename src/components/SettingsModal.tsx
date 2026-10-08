import { ArrowDownTrayIcon, ArrowUpTrayIcon, ComputerDesktopIcon, MoonIcon, SunIcon, XMarkIcon } from '@heroicons/react/24/outline';
import type { AppTheme } from '../types';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  theme: AppTheme;
  onChangeTheme: (theme: AppTheme) => void;
  onExportPlaylist: () => void;
  onImportPlaylist: () => void;
}

export function SettingsModal({ isOpen, onClose, theme, onChangeTheme, onExportPlaylist, onImportPlaylist }: SettingsModalProps) {
  if (!isOpen) return null;

  const themeBtn = (active: boolean) =>
    `flex items-center justify-center gap-1.5 rounded-lg border px-3 py-2 text-xs font-medium transition-colors ${
      active
        ? 'border-blue-600 bg-blue-50 text-blue-700 dark:bg-blue-950/40 dark:text-blue-300'
        : 'border-gray-200 text-gray-700 hover:bg-gray-50 dark:border-gray-700 dark:text-gray-300 dark:hover:bg-gray-800'
    }`;
  const backupBtn =
    'flex flex-1 items-center justify-center gap-1.5 rounded-lg border border-gray-200 bg-gray-100 px-3 py-2 text-xs font-medium text-gray-700 transition-colors hover:bg-gray-200 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-200 dark:hover:bg-gray-700';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="fixed inset-0 bg-black/60" onClick={onClose} aria-hidden="true" />
      <div className="relative z-50 w-full max-w-md rounded-xl border border-gray-200 bg-white p-6 text-gray-800 shadow-2xl dark:border-gray-800 dark:bg-gray-900 dark:text-gray-100">
        <div className="flex items-center justify-between border-b border-gray-200 pb-3 dark:border-gray-800">
          <h2 className="text-base font-bold">설정</h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close settings"
            className="rounded-md p-1 text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-700 dark:hover:bg-gray-800 dark:hover:text-gray-200"
          >
            <XMarkIcon className="h-5 w-5" />
          </button>
        </div>

        <div className="space-y-6 py-4">
          <div>
            <span className="mb-2 block text-xs font-semibold text-gray-700 dark:text-gray-300">화면 테마</span>
            <div className="grid grid-cols-3 gap-2">
              <button type="button" onClick={() => onChangeTheme('light')} className={themeBtn(theme === 'light')}>
                <SunIcon className="h-3.5 w-3.5" />
                <span>라이트</span>
              </button>
              <button type="button" onClick={() => onChangeTheme('dark')} className={themeBtn(theme === 'dark')}>
                <MoonIcon className="h-3.5 w-3.5" />
                <span>다크</span>
              </button>
              <button type="button" onClick={() => onChangeTheme('system')} className={themeBtn(theme === 'system')}>
                <ComputerDesktopIcon className="h-3.5 w-3.5" />
                <span>시스템</span>
              </button>
            </div>
          </div>

          <div>
            <span className="mb-1 block text-xs font-semibold text-gray-700 dark:text-gray-300">플레이리스트 백업 및 복구</span>
            <p className="mb-3 text-xs text-gray-500 dark:text-gray-400">
              구조를 JSON으로 내보내거나 불러옵니다. 복구 후 새로고침으로 미디어를 재연결하세요.
            </p>
            <div className="flex gap-2">
              <button type="button" onClick={onExportPlaylist} className={backupBtn}>
                <ArrowDownTrayIcon className="h-3.5 w-3.5" />
                <span>JSON 내보내기</span>
              </button>
              <button type="button" onClick={onImportPlaylist} className={backupBtn}>
                <ArrowUpTrayIcon className="h-3.5 w-3.5" />
                <span>JSON 가져오기</span>
              </button>
            </div>
          </div>
        </div>

        <div className="border-t border-gray-100 pt-3 text-right dark:border-gray-800">
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg bg-gray-800 px-4 py-1.5 text-xs font-medium text-white transition-colors hover:bg-gray-900 dark:bg-gray-700 dark:hover:bg-gray-600"
          >
            닫기
          </button>
        </div>
      </div>
    </div>
  );
}
