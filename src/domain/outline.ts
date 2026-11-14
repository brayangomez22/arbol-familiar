import { getUnion, rootUnion, unionsOf, type FamilyIndex } from './genealogy';
import type { PersonId, UnionId } from './types';

/** A couple (or a parent alone) and their children, each with their own couples below. */
export interface OutlineUnion {
  readonly id: UnionId;
  readonly partners: readonly PersonId[];
  readonly children: readonly OutlinePerson[];
}

/** Someone born into the family, with every couple they formed, in file order. */
export interface OutlinePerson {
  readonly id: PersonId;
  readonly unions: readonly OutlineUnion[];
}

/**
 * The family as nested lists, the way the tree reads from the trunk up: the root couple, their
 * children in birth order and, under each child, their couples and children. Partners who married
 * in (grafts) appear inside their couple, never as a branch of their own.
 */
export function familyOutline(index: FamilyIndex): OutlineUnion {
  return outlineUnion(index, rootUnion(index).id);
}

function outlineUnion(index: FamilyIndex, unionId: UnionId): OutlineUnion {
  const union = getUnion(index, unionId);
  return {
    id: union.id,
    partners: union.partners,
    children: union.children.map((childId) => ({
      id: childId,
      unions: unionsOf(index, childId).map((childUnion) => outlineUnion(index, childUnion.id)),
    })),
  };
}
