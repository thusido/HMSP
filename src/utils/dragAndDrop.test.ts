import type { DragEvent } from 'react';
import { describe, expect, it } from 'vitest';
import { parseDropEvent } from './dragAndDrop';

function fileWithPath(name: string, rel: string): File {
  const file = new File(['x'], name);
  Object.defineProperty(file, 'webkitRelativePath', { value: rel });
  return file;
}

function dropEvent(files: File[]): DragEvent {
  return { dataTransfer: { items: [], files } } as unknown as DragEvent;
}

describe('parseDropEvent', () => {
  it('groups folder drops via webkitRelativePath when no entries exist', async () => {
    const res = await parseDropEvent(
      dropEvent([
        fileWithPath('a.mp3', 'Album/a.mp3'),
        fileWithPath('a.vtt', 'Album/a.vtt'),
        new File(['x'], 'solo.mp3'),
      ]),
    );
    expect(res.folders).toHaveLength(1);
    expect(res.folders[0].folderName).toBe('Album');
    expect(res.folders[0].files.map((f) => f.name).sort()).toEqual(['a.mp3', 'a.vtt']);
    expect(res.rootFiles.map((f) => f.name)).toEqual(['solo.mp3']);
  });

  it('returns empty result for empty drops', async () => {
    const res = await parseDropEvent(dropEvent([]));
    expect(res.folders).toHaveLength(0);
    expect(res.rootFiles).toHaveLength(0);
  });

  it('reads folder contents via directory entries when available', async () => {
    const wav = new File(['audio'], 'b.mp3');
    const vtt = new File(['subs'], 'b.vtt');
    const fileEntry = (f: File) => ({ isFile: true, file: (ok: (file: File) => void) => ok(f) });
    let served = false;
    const dirEntry = {
      isDirectory: true,
      name: 'Album',
      createReader: () => ({
        readEntries: (ok: (entries: unknown[]) => void) => {
          if (!served) {
            served = true;
            ok([fileEntry(wav), fileEntry(vtt)]);
          } else {
            ok([]);
          }
        },
      }),
    };
    const event = {
      dataTransfer: {
        items: [{ kind: 'file', webkitGetAsEntry: () => dirEntry }],
        files: [],
      },
    } as unknown as DragEvent;
    const res = await parseDropEvent(event);
    expect(res.folders).toHaveLength(1);
    expect(res.folders[0].folderName).toBe('Album');
    expect(res.folders[0].files.map((f) => f.name).sort()).toEqual(['b.mp3', 'b.vtt']);
    expect(res.rootFiles).toHaveLength(0);
  });

  it('falls back to grouped files when entry reading throws', async () => {
    const event = {
      dataTransfer: {
        items: [{ kind: 'file', webkitGetAsEntry: () => ({ isDirectory: true, name: 'Album' }) }],
        files: [fileWithPath('c.mp3', 'Album/c.mp3')],
      },
    } as unknown as DragEvent;
    const res = await parseDropEvent(event);
    expect(res.folders).toHaveLength(1);
    expect(res.folders[0].files.map((f) => f.name)).toEqual(['c.mp3']);
  });
});
