import type { PersonId } from '@/domain/types';
import { hashString } from '@/layout/random';

/** Each person keeps the same fruit color across visits: one of `count` slots, by a hash of the id. */
export function fruitColorIndex(personId: PersonId, count: number): number {
  return hashString(`${personId}\u0000fruit-color`) % count;
}
