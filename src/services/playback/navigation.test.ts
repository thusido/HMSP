import { describe, expect, it } from 'vitest';
import type { AudioItem, SubtitleCue } from '../../types';
import {
  calculateNextSubtitleTime,
  calculatePrevSubtitleTime,
  findActiveCue,
  getGroupSortedFiles,
} from './navigation';

const cues: SubtitleCue[] = [
  { id: '1', startTime: 10.0, endTime: 15.0, text: 'First' },
  { id: '2', startTime: 20.0, endTime: 26.0, text: 'Second' },
  { id: '3', startTime: 30.0, endTime: 35.0, text: 'Third' },
];

describe('navigation', () => {
  it('finds the active cue via binary search', () => {
    expect(findActiveCue(cues, 22)?.id).toBe('2');
    expect(findActiveCue(cues, 17)).toBeNull();
    expect(findActiveCue([], 5)).toBeNull();
  });

  it('prev: restarts cue past the 2s grace, else steps back', () => {
    expect(calculatePrevSubtitleTime(22.5, cues, cues[1])).toBe(20.0);
    expect(calculatePrevSubtitleTime(21.0, cues, cues[1])).toBe(10.0);
    expect(calculatePrevSubtitleTime(5.0, cues, null)).toBeNull();
  });

  it('next: steps forward, or jumps to first cue from before it', () => {
    expect(calculateNextSubtitleTime(12.0, cues, cues[0])).toBe(20.0);
    expect(calculateNextSubtitleTime(32.0, cues, cues[2])).toBeNull();
    expect(calculateNextSubtitleTime(5.0, cues, null)).toBe(10.0);
  });

  it('keeps file navigation inside the folder boundary', () => {
    const items: AudioItem[] = [
      { id: '1', title: 'b', fileName: 'f1_b.mp3', folderId: 'folder-1' },
      { id: '2', title: 'a', fileName: 'f1_a.mp3', folderId: 'folder-1' },
      { id: '3', title: 'c', fileName: 'f2_c.mp3', folderId: 'folder-2' },
    ];
    const group = getGroupSortedFiles(items, 'folder-1');
    expect(group.map((i) => i.fileName)).toEqual(['f1_a.mp3', 'f1_b.mp3']);
    expect(getGroupSortedFiles(items, 'folder-2')).toHaveLength(1);
  });
});
