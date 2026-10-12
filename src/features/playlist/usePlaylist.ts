import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { AudioItem, PlaylistFolder, ReconnectWanted, RefreshResult } from '../../types';
import { PlatformServiceFactory } from '../../services/platform/PlatformServiceFactory';
import type { PlatformAdapter } from '../../services/platform/PlatformAdapter';
import { isSubtitleFile } from '../../services/playlist/PlaylistMatcher';
import { parseSubtitle } from '../../services/subtitle/SubtitleParser';
import { intakeFiles } from '../../services/playlist/intake';
import { type Lang, STRINGS } from '../../i18n';

const STORAGE_KEY = 'HMSP_V1_PLAYLIST_SCHEMA';

function newFolderId(): string {
  return `folder-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
}

function loadPersisted(): { folders: PlaylistFolder[]; items: AudioItem[] } {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return { folders: [], items: [] };
    const parsed = JSON.parse(raw);
    return {
      folders: Array.isArray(parsed.folders) ? parsed.folders : [],
      items: Array.isArray(parsed.items)
        ? parsed.items.map((it: AudioItem) => ({ ...it, file: undefined, isMissing: true }))
        : [],
    };
  } catch (err) {
    console.warn('Failed to load persisted playlist:', err);
    return { folders: [], items: [] };
  }
}

function getSortedFolders(folders: PlaylistFolder[]): PlaylistFolder[] {
  return [...folders].sort((a, b) => a.order - b.order);
}

/** Owns folders/items/selection + intake + JSON persistence. UI dialogs stay in App. */
export function usePlaylist(lang: Lang = 'ko') {
  const t = STRINGS[lang];
  const [folders, setFolders] = useState<PlaylistFolder[]>(() => loadPersisted().folders);
  const [items, setItems] = useState<AudioItem[]>(() => loadPersisted().items);
  const [selectedFolderId, setSelectedFolderId] = useState<string | null>(null);
  const [selectedItemId, setSelectedItemId] = useState<string | null>(null);
  const [currentPlayingId, setCurrentPlayingId] = useState<string | null>(null);
  const [dropTargetFolderId, setDropTargetFolderId] = useState<string | null>(null);

  const itemsRef = useRef(items);
  itemsRef.current = items;
  const foldersRef = useRef(folders);
  foldersRef.current = folders;
  const selectedFolderIdRef = useRef(selectedFolderId);
  selectedFolderIdRef.current = selectedFolderId;

  const adapterRef = useRef<PlatformAdapter | null>(null);
  const getAdapter = useCallback(async (): Promise<PlatformAdapter> => {
    if (!adapterRef.current) adapterRef.current = await PlatformServiceFactory.create();
    return adapterRef.current;
  }, []);

  useEffect(() => {
    try {
      localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify({
          folders,
          items: items.map((it) => ({
            id: it.id,
            title: it.title,
            fileName: it.fileName,
            subtitleFileName: it.subtitleFileName,
            folderId: it.folderId,
          })),
        }),
      );
    } catch (err) {
      console.warn('Failed to persist playlist:', err);
    }
  }, [folders, items]);

  const sortedFolders = useMemo(() => getSortedFolders(folders), [folders]);
  const currentItem = useMemo(
    () => items.find((it) => it.id === currentPlayingId) ?? null,
    [items, currentPlayingId],
  );

  /**
   * Single commit point for items: mirrors the ref so sequential async intakes
   * always read the latest snapshot, even before React flushes the render.
   */
  const commitItems = useCallback((next: AudioItem[]) => {
    itemsRef.current = next;
    setItems(next);
  }, []);

  /** Single commit point for folders (same staleness guarantee as commitItems). */
  const commitFolders = useCallback((next: PlaylistFolder[]) => {
    foldersRef.current = next;
    setFolders(next);
  }, []);

  /** Single commit point for the selected folder (intake falls back to this ref). */
  const commitSelectedFolderId = useCallback((id: string | null) => {
    selectedFolderIdRef.current = id;
    setSelectedFolderId(id);
  }, []);

  /** Runs pure intake against the latest snapshot and commits. Returns affected count. */
  const intake = useCallback(
    async (files: File[], folderId?: string | null, reconnectOnly = false): Promise<number> => {
      const { items: next, affectedCount } = await intakeFiles(
        files,
        itemsRef.current,
        // undefined = follow selection; null = root scope (no fallback).
        folderId === undefined ? selectedFolderIdRef.current : folderId,
        reconnectOnly,
      );
      if (affectedCount > 0) commitItems(next);
      return affectedCount;
    },
    [commitItems],
  );

  /**
   * Intake into a named folder, creating it only when something was actually added.
   * Makes phantom empty folders structurally impossible.
   */
  const intakeToFolder = useCallback(
    async (name: string, files: File[]): Promise<{ folder: PlaylistFolder | null; affected: number }> => {
      const existing = foldersRef.current.find((f) => f.name === name) ?? null;
      const folderId = existing ? existing.id : newFolderId();
      const { items: next, affectedCount } = await intakeFiles(files, itemsRef.current, folderId, false);
      if (affectedCount > 0) commitItems(next);
      if (existing) {
        commitSelectedFolderId(existing.id);
        return { folder: existing, affected: affectedCount };
      }
      if (affectedCount === 0) return { folder: null, affected: 0 };
      const folder: PlaylistFolder = { id: folderId, name, order: foldersRef.current.length + 1 };
      commitFolders([...foldersRef.current, folder]);
      commitSelectedFolderId(folder.id);
      return { folder, affected: affectedCount };
    },
    [commitItems, commitFolders, commitSelectedFolderId],
  );

  const createFolder = useCallback(
    (name: string): PlaylistFolder => {
      const trimmed = name.trim();
      const folder: PlaylistFolder = { id: newFolderId(), name: trimmed, order: foldersRef.current.length + 1 };
      commitFolders([...foldersRef.current, folder]);
      commitSelectedFolderId(folder.id);
      return folder;
    },
    [commitFolders, commitSelectedFolderId],
  );

  const renameFolder = useCallback(
    (id: string, name: string) => {
      const trimmed = name.trim();
      if (!trimmed) return;
      commitFolders(foldersRef.current.map((f) => (f.id === id ? { ...f, name: trimmed } : f)));
    },
    [commitFolders],
  );

  const moveFolder = useCallback(
    (id: string, dir: 'up' | 'down') => {
      const sorted = getSortedFolders(foldersRef.current);
      const i = sorted.findIndex((f) => f.id === id);
      const j = dir === 'up' ? i - 1 : i + 1;
      if (i < 0 || j < 0 || j >= sorted.length) return;
      const next = [...sorted];
      [next[i].order, next[j].order] = [next[j].order, next[i].order];
      commitFolders(next);
    },
    [commitFolders],
  );

  const autoSortFolders = useCallback(() => {
    commitFolders(
      [...foldersRef.current]
        .sort((a, b) => a.name.localeCompare(b.name, undefined, { numeric: true, sensitivity: 'base' }))
        .map((f, idx) => ({ ...f, order: idx + 1 })),
    );
  }, [commitFolders]);

  const removeItem = useCallback(
    (id: string) => {
      commitItems(itemsRef.current.filter((i) => i.id !== id));
      setSelectedItemId((sel) => (sel === id ? null : sel));
      setCurrentPlayingId((cur) => (cur === id ? null : cur));
    },
    [commitItems],
  );

  const removeFolder = useCallback(
    (id: string) => {
      commitFolders(foldersRef.current.filter((f) => f.id !== id));
      commitItems(itemsRef.current.filter((i) => i.folderId !== id));
      if (selectedFolderIdRef.current === id) commitSelectedFolderId(null);
    },
    [commitFolders, commitItems, commitSelectedFolderId],
  );

  const clearAll = useCallback(() => {
    commitFolders([]);
    commitItems([]);
    commitSelectedFolderId(null);
    setSelectedItemId(null);
    setCurrentPlayingId(null);
  }, [commitFolders, commitItems, commitSelectedFolderId]);

  const selectFolder = useCallback(
    (id: string | null) => {
      commitSelectedFolderId(id);
      setSelectedItemId(null);
    },
    [commitSelectedFolderId],
  );

  const selectItem = useCallback(
    (id: string) => {
      setSelectedItemId(id);
      const item = itemsRef.current.find((i) => i.id === id);
      if (item?.folderId) commitSelectedFolderId(item.folderId);
    },
    [commitSelectedFolderId],
  );

  const attachSubtitle = useCallback(async (itemId: string, file: File): Promise<boolean> => {
    if (!isSubtitleFile(file.name)) return false;
    try {
      const cues = parseSubtitle(await file.text(), file.name);
      commitItems(
        itemsRef.current.map((i) =>
          i.id === itemId ? { ...i, subtitleFileName: file.name, subtitles: cues } : i,
        ),
      );
      return true;
    } catch (err) {
      console.warn('Subtitle attach failed:', err);
      return false;
    }
  }, [commitItems]);

  /** Reconnects missing files via one folder pick. Never silent: errors ride along. */
  const refreshFromFolder = useCallback(async (): Promise<RefreshResult | null> => {
    const missing = itemsRef.current.filter((it) => it.isMissing);
    if (missing.length === 0) return null;
    const folders = foldersRef.current;
    const wanted: ReconnectWanted[] = missing.map((it) => ({
      fileName: it.fileName,
      folderName: folders.find((f) => f.id === it.folderId)?.name ?? null,
    }));
    try {
      const search = await (await getAdapter()).pickReconnectFiles(wanted);
      if (!search) return { folderName: '', affected: 0, failed: 0, error: null };
      const groups = new Map<string | null, File[]>();
      for (const f of search.found) {
        groups.set(f.folderName, [...(groups.get(f.folderName) ?? []), f.file]);
      }
      let affected = 0;
      let displayName = '';
      for (const [folderName, files] of groups) {
        const folderId = folderName ? (folders.find((f) => f.name === folderName)?.id ?? null) : null;
        affected += await intake(files, folderId, true);
        if (!displayName) displayName = folderName ?? '';
      }
      // Never silent: name the first wanted folder so the UI can report a miss.
      if (!displayName) displayName = wanted[0]?.folderName ?? t.app.defaultFolder;
      return { folderName: displayName, affected, failed: search.failed, error: null };
    } catch (err) {
      return {
        folderName: wanted[0]?.folderName ?? t.app.defaultFolder,
        affected: 0,
        failed: 0,
        error: err instanceof Error ? err.message : String(err),
      };
    }
  }, [getAdapter, intake, t]);

  /**
   * Resolves playable bytes for one item. Real Files (web/DnD) pass through;
   * Tauri shells (0 bytes + filePath) load lazily and get cached.
   * Returns null when unresolvable (and flags the item missing).
   */
  const ensureItemFile = useCallback(
    async (item: AudioItem): Promise<File | null> => {
      if (item.file && (item.file.size > 0 || !item.filePath)) return item.file;
      if (!item.filePath) return null;
      let file: File | null;
      try {
        file = await (await getAdapter()).readAudioFile(item.filePath);
      } catch {
        file = null;
      }
      commitItems(
        itemsRef.current.map((it) =>
          it.id === item.id ? (file ? { ...it, file, isMissing: false } : { ...it, isMissing: true }) : it,
        ),
      );
      return file;
    },
    [getAdapter, commitItems],
  );

  const exportJson = useCallback(async () => {
    await (await getAdapter()).exportPlaylistJson({
      folders: foldersRef.current,
      // file/filePath never leave the session (bytes don't serialize; paths don't transfer).
      items: itemsRef.current.map(({ file: _file, filePath: _path, ...rest }) => rest),
    });
  }, [getAdapter]);

  const pickMediaFiles = useCallback(async (): Promise<File[]> => {
    return (await getAdapter()).pickFiles();
  }, [getAdapter]);

  const pickFolderResult = useCallback(async (): Promise<{ folderName: string; files: File[] } | null> => {
    return (await getAdapter()).pickFolder();
  }, [getAdapter]);
  const importJson = useCallback(async (): Promise<boolean> => {
    const data = await (await getAdapter()).importPlaylistJson();
    if (!data) return false;
    commitFolders(data.folders);
    commitItems(data.items.map((it) => ({ ...it, file: undefined, isMissing: true })));
    commitSelectedFolderId(null);
    setSelectedItemId(null);
    setCurrentPlayingId(null);
    return true;
  }, [getAdapter, commitFolders, commitItems, commitSelectedFolderId]);

  return {
    folders,
    sortedFolders,
    items,
    selectedFolderId,
    selectedItemId,
    currentPlayingId,
    currentItem,
    dropTargetFolderId,
    setCurrentPlayingId,
    setDropTargetFolderId,
    selectFolder,
    selectItem,
    intake,
    intakeToFolder,
    createFolder,
    renameFolder,
    moveFolder,
    autoSortFolders,
    removeItem,
    removeFolder,
    clearAll,
    attachSubtitle,
    refreshFromFolder,
    ensureItemFile,
    exportJson,
    importJson,
    pickMediaFiles,
    pickFolderResult,
  };
}
