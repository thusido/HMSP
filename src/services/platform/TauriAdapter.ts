import { open, save } from '@tauri-apps/plugin-dialog';
import { readDir, readFile, readTextFile, writeTextFile } from '@tauri-apps/plugin-fs';
import {
  getName as afsGetName,
  isAndroid,
  readDir as afsReadDir,
  readFile as afsReadFile,
  readTextFile as afsReadText,
  showOpenDirPicker,
  type EntryMetadataWithUri,
} from 'tauri-plugin-android-fs-api';
import { join } from '@tauri-apps/api/path';
import { invoke } from '@tauri-apps/api/core';
import type {
  AudioItem,
  DirCandidate,
  PlaylistFolder,
  ReconnectFound,
  ReconnectSearchResult,
  ReconnectWanted,
} from '../../types';
import { runBounded, selectReconnect, shouldDescend } from '../playlist/reconnect';
import { isAudioFile } from '../playlist/PlaylistMatcher';
import type { PlatformAdapter } from './PlatformAdapter';
import { displayNameOf, fsUriKey, parseFsUriKey, withFilePath } from './PlatformAdapter';

const AUDIO_EXTS = ['mp3', 'wav', 'm4a'];
const SUBTITLE_EXTS = ['vtt', 'srt'];
const TEXT_EXTS = ['txt'];
const ALL_EXTS = [...AUDIO_EXTS, ...SUBTITLE_EXTS, ...TEXT_EXTS];

/** Desktop/Android adapter: native dialogs + fs, bridged to web File so core stays unchanged. */
export class TauriAdapter implements PlatformAdapter {
  async pickFiles(): Promise<File[]> {
    // Android SAF hides vtt/srt from filtered pickers; intake validates instead.
    const paths = await open(isAndroid() ? { multiple: true } : { multiple: true, filters: [{ name: 'Media', extensions: ALL_EXTS }] });
    if (!paths) return [];
    const selected = Array.isArray(paths) ? paths : [paths];
    // Audio stays a shell (bytes load at play); subtitles are KBs, read eagerly.
    return Promise.all(
      selected.map((p) => (isAudioFile(p) ? this.pathToShell(p) : this.pathToFile(p).catch(() => null))),
    ).then((files) => files.filter((f): f is File => f !== null));
  }

  async pickFolder(): Promise<{ folderName: string; files: File[] } | null> {
    // Desktop parity is flat (top level only); Android SAF via android-fs instead
    // of the unimplemented directory:true dialog.
    if (isAndroid()) {
      const dirUri = await showOpenDirPicker();
      if (!dirUri) return null;
      const folderName = await afsGetName(dirUri).catch(() => 'Folder');
      const entries = await afsReadDir(dirUri).catch(() => []);
      const settled = await Promise.all(entries.map((e) => this.afsEntryToFile(e).catch(() => null)));
      return { folderName, files: settled.filter((f): f is File => f !== null) };
    }
    const dir = await open({ directory: true });
    if (!dir) return null;
    const dirPath = Array.isArray(dir) ? dir[0] : dir;
    const folderName = dirPath.split(/[/\\]/).pop() || 'Folder';
    const entries = await readDir(dirPath);
    const media = entries.filter(
      (e) => !e.isDirectory && ALL_EXTS.some((ext) => e.name.toLowerCase().endsWith(`.${ext}`)),
    );
    const shells = media.filter((e) => isAudioFile(e.name)).map((e) => this.pathToShell(`${dirPath}/${e.name}`));
    const subs = await Promise.all(
      media
        .filter((e) => !isAudioFile(e.name))
        .map((e) => this.pathToFile(`${dirPath}/${e.name}`).catch(() => null)),
    );
    const files = [...shells, ...subs.filter((f): f is File => f !== null)];
    return { folderName, files };
  }

  async pickReconnectFiles(wanted: ReconnectWanted[]): Promise<ReconnectSearchResult | null> {
    if (wanted.length === 0) return { found: [], failed: 0 };
    // Candidates carry either a desktop path or an android-fs key in fullPath;
    // selectReconnect + resolution below handle both identically.
    const candidates: (DirCandidate & { fullPath: string })[] = [];
    let pickedRootName: string;
    if (isAndroid()) {
      const dirUri = await showOpenDirPicker();
      if (!dirUri) return null;
      pickedRootName = await afsGetName(dirUri).catch(() => 'Folder');
      await this.walkAfs(dirUri, [], candidates);
    } else {
      const dir = await open({ directory: true });
      if (!dir) return null;
      const dirPath = Array.isArray(dir) ? dir[0] : dir;
      pickedRootName = dirPath.split(/[/\\]/).pop() || 'Folder';
      // Dialog paths read fine, but joined sub-paths hit `forbidden` without an explicit scope.
      await invoke('allow_dir_recursive', { path: dirPath }).catch(() => null);
      // Collect (name, location) only; bytes resolve after matching.
      await this.walkPath(dirPath, [], candidates);
    }
    // Audio resolves to shells (no bytes); only subtitles read eagerly (KBs), isolated.
    const { ok: found, failed } = await runBounded(
      selectReconnect(candidates, wanted, pickedRootName).map((sel) => async (): Promise<ReconnectFound> => {
        const c = candidates[sel.index];
        const file = await this.resolveCandidate(c.fullPath, c.fileName);
        return { file, folderName: sel.folderName };
      }),
      4,
    );
    return { found, failed };
  }

  async readAudioFile(filePath: string): Promise<File | null> {
    try {
      const key = parseFsUriKey(filePath);
      if (key) {
        const bytes = await afsReadFile({ uri: key.uri, documentTopTreeUri: key.documentTopTreeUri });
        return new File([bytes as unknown as BlobPart], key.name);
      }
      return await this.pathToFile(filePath);
    } catch {
      return null;
    }
  }

  async exportPlaylistJson(data: { folders: PlaylistFolder[]; items: AudioItem[] }): Promise<void> {
    const path = await save({
      filters: [{ name: 'JSON', extensions: ['json'] }],
      defaultPath: `HMSP_playlist_${new Date().toISOString().slice(0, 10)}.json`,
    });
    if (!path) return;
    await writeTextFile(path, JSON.stringify(data, null, 2));
  }

  async importPlaylistJson(): Promise<{ folders: PlaylistFolder[]; items: AudioItem[] } | null> {
    const path = await open({ filters: [{ name: 'JSON', extensions: ['json'] }], multiple: false });
    if (!path) return null;
    const selected = Array.isArray(path) ? path[0] : path;
    try {
      const parsed = JSON.parse(await readTextFile(selected));
      if (Array.isArray(parsed.folders) && Array.isArray(parsed.items)) return parsed;
    } catch (err) {
      console.warn('Invalid playlist JSON:', err);
    }
    return null;
  }

  private pathToShell(filePath: string): File {
    const name = displayNameOf(filePath);
    return withFilePath(new File([], name), filePath);
  }

  private async pathToFile(filePath: string): Promise<File> {
    // ponytail: bridge native path → web File so the rest of the app stays unchanged
    const contents = await readFile(filePath);
    return new File([contents as unknown as BlobPart], displayNameOf(filePath));
  }

  /** One SAF entry → shell (audio) or bytes (subtitle); null when unsupported. */
  private async afsEntryToFile(e: EntryMetadataWithUri): Promise<File | null> {
    if (e.type !== 'File') return null;
    if (!ALL_EXTS.some((ext) => e.name.toLowerCase().endsWith(`.${ext}`))) return null;
    if (isAudioFile(e.name)) return withFilePath(new File([], e.name), fsUriKey(e.uri, e.name));
    return new File([await afsReadText(e.uri)], e.name);
  }

  /** fullPath is either a desktop path or an android-fs key; fileName decides audio/sub. */
  private async resolveCandidate(fullPath: string, fileName: string): Promise<File> {
    const key = parseFsUriKey(fullPath);
    if (key) {
      if (isAudioFile(fileName)) return withFilePath(new File([], fileName), fullPath);
      return new File([await afsReadText({ uri: key.uri, documentTopTreeUri: key.documentTopTreeUri })], fileName);
    }
    return isAudioFile(fullPath) ? this.pathToShell(fullPath) : await this.pathToFile(fullPath);
  }

  private async walkPath(path: string, segments: string[], out: (DirCandidate & { fullPath: string })[]): Promise<void> {
    let entries;
    try {
      entries = await readDir(path);
    } catch {
      return;
    }
    for (const e of entries) {
      if (e.isDirectory) {
        if (e.isSymlink || !shouldDescend(e.name, segments.length + 1)) continue;
        await this.walkPath(await join(path, e.name), [...segments, e.name], out);
      } else if (ALL_EXTS.some((ext) => e.name.toLowerCase().endsWith(`.${ext}`))) {
        out.push({ fileName: e.name, dirSegments: segments, fullPath: await join(path, e.name) });
      }
    }
  }

  private async walkAfs(uri: Parameters<typeof afsReadDir>[0], segments: string[], out: (DirCandidate & { fullPath: string })[]): Promise<void> {
    let entries;
    try {
      entries = await afsReadDir(uri);
    } catch {
      return;
    }
    for (const e of entries) {
      if (e.type === 'Dir') {
        if (!shouldDescend(e.name, segments.length + 1)) continue;
        await this.walkAfs(e.uri, [...segments, e.name], out);
      } else if (ALL_EXTS.some((ext) => e.name.toLowerCase().endsWith(`.${ext}`))) {
        out.push({ fileName: e.name, dirSegments: segments, fullPath: fsUriKey(e.uri, e.name) });
      }
    }
  }
}
