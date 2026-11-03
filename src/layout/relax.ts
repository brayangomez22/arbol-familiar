import type { LayoutConfig } from '@/config/constants';
import type { PersonId } from '@/domain/types';
import { branchIdOf, chordAngle, clamp, type GrownBranch } from './branchShape';
import type { FamilyTree } from './familyTree';
import { closeFruitPairs } from './fruits';
import type { FruitPlacement, Vec3 } from './types';
import { sub } from './vec';

export interface MutableAdjustments {
  readonly angle: Map<PersonId, number>;
  readonly stretch: Map<PersonId, number>;
}

/**
 * One relaxation pass: for every pair of fruits that are too close, rotate apart the two sibling
 * branches whose subtrees hold them (children of their lowest common ancestor), and stretch them a
 * little so a full fan gains room along its arc. If one fruit belongs to that ancestor itself, only
 * the other side moves. Fruits are never moved by hand, so branches always end at their fruits.
 *
 * Mutates `adjustments` and returns how many pairs are still under `fruit.minDistance`. Pairs
 * between that and the slightly larger target are pushed too, but do not keep the loop going.
 */
export function relaxStep(
  tree: FamilyTree,
  branches: readonly GrownBranch[],
  fruits: readonly FruitPlacement[],
  adjustments: MutableAdjustments,
  config: LayoutConfig,
): number {
  const target = config.fruit.minDistance * config.relax.margin;
  const pairs = closeFruitPairs(fruits, target);
  if (pairs.length === 0) return 0;
  const tooClose = pairs.filter(({ distance }) => distance < config.fruit.minDistance).length;

  const branchById = new Map(branches.map((branch) => [branch.id, branch]));
  const anchorOf = (fruit: FruitPlacement): PersonId => {
    const node = branchById.get(fruit.anchorBranchId)?.node;
    if (!node) throw new Error(`Fruit "${fruit.personId}" is not anchored to a person's branch`);
    return node.personId;
  };
  const branchOf = (personId: PersonId): GrownBranch => {
    const branch = branchById.get(branchIdOf(personId));
    if (!branch) throw new Error(`Missing branch for "${personId}"`);
    return branch;
  };
  const angleOf = (personId: PersonId): number => chordAngle(branchOf(personId).points);

  const turns = new Map<PersonId, number>();
  const stretches = new Map<PersonId, number>();
  const push = (personId: PersonId, moving: Vec3, direction: number, amount: number): void => {
    const arm = sub(moving, branchOf(personId).points[0] ?? moving);
    const armLength = Math.max(Math.hypot(arm.x, arm.y), 1e-3);
    turns.set(personId, (turns.get(personId) ?? 0) + (direction * amount) / armLength);
    stretches.set(personId, (stretches.get(personId) ?? 0) + amount / armLength);
  };

  for (const { a, b, distance } of pairs) {
    const anchorA = anchorOf(a);
    const anchorB = anchorOf(b);
    const [sideA, sideB] = divergingAncestors(tree, anchorA, anchorB);
    // A side without its own sibling branch is the common ancestor's fruit, on its leader.
    const angleA = angleOf(sideA ?? anchorA);
    const angleB = angleOf(sideB ?? anchorB);
    // Siblings are pushed apart in the order they already have in the fan, never across each
    // other: following the fruits instead makes interleaved grafts swing back and forth.
    const directionA = angleA < angleB || (angleA === angleB && anchorA < anchorB) ? -1 : 1;
    const amount = (sideA && sideB ? 0.5 : 1) * config.relax.step * (target - distance);
    if (sideA) push(sideA, a.position, directionA, amount);
    if (sideB) push(sideB, b.position, -directionA, amount);
  }

  const { maxStepAngle, stretchRate, maxStretch } = config.relax;
  for (const [personId, turn] of turns) {
    const angle = (adjustments.angle.get(personId) ?? 0) + clamp(turn, -maxStepAngle, maxStepAngle);
    adjustments.angle.set(personId, angle);
  }
  for (const [personId, stretch] of stretches) {
    const total = (adjustments.stretch.get(personId) ?? 0) + stretch * stretchRate;
    adjustments.stretch.set(personId, Math.min(total, maxStretch));
  }
  return tooClose;
}

/**
 * The two children of the lowest common ancestor on the way to `a` and to `b`. One side is
 * undefined when that person is the common ancestor. The trunk acts as the shared root.
 */
function divergingAncestors(
  tree: FamilyTree,
  a: PersonId,
  b: PersonId,
): [PersonId | undefined, PersonId | undefined] {
  const pathA = pathFromTrunk(tree, a);
  const pathB = pathFromTrunk(tree, b);
  let depth = 0;
  while (depth < pathA.length && depth < pathB.length && pathA[depth] === pathB[depth]) depth++;
  return [pathA[depth], pathB[depth]];
}

function pathFromTrunk(tree: FamilyTree, personId: PersonId): PersonId[] {
  const path: PersonId[] = [];
  let current: PersonId | null | undefined = personId;
  while (current) {
    path.push(current);
    current = tree.parentOf.get(current);
  }
  return path.reverse();
}
