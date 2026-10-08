import type {
  AudioItem,
  PlaylistFolder,
  ReconnectSearchResult,
  ReconnectWanted,
} from '../../types';
import type { FsUri } from 'tauri-plugin-android-fs-api';

/** Platform boundary: everything file-system specific lives behind this interface. */
export interface PlatformAdapter {
  pickFiles(): Promise<File[]>;
  pickFolder(): Promise<{ folderName: string; files: File[] } | null>;
  /**
   * Reconnect search: walks the picked folder (recursively), resolving bytes
   * only for matched files. Returns null when cancelled.
   */
  pickReconnectFiles(wanted: ReconnectWanted[]): Promise<ReconnectSearchResult | null>;
  /**
   * Lazily loads audio bytes for a natively-pathed item (Tauri).
   * Returns null when unreadable or unsupported (web always returns null:
   * browser Files already carry bytes lazily).
   */
  readAudioFile(filePath: string): Promise<File | null>;
  exportPlaylistJson(data: { folders: PlaylistFolder[]; items: AudioItem[] }): Promise<void>;
  importPlaylistJson(): Promise<{ folders: PlaylistFolder[]; items: AudioItem[] } | null>;
}

const FILE_PATH_KEY = 'filePath';

/**
 * Attaches a native path to a File shell without changing intake signatures.
 * Never serialized: persist/export strip it alongside `file`.
 */
export function withFilePath(file: File, filePath: string): File {
  (file as unknown as Record<string, unknown>)[FILE_PATH_KEY] = filePath;
  return file;
}

/** Reads back the path attached by withFilePath (undefined for plain Files). */
export function getFilePath(file: File): string | undefined {
  const v = (file as unknown as Record<string, unknown>)[FILE_PATH_KEY];
  return typeof v === 'string' ? v : undefined;
}

/**
 * Display name for a native dialog path. Android returns SAF document IDs
 * (`primary%3ADownload%2Ffile.mp3`); desktop returns plain paths.
 * Filenames containing a literal `%` fall back to the raw segment.
 */
export function displayNameOf(path: string): string {
  const last = path.split(/[/\\]/).pop() ?? path;
  try {
    return decodeURIComponent(last).split(/[/:]/).pop() || last;
  } catch {
    return last;
  }
}

const AFS_KEY_PREFIX = 'android-fs:';

export interface FsUriKey {
  uri: string;
  documentTopTreeUri: string | null;
  name: string;
}

/** Opaque lazy key for an Android SAF entry (replaces a filesystem path). */
export function fsUriKey(uri: FsUri, name: string): string {
  return `${AFS_KEY_PREFIX}${JSON.stringify({ uri: uri.uri, documentTopTreeUri: uri.documentTopTreeUri, name })}`;
}

/** Parses a key made by fsUriKey (null for plain paths). */
export function parseFsUriKey(key: string): FsUriKey | null {
  if (!key.startsWith(AFS_KEY_PREFIX)) return null;
  try {
    const parsed = JSON.parse(key.slice(AFS_KEY_PREFIX.length)) as Partial<FsUriKey>;
    if (typeof parsed.uri === 'string' && typeof parsed.name === 'string') {
      return { uri: parsed.uri, documentTopTreeUri: parsed.documentTopTreeUri ?? null, name: parsed.name };
    }
  } catch {
    /* fallthrough */
  }
  return null;
}
