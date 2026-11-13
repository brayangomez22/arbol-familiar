import { foldName } from './seasons';

export const DAY_PHASES = ['dawn', 'day', 'dusk', 'night'] as const;
export type DayPhase = (typeof DAY_PHASES)[number];

/** A moment of the day that looks exactly like `phase`; between two stops the look blends. */
export interface DayStop {
  /** Local time in hours, 0–24. */
  readonly hour: number;
  readonly phase: DayPhase;
}

/** The look of one moment: `mix` of the way from `from` to `to`. */
export interface DayBlend {
  readonly from: DayPhase;
  readonly to: DayPhase;
  /** 0–1. */
  readonly mix: number;
}

/** Hours since local midnight, with minutes and seconds as a fraction. */
export function hourOf(date: Date): number {
  return date.getHours() + date.getMinutes() / 60 + date.getSeconds() / 3600;
}

/**
 * Blend at `hour` given stops sorted by hour. The day wraps: after the last stop it blends toward
 * the first one of the next day. Two stops of the same phase hold that look between them.
 */
export function dayBlendAt(hour: number, stops: readonly DayStop[]): DayBlend {
  const first = stops[0];
  if (!first) throw new Error('The day cycle needs at least one stop');
  const wrapped = ((hour % 24) + 24) % 24;
  let previous = stops.at(-1) ?? first;
  let previousHour = previous.hour - 24;
  for (const stop of [...stops, { hour: first.hour + 24, phase: first.phase }]) {
    if (wrapped < stop.hour) {
      const span = stop.hour - previousHour;
      const mix = span > 0 ? (wrapped - previousHour) / span : 0;
      return { from: previous.phase, to: stop.phase, mix: smooth(mix) };
    }
    previous = stop;
    previousHour = stop.hour;
  }
  return { from: previous.phase, to: previous.phase, mix: 0 };
}

/** Eases each transition, so the light settles into a phase rather than passing through it. */
function smooth(t: number): number {
  const clamped = Math.min(Math.max(t, 0), 1);
  return clamped * clamped * (3 - 2 * clamped);
}

/** A single phase, held. */
export function steadyBlend(phase: DayPhase): DayBlend {
  return { from: phase, to: phase, mix: 0 };
}

/** How much of each phase a blend holds; the weights add up to 1. */
export function phaseWeights(blend: DayBlend): Readonly<Record<DayPhase, number>> {
  const weights: Record<DayPhase, number> = { dawn: 0, day: 0, dusk: 0, night: 0 };
  weights[blend.from] += 1 - blend.mix;
  weights[blend.to] += blend.mix;
  return weights;
}

const PHASE_NAMES: Readonly<Record<string, DayPhase>> = {
  dawn: 'dawn',
  sunrise: 'dawn',
  amanecer: 'dawn',
  day: 'day',
  dia: 'day',
  dusk: 'dusk',
  sunset: 'dusk',
  atardecer: 'dusk',
  night: 'night',
  noche: 'night',
};

/** For `?time=`: English or Spanish, any case, with or without accents. Null if unknown. */
export function parseDayPhase(text: string | null): DayPhase | null {
  if (text === null) return null;
  return PHASE_NAMES[foldName(text)] ?? null;
}
