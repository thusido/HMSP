import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { DragEvent } from 'react';
import { AppBar } from './components/AppBar';
import { ConfirmModal } from './components/ConfirmModal';
import { MainReader } from './components/MainReader';
import { Notice, type NoticeState } from './components/Notice';
import { PlaybackBar } from './components/PlaybackBar';
import { PlaylistDrawer } from './components/PlaylistDrawer';
import { PromptModal } from './components/PromptModal';
import { SettingsModal } from './components/SettingsModal';
import { usePlayback } from './features/playback/usePlayback';
import { usePlaylist } from './features/playlist/usePlaylist';
import { useReader } from './features/reader/useReader';
import { SETTINGS_KEY, READER_FONT_STACKS, useSettings } from './features/settings/useSettings';
import { STRINGS } from './i18n';
import {
  calculateNextSubtitleTime,
  calculatePrevSubtitleTime,
  getGroupSortedFiles,
} from './services/playback/navigation';
import type { AudioItem } from './types';
import { parseDropEvent } from './utils/dragAndDrop';
import { shouldUseSafeArea } from './services/platform/PlatformAdapter';

interface ConfirmState {
  message: string;
  onConfirm: () => void;
  destructive?: boolean;
}

interface PromptState {
  message: string;
  defaultValue: string;
  onConfirm: (value: string) => void;
}

export default function App() {
  const [isWide, setIsWide] = useState(() => window.innerWidth >= 768);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [confirm, setConfirm] = useState<ConfirmState | null>(null);
  const [prompt, setPrompt] = useState<PromptState | null>(null);
  const [notice, setNotice] = useState<NoticeState | null>(null);

  const { settings, updateSettings, resetReaderSettings } = useSettings();
  const t = STRINGS[settings.language];
  const playlist = usePlaylist(settings.language);
  const { items, currentItem } = playlist;
  const notify = useCallback((message: string) => setNotice({ id: Date.now(), message }), []);

  const playbackRef = useRef<ReturnType<typeof usePlayback> | null>(null);
  const currentItemRef = useRef(currentItem);
  currentItemRef.current = currentItem;
  const itemsRef = useRef(items);
  itemsRef.current = items;
  const dropTargetRef = useRef<string | null>(null);

  const playItem = useCallback(
    async (item: AudioItem) => {
      let file: File | null;
      try {
        file = await playlist.ensureItemFile(item);
      } catch {
        file = null;
      }
      if (!file) {
        notify(t.app.binaryMissing(item.fileName));
        return;
      }
      playbackRef.current?.loadFile(file);
      playlist.setCurrentPlayingId(item.id);
      playlist.selectItem(item.id);
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [playlist.setCurrentPlayingId, playlist.selectItem, notify],
  );

  const handleTrackEnded = useCallback(() => {
    const curr = currentItemRef.current;
    if (!curr) return;
    const group = getGroupSortedFiles(itemsRef.current, curr.folderId);
    const i = group.findIndex((it) => it.id === curr.id);
    if (i >= 0 && i < group.length - 1) playItem(group[i + 1]);
  }, [playItem]);

  const playback = usePlayback({ onEnded: handleTrackEnded });
  playbackRef.current = playback;

  useEffect(() => {
    const onResize = () => setIsWide(window.innerWidth >= 768);
    window.addEventListener('resize', onResize);
    try {
      const saved = localStorage.getItem(SETTINGS_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (typeof parsed.volume === 'number') playbackRef.current.setVolume(parsed.volume);
      }
    } catch (err) {
      console.warn('Failed to load settings:', err);
    }
    return () => window.removeEventListener('resize', onResize);
  }, []);

  useEffect(() => {
    try {
      localStorage.setItem(SETTINGS_KEY, JSON.stringify({ volume: playback.volume, ...settings }));
    } catch (err) {
      console.warn('Failed to persist settings:', err);
    }
  }, [settings, playback.volume]);

  const cues = useMemo(() => currentItem?.subtitles ?? [], [currentItem]);
  const activeCue = useReader(cues, playback.currentTime);

  const groupItems = useMemo(
    () => (currentItem ? getGroupSortedFiles(items, currentItem.folderId) : []),
    [items, currentItem],
  );
  const fileIndex = currentItem ? groupItems.findIndex((it) => it.id === currentItem.id) : -1;
  const canPrevFile = fileIndex > 0;
  const canNextFile = fileIndex >= 0 && fileIndex < groupItems.length - 1;

  const canPrevSubtitle = cues.length > 0 && (!!activeCue || playback.currentTime > cues[0].startTime);
  const canNextSubtitle =
    cues.length > 0 &&
    (!!activeCue
      ? cues.findIndex((c) => c.id === activeCue.id) < cues.length - 1
      : playback.currentTime < cues[cues.length - 1].startTime);

  const handleTogglePlay = () => {
    if (!currentItem) {
      if (items.length > 0) playItem(items[0]);
      return;
    }
    playback.togglePlay();
  };

  const setDropTarget = (id: string | null) => {
    if (dropTargetRef.current === id) return;
    dropTargetRef.current = id;
    playlist.setDropTargetFolderId(id);
  };

  const handleDrop = async (e: DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    const target = dropTargetRef.current;
    setDropTarget(null);
    try {
      const result = await parseDropEvent(e);
      let added = 0;
      for (const folder of result.folders) {
        if (folder.files.length === 0) continue;
        added += (await playlist.intakeToFolder(folder.folderName, folder.files)).affected;
      }
      if (result.rootFiles.length > 0) added += await playlist.intake(result.rootFiles, target ?? undefined);
      if (added === 0) {
        notify(t.app.dropNoMedia);
      }
    } catch {
      notify(t.app.dropError);
    }
  };

  const handleAddFiles = async () => {
    try {
      const files = await playlist.pickMediaFiles();
      if (files.length > 0) await playlist.intake(files, playlist.selectedFolderId ?? undefined);
    } catch {
      notify(t.app.filesError);
    }
  };

  const handleAddFolder = async () => {
    try {
      const res = await playlist.pickFolderResult();
      if (!res) return;
      const { folder } = await playlist.intakeToFolder(res.folderName, res.files);
      if (!folder) notify(t.app.folderEmpty);
    } catch {
      notify(t.app.folderError);
    }
  };

  const handleRefresh = async () => {
    const result = await playlist.refreshFromFolder();
    if (result === null) notify(t.app.refreshOk);
    else if (result.error) notify(t.app.refreshError(result.error));
    else if (!result.folderName) return; // cancelled
    else {
      const failedNote = result.failed > 0 ? t.app.failedNote(result.failed) : '';
      if (result.affected === 0) {
        notify(t.app.refreshMiss(result.folderName, failedNote));
      } else {
        notify(t.app.refreshDone(result.folderName, result.affected, failedNote));
      }
    }
  };

  const handleDeleteSelected = () => {
    if (playlist.selectedItemId) {
      const item = items.find((i) => i.id === playlist.selectedItemId);
      setConfirm({
        message: t.app.deleteItem(item?.fileName ?? ''),
        destructive: true,
        onConfirm: () => {
          if (playlist.currentPlayingId === playlist.selectedItemId) playback.pause();
          playlist.removeItem(playlist.selectedItemId!);
          setConfirm(null);
        },
      });
      return;
    }
    if (playlist.selectedFolderId) {
      const folder = playlist.folders.find((f) => f.id === playlist.selectedFolderId);
      setConfirm({
        message: t.app.deleteFolder(folder?.name ?? ''),
        destructive: true,
        onConfirm: () => {
          playback.pause();
          playlist.removeFolder(playlist.selectedFolderId!);
          setConfirm(null);
        },
      });
    }
  };

  const handleDeleteAll = () => {
    setConfirm({
      message: t.app.deleteAll,
      destructive: true,
      onConfirm: () => {
        playback.pause();
        playlist.clearAll();
        setConfirm(null);
      },
    });
  };

  const handleManualAttach = async (item: AudioItem) => {
    try {
      const files = await playlist.pickMediaFiles();
      const target = files[0];
      if (!target) return;
      const ok = await playlist.attachSubtitle(item.id, target);
      notify(ok ? t.app.attachDone(target.name) : t.app.attachNeed);
    } catch {
      notify(t.app.attachError);
    }
  };

  const handleExport = async () => {
    try {
      await playlist.exportJson();
      notify(t.app.exportDone);
    } catch (err) {
      console.warn('Export failed:', err);
      notify(t.app.exportFail);
    }
  };

  const handleImport = async () => {
    const doImport = async () => {
      try {
        const ok = await playlist.importJson();
        setConfirm(null);
        setIsSettingsOpen(false);
        if (ok) notify(t.app.importDone);
      } catch {
        setConfirm(null);
        notify(t.app.importFail);
      }
    };
    if (items.length > 0 || playlist.folders.length > 0) {
      setConfirm({ message: t.app.importReplace, onConfirm: doImport });
    } else {
      await doImport();
    }
  };

  return (
    <div
      onDragOver={(e) => {
        e.preventDefault();
        e.stopPropagation();
      }}
      onDrop={handleDrop}
      className={`flex h-dvh w-screen overflow-hidden bg-[#FAFAFA] text-gray-900${shouldUseSafeArea() ? ' pt-[env(safe-area-inset-top)]' : ''}`}
    >
      <PlaylistDrawer
        isOpen={isDrawerOpen}
        isWide={isWide}
        folders={playlist.sortedFolders}
        items={items}
        dropTargetFolderId={playlist.dropTargetFolderId}
        selectedFolderId={playlist.selectedFolderId}
        selectedItemId={playlist.selectedItemId}
        currentPlayingId={playlist.currentPlayingId}
        onClose={() => setIsDrawerOpen(false)}
        onSetDropTargetFolder={setDropTarget}
        onSelectFolder={playlist.selectFolder}
        onSelectItem={playlist.selectItem}
        onPlayItem={playItem}
        onAddFiles={handleAddFiles}
        onAddFolder={handleAddFolder}
        onCreateVirtualFolder={() =>
          setPrompt({
            message: t.app.createFolder,
            defaultValue: t.app.newFolderDefault(playlist.folders.length + 1),
            onConfirm: (value) => {
              if (value.trim()) playlist.createFolder(value);
              setPrompt(null);
            },
          })
        }
        onRenameSelectedFolder={() => {
          const folder = playlist.folders.find((f) => f.id === playlist.selectedFolderId);
          if (!folder) return;
          setPrompt({
            message: t.app.renameFolder,
            defaultValue: folder.name,
            onConfirm: (value) => {
              playlist.renameFolder(folder.id, value);
              setPrompt(null);
            },
          });
        }}
        onMoveFolderUp={() => playlist.selectedFolderId && playlist.moveFolder(playlist.selectedFolderId, 'up')}
        onMoveFolderDown={() => playlist.selectedFolderId && playlist.moveFolder(playlist.selectedFolderId, 'down')}
        onAutoSortFolders={playlist.autoSortFolders}
        onDeleteSelected={handleDeleteSelected}
        onDeleteAll={handleDeleteAll}
        onManualAttachSubtitle={handleManualAttach}
        lang={settings.language}
      />

      <div className="relative flex h-full min-w-0 flex-1 flex-col overflow-hidden">
        <AppBar
          fileName={currentItem?.fileName}
          drawerOpen={isDrawerOpen}
          onToggleDrawer={() => setIsDrawerOpen((v) => !v)}
          onRefresh={handleRefresh}
          onOpenSettings={() => setIsSettingsOpen(true)}
          lang={settings.language}
        />
        <MainReader
          cues={cues}
          activeCueId={activeCue?.id ?? null}
          onSeekToCue={(cue) => playback.seek(cue.startTime)}
          hasAudio={!!currentItem}
          readerFont={READER_FONT_STACKS[settings.readerFont]}
          readerFontSize={settings.fontSize}
          readerLetterSpacing={settings.letterSpacing}
          readerLineHeight={settings.lineHeight}
          lang={settings.language}
        />
        <PlaybackBar
          currentTime={playback.currentTime}
          duration={playback.duration}
          isPlaying={playback.isPlaying}
          rate={playback.rate}
          volume={playback.volume}
          repeatMode={playback.repeatMode}
          canPrevFile={canPrevFile}
          canNextFile={canNextFile}
          canPrevSubtitle={canPrevSubtitle}
          canNextSubtitle={canNextSubtitle}
          onTogglePlay={handleTogglePlay}
          onSeek={playback.seek}
          onPrevFile={() => canPrevFile && playItem(groupItems[fileIndex - 1])}
          onNextFile={() => canNextFile && playItem(groupItems[fileIndex + 1])}
          onPrevSubtitle={() => {
            const t = calculatePrevSubtitleTime(playback.currentTime, cues, activeCue);
            if (t !== null) playback.seek(t);
          }}
          onNextSubtitle={() => {
            const t = calculateNextSubtitleTime(playback.currentTime, cues, activeCue);
            if (t !== null) playback.seek(t);
          }}
          onChangeSpeed={playback.setRate}
          onChangeVolume={playback.setVolume}
          onToggleRepeat={playback.toggleRepeat}
          lang={settings.language}
        />
      </div>

      <SettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        theme={settings.theme}
        onChangeTheme={(theme) => updateSettings({ theme })}
        readerFont={settings.readerFont}
        fontSize={settings.fontSize}
        letterSpacing={settings.letterSpacing}
        lineHeight={settings.lineHeight}
        onUpdateReader={(patch) => updateSettings(patch)}
        onResetReader={resetReaderSettings}
        language={settings.language}
        onChangeLanguage={(language) => updateSettings({ language })}
        onExportPlaylist={handleExport}
        onImportPlaylist={handleImport}
        lang={settings.language}
      />
      <ConfirmModal
        isOpen={confirm !== null}
        message={confirm?.message ?? ''}
        destructive={confirm?.destructive}
        onConfirm={() => confirm?.onConfirm()}
        onCancel={() => setConfirm(null)}
        lang={settings.language}
      />
      <PromptModal
        isOpen={prompt !== null}
        message={prompt?.message ?? ''}
        defaultValue={prompt?.defaultValue ?? ''}
        onConfirm={(v) => prompt?.onConfirm(v)}
        onCancel={() => setPrompt(null)}
        lang={settings.language}
      />
      <Notice notice={notice} />
    </div>
  );
}
