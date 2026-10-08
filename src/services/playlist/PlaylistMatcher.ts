const AUDIO_EXTENSIONS = ['.wav', '.mp3', '.m4a'];
const SUBTITLE_EXTENSIONS = ['.vtt', '.srt'];

function stripExtension(fileName: string, extensions: string[]): string {
  const lower = fileName.toLowerCase();
  for (const ext of extensions) {
    if (lower.endsWith(ext)) return fileName.slice(0, fileName.length - ext.length);
  }
  return fileName;
}

export function stripAudioExtension(fileName: string): string {
  return stripExtension(fileName, AUDIO_EXTENSIONS);
}

export function stripSubtitleExtension(fileName: string): string {
  return stripExtension(fileName, SUBTITLE_EXTENSIONS);
}

export function isAudioFile(fileName: string): boolean {
  return stripAudioExtension(fileName) !== fileName;
}

export function isSubtitleFile(fileName: string): boolean {
  return stripSubtitleExtension(fileName) !== fileName;
}

/**
 * Two accepted patterns (case-insensitive):
 * 1. clean: "example.wav" + "example.vtt"
 * 2. full name preserved: "example.wav" + "example.wav.vtt"
 */
export function doesSubtitleMatchAudio(audioFileName: string, subtitleFileName: string): boolean {
  const cleanAudio = stripAudioExtension(audioFileName).toLowerCase();
  const subBase = stripSubtitleExtension(subtitleFileName).toLowerCase();
  return cleanAudio === subBase || audioFileName.toLowerCase() === subBase;
}

interface MatchResult {
  matchedSubtitle?: File;
  matchedSubtitleName?: string;
  isAmbiguous: boolean;
}

/** Returns a match only when exactly one candidate fits; ambiguity stays unconnected. */
export function matchSubtitleForAudio(audioFileName: string, subtitleFiles: File[]): MatchResult {
  const matched = subtitleFiles.filter((sub) => doesSubtitleMatchAudio(audioFileName, sub.name));
  if (matched.length === 1) {
    return { matchedSubtitle: matched[0], matchedSubtitleName: matched[0].name, isAmbiguous: false };
  }
  return { isAmbiguous: matched.length > 1 };
}
