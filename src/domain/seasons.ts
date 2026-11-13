export const SEASONS = ['spring', 'summer', 'autumn', 'winter'] as const;
export type Season = (typeof SEASONS)[number];

/**
 * Meteorological seasons of the northern hemisphere. Colombia has none to speak of: this is an
 * aesthetic choice, so the tree changes through the year as the illustrations it draws from do.
 */
export function seasonOfMonth(month: number): Season {
  if (month >= 3 && month <= 5) return 'spring';
  if (month >= 6 && month <= 8) return 'summer';
  if (month >= 9 && month <= 11) return 'autumn';
  return 'winter';
}

/** Uses local time, like everything a visitor experiences as "today". */
export function seasonOf(date: Date): Season {
  return seasonOfMonth(date.getMonth() + 1);
}

const SEASON_NAMES: Readonly<Record<string, Season>> = {
  spring: 'spring',
  primavera: 'spring',
  summer: 'summer',
  verano: 'summer',
  autumn: 'autumn',
  fall: 'autumn',
  otono: 'autumn',
  winter: 'winter',
  invierno: 'winter',
};

/** For `?season=`: English or Spanish, any case, with or without accents. Null if unknown. */
export function parseSeason(text: string | null): Season | null {
  if (text === null) return null;
  return SEASON_NAMES[foldName(text)] ?? null;
}

/** Lowercase without accents ("Otoño" ⇒ "otono"). */
export function foldName(text: string): string {
  return text
    .trim()
    .toLowerCase()
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '');
}
