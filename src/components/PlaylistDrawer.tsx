import { useState } from 'react';
import {
  Bars3Icon,
  ExclamationCircleIcon,
  FolderIcon,
  FolderPlusIcon,
  LinkIcon,
  MusicalNoteIcon,
  PencilIcon,
  PlusIcon,
} from '@heroicons/react/24/outline';
import type { AudioItem, PlaylistFolder } from '../types';
import { compareFileName } from '../services/playlist/compare';
import { shouldUseSafeArea } from '../services/platform/PlatformAdapter';
import { type Lang, STRINGS } from '../i18n';

interface PlaylistDrawerProps {
  isOpen: boolean;
  isWide: boolean;
  folders: PlaylistFolder[];
  items: AudioItem[];
  dropTargetFolderId: string | null;
  selectedFolderId: string | null;
  selectedItemId: string | null;
  currentPlayingId: string | null;
  onClose: () => void;
  onSetDropTargetFolder: (folderId: string | null) => void;
  onSelectFolder: (folderId: string | null) => void;
  onSelectItem: (itemId: string) => void;
  onPlayItem: (item: AudioItem) => void;
  onAddFiles: () => void;
  onAddFolder: () => void;
  onCreateVirtualFolder: () => void;
  onRenameSelectedFolder: () => void;
  onMoveFolderUp: () => void;
  onMoveFolderDown: () => void;
  onAutoSortFolders: () => void;
  onDeleteSelected: () => void;
  onDeleteAll: () => void;
  onManualAttachSubtitle: (item: AudioItem) => void;
  lang: Lang;
}

export function PlaylistDrawer({
  isOpen,
  isWide,
  folders,
  items,
  dropTargetFolderId,
  selectedFolderId,
  selectedItemId,
  currentPlayingId,
  onClose,
  onSetDropTargetFolder,
  onSelectFolder,
  onSelectItem,
  onPlayItem,
  onAddFiles,
  onAddFolder,
  onCreateVirtualFolder,
  onRenameSelectedFolder,
  onMoveFolderUp,
  onMoveFolderDown,
  onAutoSortFolders,
  onDeleteSelected,
  onDeleteAll,
  onManualAttachSubtitle,
  lang,
}: PlaylistDrawerProps) {
  const t = STRINGS[lang];
  const [collapsed, setCollapsed] = useState<Record<string, boolean>>({});

  if (!isOpen) return null;

  const rootItems = items.filter((it) => !it.folderId).sort((a, b) => compareFileName(a.fileName, b.fileName));

  const renderAudioCard = (item: AudioItem) => {
    const isPlaying = currentPlayingId === item.id;
    const isSelected = selectedItemId === item.id;
    return (
      <div
        key={item.id}
        onClick={() => onSelectItem(item.id)}
        onDoubleClick={() => onPlayItem(item)}
        className={`group flex cursor-pointer items-center justify-between rounded-md border bg-paper p-2 transition-all dark:bg-night-card ${
          isPlaying
            ? 'border-mint ring-2 ring-mint/30 dark:border-mint'
            : isSelected
              ? 'border-fog bg-paper-deep dark:border-graphite dark:bg-paper/5'
              : 'border-fog hover:border-gray-300 dark:border-white/10 dark:hover:border-white/20'
        }`}
      >
        <div className="mr-2 flex flex-1 items-start gap-2 overflow-hidden">
          <MusicalNoteIcon className={`h-4 w-4 pt-0.5 ${isPlaying ? 'text-ink dark:text-mint' : 'text-gray-400 dark:text-gray-500'}`} />
          <div className="flex-1 overflow-hidden">
            <div className="flex items-center gap-1.5">
              <span
                title={item.fileName}
                className={`block truncate text-xs ${isPlaying ? 'font-bold text-ink dark:text-paper' : 'font-medium text-ink dark:text-white'}`}
              >
                {item.fileName}
              </span>
              {item.isMissing && (
                <span title={t.drawer.missingFile} className="flex-shrink-0">
                  <ExclamationCircleIcon className="h-3.5 w-3.5 text-red-500" />
                </span>
              )}
            </div>
            <div className="mt-0.5 truncate text-xs">
              {item.subtitleFileName || item.plainTextFileName ? (
                <span title={item.subtitleFileName ?? item.plainTextFileName} className="text-gray-500 dark:text-gray-400">
                  {item.subtitleFileName ?? item.plainTextFileName}
                </span>
              ) : (
                <span className="text-gray-400 italic dark:text-gray-500">{t.drawer.noSubtitle}</span>
              )}
            </div>
          </div>
        </div>
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onManualAttachSubtitle(item);
          }}
          title={t.drawer.attachHint}
          className="flex-shrink-0 rounded p-1 text-gray-400 hover:bg-paper-deep hover:text-gray-700 dark:hover:bg-night-hover dark:hover:text-white"
        >
          <LinkIcon className="h-3.5 w-3.5" />
        </button>
      </div>
    );
  };

  const drawerContent = (
    <div className="z-30 flex h-full w-80 flex-shrink-0 flex-col border-r border-fog bg-paper select-none dark:border-white/10 dark:bg-night">
      <div className="flex h-12 flex-shrink-0 items-center justify-between bg-paper px-2.5 dark:bg-night">
        <div className="flex items-center gap-1.5">
          <button type="button" onClick={onAddFiles} title={t.drawer.addFiles} aria-label={t.drawer.addFiles} className="rounded-md border border-fog bg-paper p-1.5 text-graphite transition-colors hover:bg-paper-deep dark:border-white/10 dark:bg-night-card dark:text-white dark:hover:bg-night-hover">
            <PlusIcon className="h-4 w-4" />
          </button>
          <button type="button" onClick={onAddFolder} title={t.drawer.addFolder} aria-label={t.drawer.addFolder} className="rounded-md border border-fog bg-paper p-1.5 text-graphite transition-colors hover:bg-paper-deep dark:border-white/10 dark:bg-night-card dark:text-white dark:hover:bg-night-hover">
            <FolderPlusIcon className="h-4 w-4" />
          </button>
          <button type="button" onClick={onCreateVirtualFolder} title={t.drawer.newFolder} aria-label={t.drawer.newFolder} className="rounded-md border border-fog bg-paper p-1.5 text-graphite transition-colors hover:bg-paper-deep dark:border-white/10 dark:bg-night-card dark:text-white dark:hover:bg-night-hover">
            <FolderIcon className="h-4 w-4" />
          </button>
          <button
            type="button"
            onClick={onRenameSelectedFolder}
            disabled={!selectedFolderId}
            title={t.drawer.rename}
            aria-label="Rename selected folder"
            className="rounded-md border border-fog bg-paper p-1.5 text-graphite transition-colors hover:bg-paper-deep dark:border-white/10 dark:bg-night-card dark:text-white disabled:cursor-not-allowed disabled:opacity-40 dark:hover:bg-night-hover"
          >
            <PencilIcon className="h-4 w-4" />
          </button>
        </div>
        <button
          type="button"
          onClick={onClose}
          title={t.drawer.close}
          aria-label={t.drawer.close}
          className="rounded-md p-1.5 text-graphite transition-colors hover:bg-paper-deep dark:text-white dark:hover:bg-night-hover"
        >
          <Bars3Icon className="h-5 w-5" />
        </button>
      </div>

      <div
        className="flex-1 space-y-3 overflow-y-auto p-2.5"
        onDragOver={(e) => {
          e.preventDefault();
          onSetDropTargetFolder(null);
        }}
      >
        {folders.map((folder, folderIndex) => {
          const folderItems = items.filter((it) => it.folderId === folder.id).sort((a, b) => compareFileName(a.fileName, b.fileName));
          const isSelected = selectedFolderId === folder.id;
          const isCollapsed = !!collapsed[folder.id];
          const isDropTarget = dropTargetFolderId === folder.id;
          return (
            <div
              key={folder.id}
              onDragOver={(e) => {
                e.preventDefault();
                e.stopPropagation();
                onSetDropTargetFolder(folder.id);
              }}
              onDragLeave={(e) => {
                if (!e.currentTarget.contains(e.relatedTarget as Node)) onSetDropTargetFolder(null);
              }}
              className={`rounded-2xl border p-2 transition-all ${
                isDropTarget
                  ? 'border-mint bg-mint/20 dark:border-mint dark:bg-mint/15'
                  : isSelected
                    ? 'border-mint/70 bg-mint/10 dark:border-graphite dark:bg-paper/5'
                    : 'border-fog bg-paper-deep dark:border-white/10 dark:bg-night-card/80'
              }`}
            >
              <div
                onClick={() => onSelectFolder(folder.id)}
                className="flex cursor-pointer items-center justify-between rounded px-1.5 py-1 hover:bg-black/5 dark:hover:bg-white/5"
              >
                <div className="flex items-center gap-2 truncate">
                  <span className="truncate text-xs font-bold text-ink dark:text-white">
                    {`${(folderIndex + 1).toString().padStart(2, '0')}. ${folder.name}`}
                  </span>
                  <span className="font-mono text-xs text-gray-500 dark:text-gray-400">({folderItems.length})</span>
                </div>
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    setCollapsed((prev) => ({ ...prev, [folder.id]: !prev[folder.id] }));
                  }}
                  className="px-1 text-xs text-gray-500 hover:text-gray-800 dark:text-gray-400 dark:hover:text-white"
                >
                  {isCollapsed ? t.drawer.expand : t.drawer.collapse}
                </button>
              </div>
              {!isCollapsed && (
                <div className="mt-1.5 space-y-1.5 pl-1">
                  {folderItems.length === 0 ? (
                    <div className="rounded bg-paper/60 py-2 text-center text-xs text-gray-400 dark:bg-night/60">
                      {t.drawer.noAudio}
                    </div>
                  ) : (
                    folderItems.map(renderAudioCard)
                  )}
                </div>
              )}
            </div>
          );
        })}

        {rootItems.length > 0 && (
          <div className="rounded-2xl border border-fog bg-paper-deep/70 p-2 dark:border-white/10 dark:bg-night-card/50">
            <div
              onClick={() => onSelectFolder(null)}
              className="mb-1.5 flex cursor-pointer items-center justify-between px-1 text-xs font-bold text-graphite dark:text-smoke"
            >
              <span>{t.drawer.rootFiles(rootItems.length)}</span>
            </div>
            <div className="space-y-1.5 pl-1">{rootItems.map(renderAudioCard)}</div>
          </div>
        )}

        {folders.length === 0 && rootItems.length === 0 && (
          <div className="flex h-40 flex-col items-center justify-center px-4 text-center text-xs text-gray-400 dark:text-gray-500">
            <p className="mb-1">{t.drawer.emptyTitle}</p>
            <p className="text-xs">{t.drawer.emptyHint}</p>
          </div>
        )}
      </div>

      <div className="flex flex-shrink-0 items-center justify-between bg-paper p-2 text-xs dark:bg-night">
        <div className="flex items-center gap-1">
          <button type="button" onClick={onMoveFolderUp} disabled={!selectedFolderId} title={t.drawer.moveUp} className="rounded border border-fog bg-paper px-2 py-1 text-graphite hover:bg-paper-deep disabled:cursor-not-allowed disabled:opacity-40 dark:border-white/10 dark:bg-night-card dark:text-white dark:hover:bg-night-hover">
            {t.drawer.moveUpLabel}
          </button>
          <button type="button" onClick={onMoveFolderDown} disabled={!selectedFolderId} title={t.drawer.moveDown} className="rounded border border-fog bg-paper px-2 py-1 text-graphite hover:bg-paper-deep disabled:cursor-not-allowed disabled:opacity-40 dark:border-white/10 dark:bg-night-card dark:text-white dark:hover:bg-night-hover">
            {t.drawer.moveDownLabel}
          </button>
          <button type="button" onClick={onAutoSortFolders} title={t.drawer.autoSort} className="rounded border border-fog bg-paper px-2 py-1 text-graphite hover:bg-paper-deep dark:border-white/10 dark:bg-night-card dark:text-white dark:hover:bg-night-hover">
            {t.drawer.autoSortLabel}
          </button>
        </div>
        <div className="flex items-center gap-1">
          <button type="button" onClick={onDeleteSelected} disabled={!selectedFolderId && !selectedItemId} title={t.drawer.deleteSelected} className="rounded border border-red-200 bg-paper px-2 py-1 text-red-600 hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-40 dark:border-red-900/60 dark:bg-night-card dark:text-red-400 dark:hover:bg-red-950/40">
            {t.drawer.deleteLabel}
          </button>
          <button type="button" onClick={onDeleteAll} title={t.drawer.deleteAll} className="rounded border border-red-300 bg-paper px-2 py-1 font-medium text-red-700 hover:bg-red-50 dark:border-red-800 dark:bg-night-card dark:text-red-400 dark:hover:bg-red-950/50">
            {t.drawer.deleteAllLabel}
          </button>
        </div>
      </div>
    </div>
  );

  if (isWide) return drawerContent;

  return (
    <div className={`fixed inset-0 z-40 flex${shouldUseSafeArea() ? ' pt-[env(safe-area-inset-top)]' : ''}`}>
      <div className="fixed inset-0 bg-black/40" onClick={onClose} aria-hidden="true" />
      <div className="relative z-50 flex h-full">{drawerContent}</div>
    </div>
  );
}
