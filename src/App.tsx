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
import {
  calculateNextSubtitleTime,
  calculatePrevSubtitleTime,
  getGroupSortedFiles,
} from './services/playback/navigation';
import type { AppTheme, AudioItem } from './types';
import { parseDropEvent } from './utils/dragAndDrop';
import { shouldUseSafeArea } from './services/platform/PlatformAdapter';

const SETTINGS_KEY = 'HMSP_V1_SETTINGS';

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
  const [theme, setTheme] = useState<AppTheme>('light');
  const [confirm, setConfirm] = useState<ConfirmState | null>(null);
  const [prompt, setPrompt] = useState<PromptState | null>(null);
  const [notice, setNotice] = useState<NoticeState | null>(null);

  const playlist = usePlaylist();
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
        notify(`'${item.fileName}' 파일 바이너리를 찾을 수 없습니다. 폴더를 다시 드롭하거나 새로고침으로 연결해주세요.`);
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
        if (parsed.theme) setTheme(parsed.theme);
      }
    } catch (err) {
      console.warn('Failed to load settings:', err);
    }
    return () => window.removeEventListener('resize', onResize);
  }, []);

  useEffect(() => {
    const isDark = theme === 'dark' || (theme === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches);
    document.documentElement.classList.toggle('dark', isDark);
    try {
      localStorage.setItem(SETTINGS_KEY, JSON.stringify({ volume: playback.volume, theme }));
    } catch (err) {
      console.warn('Failed to persist settings:', err);
    }
  }, [theme, playback.volume]);

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
        notify('드롭한 항목에서 지원 형식(wav/mp3/m4a/vtt/srt) 파일을 찾지 못했습니다.');
      }
    } catch {
      notify('드롭한 항목을 처리하는 중 오류가 발생했습니다.');
    }
  };

  const handleAddFiles = async () => {
    try {
      const files = await playlist.pickMediaFiles();
      if (files.length > 0) await playlist.intake(files, playlist.selectedFolderId ?? undefined);
    } catch {
      notify('파일을 가져오는 중 오류가 발생했습니다.');
    }
  };

  const handleAddFolder = async () => {
    try {
      const res = await playlist.pickFolderResult();
      if (!res) return;
      const { folder } = await playlist.intakeToFolder(res.folderName, res.files);
      if (!folder) notify('선택한 폴더에서 지원 형식(wav/mp3/m4a/vtt/srt) 파일을 찾지 못했습니다.');
    } catch {
      notify('폴더를 가져오는 중 오류가 발생했습니다.');
    }
  };

  const handleRefresh = async () => {
    const result = await playlist.refreshFromFolder();
    if (result === null) notify('모든 항목의 미디어 파일이 정상 연결되어 있습니다.');
    else if (result.error) notify(`재연결 중 오류가 발생했습니다: ${result.error}`);
    else if (!result.folderName) return; // cancelled
    else {
      const failedNote = result.failed > 0 ? ` (${result.failed}개 읽기 실패)` : '';
      if (result.affected === 0) {
        notify(`'${result.folderName}' (선택 폴더 트리)에서 일치하는 파일을 찾지 못했습니다.${failedNote}`);
      } else {
        notify(`'${result.folderName}' 폴더에서 ${result.affected}개 항목을 재연결했습니다.${failedNote}`);
      }
    }
  };

  const handleDeleteSelected = () => {
    if (playlist.selectedItemId) {
      const item = items.find((i) => i.id === playlist.selectedItemId);
      setConfirm({
        message: `'${item?.fileName}' 항목을 삭제하시겠습니까?`,
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
        message: `'${folder?.name}' 폴더와 내부 항목들을 삭제하시겠습니까?`,
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
      message: '플레이리스트 전체를 삭제하시겠습니까?',
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
      notify(ok ? `'${target.name}' 자막을 연결했습니다.` : '자막 파일(vtt, srt)을 선택해주세요.');
    } catch {
      notify('자막 파일을 연결하는 중 오류가 발생했습니다.');
    }
  };

  const handleExport = async () => {
    try {
      await playlist.exportJson();
      notify('플레이리스트 구조를 백업했습니다.');
    } catch (err) {
      console.warn('Export failed:', err);
      notify('플레이리스트 백업에 실패했습니다.');
    }
  };

  const handleImport = async () => {
    const doImport = async () => {
      try {
        const ok = await playlist.importJson();
        setConfirm(null);
        setIsSettingsOpen(false);
        if (ok) notify('플레이리스트를 복구했습니다.\n새로고침으로 미디어를 재연결해주세요.');
      } catch {
        setConfirm(null);
        notify('플레이리스트 복구를 실패했습니다.');
      }
    };
    if (items.length > 0 || playlist.folders.length > 0) {
      setConfirm({ message: '기존 플레이리스트를 대체합니다. 계속하시겠습니까?', onConfirm: doImport });
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
            message: '새 플레이리스트 폴더 이름을 입력하세요:',
            defaultValue: `새 폴더 ${playlist.folders.length + 1}`,
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
            message: '폴더 이름을 변경하세요:',
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
      />

      <div className="relative flex h-full min-w-0 flex-1 flex-col overflow-hidden">
        <AppBar
          fileName={currentItem?.fileName}
          drawerOpen={isDrawerOpen}
          onToggleDrawer={() => setIsDrawerOpen((v) => !v)}
          onRefresh={handleRefresh}
          onOpenSettings={() => setIsSettingsOpen(true)}
        />
        <MainReader
          cues={cues}
          activeCueId={activeCue?.id ?? null}
          onSeekToCue={(cue) => playback.seek(cue.startTime)}
          hasAudio={!!currentItem}
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
        />
      </div>

      <SettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        theme={theme}
        onChangeTheme={setTheme}
        onExportPlaylist={handleExport}
        onImportPlaylist={handleImport}
      />
      <ConfirmModal
        isOpen={confirm !== null}
        message={confirm?.message ?? ''}
        destructive={confirm?.destructive}
        onConfirm={() => confirm?.onConfirm()}
        onCancel={() => setConfirm(null)}
      />
      <PromptModal
        isOpen={prompt !== null}
        message={prompt?.message ?? ''}
        defaultValue={prompt?.defaultValue ?? ''}
        onConfirm={(v) => prompt?.onConfirm(v)}
        onCancel={() => setPrompt(null)}
      />
      <Notice notice={notice} />
    </div>
  );
}
