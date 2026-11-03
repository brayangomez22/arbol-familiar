import { describe, expect, it } from 'vitest';
import { fanOffsets, softLimitAngle } from '../branchShape';

const FAN = Math.PI / 2;

describe('fanOffsets', () => {
  it('spreads a leaderless fan symmetrically around the center', () => {
    const [left, middle, right] = fanOffsets([1, 1, 1], null, FAN);
    expect(middle).toBeCloseTo(0, 12);
    expect(left).toBeCloseTo(-(right ?? 0), 12);
    expect(right).toBeCloseTo(FAN / 3, 12);
  });

  it('measures offsets from the leader, which takes the balancing slot', () => {
    const offsets = fanOffsets([1, 1], 1, FAN);
    expect(offsets).toHaveLength(2);
    expect(offsets[0]).toBeLessThan(0);
    expect(offsets[1]).toBeGreaterThan(0);
    expect(offsets[0]).toBeCloseTo(-(offsets[1] ?? 0), 12);
  });

  it('gives heavier children wider slots', () => {
    const [small, big] = fanOffsets([1, 3], null, FAN);
    // Slots: small spans [-45°, -22.5°], big spans [-22.5°, 45°].
    expect(small).toBeCloseTo(-FAN / 2 + FAN / 8, 12);
    expect(big).toBeCloseTo(-FAN / 2 + FAN / 4 + (FAN * 3) / 8, 12);
  });

  it('keeps children in order', () => {
    const offsets = fanOffsets([2, 1, 4, 1, 3], 1, FAN);
    expect([...offsets].sort((a, b) => a - b)).toEqual(offsets);
  });

  it('moves the leader to one side when asked for an uneven share', () => {
    const balanced = fanOffsets([1, 1, 1, 1], 1, FAN, 0.5);
    const mostlyRight = fanOffsets([1, 1, 1, 1], 1, FAN, 0.2);
    expect(balanced.filter((offset) => offset < 0)).toHaveLength(2);
    expect(mostlyRight.filter((offset) => offset < 0)).toHaveLength(1);
  });
});

describe('softLimitAngle', () => {
  const soft = Math.PI / 4;
  const max = Math.PI / 2;

  it('leaves moderate angles untouched', () => {
    expect(softLimitAngle(0.3, soft, max)).toBe(0.3);
    expect(softLimitAngle(-soft, soft, max)).toBe(-soft);
  });

  it('eases large angles toward the limit, keeping their order and sign', () => {
    const eased = [1, 1.5, 3, 10].map((angle) => softLimitAngle(angle, soft, max));
    for (let i = 1; i < eased.length; i++) {
      expect(eased[i]).toBeGreaterThan(eased[i - 1] ?? Infinity);
    }
    for (const angle of eased) expect(angle).toBeLessThanOrEqual(max);
    expect(softLimitAngle(-3, soft, max)).toBeCloseTo(-softLimitAngle(3, soft, max), 12);
  });
});
