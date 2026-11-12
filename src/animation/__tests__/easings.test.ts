import { describe, expect, it } from 'vitest';
import { cssEase, cubicBezier, ease, EASE_CURVES } from '../easings';

describe('cubicBezier', () => {
  it('is linear for the identity curve', () => {
    const linear = cubicBezier(1 / 3, 1 / 3, 2 / 3, 2 / 3);
    for (const x of [0.1, 0.37, 0.5, 0.9]) expect(linear(x)).toBeCloseTo(x, 5);
  });

  it.each(Object.keys(EASE_CURVES) as (keyof typeof EASE_CURVES)[])(
    '%s goes from 0 to 1 and never turns back',
    (name) => {
      const curve = ease[name];
      expect(curve(0)).toBe(0);
      expect(curve(1)).toBe(1);
      let previous = 0;
      for (let i = 1; i <= 200; i++) {
        const value = curve(i / 200);
        expect(value).toBeGreaterThanOrEqual(previous - 1e-9);
        previous = value;
      }
    },
  );

  it('is symmetric-ish for standard: slow at both ends', () => {
    expect(ease.standard(0.1)).toBeLessThan(0.1);
    expect(ease.standard(0.9)).toBeGreaterThan(0.9);
  });

  it('writes the same curve for CSS', () => {
    expect(cssEase('standard')).toBe('cubic-bezier(0.45, 0, 0.2, 1)');
  });
});
