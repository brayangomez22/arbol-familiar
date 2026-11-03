import { describe, expect, it } from 'vitest';
import {
  ageOf,
  comparePartialDates,
  formatPartialDate,
  isAliveAt,
  isBirthday,
  parsePartialDate,
  yearsBetween,
} from '../dates';
import { date, person } from './fixtures';

describe('parsePartialDate', () => {
  it('parses year, year-month and full dates', () => {
    expect(parsePartialDate('1938')).toEqual({ year: 1938 });
    expect(parsePartialDate('1938-05')).toEqual({ year: 1938, month: 5 });
    expect(parsePartialDate('1938-05-12')).toEqual({ year: 1938, month: 5, day: 12 });
  });

  it.each(['38', '1938-5', '1938-13', '1938-00', '1938-02-30', '2023-02-29', '1938/05/12', ''])(
    'rejects "%s"',
    (text) => {
      expect(parsePartialDate(text)).toBeNull();
    },
  );

  it('accepts Feb 29 only in leap years', () => {
    expect(parsePartialDate('2024-02-29')).toEqual({ year: 2024, month: 2, day: 29 });
    expect(parsePartialDate('1900-02-29')).toBeNull();
    expect(parsePartialDate('2000-02-29')).not.toBeNull();
  });

  it('round-trips with formatPartialDate', () => {
    for (const text of ['0987', '1938', '1938-05', '1938-05-02']) {
      const parsed = parsePartialDate(text);
      expect(parsed && formatPartialDate(parsed)).toBe(text);
    }
  });
});

describe('comparePartialDates', () => {
  it('orders by year, month and day', () => {
    expect(comparePartialDates(date('1990'), date('1991'))).toBeLessThan(0);
    expect(comparePartialDates(date('1990-06'), date('1990-05'))).toBeGreaterThan(0);
    expect(comparePartialDates(date('1990-05-02'), date('1990-05-10'))).toBeLessThan(0);
  });

  it('only compares the precision both dates share', () => {
    expect(comparePartialDates(date('1990'), date('1990-05-02'))).toBe(0);
    expect(comparePartialDates(date('1990-05'), date('1990-05-31'))).toBe(0);
  });
});

describe('yearsBetween', () => {
  it('counts completed years with full dates', () => {
    expect(yearsBetween(date('1990-05-10'), date('2020-05-09'))).toBe(29);
    expect(yearsBetween(date('1990-05-10'), date('2020-05-10'))).toBe(30);
  });

  it('assumes the anniversary already passed when precision is missing', () => {
    expect(yearsBetween(date('1990'), date('2020-01-01'))).toBe(30);
    expect(yearsBetween(date('1990-05'), date('2020-05-01'))).toBe(30);
    expect(yearsBetween(date('1990-05'), date('2020-04-30'))).toBe(29);
  });
});

describe('ageOf', () => {
  const today = new Date(2026, 10, 3);

  it('returns current age for living people', () => {
    expect(ageOf(person('a', { birth: { date: date('1965-11-03') } }), today)).toBe(61);
    expect(ageOf(person('a', { birth: { date: date('1965-11-04') } }), today)).toBe(60);
  });

  it('returns age at death for deceased people', () => {
    const deceased = person('a', {
      birth: { date: date('1938-05-12') },
      death: { date: date('2015') },
    });
    expect(ageOf(deceased, today)).toBe(77);
  });

  it('returns null when it cannot be known', () => {
    expect(ageOf(person('a'), today)).toBeNull();
    expect(ageOf(person('a', { birth: { date: date('1938') }, death: {} }), today)).toBeNull();
  });
});

describe('isBirthday', () => {
  it('matches month and day in local time', () => {
    expect(isBirthday(date('1965-11-03'), new Date(2026, 10, 3, 23, 59))).toBe(true);
    expect(isBirthday(date('1965-11-03'), new Date(2026, 10, 4, 0, 0))).toBe(false);
  });

  it('never applies to partial dates', () => {
    expect(isBirthday(date('1965-11'), new Date(2026, 10, 3))).toBe(false);
    expect(isBirthday(date('1965'), new Date(2026, 0, 1))).toBe(false);
  });

  it('celebrates Feb 29 birthdays on Feb 28 in non-leap years', () => {
    const leapling = date('2000-02-29');
    expect(isBirthday(leapling, new Date(2026, 1, 28))).toBe(true);
    expect(isBirthday(leapling, new Date(2028, 1, 28))).toBe(false);
    expect(isBirthday(leapling, new Date(2028, 1, 29))).toBe(true);
  });
});

describe('isAliveAt', () => {
  const jose = person('jose', {
    birth: { date: date('1938-05-12') },
    death: { date: date('2015') },
  });

  it('is false before birth and after the death year', () => {
    expect(isAliveAt(jose, 1937)).toBe(false);
    expect(isAliveAt(jose, 1938)).toBe(true);
    expect(isAliveAt(jose, 2015)).toBe(true);
    expect(isAliveAt(jose, 2016)).toBe(false);
  });

  it('treats unknown dates permissively', () => {
    expect(isAliveAt(person('x'), 1800)).toBe(true);
    expect(isAliveAt(person('x', { death: {} }), 3000)).toBe(true);
  });
});
