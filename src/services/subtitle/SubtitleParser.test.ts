import { describe, expect, it } from 'vitest';
import { parseSRT, parseSubtitle, parseTimestampToSeconds, parseWebVTT } from './SubtitleParser';

describe('SubtitleParser', () => {
  it('parses timestamps', () => {
    expect(parseTimestampToSeconds('00:01:23,456')).toBe(83.456);
    expect(parseTimestampToSeconds('01:23.456')).toBe(83.456);
    expect(parseTimestampToSeconds('01:02:03.000')).toBe(3723);
    expect(parseTimestampToSeconds('nope')).toBeNull();
  });

  it('parses SRT', () => {
    const cues = parseSRT('1\n00:00:01,000 --> 00:00:04,000\n첫 문장.\n\n2\n00:00:04,500 --> 00:00:08,200\n둘째 문장.\n');
    expect(cues).toHaveLength(2);
    expect(cues[0]).toMatchObject({ startTime: 1.0, endTime: 4.0, text: '첫 문장.' });
    expect(cues[1].startTime).toBe(4.5);
  });

  it('parses WebVTT, skipping header and stripping tags', () => {
    const cues = parseWebVTT('WEBVTT\n\n00:01.500 --> 00:04.000\n첫 문장.\n\n00:04.500 --> 00:07.000 position:50%\n<v Narrator>둘째 문장.</v>\n');
    expect(cues).toHaveLength(2);
    expect(cues[0].startTime).toBe(1.5);
    expect(cues[1].text).toBe('둘째 문장.');
  });

  it('returns [] for empty or malformed input without throwing', () => {
    expect(parseSubtitle('')).toEqual([]);
    expect(parseSubtitle('random noise')).toEqual([]);
    expect(parseSubtitle('1\nBad --> Time\nText')).toEqual([]);
    expect(parseSubtitle('WEBVTT\n\nno cues here', 'x.vtt')).toEqual([]);
  });
});
