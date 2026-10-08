import { useEffect, useRef, useState } from 'react';

interface PromptModalProps {
  isOpen: boolean;
  message: string;
  defaultValue?: string;
  onConfirm: (value: string) => void;
  onCancel: () => void;
}

/** Async replacement for window.prompt. */
export function PromptModal({ isOpen, message, defaultValue = '', onConfirm, onCancel }: PromptModalProps) {
  const [value, setValue] = useState(defaultValue);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setValue(defaultValue);
  }, [defaultValue]);
  useEffect(() => {
    if (isOpen) inputRef.current?.focus();
  }, [isOpen ]);

  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="fixed inset-0 bg-black/60" onClick={onCancel} aria-hidden="true" />
      <div className="relative z-50 w-full max-w-sm rounded-xl border border-gray-200 bg-white p-6 text-gray-800 shadow-2xl dark:border-gray-800 dark:bg-gray-900 dark:text-gray-100">
        <p className="pb-4 text-sm leading-relaxed whitespace-pre-line">{message}</p>
        <input
          ref={inputRef}
          type="text"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') onConfirm(value);
          }}
          className="w-full rounded-md border border-gray-300 px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:outline-none dark:border-gray-700 dark:bg-gray-800 dark:text-gray-100"
        />
        <div className="mt-3 flex justify-end gap-2 border-t border-gray-100 pt-3 dark:border-gray-800">
          <button
            type="button"
            onClick={onCancel}
            className="rounded-lg bg-gray-100 px-4 py-1.5 text-xs font-medium text-gray-700 transition-colors hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-200 dark:hover:bg-gray-700"
          >
            취소
          </button>
          <button
            type="button"
            onClick={() => onConfirm(value)}
            className="rounded-lg bg-blue-600 px-4 py-1.5 text-xs font-medium text-white transition-colors hover:bg-blue-700"
          >
            확인
          </button>
        </div>
      </div>
    </div>
  );
}
