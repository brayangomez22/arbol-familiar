import type { Random } from '@/layout/random';

export type BirdPhase = 'away' | 'arriving' | 'perched' | 'leaving';

export interface BirdState {
  readonly phase: BirdPhase;
  /** Seconds into the phase, and how long it lasts. */
  readonly elapsed: number;
  readonly duration: number;
  /** Index of the perch of this visit. */
  readonly perch: number;
  /** Which way it looks: +1 toward +x. */
  readonly facing: 1 | -1;
}

export interface BirdWorld {
  /** Intro over and the tree as it is today: a visit may start or go on. */
  readonly canVisit: boolean;
  readonly perchCount: number;
  /** Touched while perched. */
  readonly scared: boolean;
}

export interface BirdTiming {
  readonly firstVisit: readonly [number, number];
  readonly wait: readonly [number, number];
  readonly stay: readonly [number, number];
  readonly arrive: number;
  readonly leave: number;
}

export function initialBird(random: Random, timing: BirdTiming): BirdState {
  return {
    phase: 'away',
    elapsed: 0,
    duration: random.range(...timing.firstVisit),
    perch: 0,
    facing: 1,
  };
}

/**
 * One step of the bird's day. Away, it only counts the wait while a visit is possible; it stays
 * until its time is up, it is touched, or the visit stops being possible (the timeline moves).
 */
export function stepBird(
  state: BirdState,
  delta: number,
  world: BirdWorld,
  random: Random,
  timing: BirdTiming,
): BirdState {
  const elapsed = state.elapsed + delta;
  switch (state.phase) {
    case 'away':
      if (!world.canVisit || world.perchCount === 0) return state;
      if (elapsed < state.duration) return { ...state, elapsed };
      return {
        phase: 'arriving',
        elapsed: 0,
        duration: timing.arrive,
        perch: random.int(0, world.perchCount - 1),
        facing: random.next() < 0.5 ? 1 : -1,
      };
    case 'arriving':
      if (elapsed < state.duration) return { ...state, elapsed };
      return { ...state, phase: 'perched', elapsed: 0, duration: random.range(...timing.stay) };
    case 'perched':
      if (world.scared || !world.canVisit || elapsed >= state.duration)
        return { ...state, phase: 'leaving', elapsed: 0, duration: timing.leave };
      return { ...state, elapsed };
    case 'leaving':
      if (elapsed < state.duration) return { ...state, elapsed };
      return { ...state, phase: 'away', elapsed: 0, duration: random.range(...timing.wait) };
  }
}
