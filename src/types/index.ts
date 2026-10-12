/** Core domain types for HMSubtitlePlayer (HMSP). */

export interface SubtitleCue {
  id: string;
  startTime: number; // seconds
  endTime: number; // seconds
  text: string;
}

export interface AudioItem {
  id: string;
  title: string;
  fileName: string;
  /**
   * Audio bytes. Tauri dialog picks store an empty shell here (name only);
   * real bytes load lazily via filePath at play time. Web/DnD files carry bytes directly.
   */
  file?: File;
  /** Native absolute path (Tauri only, memory-only, never persisted/exported). */
  filePath?: string;
  subtitleFileName?: string;
  subtitles?: SubtitleCue[];
  /** Plain-text companion (.txt): shown as-is, no cue tracking or seeking. */
  plainTextFileName?: string;
  plainText?: string;
  isMissing?: boolean;
  folderId?: string; // virtual folder id, undefined = root group
  duration?: number; // seconds
}

export interface PlaylistFolder {
  id: string;
  name: string;
  order: number;
}

export type PlaybackSpeed = 0.5 | 0.75 | 1.0 | 1.25 | 1.5 | 2.0;

export type PlaybackRepeatMode = 'none' | 'repeat-one';

export type AppTheme = 'light' | 'dark' | 'system';

/** A missing file wanted back: audio fileName + owning folder name (null = root). */
export interface ReconnectWanted {
  fileName: string;
  folderName: string | null;
}

/** A file discovered during reconnect search, tagged with its owning folder name. */
export interface ReconnectFound {
  file: File;
  folderName: string | null;
}

/** Outcome of a reconnect search: null = user cancelled the folder pick. */
export interface ReconnectSearchResult {
  found: ReconnectFound[];
  /** Files that matched but could not be read (best-effort continues). */
  failed: number;
}

/** Outcome of one Refresh run: null = nothing missing. Never silent otherwise. */
export interface RefreshResult {
  folderName: string;
  affected: number;
  failed: number;
  error: string | null;
}

/** A discovered candidate before fetching bytes: name + path segments below the picked root. */
export interface DirCandidate {
  fileName: string;
  dirSegments: string[];
}
