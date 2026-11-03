import { LAYOUT, type LayoutConfig } from '@/config/constants';
import type { Family } from '@/domain/types';
import { growTree, type GrownBranch } from './branchShape';
import { computeBounds } from './bounds';
import { pointOnCurve } from './curve';
import { buildFamilyTree, type FamilyTree } from './familyTree';
import { placeFruits } from './fruits';
import { placeLeafClusters } from './leaves';
import { relaxStep, type MutableAdjustments } from './relax';
import { growRoots } from './roots';
import { computeRadii, type TreeRadii } from './thickness';
import type { BranchSegment, TreeLayout } from './types';
import { add, sub } from './vec';

/**
 * Turns a validated family into the shape of its tree. Pure and deterministic: the same family and
 * config always produce exactly the same layout.
 */
export function buildTreeLayout(family: Family, baseConfig: LayoutConfig = LAYOUT): TreeLayout {
  const tree = buildFamilyTree(family);
  const config = scaledToFamily(baseConfig, totalFruits(tree));
  const radii = computeRadii(tree, config.branch, config.trunk.flare);
  const grown = relaxedGrowth(tree, radii, config);

  const trunk = grown[0];
  if (!trunk) throw new Error('The tree has no trunk');

  const partial = {
    branches: withGrowthOrder(grown),
    fruits: placeFruits(grown, config.fruit),
    roots: growRoots(tree.rootUnionId, trunk, config.roots),
    leafClusters: placeLeafClusters(grown, config.leaves),
  };
  return { ...partial, bounds: computeBounds(partial) };
}

function totalFruits(tree: FamilyTree): number {
  return [...tree.rootPartners, ...tree.limbs].reduce((sum, node) => sum + node.fruitCount, 0);
}

/**
 * Bigger families get a proportionally bigger tree, so fruits keep the same breathing room. Only
 * lengths grow: fruits keep their size and thickness already follows the pipe model.
 */
function scaledToFamily(config: LayoutConfig, fruitCount: number): LayoutConfig {
  const factor = Math.max(
    1,
    Math.pow(fruitCount / config.growth.referenceFruitCount, config.growth.exponent),
  );
  if (factor === 1) return config;
  return {
    ...config,
    trunk: { ...config.trunk, height: config.trunk.height * factor },
    rootCouple: { ...config.rootCouple, length: config.rootCouple.length * factor },
    branch: {
      ...config.branch,
      baseLength: config.branch.baseLength * factor,
      minLength: config.branch.minLength * factor,
    },
    roots: { ...config.roots, length: config.roots.length * factor },
  };
}

/**
 * Grows the tree, then keeps turning branches apart until no two fruits are too close. Depth is
 * normalized on every pass so the check runs on the exact final geometry.
 */
function relaxedGrowth(tree: FamilyTree, radii: TreeRadii, config: LayoutConfig): GrownBranch[] {
  const adjustments: MutableAdjustments = { angle: new Map(), stretch: new Map() };
  const grow = (): GrownBranch[] =>
    normalizeDepth(growTree(tree, radii, config, adjustments), config.depth.ratio);

  let grown = grow();
  for (let i = 0; i < config.relax.maxIterations; i++) {
    const fruits = placeFruits(grown, config.fruit);
    if (relaxStep(tree, grown, fruits, adjustments, config) === 0) break;
    grown = grow();
  }
  return grown;
}

/**
 * Rescales z so the crown is as deep as `ratio` × its width. Scaling bends the centripetal curves a
 * hair, so each branch is shifted back onto its parent (parents come first, so they are final).
 */
function normalizeDepth(branches: readonly GrownBranch[], ratio: number): GrownBranch[] {
  let minX = Infinity;
  let maxX = -Infinity;
  let maxDepth = 0;
  for (const branch of branches) {
    for (const point of branch.points) {
      minX = Math.min(minX, point.x);
      maxX = Math.max(maxX, point.x);
      maxDepth = Math.max(maxDepth, Math.abs(point.z));
    }
  }
  if (maxDepth === 0) return [...branches];
  const factor = (ratio * (maxX - minX)) / maxDepth;

  const byId = new Map<string, GrownBranch>();
  return branches.map((branch) => {
    const scaled = branch.points.map((point) => ({ ...point, z: point.z * factor }));
    const parent = branch.parentBranchId === null ? undefined : byId.get(branch.parentBranchId);
    const first = scaled[0];
    const shift =
      parent && first ? sub(pointOnCurve(parent.points, branch.parentT), first) : undefined;
    const result = { ...branch, points: shift ? scaled.map((p) => add(p, shift)) : scaled };
    byId.set(branch.id, result);
    return result;
  });
}

/** Breadth-first from the trunk; siblings in the order they sprout along their parent. */
function withGrowthOrder(branches: readonly GrownBranch[]): BranchSegment[] {
  const childrenOf = new Map<string | null, GrownBranch[]>();
  for (const branch of branches) {
    const siblings = childrenOf.get(branch.parentBranchId) ?? [];
    siblings.push(branch);
    childrenOf.set(branch.parentBranchId, siblings);
  }

  const result: BranchSegment[] = [];
  const queue = [...(childrenOf.get(null) ?? [])];
  for (let branch = queue.shift(); branch; branch = queue.shift()) {
    result.push(toSegment(branch, result.length));
    const children = [...(childrenOf.get(branch.id) ?? [])].sort(
      (a, b) => a.parentT - b.parentT || a.id.localeCompare(b.id),
    );
    queue.push(...children);
  }
  return result;
}

function toSegment(branch: GrownBranch, order: number): BranchSegment {
  return {
    id: branch.id,
    kind: branch.kind,
    parentBranchId: branch.parentBranchId,
    parentT: branch.parentT,
    points: branch.points,
    radiusStart: branch.radius.start,
    radiusEnd: branch.radius.end,
    generation: branch.generation,
    personId: branch.node?.personId ?? null,
    order,
  };
}
