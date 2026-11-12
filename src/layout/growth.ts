import type { TreeReach } from './reach';
import type { BranchSegment } from './types';

export interface GrowthConfig {
  /** Seconds from the shoot to the last tip. */
  readonly duration: number;
  /** A child branch waits this long after the growth passes the point it sprouts from. */
  readonly generationPause: number;
}

/** When each point of the wood appears, in seconds from the moment the trunk sprouts. */
export interface GrowthSchedule {
  /** Point at fraction `u` (arc length, 0 = base, 1 = tip) of a branch. */
  atFraction(branchId: string, u: number): number;
  /** Point at curve parameter `t` (as in pointOnCurve and LeafCluster.branchT). */
  atParameter(branchId: string, t: number): number;
  /** When the last tip is reached. */
  readonly end: number;
}

/**
 * The growth front runs along the wood at a constant speed from the trunk's base, and every
 * generation waits a little longer: a point appears at reach / speed + generation × pause. A child
 * therefore starts a pause after the front passes its fork, so the tree grows generation by
 * generation and a branch never grows before its parent (the order of BranchSegment.order). The
 * speed is chosen so the whole tree, whatever its size, grows in `duration`.
 */
export function growthSchedule(
  branches: readonly BranchSegment[],
  reach: TreeReach,
  { duration, generationPause }: GrowthConfig,
): GrowthSchedule {
  const generationOf = new Map(branches.map((branch) => [branch.id, branch.generation]));
  const maxGeneration = Math.max(0, ...generationOf.values());
  // At least half the time goes to the front itself, however many generations wait.
  const travel = Math.max(duration - maxGeneration * generationPause, duration / 2);
  const pause = (duration - travel) / Math.max(maxGeneration, 1);
  const speed = reach.max > 0 ? reach.max / travel : 1;
  const timeOf = (branchId: string, distance: number) =>
    distance / speed + (generationOf.get(branchId) ?? 0) * pause;

  let end = 0;
  for (const branch of branches)
    end = Math.max(end, timeOf(branch.id, reach.atFraction(branch.id, 1)));

  return {
    atFraction: (branchId, u) => timeOf(branchId, reach.atFraction(branchId, u)),
    atParameter: (branchId, t) => timeOf(branchId, reach.atParameter(branchId, t)),
    end,
  };
}
