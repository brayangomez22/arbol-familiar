import { pointOnCurve } from './curve';
import type { BranchSegment, FruitPlacement, LeafCluster, Vec3 } from './types';

export interface BirdPerch {
  readonly branchId: string;
  /** Curve parameter on the branch, for its sway. */
  readonly t: number;
  /** On top of the bark. */
  readonly position: Vec3;
}

export interface PerchConfig {
  readonly from: number;
  readonly to: number;
  readonly samples: number;
  readonly maxSlope: number;
  readonly fruitClearance: number;
  readonly minRadius: number;
  /** Leaf clusters reach this fraction of their radius on the front view; a perch must be outside. */
  readonly foliageClearance: number;
}

const STEP = 0.01;

function distance(a: Vec3, b: Vec3): number {
  return Math.hypot(a.x - b.x, a.y - b.y, a.z - b.z);
}

/** Seen from the front, as the camera does: depth does not keep a bird out of the leaves' way. */
function inFoliage(point: Vec3, clusters: readonly LeafCluster[], clearance: number): boolean {
  return clusters.some(
    (cluster) =>
      Math.hypot(cluster.position.x - point.x, cluster.position.y - point.y) <
      cluster.radius * clearance,
  );
}

/**
 * Where a bird could sit: on each branch, the most level stretch that is thick enough, clear of
 * every fruit and out of the leaves (where nobody would see it), on top of the bark. Branches with no such stretch offer none. Pure and in branch
 * order, so the same tree always offers the same perches.
 */
export function birdPerches(
  branches: readonly BranchSegment[],
  fruits: readonly FruitPlacement[],
  clusters: readonly LeafCluster[],
  config: PerchConfig,
): BirdPerch[] {
  return branches.flatMap((branch) => {
    if (branch.kind !== 'branch') return [];
    let best: (BirdPerch & { slope: number }) | null = null;
    for (let i = 0; i <= config.samples; i++) {
      const t = config.from + ((config.to - config.from) * i) / config.samples;
      const radius = branch.radiusStart + (branch.radiusEnd - branch.radiusStart) * t;
      if (radius < config.minRadius) continue;
      const a = pointOnCurve(branch.points, t - STEP);
      const b = pointOnCurve(branch.points, t + STEP);
      const run = Math.hypot(b.x - a.x, b.z - a.z);
      const slope = run === 0 ? Infinity : Math.abs(b.y - a.y) / run;
      if (slope > config.maxSlope) continue;
      const center = pointOnCurve(branch.points, t);
      const position = { x: center.x, y: center.y + radius, z: center.z };
      if (fruits.some((fruit) => distance(fruit.position, position) < config.fruitClearance))
        continue;
      if (inFoliage(position, clusters, config.foliageClearance)) continue;
      if (!best || slope < best.slope) best = { branchId: branch.id, t, position, slope };
    }
    return best ? [{ branchId: best.branchId, t: best.t, position: best.position }] : [];
  });
}
