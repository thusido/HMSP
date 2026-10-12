import { ExclamationTriangleIcon } from '@heroicons/react/24/outline';
import { type Lang, STRINGS } from '../i18n';

interface ConfirmModalProps {
  isOpen: boolean;
  message: string;
  onConfirm: () => void;
  onCancel: () => void;
  destructive?: boolean;
  lang: Lang;
}

/** Async replacement for window.confirm. */
export function ConfirmModal({ isOpen, message, onConfirm, onCancel, destructive = false, lang }: ConfirmModalProps) {
  if (!isOpen) return null;
  const t = STRINGS[lang];
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="fixed inset-0 bg-black/60" onClick={onCancel} aria-hidden="true" />
      <div className="relative z-50 w-full max-w-sm rounded-3xl border border-fog bg-paper p-6 text-ink dark:border-gray-800 dark:bg-night dark:text-gray-100">
        <div className="flex items-start gap-3 pb-4">
          <ExclamationTriangleIcon className="mt-0.5 h-5 w-5 flex-shrink-0 text-amber-500 dark:text-amber-400" />
          <p className="text-sm leading-relaxed whitespace-pre-line">{message}</p>
        </div>
        <div className="flex justify-end gap-2 border-t border-gray-100 pt-3 dark:border-gray-800">
          <button
            type="button"
            onClick={onCancel}
            className="rounded-2xl bg-paper-deep px-4 py-1.5 text-xs font-medium text-graphite transition-colors hover:bg-paper-deep dark:bg-night-card dark:text-gray-200 dark:hover:bg-night-hover"
          >
            {t.modal.cancel}
          </button>
          <button
            type="button"
            onClick={onConfirm}
            className={`rounded-2xl border px-4 py-1.5 text-xs font-medium transition-colors ${
              destructive
                ? 'border-red-600 bg-red-600 text-white hover:bg-red-700 dark:bg-red-700 dark:hover:bg-red-600'
                : 'border-fog text-ink hover:bg-paper-deep dark:border-graphite dark:text-gray-200 dark:hover:bg-night-hover'
            }`}
          >
            {t.modal.confirm}
          </button>
        </div>
      </div>
    </div>
  );
}
