import { useEffect, useRef } from 'react';
import type { SubtitleCue } from '../types';
import { type Lang, STRINGS } from '../i18n';

interface MainReaderProps {
  cues: SubtitleCue[];
  activeCueId: string | null;
  onSeekToCue: (cue: SubtitleCue) => void;
  hasAudio: boolean;
  plainText?: string | null;
  readerFont: string;
  readerFontSize: number;
  readerLetterSpacing: number;
  readerLineHeight: number;
  lang: Lang;
}

/** Document-flow reader. Active cue highlighted; text selection wins over click-to-seek. */
export function MainReader({ cues, activeCueId, onSeekToCue, hasAudio, plainText, readerFont, readerFontSize, readerLetterSpacing, readerLineHeight, lang }: MainReaderProps) {
  const t = STRINGS[lang];
  const containerRef = useRef<HTMLElement>(null);
  const activeElementRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const container = containerRef.current;
    const element = activeElementRef.current;
    if (!container || !element) return;

    const containerRect = container.getBoundingClientRect();
    const elementRect = element.getBoundingClientRect();
    if (elementRect.top < containerRect.top + 70 || elementRect.bottom > containerRect.bottom - 90) {
      element.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  }, [activeCueId]);

  const handleCueClick = (cue: SubtitleCue) => {
    const selection = window.getSelection();
    if (selection && selection.toString().trim().length > 0) return;
    onSeekToCue(cue);
  };

  if (!hasAudio || (cues.length === 0 && !plainText)) {
    return (
      <main className="flex flex-1 items-center justify-center bg-paper p-8 text-gray-400 select-none dark:bg-night dark:text-gray-500">
        <p className="text-sm">
          {!hasAudio ? t.reader.noAudio : t.reader.noSubtitle}
        </p>
      </main>
    );
  }

  // Plain text companion: readable as-is, no cue tracking or seeking.
  if (cues.length === 0 && plainText) {
    return (
      <main className="selectable-reader flex-1 overflow-y-auto bg-paper px-3 py-6 sm:px-6 dark:bg-night">
        <div
          className="mx-auto min-h-full max-w-2xl rounded-3xl border border-ink/80 bg-paper px-6 py-8 text-ink sm:px-10 sm:py-12 dark:border-gray-800 dark:bg-night dark:text-gray-200"
          style={{
            fontFamily: readerFont,
            fontSize: `${readerFontSize}px`,
            letterSpacing: `${readerLetterSpacing / 100}em`,
            lineHeight: `${readerLineHeight}%`,
          }}
        >
          {plainText.split('\n').map((line, i) => (
            <p key={i} className="mb-3 last:mb-0">{line || '\u00a0'}</p>
          ))}
        </div>
      </main>
    );
  }

  return (
    <main ref={containerRef} className="selectable-reader flex-1 overflow-y-auto bg-paper px-3 py-6 sm:px-6 dark:bg-night">
      <div
        className="mx-auto min-h-full max-w-2xl space-y-3.5 rounded-3xl border border-ink/80 bg-paper px-6 py-8 text-ink sm:px-10 sm:py-12 dark:border-gray-800 dark:bg-night dark:text-gray-200"
        style={{
          fontFamily: readerFont,
          fontSize: `${readerFontSize}px`,
          letterSpacing: `${readerLetterSpacing / 100}em`,
          lineHeight: `${readerLineHeight}%`,
        }}
      >
        {cues.map((cue) => {
          const isActive = cue.id === activeCueId;
          return (
            <div
              key={cue.id}
              ref={isActive ? (el) => void (activeElementRef.current = el) : undefined}
              onClick={() => handleCueClick(cue)}
              title={t.reader.cueHint}
              className={`block w-full cursor-pointer rounded-2xl px-3.5 py-2 transition-colors duration-150 ${
                isActive
                  ? 'bg-sunshine/85 text-[1.1em] font-bold text-ink dark:bg-yellow-900/40 dark:text-yellow-100'
                  : 'text-ink hover:bg-paper-deep dark:text-gray-200 dark:hover:bg-night-hover/60'
              }`}
            >
              <span>{cue.text}</span>
            </div>
          );
        })}
      </div>
    </main>
  );
}
