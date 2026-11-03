import { describe, expect, it } from 'vitest';
import { createRandom, hashString } from '../random';

const draw = (count: number, ...seed: string[]): number[] => {
  const rng = createRandom(...seed);
  return Array.from({ length: count }, () => rng.next());
};

describe('createRandom', () => {
  it('repeats the same stream for the same seed', () => {
    expect(draw(20, 'ana-alvarez', 'branch')).toEqual(draw(20, 'ana-alvarez', 'branch'));
  });

  it('gives different streams to different people and aspects', () => {
    expect(draw(5, 'ana-alvarez', 'branch')).not.toEqual(draw(5, 'ana-alvarez-2', 'branch'));
    expect(draw(5, 'ana-alvarez', 'branch')).not.toEqual(draw(5, 'ana-alvarez', 'fruit'));
    // Joining parts must not be ambiguous: ('ab', 'c') is not ('a', 'bc').
    expect(draw(5, 'ab', 'c')).not.toEqual(draw(5, 'a', 'bc'));
  });

  it('stays within its ranges', () => {
    const rng = createRandom('ranges');
    for (let i = 0; i < 1000; i++) {
      const unit = rng.next();
      expect(unit).toBeGreaterThanOrEqual(0);
      expect(unit).toBeLessThan(1);
      expect(Math.abs(rng.signed())).toBeLessThanOrEqual(1);
      const value = rng.range(2, 3);
      expect(value).toBeGreaterThanOrEqual(2);
      expect(value).toBeLessThan(3);
      const int = rng.int(5, 8);
      expect(Number.isInteger(int)).toBe(true);
      expect(int).toBeGreaterThanOrEqual(5);
      expect(int).toBeLessThanOrEqual(8);
    }
  });

  it('spreads values evenly enough', () => {
    const values = draw(10_000, 'spread');
    const mean = values.reduce((sum, v) => sum + v, 0) / values.length;
    expect(mean).toBeCloseTo(0.5, 1);
  });
});

describe('hashString', () => {
  it('is a stable unsigned 32-bit hash', () => {
    expect(hashString('')).toBe(0x811c9dc5);
    expect(hashString('jose-gomez')).toBe(hashString('jose-gomez'));
    expect(hashString('jose-gomez')).not.toBe(hashString('rosa-manco'));
    expect(hashString('jose-gomez')).toBeGreaterThanOrEqual(0);
    expect(hashString('jose-gomez')).toBeLessThan(2 ** 32);
  });
});
