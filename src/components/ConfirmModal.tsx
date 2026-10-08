import { ExclamationTriangleIcon } from '@heroicons/react/24/outline';

interface ConfirmModalProps {
  isOpen: boolean;
  message: string;
  onConfirm: () => void;
  onCancel: () => void;
  destructive?: boolean;
}

/** Async replacement for window.confirm. */
export function ConfirmModal({ isOpen, message, onConfirm, onCancel, destructive = false }: ConfirmModalProps) {
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="fixed inset-0 bg-black/60" onClick={onCancel} aria-hidden="true" />
      <div className="relative z-50 w-full max-w-sm rounded-xl border border-gray-200 bg-white p-6 text-gray-800 shadow-2xl dark:border-gray-800 dark:bg-gray-900 dark:text-gray-100">
        <div className="flex items-start gap-3 pb-4">
          <ExclamationTriangleIcon className="mt-0.5 h-5 w-5 flex-shrink-0 text-amber-500 dark:text-amber-400" />
          <p className="text-sm leading-relaxed whitespace-pre-line">{message}</p>
        </div>
        <div className="flex justify-end gap-2 border-t border-gray-100 pt-3 dark:border-gray-800">
          <button
            type="button"
            onClick={onCancel}
            className="rounded-lg bg-gray-100 px-4 py-1.5 text-xs font-medium text-gray-700 transition-colors hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-200 dark:hover:bg-gray-700"
          >
            취소
          </button>
          <button
            type="button"
            onClick={onConfirm}
            className={`rounded-lg px-4 py-1.5 text-xs font-medium text-white transition-colors ${
              destructive ? 'bg-red-600 hover:bg-red-700 dark:bg-red-700 dark:hover:bg-red-600' : 'bg-gray-800 hover:bg-gray-900 dark:bg-gray-700 dark:hover:bg-gray-600'
            }`}
          >
            확인
          </button>
        </div>
      </div>
    </div>
  );
}
