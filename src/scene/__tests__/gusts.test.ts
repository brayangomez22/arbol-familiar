import { describe, expect, it } from 'vitest';
import { WIND } from '@/config/constants';
import { createGustSchedule } from '../wind/gusts';

const STEP = 1 / 120;
const SPAN = WIND.gust.interval * 40;

function sample(schedule: (time: number) => number): number[] {
  const values: number[] = [];
  for (let time = 0; time < SPAN; time += STEP) values.push(schedule(time));
  return values;
}

describe('createGustSchedule', () => {
  const values = sample(createGustSchedule(WIND.gust));

  it('is deterministic', () => {
    expect(sample(createGustSchedule(WIND.gust))).toEqual(values);
  });

  it('stays between 0 and 1', () => {
    expect(Math.min(...values)).toBeGreaterThanOrEqual(0);
    expect(Math.max(...values)).toBeLessThanOrEqual(1);
  });

  it('actually blows now and then, and is calm in between', () => {
    expect(values.some((value) => value > WIND.gust.minPeak * 0.9)).toBe(true);
    expect(values.filter((value) => value === 0).length).toBeGreaterThan(values.length / 3);
  });

  it('never jumps from one frame to the next', () => {
    // Steepest smoothstep slope is 1.5 / (shortest swell), times the step.
    const maxSlope = 1.5 / (WIND.gust.minDuration * WIND.gust.rise);
    for (let i = 1; i < values.length; i++) {
      expect(Math.abs((values[i] ?? 0) - (values[i - 1] ?? 0))).toBeLessThanOrEqual(
        maxSlope * STEP * 1.01,
      );
    }
  });

  it('answers the same for a moment whether reached in order or directly', () => {
    const time = WIND.gust.interval * 17.4;
    const ordered = createGustSchedule(WIND.gust);
    for (let t = 0; t < time; t += 1) ordered(t);
    expect(ordered(time)).toBe(createGustSchedule(WIND.gust)(time));
  });
});
