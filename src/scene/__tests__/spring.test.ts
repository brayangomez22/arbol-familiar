import { describe, expect, it } from 'vitest';
import { stepSpring, type SpringConfig, type SpringState } from '../spring';

function run(config: SpringConfig, fps: number, seconds: number): number[] {
  const state: SpringState = { value: 1, velocity: 0 };
  const values: number[] = [];
  for (let frame = 0; frame < fps * seconds; frame++) {
    stepSpring(state, 1.15, config, 1 / fps);
    values.push(state.value);
  }
  return values;
}

const gentle = { stiffness: 260, dampingRatio: 0.6 };

describe('stepSpring', () => {
  it('settles on the target', () => {
    expect(run(gentle, 60, 2).at(-1)).toBeCloseTo(1.15, 4);
  });

  it('overshoots only a little when slightly underdamped', () => {
    const peak = Math.max(...run(gentle, 60, 2));
    expect(peak).toBeGreaterThan(1.15);
    expect(peak).toBeLessThan(1.15 + 0.15 * 0.15);
  });

  it('never overshoots when critically damped', () => {
    expect(Math.max(...run({ stiffness: 260, dampingRatio: 1 }, 60, 2))).toBeLessThanOrEqual(1.15);
  });

  it('feels the same at 30 and 144 fps', () => {
    const slow = run(gentle, 30, 0.2).at(-1) ?? 0;
    const fast = run(gentle, 144, 0.2).at(-1) ?? 0;
    expect(Math.abs(slow - fast)).toBeLessThan(0.002);
  });
});
