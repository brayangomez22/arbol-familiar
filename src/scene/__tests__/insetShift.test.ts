import { describe, expect, it } from 'vitest';
import { insetShift } from '../camera/insetShift';

const viewport = { width: 1200, height: 800 };

describe('insetShift', () => {
  it('does not move without a panel', () => {
    const shift = insetShift({ right: 0, bottom: 0 }, viewport, 24, 30);
    expect(Math.hypot(shift.x, shift.y, shift.z)).toBe(0);
  });

  it('looks past the person toward a side panel by half its width', () => {
    // At 90° the view is 2 × distance tall, so one pixel is 2 × 10 / 800 world units.
    const shift = insetShift({ right: 400, bottom: 0 }, viewport, 10, 90);
    expect(shift.x).toBeCloseTo(200 * (20 / 800));
    expect(shift.y).toBeCloseTo(0);
  });

  it('looks below the person for a bottom sheet, so they show above it', () => {
    const shift = insetShift({ right: 0, bottom: 400 }, viewport, 10, 90);
    expect(shift.y).toBeCloseTo(-200 * (20 / 800));
  });

  it('never shifts by more than the view itself', () => {
    const huge = insetShift({ right: 99999, bottom: 0 }, viewport, 10, 90);
    const full = insetShift({ right: viewport.width, bottom: 0 }, viewport, 10, 90);
    expect(huge).toEqual(full);
  });

  it('ignores an empty viewport', () => {
    expect(insetShift({ right: 10, bottom: 10 }, { width: 0, height: 0 }, 10, 90)).toEqual({
      x: 0,
      y: 0,
      z: 0,
    });
  });
});
