import { describe, expect, it } from 'vitest';
import { parsePartialDate } from '@/domain/dates';
import type { PartialDate, Person } from '@/domain/types';
import {
  ageText,
  initials,
  lifeDatesText,
  photoCaption,
  placeText,
  spanishDate,
  yearsText,
} from '../personText';

function date(text: string): PartialDate {
  const parsed = parsePartialDate(text);
  if (!parsed) throw new Error(text);
  return parsed;
}

function person(birth?: string, death?: string | null): Person {
  return {
    id: 'ana-alvarez',
    firstName: 'Ana',
    lastName: 'Álvarez',
    photos: [],
    ...(birth !== undefined && { birth: { date: date(birth) } }),
    ...(death !== undefined && { death: death === null ? {} : { date: date(death) } }),
  };
}

const today = new Date(2026, 10, 12);

describe('spanishDate', () => {
  it('writes each precision in Spanish', () => {
    expect(spanishDate(date('1938-05-12'))).toBe('12 de mayo de 1938');
    expect(spanishDate(date('1941-09'))).toBe('septiembre de 1941');
    expect(spanishDate(date('1968'))).toBe('1968');
  });
});

describe('lifeDatesText', () => {
  it('says when a living person was born', () => {
    expect(lifeDatesText(person('2003-03-03'))).toBe('Nació el 3 de marzo de 2003');
    expect(lifeDatesText(person('1968'))).toBe('Nació en 1968');
    expect(lifeDatesText(person('1941-09'))).toBe('Nació en septiembre de 1941');
  });

  it('spans birth to death for those who died', () => {
    expect(lifeDatesText(person('1938-05-12', '2015'))).toBe('12 de mayo de 1938 – 2015');
    expect(lifeDatesText(person(undefined, '2015'))).toBe('Falleció en 2015');
    expect(lifeDatesText(person('1938', null))).toBe('Nació en 1938');
  });

  it('is null when nothing is known', () => {
    expect(lifeDatesText(person())).toBeNull();
    expect(lifeDatesText(person(undefined, null))).toBeNull();
  });
});

describe('ageText', () => {
  it('gives the age of living people, approximate when unsure', () => {
    expect(ageText(person('2003-03-03'), today)).toBe('23 años');
    expect(ageText(person('1968'), today)).toBe('unos 58 años');
    expect(ageText(person('2025-11-01'), today)).toBe('1 año');
  });

  it('says how long deceased people lived', () => {
    expect(ageText(person('1938-05-12', '2015-06-01'), today)).toBe('Vivió 77 años');
    expect(ageText(person('1938-05-12', '2015'), today)).toBe('Vivió unos 77 años');
    expect(ageText(person('1938', null), today)).toBeNull();
  });
});

describe('short texts', () => {
  it('writes years for lists', () => {
    expect(yearsText(person('1938', '2015'))).toBe('1938 – 2015');
    expect(yearsText(person('1988'))).toBe('n. 1988');
    expect(yearsText(person('1938', null))).toBe('1938 – ?');
    expect(yearsText(person(undefined, '2015'))).toBe('† 2015');
    expect(yearsText(person())).toBeNull();
  });

  it('writes initials and places', () => {
    expect(initials(person())).toBe('AÁ');
    const place = { id: 'madrid', name: 'Madrid', country: 'España', lat: 0, lng: 0 };
    expect(placeText(place)).toBe('Madrid, España');
    expect(placeText({ ...place, name: 'Cali', region: 'Valle del Cauca' })).toBe(
      'Cali, Valle del Cauca',
    );
  });
});

describe('photoCaption', () => {
  it('adds the year unless the caption already has it', () => {
    expect(photoCaption('La boda', 1962)).toBe('La boda · 1962');
    expect(photoCaption('Finca, 1970', 1970)).toBe('Finca, 1970');
    expect(photoCaption(undefined, 1970)).toBe('1970');
    expect(photoCaption('Retrato', undefined)).toBe('Retrato');
    expect(photoCaption(undefined, undefined)).toBeNull();
  });
});
