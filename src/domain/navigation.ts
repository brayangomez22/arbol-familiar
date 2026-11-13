import {
  bloodPartnerOf,
  childrenOf,
  getPerson,
  parentUnionOf,
  partnersOf,
  unionAnchorOf,
} from './genealogy';
import type { FamilyIndex } from './genealogy';
import type { PersonId } from './types';

export type Direction = 'up' | 'down' | 'left' | 'right';

/** Where a person's fruit sits from left to right; only the order matters. */
export type HorizontalPosition = (id: PersonId) => number;

/**
 * The relative an arrow key moves to, as the tree is drawn: up to the parent whose branch this one
 * grows from, down to the child hanging closest below, and sideways along the fruits of the same
 * fork (siblings and the partners hanging next to them).
 */
export function relativeInDirection(
  index: FamilyIndex,
  id: PersonId,
  direction: Direction,
  xOf: HorizontalPosition,
): PersonId | undefined {
  getPerson(index, id);
  switch (direction) {
    case 'up':
      return parentFruitOf(index, id);
    case 'down':
      return closest(childrenOf(index, id), xOf(id), xOf);
    case 'left':
    case 'right': {
      const row = [...forkRowOf(index, id)].sort((a, b) => xOf(a) - xOf(b));
      const position = row.indexOf(id) + (direction === 'left' ? -1 : 1);
      return row[position];
    }
  }
}

/** A graft hangs from their partner, so "up" from a graft is that partner. */
function parentFruitOf(index: FamilyIndex, id: PersonId): PersonId | undefined {
  const bloodPartner = bloodPartnerOf(index, id);
  if (bloodPartner !== undefined) return bloodPartner;
  const parentUnion = parentUnionOf(index, id);
  return parentUnion && unionAnchorOf(index, parentUnion);
}

/**
 * The fruits that hang from the same fork: the person's siblings from the same union (or the root
 * couple, who have no parents) plus every partner without a branch of their own.
 */
function forkRowOf(index: FamilyIndex, id: PersonId): readonly PersonId[] {
  const anchor = bloodPartnerOf(index, id) ?? id;
  const blood = parentUnionOf(index, anchor)?.children ?? [anchor];
  const row = new Set<PersonId>(blood);
  for (const memberId of blood) {
    for (const partnerId of partnersOf(index, memberId)) {
      if (!index.parentUnionByChild.has(partnerId)) row.add(partnerId);
    }
  }
  return [...row];
}

function closest(
  ids: readonly PersonId[],
  x: number,
  xOf: HorizontalPosition,
): PersonId | undefined {
  let best: PersonId | undefined;
  let bestDistance = Infinity;
  for (const candidate of ids) {
    const distance = Math.abs(xOf(candidate) - x);
    if (distance < bestDistance) {
      best = candidate;
      bestDistance = distance;
    }
  }
  return best;
}
