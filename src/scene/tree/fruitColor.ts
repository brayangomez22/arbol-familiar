import type { Palette } from '@/config/theme';
import type { PersonId } from '@/domain/types';
import { hashString } from '@/layout/random';

/** Each person keeps the same fruit color across visits: picked from the theme by a hash of the id. */
export function fruitColorIndex(personId: PersonId, palette: Palette): number {
  return hashString(`${personId}\u0000fruit-color`) % palette.fruits.length;
}
