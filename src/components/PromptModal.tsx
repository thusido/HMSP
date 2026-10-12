import { useEffect, useRef, useState } from 'react';
import { type Lang, STRINGS } from '../i18n';

interface PromptModalProps {
  isOpen: boolean;
  message: string;
  defaultValue?: string;
  onConfirm: (value: string) => void;
  onCancel: () => void;
  lang: Lang;
}

/** Async replacement for window.prompt. */
export function PromptModal({ isOpen, message, defaultValue = '', onConfirm, onCancel, lang }: PromptModalProps) {
  const t = STRINGS[lang];
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
      <div className="relative z-50 w-full max-w-sm rounded-3xl border border-fog bg-paper p-6 text-ink dark:border-gray-800 dark:bg-night dark:text-gray-100">
        <p className="pb-4 text-sm leading-relaxed whitespace-pre-line">{message}</p>
        <input
          ref={inputRef}
          type="text"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') onConfirm(value);
          }}
          className="w-full rounded-md border border-fog px-3 py-2 focus:ring-2 focus:ring-graphite focus:outline-none dark:border-gray-700 dark:bg-night-card dark:text-gray-100"
        />
        <div className="mt-3 flex justify-end gap-2 border-t border-gray-100 pt-3 dark:border-gray-800">
          <button
            type="button"
            onClick={onCancel}
            className="rounded-2xl bg-paper-deep px-4 py-1.5 text-xs font-medium text-graphite transition-colors hover:bg-paper-deep dark:bg-night-card dark:text-gray-200 dark:hover:bg-night-hover"
          >
            {t.modal.cancel}
          </button>
          <button
            type="button"
            onClick={() => onConfirm(value)}
            className="rounded-2xl bg-mint px-4 py-1.5 text-xs font-medium text-ink transition-colors hover:bg-mint/85"
          >
            {t.modal.confirm}
          </button>
        </div>
      </div>
    </div>
  );
}
