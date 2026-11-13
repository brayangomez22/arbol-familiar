import { describe, expect, it } from 'vitest';
import { birthdaysOn } from '../birthdays';
import { date, family, person, union } from './fixtures';

function familyWith(...people: ReturnType<typeof person>[]) {
  return family(people, [union('u', [people[0]?.id ?? 'x'])], 'u');
}

describe('birthdaysOn', () => {
  const today = new Date(2026, 10, 13, 9, 0);

  it('lists living people born on this day, oldest first', () => {
    const result = birthdaysOn(
      familyWith(
        person('young', { birth: { date: date('2003-11-13') } }),
        person('old', { birth: { date: date('1950-11-13') } }),
        person('other', { birth: { date: date('1950-11-14') } }),
      ),
      today,
    );
    expect(result.map((p) => p.id)).toEqual(['old', 'young']);
  });

  it('skips partial birth dates', () => {
    const result = birthdaysOn(
      familyWith(
        person('month', { birth: { date: date('1990-11') } }),
        person('year', { birth: { date: date('1990') } }),
        person('none'),
      ),
      today,
    );
    expect(result).toEqual([]);
  });

  it('skips people who have died', () => {
    const result = birthdaysOn(
      familyWith(person('gone', { birth: { date: date('1938-11-13') }, death: {} })),
      today,
    );
    expect(result).toEqual([]);
  });

  it('celebrates Feb 29 birthdays on Feb 28 in common years and on Feb 29 in leap years', () => {
    const leapFamily = familyWith(person('leap', { birth: { date: date('2000-02-29') } }));
    expect(birthdaysOn(leapFamily, new Date(2027, 1, 28))).toHaveLength(1);
    expect(birthdaysOn(leapFamily, new Date(2027, 2, 1))).toHaveLength(0);
    expect(birthdaysOn(leapFamily, new Date(2028, 1, 28))).toHaveLength(0);
    expect(birthdaysOn(leapFamily, new Date(2028, 1, 29))).toHaveLength(1);
  });
});
