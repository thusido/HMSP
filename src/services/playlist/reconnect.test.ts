import { describe, expect, it } from 'vitest';
import { MAX_WALK_DEPTH, runBounded, selectReconnect, shouldDescend } from './reconnect';
import { intakeFiles } from './intake';
import type { AudioItem, DirCandidate, ReconnectWanted } from '../../types';

const cand = (fileName: string, dirSegments: string[] = []): DirCandidate => ({ fileName, dirSegments });
const want = (fileName: string, folderName: string | null): ReconnectWanted => ({ fileName, folderName });

describe('selectReconnect', () => {
  it('matches picked-root files to the picked folder name', () => {
    const sel = selectReconnect([cand('a.mp3')], [want('a.mp3', 'sample')], 'sample');
    expect(sel).toEqual([{ index: 0, folderName: 'sample' }]);
  });

  it('matches subdir files to their parent dir name', () => {
    const sel = selectReconnect([cand('b.mp3', ['ch1'])], [want('b.mp3', 'ch1')], 'music');
    expect(sel).toHaveLength(1);
    expect(sel[0].folderName).toBe('ch1');
  });

  it('matches any depth below the picked root of the same name', () => {
    const sel = selectReconnect(
      [cand('c.mp3', ['ch1', 'sub']), cand('d.mp3')],
      [want('c.mp3', 'sample'), want('d.mp3', 'sample')],
      'sample',
    );
    expect(sel).toEqual([
      { index: 0, folderName: 'sample' },
      { index: 1, folderName: 'sample' },
    ]);
  });

  it('matches root items only at the picked root', () => {
    const sels = selectReconnect(
      [cand('r.mp3'), cand('r.mp3', ['sub'])],
      [want('r.mp3', null)],
      'sample',
    );
    expect(sels).toEqual([{ index: 0, folderName: null }]);
  });

  it('falls back to filename when folder names do not align', () => {
    const sel = selectReconnect([cand('a.mp3', ['other'])], [want('a.mp3', 'sample')], 'music');
    expect(sel).toEqual([{ index: 0, folderName: 'sample' }]);
  });

  it('emits one selection per folder for shared files, without duplicates', () => {
    const sel = selectReconnect(
      [cand('a.mp3')],
      [want('a.mp3', 'F'), want('a.mp3', 'F'), want('a.mp3', 'G')],
      'music',
    );
    expect(sel).toEqual([
      { index: 0, folderName: 'F' },
      { index: 0, folderName: 'G' },
    ]);
  });

  it('JSON1 shape: virtual folders + flat disk reconnects everything', () => {
    const candidates = [cand('r_MIB2B.mp3'), cand('MIB2B.mp3'), cand('MIB2A.wav')];
    const wantedByName: ReconnectWanted[] = [
      want('r_MIB2B.mp3', 'sample'),
      want('MIB2B.mp3', 'sample'),
      want('MIB2A.wav', 'sample'),
      want('MIB2A.wav', '새 폴더 1'),
      want('MIB2B.mp3', '새 폴더 2'),
      want('r_MIB2B.mp3', '새 폴더 2'),
    ];
    const sel = selectReconnect(candidates, wantedByName, 'sample');
    expect(sel).toHaveLength(6);
    expect(sel.filter((s) => s.folderName === 'sample')).toHaveLength(3);
  });

  it('JSON2 shape: renamed subdirs under a picked parent reconnect by filename', () => {
    const sel = selectReconnect(
      [cand('[WAV] 1장.wav', ['disk-ch1']), cand('[WAV] 2장.wav', ['disk-ch2'])],
      [want('[WAV] 1장.wav', '■01_본편'), want('[WAV] 2장.wav', '■03_본편')],
      'library',
    );
    expect(sel).toEqual([
      { index: 0, folderName: '■01_본편' },
      { index: 1, folderName: '■03_본편' },
    ]);
  });

  it('pulls subtitles sitting next to a matched audio', () => {
    const sel = selectReconnect(
      [cand('a.mp3', ['ch1']), cand('a.vtt', ['ch1']), cand('stray.vtt', ['ch2'])],
      [want('a.mp3', 'ch1')],
      'sample',
    );
    expect(sel.map((s) => s.index).sort()).toEqual([0, 1]);
    expect(sel.find((s) => s.index === 1)?.folderName).toBe('ch1');
  });

  it('gives nested subtitles the audio’s wanted folder, not the parent dir', () => {
    const sel = selectReconnect(
      [cand('a.mp3', ['ch1']), cand('a.vtt', ['ch1'])],
      [want('a.mp3', 'sample')],
      'sample',
    );
    expect(sel.map((s) => s.index).sort()).toEqual([0, 1]);
    expect(sel.find((s) => s.index === 1)?.folderName).toBe('sample');
  });

  it('chain: select + grouped intake reconnects all JSON1 items', async () => {
    const files = [
      new File(['a'], 'r_MIB2B.mp3'),
      new File(['b'], 'MIB2B.mp3'),
      new File(['c'], 'MIB2A.wav'),
    ];
    const candidates = files.map((file) => ({ fileName: file.name, dirSegments: [] as string[] }));
    const folders = [
      { id: 'f1', name: '새 폴더 1', order: 1 },
      { id: 'f2', name: '새 폴더 2', order: 2 },
      { id: 'fs', name: 'sample', order: 3 },
    ];
    const prev: AudioItem[] = [
      { id: 'i1', title: 'r', fileName: 'r_MIB2B.mp3', folderId: 'fs', isMissing: true },
      { id: 'i2', title: 'm', fileName: 'MIB2B.mp3', folderId: 'fs', isMissing: true },
      { id: 'i3', title: 'w', fileName: 'MIB2A.wav', folderId: 'fs', isMissing: true },
      { id: 'i4', title: 'w', fileName: 'MIB2A.wav', folderId: 'f1', isMissing: true },
      { id: 'i5', title: 'm', fileName: 'MIB2B.mp3', folderId: 'f2', isMissing: true },
      { id: 'i6', title: 'r', fileName: 'r_MIB2B.mp3', folderId: 'f2', isMissing: true },
    ];
    const wanted = prev.map((it) => ({
      fileName: it.fileName,
      folderName: folders.find((f) => f.id === it.folderId)?.name ?? null,
    }));
    const sel = selectReconnect(candidates, wanted, 'sample');
    const groups = new Map<string | null, File[]>();
    for (const s of sel) {
      groups.set(s.folderName, [...(groups.get(s.folderName) ?? []), files[s.index]]);
    }
    let items = prev;
    let affected = 0;
    for (const [folderName, groupFiles] of groups) {
      const folderId = folderName ? (folders.find((f) => f.name === folderName)?.id ?? null) : null;
      const r = await intakeFiles(groupFiles, items, folderId, true);
      items = r.items;
      affected += r.affectedCount;
    }
    expect(affected).toBe(6);
    expect(items.every((it) => !it.isMissing)).toBe(true);
  });
});

describe('shouldDescend', () => {
  it('prunes dependency, system, and over-deep dirs', () => {
    expect(shouldDescend('node_modules', 1)).toBe(false);
    expect(shouldDescend('.git', 1)).toBe(false);
    expect(shouldDescend('.cache', 2)).toBe(false);
    expect(shouldDescend('ch1', MAX_WALK_DEPTH + 1)).toBe(false);
  });

  it('allows ordinary library dirs', () => {
    expect(shouldDescend('sample', 1)).toBe(true);
    expect(shouldDescend('■01_본편', 3)).toBe(true);
  });
});

describe('runBounded', () => {
  it('caps in-flight tasks and isolates failures', async () => {
    let inflight = 0;
    let peak = 0;
    const gate = () =>
      new Promise<string>((resolve) => {
        setTimeout(() => resolve('x'), 5);
      });
    const tasks = Array.from({ length: 8 }, (_, i) => async () => {
      inflight++;
      peak = Math.max(peak, inflight);
      try {
        if (i === 3) throw new Error('bad file');
        return await gate();
      } finally {
        inflight--;
      }
    });
    const { ok, failed } = await runBounded(tasks, 3);
    expect(ok).toHaveLength(7);
    expect(failed).toBe(1);
    expect(peak).toBeLessThanOrEqual(3);
  });
});
