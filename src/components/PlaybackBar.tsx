import { useEffect, useRef, useState } from 'react';
import {
  ArrowPathIcon,
  BackwardIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  ForwardIcon,
  PauseIcon,
  PlayIcon,
  SpeakerWaveIcon,
  SpeakerXMarkIcon,
} from '@heroicons/react/24/outline';
import { SPEED_OPTIONS } from '../features/playback/usePlayback';
import type { PlaybackRepeatMode, PlaybackSpeed } from '../types';
import { type Lang, STRINGS } from '../i18n';

interface PlaybackBarProps {
  currentTime: number;
  duration: number;
  isPlaying: boolean;
  rate: PlaybackSpeed;
  volume: number;
  repeatMode: PlaybackRepeatMode;
  canPrevFile: boolean;
  canNextFile: boolean;
  canPrevSubtitle: boolean;
  canNextSubtitle: boolean;
  onTogglePlay: () => void;
  onSeek: (time: number) => void;
  onPrevFile: () => void;
  onNextFile: () => void;
  onPrevSubtitle: () => void;
  onNextSubtitle: () => void;
  onChangeSpeed: (speed: PlaybackSpeed) => void;
  onChangeVolume: (volume: number) => void;
  onToggleRepeat: () => void;
  lang: Lang;
}

function formatTime(seconds: number): string {
  if (Number.isNaN(seconds) || seconds < 0) return '00:00';
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
}

const iconBtn =
  'rounded-md p-1.5 text-gray-700 transition-colors hover:bg-gray-200 dark:text-gray-200 dark:hover:bg-gray-800';

/**
 * Bottom bar. Button order is strict:
 * [Volume, Speed] · [PrevFile][PrevSub][Play][NextSub][NextFile] · [Repeat]
 */
export function PlaybackBar({
  currentTime,
  duration,
  isPlaying,
  rate,
  volume,
  repeatMode,
  canPrevFile,
  canNextFile,
  canPrevSubtitle,
  canNextSubtitle,
  onTogglePlay,
  onSeek,
  onPrevFile,
  onNextFile,
  onPrevSubtitle,
  onNextSubtitle,
  onChangeSpeed,
  onChangeVolume,
  onToggleRepeat,
  lang,
}: PlaybackBarProps) {
  const t = STRINGS[lang];
  const [volumeOpen, setVolumeOpen] = useState(false);
  const [speedOpen, setSpeedOpen] = useState(false);
  const volumeRef = useRef<HTMLDivElement>(null);
  const speedRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const close = (e: MouseEvent) => {
      if (volumeRef.current && !volumeRef.current.contains(e.target as Node)) setVolumeOpen(false);
      if (speedRef.current && !speedRef.current.contains(e.target as Node)) setSpeedOpen(false);
    };
    document.addEventListener('mousedown', close);
    return () => document.removeEventListener('mousedown', close);
  }, []);

  const roundBtn = (enabled: boolean) =>
    `rounded-full p-1.5 transition-colors sm:p-2 ${
      enabled
        ? 'text-gray-800 hover:bg-gray-200 dark:text-gray-200 dark:hover:bg-gray-800'
        : 'cursor-not-allowed text-gray-300 dark:text-gray-700'
    }`;

  return (
    <footer className="z-10 flex-shrink-0 select-none bg-chrome-light px-4 py-2.5 dark:bg-gray-900">
      <div className="mb-2 flex w-full justify-center">
        <div className="flex w-full max-w-2xl items-center gap-3 px-6 sm:px-10">
          <span className="w-10 flex-shrink-0 text-right font-mono text-xs text-gray-500">
            {formatTime(currentTime)}
          </span>
          <div className="flex flex-1 items-center">
            <input
              type="range"
              min={0}
              max={duration || 1}
              step={0.1}
              value={currentTime}
              onChange={(e) => onSeek(parseFloat(e.target.value))}
              aria-label={t.playback.seek}
              className="h-1.5 w-full cursor-pointer appearance-none rounded-lg bg-gray-300 accent-blue-600 dark:bg-gray-700"
            />
          </div>
          <span className="w-10 flex-shrink-0 font-mono text-xs text-gray-500">{formatTime(duration)}</span>
        </div>
      </div>

      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="relative" ref={volumeRef}>
            <button type="button" onClick={() => setVolumeOpen((v) => !v)} aria-label={t.playback.volume} className={iconBtn}>
              {volume === 0 ? <SpeakerXMarkIcon className="h-4 w-4" /> : <SpeakerWaveIcon className="h-4 w-4" />}
            </button>
            {volumeOpen && (
              <div className="absolute bottom-9 left-0 z-30 w-44 rounded-lg border border-gray-200 bg-white p-3 shadow-lg dark:border-gray-700 dark:bg-gray-800">
                <div className="mb-1 flex justify-between text-xs text-gray-600 dark:text-gray-300">
                  <span>{t.playback.volumeLabel}</span>
                  <span className="font-semibold">{Math.round(volume * 100)}%</span>
                </div>
                <input
                  type="range"
                  min={0}
                  max={100}
                  step={5}
                  value={Math.round(volume * 100)}
                  onChange={(e) => onChangeVolume(parseInt(e.target.value, 10) / 100)}
                  className="h-1.5 w-full cursor-pointer appearance-none rounded-lg bg-gray-200 accent-blue-600 dark:bg-gray-700"
                />
              </div>
            )}
          </div>

          <div className="relative" ref={speedRef}>
            <button
              type="button"
              onClick={() => setSpeedOpen((v) => !v)}
              aria-label={t.playback.speed}
              className="rounded-md border border-gray-300 bg-white px-2 py-0.5 text-xs font-medium text-gray-700 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-200"
            >
              {rate}x
            </button>
            {speedOpen && (
              <div className="absolute bottom-9 left-0 z-30 w-24 rounded-lg border border-gray-200 bg-white py-1 shadow-lg dark:border-gray-700 dark:bg-gray-800">
                {SPEED_OPTIONS.map((s) => (
                  <button
                    key={s}
                    type="button"
                    onClick={() => {
                      onChangeSpeed(s);
                      setSpeedOpen(false);
                    }}
                    className={`flex w-full items-center justify-between px-3 py-1.5 text-left text-xs hover:bg-gray-100 dark:hover:bg-gray-700 ${
                      rate === s
                        ? 'bg-blue-50 font-bold text-blue-600 dark:bg-blue-950/40 dark:text-blue-400'
                        : 'text-gray-700 dark:text-gray-200'
                    }`}
                  >
                    <span>{s}x</span>
                    {rate === s && <span>✓</span>}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="flex items-center gap-1 sm:gap-3">
          <button type="button" disabled={!canPrevFile} onClick={onPrevFile} aria-label={t.playback.prevFile} className={roundBtn(canPrevFile)}>
            <BackwardIcon className="h-4 w-4 sm:h-5 sm:w-5" />
          </button>
          <button type="button" disabled={!canPrevSubtitle} onClick={onPrevSubtitle} aria-label={t.playback.prevSubtitle} className={roundBtn(canPrevSubtitle)}>
            <ChevronLeftIcon className="h-4 w-4 sm:h-5 sm:w-5" />
          </button>
          <button
            type="button"
            onClick={onTogglePlay}
            aria-label={isPlaying ? t.playback.pause : t.playback.play}
            className="rounded-full bg-blue-600 p-2 text-white shadow-sm transition-transform active:scale-95 sm:p-2.5"
          >
            {isPlaying ? <PauseIcon className="h-5 w-5 sm:h-6 sm:w-6" /> : <PlayIcon className="h-5 w-5 translate-x-0.5 sm:h-6 sm:w-6" />}
          </button>
          <button type="button" disabled={!canNextSubtitle} onClick={onNextSubtitle} aria-label={t.playback.nextSubtitle} className={roundBtn(canNextSubtitle)}>
            <ChevronRightIcon className="h-4 w-4 sm:h-5 sm:w-5" />
          </button>
          <button type="button" disabled={!canNextFile} onClick={onNextFile} aria-label={t.playback.nextFile} className={roundBtn(canNextFile)}>
            <ForwardIcon className="h-4 w-4 sm:h-5 sm:w-5" />
          </button>
        </div>

        <div className="flex items-center">
          <button
            type="button"
            onClick={onToggleRepeat}
            aria-label={t.playback.repeat}
            className={`rounded-md p-1.5 transition-colors ${
              repeatMode === 'repeat-one'
                ? 'bg-blue-100 font-bold text-blue-600 dark:bg-blue-950/60 dark:text-blue-400'
                : 'text-gray-600 hover:bg-gray-200 dark:text-gray-400 dark:hover:bg-gray-800'
            }`}
          >
            <ArrowPathIcon className="h-4 w-4" />
          </button>
        </div>
      </div>
    </footer>
  );
}
