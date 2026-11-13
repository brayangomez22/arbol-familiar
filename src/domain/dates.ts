import type { PartialDate, Person } from './types';

const PARTIAL_DATE_PATTERN = /^(\d{4})(?:-(\d{2})(?:-(\d{2}))?)?$/;
const FEBRUARY = 2;
const LEAP_DAY = 29;

export function isLeapYear(year: number): boolean {
  return (year % 4 === 0 && year % 100 !== 0) || year % 400 === 0;
}

export function daysInMonth(year: number, month: number): number {
  // Day 0 of the next month is the last day of this one.
  return new Date(Date.UTC(year, month, 0)).getUTCDate();
}

/** Parses "YYYY", "YYYY-MM" or "YYYY-MM-DD". Returns null if the text or the calendar date is invalid. */
export function parsePartialDate(text: string): PartialDate | null {
  const match = PARTIAL_DATE_PATTERN.exec(text);
  if (!match) return null;
  const [, yearText, monthText, dayText] = match;
  const year = Number(yearText);
  if (monthText === undefined) return { year };

  const month = Number(monthText);
  if (month < 1 || month > 12) return null;
  if (dayText === undefined) return { year, month };

  const day = Number(dayText);
  if (day < 1 || day > daysInMonth(year, month)) return null;
  return { year, month, day };
}

export function formatPartialDate(date: PartialDate): string {
  const pad = (value: number) => String(value).padStart(2, '0');
  let text = String(date.year).padStart(4, '0');
  if (date.month !== undefined) text += `-${pad(date.month)}`;
  if (date.month !== undefined && date.day !== undefined) text += `-${pad(date.day)}`;
  return text;
}

export function isCompleteDate(date: PartialDate): boolean {
  return date.month !== undefined && date.day !== undefined;
}

/** Uses local time, because birthdays and "today" are experienced in the visitor's timezone. */
export function partialDateFromDate(date: Date): PartialDate {
  return { year: date.getFullYear(), month: date.getMonth() + 1, day: date.getDate() };
}

/**
 * Compares only the precision both dates share: "1990" vs "1990-05-02" is 0 (cannot tell),
 * "1990-04" vs "1990-05-02" is negative.
 */
export function comparePartialDates(a: PartialDate, b: PartialDate): number {
  if (a.year !== b.year) return a.year - b.year;
  if (a.month === undefined || b.month === undefined) return 0;
  if (a.month !== b.month) return a.month - b.month;
  if (a.day === undefined || b.day === undefined) return 0;
  return a.day - b.day;
}

/**
 * Completed years between two dates. When month or day are unknown it assumes the
 * anniversary has already passed, so the result may be one year too high, never too low.
 */
export function yearsBetween(from: PartialDate, to: PartialDate): number {
  const years = to.year - from.year;
  if (from.month === undefined || to.month === undefined) return years;
  if (to.month !== from.month) return to.month < from.month ? years - 1 : years;
  if (from.day === undefined || to.day === undefined) return years;
  return to.day < from.day ? years - 1 : years;
}

export function isDeceased(person: Person): boolean {
  return person.death !== undefined;
}

/** Age today for living people, age at death for deceased ones; null if it cannot be known. */
export function ageOf(person: Person, today: Date): number | null {
  const birth = person.birth?.date;
  if (!birth) return null;
  if (person.death) {
    const death = person.death.date;
    return death ? yearsBetween(birth, death) : null;
  }
  return yearsBetween(birth, partialDateFromDate(today));
}

/** People born on Feb 29 celebrate on Feb 28 in non-leap years. Requires a complete birth date. */
export function isBirthday(birth: PartialDate, today: Date): boolean {
  if (!isCompleteDate(birth)) return false;
  const { year, month, day } = partialDateFromDate(today);
  if (birth.month === month && birth.day === day) return true;
  return (
    birth.month === FEBRUARY &&
    birth.day === LEAP_DAY &&
    !isLeapYear(year) &&
    month === FEBRUARY &&
    day === LEAP_DAY - 1
  );
}

/** Unknown birth counts as "already born"; unknown death year counts as "still alive". */
export function isAliveAt(person: Person, year: number): boolean {
  const birthYear = person.birth?.date?.year;
  if (birthYear !== undefined && year < birthYear) return false;
  const deathYear = person.death?.date?.year;
  return deathYear === undefined || year <= deathYear;
}

export interface Lifespan {
  /** Completed years: today for living people, at death for deceased ones. */
  readonly years: number;
  /** False when a missing month or day means it could be one year less. */
  readonly exact: boolean;
}

export function lifespanOf(person: Person, today: Date): Lifespan | null {
  const birth = person.birth?.date;
  const end = person.death ? person.death.date : partialDateFromDate(today);
  if (!birth || !end) return null;
  return { years: yearsBetween(birth, end), exact: isAnniversaryKnown(birth, end) };
}

/** Whether we can tell if the anniversary of `from` had already come by `to` that year. */
function isAnniversaryKnown(from: PartialDate, to: PartialDate): boolean {
  if (from.month === undefined || to.month === undefined) return false;
  if (from.month !== to.month) return true;
  return from.day !== undefined && to.day !== undefined;
}
