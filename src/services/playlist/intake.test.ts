import { describe, expect, it } from 'vitest';
import { withFilePath } from '../platform/PlatformAdapter';
import { intakeFiles } from './intake';

const audio = (name: string) => new File(['audio-bytes'], name);
const sub = (name: string, text = '1\n00:00:01,000 --> 00:00:02,000\nHello.\n') => new File([text], name);

describe('intakeFiles', () => {
  it('adds audio with auto-matched subtitles', async () => {
    const { items, affectedCount } = await intakeFiles([audio('a.mp3'), sub('a.vtt')], [], null);
    expect(affectedCount).toBe(1);
    expect(items).toHaveLength(1);
    expect(items[0].subtitleFileName).toBe('a.vtt');
    expect(items[0].subtitles).toHaveLength(1);
    expect(items[0].isMissing).toBe(false);
  });

  it('re-attaches missing files without duplicating', async () => {
    const first = await intakeFiles([audio('a.mp3')], [], 'f1');
    const missing = first.items.map((it) => ({ ...it, file: undefined, isMissing: true }));
    const second = await intakeFiles([audio('a.mp3'), sub('a.mp3.vtt')], missing, 'f1');
    expect(second.items).toHaveLength(1);
    expect(second.items[0].isMissing).toBe(false);
    expect(second.items[0].subtitleFileName).toBe('a.mp3.vtt');
  });

  it('reconnectOnly skips unknown files', async () => {
    const { items, affectedCount } = await intakeFiles([audio('new.mp3')], [], null, true);
    expect(items).toHaveLength(0);
    expect(affectedCount).toBe(0);
  });

  it('reconnectOnly connects every duplicate missing item with the shared file', async () => {
    const first = await intakeFiles([audio('a.mp3')], [], 'f1');
    const dupes = [
      ...first.items.map((it) => ({ ...it, file: undefined, isMissing: true })),
      ...first.items.map((it) => ({ ...it, id: 'item-dup', file: undefined, isMissing: true })),
    ];
    const second = await intakeFiles([audio('a.mp3')], dupes, 'f1', true);
    expect(second.affectedCount).toBe(2);
    expect(second.items.every((it) => it.isMissing === false)).toBe(true);
    expect(second.items[0].file).toBe(second.items[1].file);
  });

  it('two same-name files do not double-connect duplicates', async () => {
    const first = await intakeFiles([audio('a.mp3')], [], 'f1');
    const dupes = [
      ...first.items.map((it) => ({ ...it, file: undefined, isMissing: true })),
      ...first.items.map((it) => ({ ...it, id: 'item-dup', file: undefined, isMissing: true })),
    ];
    const second = await intakeFiles([audio('a.mp3'), audio('a.mp3')], dupes, 'f1', true);
    expect(second.affectedCount).toBe(2);
    expect(second.items.every((it) => it.isMissing === false)).toBe(true);
  });

  it('null scope matches root items only', async () => {
    const prev = [
      { id: 'r', title: 'a.mp3', fileName: 'a.mp3', isMissing: true },
      { id: 'f', title: 'a.mp3', fileName: 'a.mp3', folderId: 'f1', isMissing: true },
    ];
    const { items, affectedCount } = await intakeFiles([audio('a.mp3')], prev, null, true);
    expect(affectedCount).toBe(1);
    expect(items.find((it) => it.id === 'r')?.isMissing).toBe(false);
    expect(items.find((it) => it.id === 'f')?.isMissing).toBe(true);
  });

  it('ignores non-media files', async () => {
    const { items } = await intakeFiles([new File(['x'], 'note.txt')], [], null);
    expect(items).toHaveLength(0);
  });

  it('carries filePath from shells onto new items', async () => {
    const shell = withFilePath(new File([], 'a.mp3'), '/music/a.mp3');
    const { items } = await intakeFiles([shell], [], 'f1');
    expect(items).toHaveLength(1);
    expect(items[0].filePath).toBe('/music/a.mp3');
    expect(items[0].file?.size).toBe(0);
  });

  it('carries filePath when re-attaching missing items', async () => {
    const first = await intakeFiles([withFilePath(new File([], 'a.mp3'), '/music/a.mp3')], [], 'f1');
    const missing = first.items.map((it) => ({ ...it, file: undefined, filePath: undefined, isMissing: true }));
    const shell = withFilePath(new File([], 'a.mp3'), '/music/a.mp3');
    const second = await intakeFiles([shell], missing, 'f1', true);
    expect(second.items[0].filePath).toBe('/music/a.mp3');
    expect(second.items[0].isMissing).toBe(false);
  });
});
