import { lifespanOf } from '@/domain/dates';
import type { PartialDate, Person, Place } from '@/domain/types';

const MONTHS = [
  'enero',
  'febrero',
  'marzo',
  'abril',
  'mayo',
  'junio',
  'julio',
  'agosto',
  'septiembre',
  'octubre',
  'noviembre',
  'diciembre',
] as const;

export function fullName(person: Person): string {
  return `${person.firstName} ${person.lastName}`;
}

export function initials(person: Person): string {
  return `${person.firstName.charAt(0)}${person.lastName.charAt(0)}`.toUpperCase();
}

/** "12 de mayo de 1938", "septiembre de 1941" or "1968". */
export function spanishDate(date: PartialDate): string {
  const month = date.month === undefined ? undefined : MONTHS[date.month - 1];
  if (month === undefined) return String(date.year);
  if (date.day === undefined) return `${month} de ${date.year}`;
  return `${date.day} de ${month} de ${date.year}`;
}

/** "Nació el 12 de mayo de 1938", "Nació en 1968". */
function bornText(date: PartialDate): string {
  return `Nació ${date.day === undefined ? 'en' : 'el'} ${spanishDate(date)}`;
}

/**
 * The dates line of a person: when they were born, and for those who died, when they died.
 * Null when nothing is known.
 */
export function lifeDatesText(person: Person): string | null {
  const birth = person.birth?.date;
  const death = person.death?.date;
  if (!person.death) return birth ? bornText(birth) : null;
  if (birth && death) return `${spanishDate(birth)} – ${spanishDate(death)}`;
  if (birth) return bornText(birth);
  return death ? `Falleció ${death.day === undefined ? 'en' : 'el'} ${spanishDate(death)}` : null;
}

/** "23 años", "unos 58 años", "Vivió 77 años"; null when it cannot be known. */
export function ageText(person: Person, today: Date): string | null {
  const lifespan = lifespanOf(person, today);
  if (!lifespan) return null;
  const years = `${lifespan.exact ? '' : 'unos '}${lifespan.years} ${lifespan.years === 1 ? 'año' : 'años'}`;
  return person.death ? `Vivió ${years}` : years;
}

/** Short years for lists: "1938 – 2015", "n. 1988", "† 2015". */
export function yearsText(person: Person): string | null {
  const born = person.birth?.date?.year;
  const died = person.death?.date?.year;
  if (born !== undefined && died !== undefined) return `${born} – ${died}`;
  if (born !== undefined) return person.death ? `${born} – ?` : `n. ${born}`;
  return died === undefined ? null : `† ${died}`;
}

/** "Manizales, Caldas" or, without a region, "Madrid, España". */
export function placeText(place: Place): string {
  return `${place.name}, ${place.region ?? place.country}`;
}

/** Caption and year of a photo, without repeating a year the caption already says ("Finca, 1970"). */
export function photoCaption(caption: string | undefined, year: number | undefined): string | null {
  if (year === undefined || caption?.includes(String(year))) return caption ?? null;
  return caption === undefined ? String(year) : `${caption} · ${year}`;
}
