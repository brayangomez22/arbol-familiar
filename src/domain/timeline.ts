import { isDeceased } from './dates';
import { parentsOf, partnersOf, type FamilyIndex } from './genealogy';
import type { PersonId } from './types';

/** Where a person stands in a given year of the family's history. */
export type LifeStage = 'unborn' | 'alive' | 'deceased';

/** When a person shows up on the timeline and when they leave it. */
export interface Lifeline {
  /** Year the person appears: their birth year, or a sensible stand-in when it is unknown. */
  readonly appearYear: number;
  /** Null when the person is alive, or when they died on an unknown date. */
  readonly deathYear: number | null;
  /** Died, whether or not the date is known. */
  readonly deceased: boolean;
}

export interface TimelineRange {
  readonly first: number;
  readonly last: number;
}

/**
 * Every person's lifeline. Without a birth year, a child appears with its parents and a partner
 * (graft) with the person they married into the family, so nobody ever appears before the branch
 * that carries them. With nothing to go on (a root partner without dates), `fallbackYear`.
 */
export function lifelines(
  index: FamilyIndex,
  fallbackYear: number,
): ReadonlyMap<PersonId, Lifeline> {
  const appear = new Map<PersonId, number>();
  const visiting = new Set<PersonId>();
  const earliestKnown = Math.min(
    fallbackYear,
    ...[...index.family.people.values()].flatMap((person) => {
      const year = person.birth?.date?.year;
      return year === undefined ? [] : [year];
    }),
  );

  const appearYearOf = (id: PersonId): number => {
    const known = appear.get(id);
    if (known !== undefined) return known;
    const person = index.family.people.get(id);
    const birthYear = person?.birth?.date?.year;
    if (birthYear !== undefined) {
      appear.set(id, birthYear);
      return birthYear;
    }
    // Partners point at each other: a pair with no dates at all falls back to the earliest year.
    if (visiting.has(id)) return earliestKnown;
    visiting.add(id);
    const parents = parentsOf(index, id);
    const relatives = parents.length > 0 ? parents : partnersOf(index, id);
    const year = relatives.length > 0 ? Math.max(...relatives.map(appearYearOf)) : earliestKnown;
    visiting.delete(id);
    appear.set(id, year);
    return year;
  };

  return new Map(
    [...index.family.people.values()].map((person): [PersonId, Lifeline] => [
      person.id,
      {
        appearYear: appearYearOf(person.id),
        deathYear: person.death?.date?.year ?? null,
        deceased: isDeceased(person),
      },
    ]),
  );
}

/**
 * Stage of a person in `year`; null means today. People are alive through the year they die and
 * deceased from the next one. An undated death only shows today: we cannot tell when it happened.
 */
export function lifeStageAt(lifeline: Lifeline, year: number | null): LifeStage {
  if (year === null) return lifeline.deceased ? 'deceased' : 'alive';
  if (year < lifeline.appearYear) return 'unborn';
  if (lifeline.deathYear !== null && year > lifeline.deathYear) return 'deceased';
  return 'alive';
}

/** From the earliest appearance to the current year. */
export function timelineRange(
  lines: ReadonlyMap<PersonId, Lifeline>,
  currentYear: number,
): TimelineRange {
  const first = Math.min(currentYear, ...[...lines.values()].map((line) => line.appearYear));
  return { first, last: currentYear };
}

/** Years that start a decade within the range, for the slider's tick marks. */
export function decadeMarks({ first, last }: TimelineRange): readonly number[] {
  const marks: number[] = [];
  for (let year = Math.ceil(first / 10) * 10; year <= last; year += 10) marks.push(year);
  return marks;
}

/** How many people the tree shows in `year`, split by stage. */
export function censusAt(
  lines: ReadonlyMap<PersonId, Lifeline>,
  year: number | null,
): Readonly<Record<LifeStage, number>> {
  const census: Record<LifeStage, number> = { unborn: 0, alive: 0, deceased: 0 };
  for (const line of lines.values()) census[lifeStageAt(line, year)] += 1;
  return census;
}
