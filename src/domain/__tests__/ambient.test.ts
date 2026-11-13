import { describe, expect, it } from 'vitest';
import {
  dayBlendAt,
  hourOf,
  parseDayPhase,
  phaseWeights,
  steadyBlend,
  type DayStop,
} from '../dayCycle';
import { parseSeason, seasonOf, seasonOfMonth } from '../seasons';

describe('seasonOfMonth', () => {
  it.each([
    [12, 'winter'],
    [1, 'winter'],
    [2, 'winter'],
    [3, 'spring'],
    [5, 'spring'],
    [6, 'summer'],
    [8, 'summer'],
    [9, 'autumn'],
    [11, 'autumn'],
  ] as const)('month %i is %s', (month, season) => {
    expect(seasonOfMonth(month)).toBe(season);
  });

  it('reads the month in local time', () => {
    expect(seasonOf(new Date(2026, 10, 13))).toBe('autumn');
  });
});

describe('parseSeason', () => {
  it('accepts English and Spanish names, any case and accents', () => {
    expect(parseSeason('spring')).toBe('spring');
    expect(parseSeason('Otoño')).toBe('autumn');
    expect(parseSeason('OTONO')).toBe('autumn');
    expect(parseSeason('fall')).toBe('autumn');
    expect(parseSeason(' invierno ')).toBe('winter');
  });

  it('is null for anything else', () => {
    expect(parseSeason(null)).toBeNull();
    expect(parseSeason('')).toBeNull();
    expect(parseSeason('monsoon')).toBeNull();
  });
});

const STOPS: readonly DayStop[] = [
  { hour: 5, phase: 'night' },
  { hour: 6, phase: 'dawn' },
  { hour: 8, phase: 'day' },
  { hour: 17, phase: 'day' },
  { hour: 18, phase: 'dusk' },
  { hour: 20, phase: 'night' },
];

describe('dayBlendAt', () => {
  it('holds a phase between two stops of that phase', () => {
    const noon = dayBlendAt(12, STOPS);
    expect([noon.from, noon.to]).toEqual(['day', 'day']);
    expect(phaseWeights(dayBlendAt(12, STOPS)).day).toBe(1);
  });

  it('blends between neighboring phases with an eased mix', () => {
    const halfway = dayBlendAt(7, STOPS);
    expect(halfway.from).toBe('dawn');
    expect(halfway.to).toBe('day');
    expect(halfway.mix).toBeCloseTo(0.5);
    expect(dayBlendAt(6.5, STOPS).mix).toBeLessThan(0.25);
  });

  it('is exactly the phase at its stop', () => {
    expect(phaseWeights(dayBlendAt(6, STOPS)).dawn).toBeCloseTo(1);
    expect(phaseWeights(dayBlendAt(18, STOPS)).dusk).toBeCloseTo(1);
  });

  it('wraps around midnight', () => {
    expect(phaseWeights(dayBlendAt(23.5, STOPS)).night).toBe(1);
    expect(phaseWeights(dayBlendAt(0, STOPS)).night).toBe(1);
    expect(phaseWeights(dayBlendAt(3, STOPS)).night).toBe(1);
  });

  it('wraps hours outside 0–24', () => {
    expect(dayBlendAt(36, STOPS)).toEqual(dayBlendAt(12, STOPS));
    expect(dayBlendAt(-1, STOPS)).toEqual(dayBlendAt(23, STOPS));
  });

  it('needs at least one stop', () => {
    expect(() => dayBlendAt(12, [])).toThrow();
  });
});

describe('phaseWeights', () => {
  it('adds up to 1', () => {
    for (let hour = 0; hour < 24; hour += 0.25) {
      const weights = phaseWeights(dayBlendAt(hour, STOPS));
      const total = weights.dawn + weights.day + weights.dusk + weights.night;
      expect(total).toBeCloseTo(1);
    }
  });

  it('gives a steady blend all the weight', () => {
    expect(phaseWeights(steadyBlend('night'))).toEqual({ dawn: 0, day: 0, dusk: 0, night: 1 });
  });
});

describe('hourOf', () => {
  it('includes minutes as a fraction, in local time', () => {
    expect(hourOf(new Date(2026, 10, 13, 18, 30))).toBe(18.5);
  });
});

describe('parseDayPhase', () => {
  it('accepts English and Spanish names', () => {
    expect(parseDayPhase('night')).toBe('night');
    expect(parseDayPhase('Noche')).toBe('night');
    expect(parseDayPhase('día')).toBe('day');
    expect(parseDayPhase('atardecer')).toBe('dusk');
    expect(parseDayPhase('amanecer')).toBe('dawn');
  });

  it('is null for anything else', () => {
    expect(parseDayPhase(null)).toBeNull();
    expect(parseDayPhase('noon')).toBeNull();
  });
});
