import { useMemo } from 'react';
import { findActiveCue } from '../../services/playback/navigation';
import type { SubtitleCue } from '../../types';

/** Derives the active cue for a playback position. */
export function useReader(cues: SubtitleCue[], currentTime: number): SubtitleCue | null {
  return useMemo(() => findActiveCue(cues, currentTime), [cues, currentTime]);
}
