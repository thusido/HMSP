import type { DragEvent } from 'react';

interface DroppedFolder {
  folderName: string;
  files: File[];
}

interface DragAndDropResult {
  folders: DroppedFolder[];
  rootFiles: File[];
}

function readFileEntry(fileEntry: { file: (ok: (f: File) => void, err: (e: unknown) => void) => void }): Promise<File> {
  return new Promise((resolve, reject) => {
    fileEntry.file(resolve, reject);
  });
}

interface DirReader {
  createReader: () => {
    readEntries: (
      ok: (entries: Array<{ isFile: boolean; file: (ok: (f: File) => void, err: (e: unknown) => void) => void }>) => void,
      err: (e: unknown) => void,
    ) => void;
  };
  name: string;
}

/** Reads immediate (1-depth) files inside a dropped directory. Never throws. */
function readDirectoryEntries(dirEntry: DirReader): Promise<File[]> {
  return new Promise((resolve) => {
    const reader = dirEntry.createReader();
    const files: File[] = [];
    const readBatch = () => {
      reader.readEntries(
        async (entries) => {
          if (!entries || entries.length === 0) return resolve(files);
          const results = await Promise.all(
            entries.filter((e) => e?.isFile).map((e) => readFileEntry(e).catch(() => null)),
          );
          for (const f of results) if (f) files.push(f);
          readBatch();
        },
        () => resolve(files),
      );
    };
    readBatch();
  });
}

function relativePathOf(file: File): string {
  return (file as File & { webkitRelativePath?: string }).webkitRelativePath ?? '';
}

/**
 * Splits a drop into folder groups + root files, using two independent paths:
 * 1. FileSystem directory entries (when the browser exposes them), and
 * 2. webkitRelativePath grouping over dataTransfer.files — Chromium populates
 *    dropped folder contents recursively, so this path survives entry-API failures.
 * Captures everything synchronously; DataTransfer invalidates across async ticks.
 */
export async function parseDropEvent(event: DragEvent): Promise<DragAndDropResult> {
  const result: DragAndDropResult = { folders: [], rootFiles: [] };
  const dataTransfer = event.dataTransfer;
  if (!dataTransfer) return result;

  const items = dataTransfer.items ? Array.from(dataTransfer.items) : [];
  const allFiles = dataTransfer.files ? Array.from(dataTransfer.files) : [];

  const grouped = new Map<string, File[]>();
  const loose: File[] = [];
  for (const file of allFiles) {
    const rel = relativePathOf(file);
    if (rel.includes('/')) {
      const top = rel.split('/')[0];
      if (!grouped.has(top)) grouped.set(top, []);
      grouped.get(top)!.push(file);
    } else {
      loose.push(file);
    }
  }

  const claimed = new Set<string>();
  for (const item of items) {
    if (item.kind !== 'file') continue;
    const entry = item.webkitGetAsEntry?.() as unknown as (DirReader & { isDirectory: boolean }) | null;
    if (!entry?.isDirectory || claimed.has(entry.name)) continue;
    let files: File[] = [];
    try {
      files = await readDirectoryEntries(entry);
    } catch (err) {
      console.warn('Directory entry read failed, falling back to file list:', err);
    }
    if (files.length === 0) files = grouped.get(entry.name) ?? [];
    result.folders.push({ folderName: entry.name, files });
    claimed.add(entry.name);
  }

  for (const [name, files] of grouped) {
    if (!claimed.has(name)) {
      result.folders.push({ folderName: name, files });
      claimed.add(name);
    }
  }

  const inFolders = new Set(
    result.folders.flatMap((f) => f.files.map((file) => `${file.name}\n${file.size}`)),
  );
  result.rootFiles = loose.filter((file) => !inFolders.has(`${file.name}\n${file.size}`));
  return result;
}
