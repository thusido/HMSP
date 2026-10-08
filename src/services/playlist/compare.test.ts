import { describe, expect, it } from 'vitest';
import { compareFileName } from './compare';

describe('compareFileName', () => {
  it('sorts naturally and case-insensitively', () => {
    const names = ['b10.wav', 'B2.wav', 'a.wav'];
    expect([...names].sort(compareFileName)).toEqual(['a.wav', 'B2.wav', 'b10.wav']);
  });
});
