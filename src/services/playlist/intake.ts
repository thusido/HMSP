import type { AudioItem, SubtitleCue } from '../../types';
import { getFilePath } from '../platform/PlatformAdapter';
import { isAudioFile, isPlainTextFile, isSubtitleFile, matchSubtitleForAudio, matchTextForAudio } from './PlaylistMatcher';
import { parseSubtitle } from '../subtitle/SubtitleParser';

function newItemId(): string {
  return `item-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
}

async function parseSubtitleFiles(subtitleFiles: File[]): Promise<Map<string, { file: File; cues: SubtitleCue[] }>> {
  const cache = new Map<string, { file: File; cues: SubtitleCue[] }>();
  for (const sub of subtitleFiles) {
    try {
      cache.set(sub.name, { file: sub, cues: parseSubtitle(await sub.text(), sub.name) });
    } catch (err) {
      console.warn('Subtitle parse error:', err);
    }
  }
  return cache;
}

async function parseTextFiles(textFiles: File[]): Promise<Map<string, string>> {
  const cache = new Map<string, string>();
  for (const f of textFiles) {
    try {
      cache.set(f.name, await f.text());
    } catch (err) {
      console.warn('Text read error:', err);
    }
  }
  return cache;
}

/**
 * Pure file intake: re-attaches known files, adds new audio, auto-matches subtitles.
 * reconnectOnly skips adding unknown files (used by Refresh). Never throws.
 *
 * targetFolderId scope: undefined = any folder, null = root items only, id = that folder.
 */
export async function intakeFiles(
  files: File[],
  prevItems: AudioItem[],
  targetFolderId: string | null | undefined,
  reconnectOnly = false,
): Promise<{ items: AudioItem[]; affectedCount: number }> {
  const inScope = (folderId: string | undefined) =>
    targetFolderId === undefined ||
    (targetFolderId === null ? folderId == null : folderId === targetFolderId);
  const audioFiles = files.filter((f) => isAudioFile(f.name));
  const subtitleFiles = files.filter((f) => isSubtitleFile(f.name));
  const textFiles = files.filter((f) => isPlainTextFile(f.name));
  if (audioFiles.length === 0 && subtitleFiles.length === 0 && textFiles.length === 0) {
    return { items: prevItems, affectedCount: 0 };
  }

  const cache = await parseSubtitleFiles(subtitleFiles);
  const textCache = await parseTextFiles(textFiles);
  const updated = [...prevItems];
  const newlyAdded: AudioItem[] = [];
  const connectedThisCall = new Set<string>();
  let affectedCount = 0;

  for (const audioFile of audioFiles) {
    const match = matchSubtitleForAudio(audioFile.name, subtitleFiles);
    const cached = match.matchedSubtitle ? cache.get(match.matchedSubtitle.name) : undefined;
    const subPatch = cached ? { subtitleFileName: cached.file.name, subtitles: cached.cues } : {};
    // Cued subtitles win; plain text fills items that matched nothing.
    const textFile = Object.keys(subPatch).length === 0 ? matchTextForAudio(audioFile.name, textFiles) : undefined;
    const textContent = textFile ? textCache.get(textFile.name) : undefined;
    const textPatch =
      textContent !== undefined && textFile
        ? { plainTextFileName: textFile.name, plainText: textContent, subtitles: [] as SubtitleCue[] }
        : {};
    const filePath = getFilePath(audioFile);

    if (reconnectOnly) {
      // One File is shareable: every duplicate missing item gets connected.
      // Items already connected by an earlier same-name file in this call are skipped.
      for (let i = 0; i < updated.length; i++) {
        const it = updated[i];
        if (it.fileName === audioFile.name && inScope(it.folderId) && it.isMissing && !connectedThisCall.has(it.id)) {
          updated[i] = { ...it, file: audioFile, isMissing: false, ...subPatch, ...textPatch, ...(filePath ? { filePath } : {}) };
          connectedThisCall.add(it.id);
          affectedCount++;
        }
      }
      continue;
    }

    const existingIdx = updated.findIndex((it) => it.fileName === audioFile.name && inScope(it.folderId));
    if (existingIdx >= 0) {
      updated[existingIdx] = { ...updated[existingIdx], file: audioFile, isMissing: false, ...subPatch, ...textPatch, ...(filePath ? { filePath } : {}) };
      affectedCount++;
    } else {
      newlyAdded.push({
        id: newItemId(),
        title: audioFile.name,
        fileName: audioFile.name,
        file: audioFile,
        ...(filePath ? { filePath } : {}),
        ...subPatch,
        ...textPatch,
        folderId: typeof targetFolderId === 'string' ? targetFolderId : undefined,
        isMissing: false,
      });
      affectedCount++;
    }
  }

  // Lone subtitle files also match items that still lack subtitles.
  if (subtitleFiles.length > 0) {
    for (let i = 0; i < updated.length; i++) {
      const item = updated[i];
      if (item.subtitles?.length) continue;
      if (!inScope(item.folderId)) continue;
      const match = matchSubtitleForAudio(item.fileName, subtitleFiles);
      const cached = match.matchedSubtitle ? cache.get(match.matchedSubtitle.name) : undefined;
      if (cached) {
        updated[i] = { ...item, subtitleFileName: cached.file.name, subtitles: cached.cues };
        affectedCount++;
      }
    }
  }

  // Lone text files also match items that still lack subtitles.
  if (textFiles.length > 0) {
    for (let i = 0; i < updated.length; i++) {
      const item = updated[i];
      if (item.subtitles?.length || item.plainText) continue;
      if (!inScope(item.folderId)) continue;
      const textFile = matchTextForAudio(item.fileName, textFiles);
      const textContent = textFile ? textCache.get(textFile.name) : undefined;
      if (textContent !== undefined && textFile) {
        updated[i] = { ...item, plainTextFileName: textFile.name, plainText: textContent, subtitles: [] };
        affectedCount++;
      }
    }
  }

  return { items: [...updated, ...newlyAdded], affectedCount };
}
