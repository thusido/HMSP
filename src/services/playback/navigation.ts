import type { AudioItem, SubtitleCue } from '../../types';
import { compareFileName } from '../playlist/compare';

/** Binary-search active cue for time t. Null when no cue covers t. */
export function findActiveCue(cues: SubtitleCue[], time: number): SubtitleCue | null {
  let lo = 0;
  let hi = cues.length - 1;
  while (lo <= hi) {
    const mid = (lo + hi) >> 1;
    const cue = cues[mid];
    if (time < cue.startTime) hi = mid - 1;
    else if (time > cue.endTime) lo = mid + 1;
    else return cue;
  }
  return null;
}

/** Prev-subtitle: rewind within cue past the 2s grace, else step to the previous cue. */
export function calculatePrevSubtitleTime(
  currentTime: number,
  cues: SubtitleCue[],
  activeCue: SubtitleCue | null,
): number | null {
  if (cues.length === 0) return null;
  if (activeCue) {
    if (currentTime >= activeCue.startTime + 2.0) return activeCue.startTime;
    const i = cues.findIndex((c) => c.id === activeCue.id);
    if (i > 0) return cues[i - 1].startTime;
    return activeCue.startTime;
  }
  const prev = [...cues].reverse().find((c) => c.startTime < currentTime);
  return prev ? prev.startTime : null;
}

/** Next-subtitle: step forward, or jump to the first cue when before it. */
export function calculateNextSubtitleTime(
  currentTime: number,
  cues: SubtitleCue[],
  activeCue: SubtitleCue | null,
): number | null {
  if (cues.length === 0) return null;
  if (activeCue) {
    const i = cues.findIndex((c) => c.id === activeCue.id);
    return i < cues.length - 1 ? cues[i + 1].startTime : null;
  }
  if (currentTime < cues[0].startTime) return cues[0].startTime;
  const next = cues.find((c) => c.startTime > currentTime);
  return next ? next.startTime : null;
}

/** Files of one virtual folder (or root when folderId is undefined), sorted by filename. */
export function getGroupSortedFiles(items: AudioItem[], folderId?: string): AudioItem[] {
  return items.filter((it) => it.folderId === folderId).sort((a, b) => compareFileName(a.fileName, b.fileName));
}
