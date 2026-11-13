import { describe, expect, it } from 'vitest';
import { createRandom } from '@/layout/random';
import { initialBird, stepBird, type BirdState, type BirdWorld } from '../bird/birdBehavior';

const timing = {
  firstVisit: [10, 10],
  wait: [30, 30],
  stay: [20, 20],
  arrive: 3,
  leave: 2,
} as const;

const open: BirdWorld = { canVisit: true, perchCount: 4, scared: false };

function run(state: BirdState, seconds: number, world: BirdWorld = open): BirdState {
  const random = createRandom('bird-test');
  let current = state;
  for (let t = 0; t < seconds; t += 0.5) current = stepBird(current, 0.5, world, random, timing);
  return current;
}

describe('stepBird', () => {
  const start = initialBird(createRandom('bird-test'), timing);

  it('waits, arrives on a perch, stays and leaves', () => {
    expect(run(start, 9).phase).toBe('away');
    const arriving = run(start, 10.5);
    expect(arriving.phase).toBe('arriving');
    expect(arriving.perch).toBeGreaterThanOrEqual(0);
    expect(arriving.perch).toBeLessThan(4);
    expect(run(start, 14).phase).toBe('perched');
    expect(run(start, 34).phase).toBe('leaving');
    expect(run(start, 36).phase).toBe('away');
  });

  it('only counts the wait while a visit is possible', () => {
    const closed = { ...open, canVisit: false };
    expect(run(start, 60, closed)).toEqual(start);
    expect(run(start, 10, { ...open, perchCount: 0 })).toEqual(start);
  });

  it('flies off when touched, or when the visit stops being possible', () => {
    const perched = run(start, 14);
    const random = createRandom('x');
    expect(stepBird(perched, 0.1, { ...open, scared: true }, random, timing).phase).toBe('leaving');
    expect(stepBird(perched, 0.1, { ...open, canVisit: false }, random, timing).phase).toBe(
      'leaving',
    );
  });
});
