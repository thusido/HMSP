import type {
  AudioItem,
  DirCandidate,
  PlaylistFolder,
  ReconnectFound,
  ReconnectSearchResult,
  ReconnectWanted,
} from '../../types';
import { selectReconnect } from '../playlist/reconnect';
import type { PlatformAdapter } from './PlatformAdapter';

/** Web / iPadOS adapter: file inputs + download/upload for JSON backup. */
export class WebPlatformAdapter implements PlatformAdapter {
  async pickFiles(): Promise<File[]> {
    return new Promise((resolve) => {
      const input = document.createElement('input');
      input.type = 'file';
      input.multiple = true;
      input.accept = '.mp3,.wav,.m4a,.vtt,.srt,.txt';
      input.onchange = () => resolve(Array.from(input.files ?? []));
      input.oncancel = () => resolve([]);
      input.click();
    });
  }

  async pickFolder(): Promise<{ folderName: string; files: File[] } | null> {
    // ponytail: webkitdirectory is the portable folder-pick; FS Access API comes later if needed
    return new Promise((resolve) => {
      const input = document.createElement('input');
      input.type = 'file';
      input.setAttribute('webkitdirectory', '');
      input.onchange = () => {
        const files = Array.from(input.files ?? []);
        if (files.length === 0) return resolve(null);
        const folderName = files[0].webkitRelativePath.split('/')[0] || 'Folder';
        resolve({ folderName, files });
      };
      input.oncancel = () => resolve(null);
      input.click();
    });
  }

  async pickReconnectFiles(wanted: ReconnectWanted[]): Promise<ReconnectSearchResult | null> {
    if (wanted.length === 0) return { found: [], failed: 0 };
    const res = await this.pickFolder();
    if (!res) return null;
    const candidates: (DirCandidate & { file: File })[] = res.files.map((file) => ({
      file,
      fileName: file.name,
      dirSegments: file.webkitRelativePath.split('/').slice(1, -1),
    }));
    const found: ReconnectFound[] = selectReconnect(candidates, wanted, res.folderName).map((sel) => ({
      file: candidates[sel.index].file,
      folderName: sel.folderName,
    }));
    return { found, failed: 0 };
  }

  async readAudioFile(_filePath: string): Promise<File | null> {
    // Browser Files already carry bytes lazily; nothing to resolve.
    return null;
  }

  async exportPlaylistJson(data: { folders: PlaylistFolder[]; items: AudioItem[] }): Promise<void> {
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    try {
      const a = document.createElement('a');
      a.href = url;
      a.download = `HMSP_playlist_${new Date().toISOString().slice(0, 10)}.json`;
      a.click();
    } finally {
      URL.revokeObjectURL(url);
    }
  }

  async importPlaylistJson(): Promise<{ folders: PlaylistFolder[]; items: AudioItem[] } | null> {
    // Dedicated picker: .json accept (pickFiles() is media-only).
    const file = await new Promise<File | null>((resolve) => {
      const input = document.createElement('input');
      input.type = 'file';
      input.accept = '.json,application/json';
      input.onchange = () => resolve(input.files?.[0] ?? null);
      input.oncancel = () => resolve(null);
      input.click();
    });
    if (!file) return null;
    try {
      const parsed = JSON.parse(await file.text());
      if (Array.isArray(parsed.folders) && Array.isArray(parsed.items)) return parsed;
    } catch (err) {
      console.warn('Invalid playlist JSON:', err);
    }
    return null;
  }
}
