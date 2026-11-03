import type { LayoutConfig } from '@/config/constants';
import type { PersonId } from '@/domain/types';
import { pointOnCurve } from './curve';
import type { FamilyTree, TreeNode } from './familyTree';
import { createRandom } from './random';
import type { BranchRadius, TreeRadii } from './thickness';
import type { Vec3 } from './types';
import { add, angleXY, directionXY, lerp, normalize, scale, sub, vec3 } from './vec';

export const TRUNK_ID = 'trunk';

export function branchIdOf(personId: PersonId): string {
  return `branch-${personId}`;
}

/** A trunk or blood branch before growth order is assigned. `node` is null only for the trunk. */
export interface GrownBranch {
  readonly id: string;
  readonly kind: 'trunk' | 'branch';
  readonly parentBranchId: string | null;
  readonly parentT: number;
  readonly points: readonly Vec3[];
  readonly radius: BranchRadius;
  readonly generation: number;
  readonly node: TreeNode | null;
}

/** Corrections per blood member found by the relaxation pass. */
export interface BranchAdjustments {
  /** Extra rotation, in radians. */
  readonly angle: ReadonlyMap<PersonId, number>;
  /** Extra length, as a fraction of the natural one. */
  readonly stretch: ReadonlyMap<PersonId, number>;
}

const MAX_CONTROL_POINTS = 5;

/**
 * The seeded variation of one branch, each value in [-1, 1). Drawn once per person and reused,
 * because relaxation regrows the tree many times with the same family.
 */
interface BranchTraits {
  readonly angle: number;
  readonly fork: number;
  readonly length: number;
  readonly tilt: number;
  readonly side: number;
  readonly wobble: readonly number[];
}

const traitsCache = new WeakMap<TreeNode, BranchTraits>();

function traitsOf(node: TreeNode): BranchTraits {
  const cached = traitsCache.get(node);
  if (cached) return cached;
  const rng = createRandom(node.personId, 'branch');
  const traits: BranchTraits = {
    angle: rng.signed(),
    fork: rng.signed(),
    length: rng.signed(),
    tilt: rng.signed(),
    side: rng.signed(),
    wobble: Array.from({ length: MAX_CONTROL_POINTS }, () => rng.signed()),
  };
  traitsCache.set(node, traits);
  return traits;
}

/**
 * Grows the whole tree from the ground up. Parents always come before their children in the result.
 * Each branch draws its variation from its own person's seed, so changing one id only nudges the
 * branches hanging from that person.
 */
export function growTree(
  tree: FamilyTree,
  radii: TreeRadii,
  config: LayoutConfig,
  adjustments: BranchAdjustments,
): GrownBranch[] {
  const branches: GrownBranch[] = [];
  const { branch: branchConfig } = config;

  const grow = (
    node: TreeNode,
    parent: GrownBranch,
    parentT: number,
    angle: number,
    naturalLength: number,
  ): void => {
    const traits = traitsOf(node);
    const length = naturalLength * (1 + (adjustments.stretch.get(node.personId) ?? 0));
    const base = pointOnCurve(parent.points, parentT);
    const tip = add(
      base,
      vec3(
        Math.sin(angle) * length,
        Math.cos(angle) * length,
        traits.tilt * branchConfig.depthTilt * length,
      ),
    );
    const branch: GrownBranch = {
      id: branchIdOf(node.personId),
      kind: 'branch',
      parentBranchId: parent.id,
      parentT,
      points: shapeBranch(base, tip, angle, length, branchConfig, traits.wobble),
      radius: radiusOf(radii, node.personId),
      generation: node.generation,
      node,
    };
    branches.push(branch);
    sprout(branch, node.children, node, branchConfig.forkStart, branchConfig.forkEnd);
  };

  /** Fans the children out over the parent, heavier subtrees taking wider slots. */
  const sprout = (
    parent: GrownBranch,
    children: readonly TreeNode[],
    leader: TreeNode | null,
    forkStart: number,
    forkEnd: number,
  ): void => {
    const firstChild = children[0];
    if (firstChild === undefined) return;

    const generation = firstChild.generation;
    const fan = Math.max(
      branchConfig.minFan,
      branchConfig.fan * Math.pow(branchConfig.fanDecay, generation - 1),
    );
    const weightOf = (node: TreeNode): number =>
      Math.pow(node.fruitCount, branchConfig.fruitWeightExponent);
    const leaderWeight = leader
      ? Math.pow(1 + leader.grafts.length, branchConfig.fruitWeightExponent)
      : null;
    const parentAngle = chordAngle(parent.points);
    // A leaning branch sends most of its children up its upper side, toward the light. Leaning
    // right, the upper side is the left one.
    const leftShare = 0.5 + branchConfig.upperSideBias * Math.sin(parentAngle);
    const offsets = fanOffsets(children.map(weightOf), leaderWeight, fan, leftShare);
    const sproutRanks = rankByMagnitudeDescending(offsets);
    const spacing = (forkEnd - forkStart) / children.length;
    // Long enough that neighbouring slots end at least a fruit spacing apart along the arc.
    const slotCount = children.length + (leader ? 1 : 0);
    const crowdedLength = (config.fruit.minDistance * slotCount) / fan;

    children.forEach((child, i) => {
      const traits = traitsOf(child);
      const offset = offsets[i] ?? 0;
      const angle = softLimitAngle(
        parentAngle +
          offset +
          traits.angle * branchConfig.angleJitter +
          (adjustments.angle.get(child.personId) ?? 0),
        branchConfig.softAngle,
        branchConfig.maxAngle,
      );
      // The outermost children sprout lowest, like the skirt of a real crown.
      const rank = sproutRanks[i] ?? 0;
      const parentT = clamp(
        forkStart + spacing * (rank + 0.5) + traits.fork * branchConfig.forkJitter * spacing,
        0,
        1,
      );
      grow(child, parent, parentT, angle, branchLength(child, crowdedLength, branchConfig));
    });
  };

  const trunk = growTrunk(tree.rootUnionId, radii.trunk, config.trunk);
  branches.push(trunk);

  const { rootCouple } = config;
  tree.rootPartners.forEach((node, i) => {
    const traits = traitsOf(node);
    const side =
      tree.rootPartners.length === 1 ? Math.sign(traits.side) || 1 : i % 2 === 0 ? -1 : 1;
    const angle =
      side * rootCouple.angle +
      traits.angle * rootCouple.angleJitter +
      (adjustments.angle.get(node.personId) ?? 0);
    grow(node, trunk, rootCouple.attachT, angle, rootCouple.length);
  });

  sprout(trunk, tree.limbs, null, config.trunk.forkStart, 1);
  return branches;
}

/**
 * Angular offset of each child from the parent's own continuation (the leader, which carries the
 * parent's fruit). The fan is split into slots proportional to weight; the leader takes the slot
 * that best balances both sides. With no leader (the trunk), offsets are measured from the fan center.
 */
export function fanOffsets(
  weights: readonly number[],
  leaderWeight: number | null,
  fan: number,
  leftShare = 0.5,
): number[] {
  const slots = [...weights];
  let leaderSlot = -1;
  if (leaderWeight !== null) {
    leaderSlot = balancedInsertIndex(weights, leftShare);
    slots.splice(leaderSlot, 0, leaderWeight);
  }

  const total = slots.reduce((sum, w) => sum + w, 0);
  let cumulative = 0;
  const centers = slots.map((w) => {
    const center = -fan / 2 + (fan * (cumulative + w / 2)) / total;
    cumulative += w;
    return center;
  });

  const reference = leaderSlot >= 0 ? (centers[leaderSlot] ?? 0) : 0;
  return centers.filter((_, i) => i !== leaderSlot).map((center) => center - reference);
}

/** Where to insert the leader so that about `leftShare` of the children's weight ends up on its left. */
function balancedInsertIndex(weights: readonly number[], leftShare: number): number {
  const total = weights.reduce((sum, w) => sum + w, 0);
  const middle = weights.length / 2;
  let best = 0;
  let bestScore = Infinity;
  let left = 0;
  for (let i = 0; i <= weights.length; i++) {
    // Ties go to the most central slot so the leader keeps growing straight.
    const score = Math.abs(left - leftShare * total) + Math.abs(i - middle) * 1e-6;
    if (score < bestScore) {
      bestScore = score;
      best = i;
    }
    left += weights[i] ?? 0;
  }
  return best;
}

function rankByMagnitudeDescending(values: readonly number[]): number[] {
  const order = values
    .map((value, i) => ({ magnitude: Math.abs(value), i }))
    .sort((a, b) => b.magnitude - a.magnitude || a.i - b.i);
  const ranks = new Array<number>(values.length);
  order.forEach(({ i }, rank) => {
    ranks[i] = rank;
  });
  return ranks;
}

function branchLength(
  node: TreeNode,
  crowdedLength: number,
  config: LayoutConfig['branch'],
): number {
  const byGeneration = Math.max(
    config.minLength,
    crowdedLength,
    config.baseLength * Math.pow(config.lengthDecay, node.generation - 1),
  );
  const byFamily = 1 + config.lengthPerFruitDoubling * Math.log2(node.fruitCount);
  return byGeneration * byFamily * (1 + traitsOf(node).length * config.lengthJitter);
}

/**
 * Control points from base to tip. Sideways branches arch upward (they leave flatter and turn
 * toward the light) and every interior point gets a little perpendicular wobble.
 */
function shapeBranch(
  base: Vec3,
  tip: Vec3,
  angle: number,
  length: number,
  config: LayoutConfig['branch'],
  wobble: readonly number[],
): Vec3[] {
  const count = clamp(1 + Math.ceil(length / config.pointSpacing), 3, MAX_CONTROL_POINTS);
  // Clockwise perpendicular: for a branch leaning right it points right and down.
  const perpendicular = vec3(Math.cos(angle), -Math.sin(angle), 0);
  const arch = Math.sin(angle) * Math.min(config.bend * length, config.maxArch);

  return Array.from({ length: count }, (_, i) => {
    const s = i / (count - 1);
    const onChord = lerp(base, tip, s);
    if (i === 0 || i === count - 1) return onChord;
    const bulge = Math.sin(Math.PI * s);
    const sideways = (wobble[i] ?? 0) * config.curveNoise * length;
    return add(onChord, scale(perpendicular, (arch + sideways) * bulge));
  });
}

function growTrunk(
  rootUnionId: string,
  radius: BranchRadius,
  config: LayoutConfig['trunk'],
): GrownBranch {
  const rng = createRandom(rootUnionId, 'trunk');
  const lean = rng.signed() * config.lean * config.height;
  const sway = rng.signed() * config.sway * config.height;
  const points = Array.from({ length: config.controlPoints }, (_, i) => {
    const s = i / (config.controlPoints - 1);
    return vec3(lean * s * s + sway * Math.sin(Math.PI * s), config.height * s, 0);
  });
  return {
    id: TRUNK_ID,
    kind: 'trunk',
    parentBranchId: null,
    parentT: 0,
    points,
    radius,
    generation: 0,
    node: null,
  };
}

function radiusOf(radii: TreeRadii, personId: PersonId): BranchRadius {
  const radius = radii.byPerson.get(personId);
  if (!radius) throw new Error(`Missing radius for "${personId}"`);
  return radius;
}

export function last<T>(items: readonly T[]): T {
  const item = items[items.length - 1];
  if (item === undefined) throw new Error('Expected a non-empty list');
  return item;
}

/**
 * Leaves angles up to `soft` untouched and eases the rest toward `max` without ever reaching it.
 * Unlike a clamp it keeps the order of branches, so relaxation can still push them apart.
 */
export function softLimitAngle(angle: number, soft: number, max: number): number {
  const magnitude = Math.abs(angle);
  if (magnitude <= soft) return angle;
  const room = max - soft;
  return Math.sign(angle) * (soft + room * Math.tanh((magnitude - soft) / room));
}

export function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}

/** Overall lean of a branch: the angle from the vertical of the line from its base to its tip. */
export function chordAngle(points: readonly Vec3[]): number {
  return angleXY(sub(last(points), points[0] ?? last(points)));
}

/** Unit direction the branch is heading at its tip, used to hang fruits and grafts. */
export function tipDirection(points: readonly Vec3[]): Vec3 {
  const tip = last(points);
  const before = points[points.length - 2] ?? tip;
  const direction = sub(tip, before);
  return direction.x === 0 && direction.y === 0 ? directionXY(0) : normalize(direction);
}
