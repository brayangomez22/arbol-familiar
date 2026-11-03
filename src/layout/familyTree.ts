import {
  bloodPartnerOf,
  indexFamily,
  isGraft,
  partnersOf,
  rootUnion,
  unionAnchorOf,
  unionsOf,
  type FamilyIndex,
} from '@/domain/genealogy';
import type { Family, PersonId, UnionId } from '@/domain/types';

/** A blood member: one branch with their fruit at the tip and their children sprouting from it. */
export interface TreeNode {
  readonly personId: PersonId;
  readonly generation: number;
  /** Union by union in file order, each in birth order. */
  readonly children: readonly TreeNode[];
  /** Partners who hang next to this person's fruit, in union order. */
  readonly grafts: readonly PersonId[];
  /** Fruits in this subtree: the person, their grafts and every descendant with theirs. */
  readonly fruitCount: number;
}

export interface FamilyTree {
  readonly rootUnionId: UnionId;
  /** The root couple: they hang from twigs on the upper trunk. */
  readonly rootPartners: readonly TreeNode[];
  /** Children of the root union: the main limbs forking from the top of the trunk. */
  readonly limbs: readonly TreeNode[];
  /** Parent node of each blood member. Null for the root couple and the limbs (they grow from the trunk). */
  readonly parentOf: ReadonlyMap<PersonId, PersonId | null>;
}

export function buildFamilyTree(family: Family): FamilyTree {
  const index = indexFamily(family);
  const root = rootUnion(index);
  const parentOf = new Map<PersonId, PersonId | null>();

  const buildNode = (
    personId: PersonId,
    generation: number,
    parentId: PersonId | null,
  ): TreeNode => {
    if (parentOf.has(personId)) throw new Error(`"${personId}" appears twice in the blood tree`);
    parentOf.set(personId, parentId);

    const children = unionsOf(index, personId)
      .filter((union) => union.id !== root.id && unionAnchorOf(index, union) === personId)
      .flatMap((union) => union.children)
      .map((childId) => buildNode(childId, generation + 1, personId));
    const grafts = graftsOf(index, personId);
    const fruitCount =
      1 + grafts.length + children.reduce((sum, child) => sum + child.fruitCount, 0);
    return { personId, generation, children, grafts, fruitCount };
  };

  const rootPartners = root.partners.map((id) => buildNode(id, 0, null));
  const limbs = root.children.map((id) => buildNode(id, 1, null));
  return { rootUnionId: root.id, rootPartners, limbs, parentOf };
}

export function walkTree(tree: FamilyTree, visit: (node: TreeNode) => void): void {
  const walk = (node: TreeNode): void => {
    visit(node);
    node.children.forEach(walk);
  };
  tree.rootPartners.forEach(walk);
  tree.limbs.forEach(walk);
}

function graftsOf(index: FamilyIndex, personId: PersonId): PersonId[] {
  const grafts = partnersOf(index, personId).filter(
    (partnerId) => isGraft(index, partnerId) && bloodPartnerOf(index, partnerId) === personId,
  );
  return [...new Set(grafts)];
}
