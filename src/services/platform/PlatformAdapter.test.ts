import { describe, expect, it } from 'vitest';
import { displayNameOf, fsUriKey, getFilePath, parseFsUriKey, withFilePath } from './PlatformAdapter';

describe('file path bridge', () => {
  it('round-trips a native path on a File shell', () => {
    const file = withFilePath(new File([], 'a.mp3'), '/music/a.mp3');
    expect(file.name).toBe('a.mp3');
    expect(getFilePath(file)).toBe('/music/a.mp3');
  });

  it('returns undefined for plain Files', () => {
    expect(getFilePath(new File(['x'], 'b.mp3'))).toBeUndefined();
  });
});

describe('displayNameOf', () => {
  it('decodes an Android SAF document id to the file name', () => {
    expect(displayNameOf('content://com.android.externalstorage.documents/tree/primary%3ADownload/document/primary%3ADownload%2F1%EC%B0%A8%EC%8B%9C.mp3')).toBe(
      '1차시.mp3',
    );
  });

  it('passes desktop paths through', () => {
    expect(displayNameOf('/Users/admin/Music/가 01.mp3')).toBe('가 01.mp3');
  });

  it('falls back to raw on a literal percent sign', () => {
    expect(displayNameOf('/music/100%.mp3')).toBe('100%.mp3');
  });
});

describe('fsUriKey', () => {
  it('round-trips uri + name, rejects plain paths', () => {
    const uri = { uri: 'content://x/tree/y', documentTopTreeUri: 'content://x/tree/y' as string | null };
    const key = fsUriKey(uri, 'a.mp3');
    expect(parseFsUriKey(key)).toEqual({ uri: 'content://x/tree/y', documentTopTreeUri: 'content://x/tree/y', name: 'a.mp3' });
    expect(parseFsUriKey('/music/a.mp3')).toBeNull();
    expect(parseFsUriKey('android-fs:not-json')).toBeNull();
  });
});
