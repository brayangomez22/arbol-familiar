import { describe, expect, it } from 'vitest';
import { indexFamily } from '../genealogy';
import {
  censusAt,
  decadeMarks,
  lifeStageAt,
  lifelines,
  timelineRange,
  type Lifeline,
} from '../timeline';
import { date, family, person, union } from './fixtures';

/**
 * abuelo (1938–2015) + abuela (1941)
 * ├─ hijo (1963) + nuera (graft, no birth date)
 * │  └─ nieto (no birth date)
 * └─ hija (1965, died on an unknown date)
 */
function datedFamily() {
  return indexFamily(
    family(
      [
        person('abuelo', { birth: { date: date('1938-05-12') }, death: { date: date('2015') } }),
        person('abuela', { birth: { date: date('1941-09') } }),
        person('hijo', { birth: { date: date('1963') } }),
        person('nuera'),
        person('nieto'),
        person('hija', { birth: { date: date('1965') }, death: {} }),
      ],
      [
        union('u-root', ['abuelo', 'abuela'], ['hijo', 'hija']),
        union('u-hijo', ['hijo', 'nuera'], ['nieto']),
      ],
      'u-root',
    ),
  );
}

function lineOf(lines: ReadonlyMap<string, Lifeline>, id: string): Lifeline {
  const line = lines.get(id);
  if (!line) throw new Error(`No lifeline for ${id}`);
  return line;
}

describe('lifelines', () => {
  const lines = lifelines(datedFamily(), 2026);

  it('uses the birth year when it is known', () => {
    expect(lineOf(lines, 'abuelo')).toEqual({ appearYear: 1938, deathYear: 2015, deceased: true });
    expect(lineOf(lines, 'abuela').appearYear).toBe(1941);
  });

  it('lets a partner without birth date appear with the person they married', () => {
    expect(lineOf(lines, 'nuera').appearYear).toBe(1963);
  });

  it('lets a child without birth date appear with its youngest parent', () => {
    expect(lineOf(lines, 'nieto').appearYear).toBe(1963);
  });

  it('marks an undated death as deceased without a year', () => {
    expect(lineOf(lines, 'hija')).toEqual({ appearYear: 1965, deathYear: null, deceased: true });
  });

  it('falls back to the earliest known year for a root couple without dates', () => {
    const undated = indexFamily(
      family(
        [person('a'), person('b'), person('c', { birth: { date: date('1990') } })],
        [union('u', ['a', 'b'], ['c'])],
        'u',
      ),
    );
    const result = lifelines(undated, 2026);
    expect(lineOf(result, 'a').appearYear).toBe(1990);
    expect(lineOf(result, 'b').appearYear).toBe(1990);
  });

  it('falls back to the given year when nobody has dates', () => {
    const undated = indexFamily(family([person('a')], [union('u', ['a'])], 'u'));
    expect(lineOf(lifelines(undated, 2026), 'a').appearYear).toBe(2026);
  });
});

describe('lifeStageAt', () => {
  const lines = lifelines(datedFamily(), 2026);
  const abuelo = lineOf(lines, 'abuelo');
  const hija = lineOf(lines, 'hija');

  it('is unborn before the appearance year', () => {
    expect(lifeStageAt(abuelo, 1937)).toBe('unborn');
    expect(lifeStageAt(abuelo, 1938)).toBe('alive');
  });

  it('is alive through the year of death and deceased after it', () => {
    expect(lifeStageAt(abuelo, 2015)).toBe('alive');
    expect(lifeStageAt(abuelo, 2016)).toBe('deceased');
  });

  it('shows today when the year is null', () => {
    expect(lifeStageAt(abuelo, null)).toBe('deceased');
    expect(lifeStageAt(lineOf(lines, 'abuela'), null)).toBe('alive');
  });

  it('keeps an undated death alive on the timeline and deceased today', () => {
    expect(lifeStageAt(hija, 2026)).toBe('alive');
    expect(lifeStageAt(hija, null)).toBe('deceased');
  });
});

describe('timelineRange', () => {
  it('runs from the earliest appearance to the current year', () => {
    expect(timelineRange(lifelines(datedFamily(), 2026), 2026)).toEqual({
      first: 1938,
      last: 2026,
    });
  });
});

describe('decadeMarks', () => {
  it('lists the decades inside the range', () => {
    expect(decadeMarks({ first: 1938, last: 2026 })).toEqual([
      1940, 1950, 1960, 1970, 1980, 1990, 2000, 2010, 2020,
    ]);
  });

  it('includes an edge that falls on a decade', () => {
    expect(decadeMarks({ first: 1940, last: 1960 })).toEqual([1940, 1950, 1960]);
  });
});

describe('censusAt', () => {
  const lines = lifelines(datedFamily(), 2026);

  it('counts each stage in a year', () => {
    expect(censusAt(lines, 1940)).toEqual({ unborn: 5, alive: 1, deceased: 0 });
    expect(censusAt(lines, 2020)).toEqual({ unborn: 0, alive: 5, deceased: 1 });
  });

  it('counts today when the year is null', () => {
    expect(censusAt(lines, null)).toEqual({ unborn: 0, alive: 4, deceased: 2 });
  });
});
