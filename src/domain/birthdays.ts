import { comparePartialDates, isBirthday, isDeceased } from './dates';
import type { Family, Person } from './types';

/**
 * Living people whose birthday is today (local time), oldest first. Only complete birth dates
 * count; someone born on Feb 29 celebrates on Feb 28 in common years.
 */
export function birthdaysOn(family: Family, today: Date): readonly Person[] {
  return [...family.people.values()]
    .filter((person) => {
      const birth = person.birth?.date;
      return birth !== undefined && !isDeceased(person) && isBirthday(birth, today);
    })
    .sort((a, b) => {
      const birthA = a.birth?.date;
      const birthB = b.birth?.date;
      return birthA && birthB ? comparePartialDates(birthA, birthB) : 0;
    });
}
