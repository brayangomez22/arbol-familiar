import type { Family, Person, PersonId, Union, UnionId } from './types';

/**
 * Precomputed reverse lookups over a validated family. Every query below assumes the
 * family passed the integrity rules in docs/datos.md (no cycles, no dangling references).
 */
export interface FamilyIndex {
  readonly family: Family;
  readonly parentUnionByChild: ReadonlyMap<PersonId, UnionId>;
  readonly unionsByPartner: ReadonlyMap<PersonId, readonly UnionId[]>;
}

export function indexFamily(family: Family): FamilyIndex {
  const parentUnionByChild = new Map<PersonId, UnionId>();
  const unionsByPartner = new Map<PersonId, UnionId[]>();

  for (const union of family.unions.values()) {
    for (const childId of union.children) parentUnionByChild.set(childId, union.id);
    for (const partnerId of union.partners) {
      const unions = unionsByPartner.get(partnerId) ?? [];
      unions.push(union.id);
      unionsByPartner.set(partnerId, unions);
    }
  }

  return { family, parentUnionByChild, unionsByPartner };
}

export function getPerson(index: FamilyIndex, id: PersonId): Person {
  const person = index.family.people.get(id);
  if (!person) throw new Error(`Unknown person "${id}"`);
  return person;
}

export function getUnion(index: FamilyIndex, id: UnionId): Union {
  const union = index.family.unions.get(id);
  if (!union) throw new Error(`Unknown union "${id}"`);
  return union;
}

export function rootUnion(index: FamilyIndex): Union {
  return getUnion(index, index.family.meta.rootUnionId);
}

export function parentUnionOf(index: FamilyIndex, id: PersonId): Union | undefined {
  const unionId = index.parentUnionByChild.get(id);
  return unionId === undefined ? undefined : getUnion(index, unionId);
}

export function parentsOf(index: FamilyIndex, id: PersonId): readonly PersonId[] {
  return parentUnionOf(index, id)?.partners ?? [];
}

/** Unions where the person is a partner, in file order. */
export function unionsOf(index: FamilyIndex, id: PersonId): readonly Union[] {
  return (index.unionsByPartner.get(id) ?? []).map((unionId) => getUnion(index, unionId));
}

export function partnersOf(index: FamilyIndex, id: PersonId): readonly PersonId[] {
  return unionsOf(index, id).flatMap((union) =>
    union.partners.filter((partnerId) => partnerId !== id),
  );
}

/** Children from every union of the person, union by union, each in birth order. */
export function childrenOf(index: FamilyIndex, id: PersonId): readonly PersonId[] {
  return unionsOf(index, id).flatMap((union) => union.children);
}

/** Nearest generation first (parents, then grandparents…). */
export function ancestors(index: FamilyIndex, id: PersonId): readonly PersonId[] {
  return breadthFirst(index, id, (personId) => parentsOf(index, personId));
}

/** Nearest generation first. Partners of descendants (grafts) are not included. */
export function descendants(index: FamilyIndex, id: PersonId): readonly PersonId[] {
  return breadthFirst(index, id, (personId) => childrenOf(index, personId));
}

/** Blood members have their own branch: they are a child of some union or a partner of the root union. */
export function isBlood(index: FamilyIndex, id: PersonId): boolean {
  return index.parentUnionByChild.has(id) || rootUnion(index).partners.includes(id);
}

/** A graft joined the family as someone's partner and hangs next to them instead of having a branch. */
export function isGraft(index: FamilyIndex, id: PersonId): boolean {
  return !isBlood(index, id);
}

/** The blood partner a graft hangs from. Undefined for blood members. */
export function bloodPartnerOf(index: FamilyIndex, id: PersonId): PersonId | undefined {
  if (isBlood(index, id)) return undefined;
  return partnersOf(index, id).find((partnerId) => isBlood(index, partnerId));
}

/** Root partners are generation 0; grafts share their blood partner's generation. */
export function generationOf(index: FamilyIndex, id: PersonId): number {
  const anchorId = branchAnchorOf(index, id);
  if (anchorId !== id) return generationOf(index, anchorId);

  const parentUnion = parentUnionOf(index, id);
  if (!parentUnion) return 0;
  const parentAnchor = unionAnchorOf(index, parentUnion);
  return parentAnchor === undefined ? 0 : generationOf(index, parentAnchor) + 1;
}

/**
 * Chain of people from the trunk to the given person, following blood lines. A graft's path is
 * their blood partner's path plus themselves. Used to light up the lineage when selecting someone.
 */
export function lineagePath(index: FamilyIndex, id: PersonId): readonly PersonId[] {
  const anchorId = branchAnchorOf(index, id);
  if (anchorId !== id) return [...lineagePath(index, anchorId), id];

  const path: PersonId[] = [id];
  let current = parentUnionOf(index, id);
  while (current) {
    const parentAnchor = unionAnchorOf(index, current);
    if (parentAnchor === undefined) break;
    path.push(parentAnchor);
    current = parentUnionOf(index, parentAnchor);
  }
  return path.reverse();
}

function branchAnchorOf(index: FamilyIndex, id: PersonId): PersonId {
  return bloodPartnerOf(index, id) ?? id;
}

/** The partner whose branch a union grows from: its first blood partner. */
export function unionAnchorOf(index: FamilyIndex, union: Union): PersonId | undefined {
  return union.partners.find((partnerId) => isBlood(index, partnerId));
}

function breadthFirst(
  index: FamilyIndex,
  startId: PersonId,
  next: (id: PersonId) => readonly PersonId[],
): readonly PersonId[] {
  getPerson(index, startId);
  const visited = new Set<PersonId>([startId]);
  const result: PersonId[] = [];
  let frontier: readonly PersonId[] = [startId];

  while (frontier.length > 0) {
    const nextFrontier: PersonId[] = [];
    for (const id of frontier) {
      for (const relativeId of next(id)) {
        if (visited.has(relativeId)) continue;
        visited.add(relativeId);
        result.push(relativeId);
        nextFrontier.push(relativeId);
      }
    }
    frontier = nextFrontier;
  }
  return result;
}
