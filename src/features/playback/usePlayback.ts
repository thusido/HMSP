import { useCallback, useEffect, useRef, useState } from 'react';
import { AudioPlaybackService } from '../../services/audio/AudioPlaybackService';
import type { PlaybackRepeatMode, PlaybackSpeed } from '../../types';

export const SPEED_OPTIONS: PlaybackSpeed[] = [0.5, 0.75, 1.0, 1.25, 1.5];

/** Owns the audio service and exposes playback state + actions. */
export function usePlayback(opts?: { onEnded?: () => void }) {
  const serviceRef = useRef<AudioPlaybackService | null>(null);
  if (serviceRef.current === null) serviceRef.current = new AudioPlaybackService();

  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolumeState] = useState(1);
  const [rate, setRateState] = useState<PlaybackSpeed>(1.0);
  const [repeatMode, setRepeatMode] = useState<PlaybackRepeatMode>('none');

  const repeatModeRef = useRef(repeatMode);
  repeatModeRef.current = repeatMode;
  const rateRef = useRef(rate);
  rateRef.current = rate;
  const onEndedRef = useRef(opts?.onEnded);
  onEndedRef.current = opts?.onEnded;

  useEffect(() => {
    const service = serviceRef.current;
    if (!service) return;
    service.setCallbacks({
      onTimeUpdate: (t, d) => {
        setCurrentTime(t);
        setDuration(d);
      },
      onPlayStateChange: setIsPlaying,
      onLoadedMetadata: setDuration,
      onEnded: () => {
        if (repeatModeRef.current === 'repeat-one') {
          service.seek(0);
          service.play();
        } else {
          onEndedRef.current?.();
        }
      },
      onError: (e) => console.warn('Playback error:', e),
    });
    return () => service.destroy();
  }, []);

  const togglePlay = useCallback(() => serviceRef.current?.togglePlay(), []);
  const pause = useCallback(() => serviceRef.current?.pause(), []);
  const seek = useCallback((t: number) => serviceRef.current?.seek(t), []);
  const setVolume = useCallback((v: number) => {
    const clamped = Math.max(0, Math.min(1, v));
    serviceRef.current?.setVolume(clamped);
    setVolumeState(clamped);
  }, []);
  const setRate = useCallback((r: PlaybackSpeed) => {
    serviceRef.current?.setPlaybackRate(r);
    setRateState(r);
  }, []);
  const toggleRepeat = useCallback(
    () => setRepeatMode((m) => (m === 'repeat-one' ? 'none' : 'repeat-one')),
    [],
  );
  const loadFile = useCallback((file: File) => {
    const service = serviceRef.current;
    if (!service) return;
    service.load(file);
    service.setPlaybackRate(rateRef.current);
    setCurrentTime(0);
    setDuration(0);
    service.play();
  }, []);

  return {
    isPlaying,
    currentTime,
    duration,
    volume,
    rate,
    repeatMode,
    togglePlay,
    pause,
    seek,
    setVolume,
    setRate,
    toggleRepeat,
    loadFile,
  };
}
