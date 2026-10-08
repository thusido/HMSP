import type { DirCandidate, ReconnectWanted } from '../../types';
import { isSubtitleFile } from './PlaylistMatcher';

export interface ReconnectSelection {
  index: number;
  folderName: string | null;
}

/** Dependency/build trees never hold audio libraries; dot-dirs are system-owned. */
const SKIP_DIR_NAMES = new Set(['node_modules', '.git']);
export const MAX_WALK_DEPTH = 10;

/** Whether the walker may descend (depth = segments below the picked root). */
export function shouldDescend(name: string, depth: number): boolean {
  if (depth > MAX_WALK_DEPTH) return false;
  if (name.startsWith('.')) return false;
  return !SKIP_DIR_NAMES.has(name);
}

/**
 * Bounded worker pool: at most `limit` tasks in flight; one rejection
 * fails only its own slot. Order of completion, not of submission.
 */
export async function runBounded<T>(
  tasks: Array<() => Promise<T>>,
  limit: number,
): Promise<{ ok: T[]; failed: number }> {
  const ok: T[] = [];
  let failed = 0;
  let next = 0;
  const worker = async (): Promise<void> => {
    while (next < tasks.length) {
      const current = next++;
      try {
        ok.push(await tasks[current]());
      } catch {
        failed++;
      }
    }
  };
  const lanes = Math.min(Math.max(limit, 1), Math.max(tasks.length, 1));
  await Promise.all(Array.from({ length: lanes }, worker));
  return { ok, failed };
}

/** Folder scope: root items live at the picked root; a named folder owns the picked
 * subtree when names match, otherwise any dir level carrying its name. */
function inScope(wantedFolder: string | null, segments: string[], pickedRootName: string): boolean {
  if (wantedFolder === null) return segments.length === 0;
  return wantedFolder === pickedRootName || segments.includes(wantedFolder);
}

/**
 * Two-pass reconnect matching (filename-led, folder as tiebreaker):
 * pass 1 prefers strict (filename + folder scope) candidates;
 * pass 2 falls back to any same-filename candidate under the picked root.
 * A file may satisfy wanteds in several folders (shared bytes).
 * Only matched candidates get their bytes fetched, so large trees stay cheap.
 */
export function selectReconnect(
  candidates: DirCandidate[],
  wanted: ReconnectWanted[],
  pickedRootName: string,
): ReconnectSelection[] {
  const out: ReconnectSelection[] = [];
  const emitted = new Set<string>();
  const dirFolder = new Map<string, string | null>();
  const emit = (index: number, folderName: string | null) => {
    const key = `${index}:${folderName ?? ''}`;
    if (emitted.has(key)) return;
    emitted.add(key);
    out.push({ index, folderName });
  };

  const sameName = (fileName: string): number[] => {
    const idx: number[] = [];
    candidates.forEach((c, i) => {
      if (c.fileName === fileName) idx.push(i);
    });
    return idx;
  };

  for (const w of wanted) {
    const pool = sameName(w.fileName);
    const strict = pool.filter((i) => inScope(w.folderName, candidates[i].dirSegments, pickedRootName));
    for (const i of strict.length > 0 ? strict : pool) {
      emit(i, w.folderName);
      const key = candidates[i].dirSegments.join('/');
      if (!dirFolder.has(key)) dirFolder.set(key, w.folderName);
    }
  }
  // Subtitles sitting next to a matched audio inherit its folder (same intake group).
  candidates.forEach((c, index) => {
    if (!isSubtitleFile(c.fileName)) return;
    const folderName = dirFolder.get(c.dirSegments.join('/'));
    if (folderName === undefined) return;
    emit(index, folderName);
  });
  return out;
}
