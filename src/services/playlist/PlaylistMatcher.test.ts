import { describe, expect, it } from 'vitest';
import {
  doesSubtitleMatchAudio,
  isAudioFile,
  isSubtitleFile,
  matchSubtitleForAudio,
  stripAudioExtension,
  stripSubtitleExtension,
} from './PlaylistMatcher';

describe('PlaylistMatcher', () => {
  it('strips extensions case-insensitively', () => {
    expect(stripAudioExtension('test.MP3')).toBe('test');
    expect(stripAudioExtension('test.m4a')).toBe('test');
    expect(stripSubtitleExtension('test.SRT')).toBe('test');
    expect(isAudioFile('a.wav')).toBe(true);
    expect(isAudioFile('a.vtt')).toBe(false);
    expect(isSubtitleFile('a.vtt')).toBe(true);
  });

  it('matches clean and full-name patterns', () => {
    expect(doesSubtitleMatchAudio('Lesson_01.mp3', 'Lesson_01.srt')).toBe(true);
    expect(doesSubtitleMatchAudio('Lesson_01.MP3', 'lesson_01.vtt')).toBe(true);
    expect(doesSubtitleMatchAudio('01_airport.wav', '01_airport.wav.srt')).toBe(true);
    expect(doesSubtitleMatchAudio('track_01.mp3', 'track_02.srt')).toBe(false);
  });

  it('connects single matches, leaves ambiguity unconnected', () => {
    const single = matchSubtitleForAudio('track.mp3', [{ name: 'track.vtt' } as File, { name: 'other.srt' } as File]);
    expect(single.matchedSubtitleName).toBe('track.vtt');
    expect(single.isAmbiguous).toBe(false);

    const ambiguous = matchSubtitleForAudio('track.mp3', [{ name: 'track.vtt' } as File, { name: 'track.mp3.vtt' } as File]);
    expect(ambiguous.isAmbiguous).toBe(true);
    expect(ambiguous.matchedSubtitle).toBeUndefined();
  });
});
