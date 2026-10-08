import type { SubtitleCue } from '../../types';

/** "00:01:23,456" | "01:23.456" -> seconds. Null on malformed input. */
export function parseTimestampToSeconds(timestamp: string): number | null {
  const cleaned = timestamp.trim().replace(',', '.');
  const parts = cleaned.split(':');

  if (parts.length === 3) {
    const [h, m, s] = parts.map(parseFloat);
    if ([h, m, s].some(Number.isNaN)) return null;
    return h * 3600 + m * 60 + s;
  }
  if (parts.length === 2) {
    const [m, s] = parts.map(parseFloat);
    if ([m, s].some(Number.isNaN)) return null;
    return m * 60 + s;
  }
  return null;
}

function cleanSubtitleText(text: string): string {
  return text
    .replace(/<[^>]+>/g, '')
    .replace(/&lrm;|&rlm;/g, '')
    .trim();
}

function parseBlocks(content: string): string[][] {
  return content
    .replace(/\r\n/g, '\n')
    .replace(/\r/g, '\n')
    .split(/\n\n+/)
    .map((b) => b.trim().split('\n'));
}

function blockToCue(lines: string[], index: number, cueSettingsAllowed: boolean): SubtitleCue | null {
  const timeLineIndex = lines.findIndex((l) => l.includes('-->'));
  if (timeLineIndex === -1) return null;

  const [startStr, rest] = lines[timeLineIndex].split('-->').map((s) => s.trim());
  if (!startStr || !rest) return null;

  const endStr = cueSettingsAllowed ? rest.split(/\s+/)[0] : rest;
  const startTime = parseTimestampToSeconds(startStr);
  const endTime = parseTimestampToSeconds(endStr);
  if (startTime === null || endTime === null) return null;

  const text = cleanSubtitleText(lines.slice(timeLineIndex + 1).join(' '));
  if (!text) return null;
  return { id: `cue-${index + 1}`, startTime, endTime, text };
}

export function parseSRT(content: string): SubtitleCue[] {
  return parseBlocks(content)
    .map((lines, i) => blockToCue(lines, i, false))
    .filter((c): c is SubtitleCue => c !== null);
}

export function parseWebVTT(content: string): SubtitleCue[] {
  return parseBlocks(content)
    .filter(([first]) => first !== undefined && !/^(WEBVTT|NOTE|STYLE)/.test(first))
    .map((lines, i) => blockToCue(lines, i, true))
    .filter((c): c is SubtitleCue => c !== null);
}

/** Never throws: unparseable input yields []. Subtitles must never block playback. */
export function parseSubtitle(content: string, fileName?: string): SubtitleCue[] {
  try {
    if (fileName) {
      const lower = fileName.toLowerCase();
      if (lower.endsWith('.srt')) return parseSRT(content);
      if (lower.endsWith('.vtt')) return parseWebVTT(content);
    }
    if (content.trim().startsWith('WEBVTT')) return parseWebVTT(content);
    return parseSRT(content);
  } catch (err) {
    console.warn('Subtitle parse error, gracefully returning empty cues:', err);
    return [];
  }
}
