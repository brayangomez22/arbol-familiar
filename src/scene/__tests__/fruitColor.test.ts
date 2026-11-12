import { describe, expect, it } from 'vitest';
import { dayPalette } from '@/config/theme';
import { fruitColorIndex } from '../tree/fruitColor';

describe('fruitColorIndex', () => {
  it('always gives the same person the same theme color', () => {
    const ids = ['jose-gomez', 'rosa-manco', 'ana-alvarez', 'pedro-alvarez'];
    for (const id of ids) {
      const index = fruitColorIndex(id, dayPalette);
      expect(index).toBe(fruitColorIndex(id, dayPalette));
      expect(index).toBeGreaterThanOrEqual(0);
      expect(index).toBeLessThan(dayPalette.fruits.length);
    }
  });
});
