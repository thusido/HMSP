import { describe, expect, it } from 'vitest';
import { en } from './en';
import { ko } from './ko';

function shape(v: unknown): unknown {
  if (typeof v === 'function') return 'fn';
  if (v !== null && typeof v === 'object') {
    return Object.fromEntries(Object.entries(v).map(([k, x]) => [k, shape(x)]));
  }
  return typeof v;
}

describe('i18n parity', () => {
  it('ko and en share the exact key shape', () => {
    expect(shape(en)).toEqual(shape(ko));
  });
});
