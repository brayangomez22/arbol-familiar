import type { PersonId } from '@/domain/types';
import type { TreeReach } from './reach';
import type { BranchSegment } from './types';

export interface TimelineGrowthConfig {
  /** Years a branch takes to grow from its fork to its tip. */
  readonly growYears: number;
}

/** When each point of the wood exists on the family timeline, in (fractional) years. */
export interface TimelineSchedule {
  /** Point at fraction `u` (arc length, 0 = base, 1 = tip) of a branch. */
  atFraction(branchId: string, u: number): number;
  /** Point at curve parameter `t` (as in pointOnCurve and LeafCluster.branchT). */
  atParameter(branchId: string, t: number): number;
}

/**
 * A person's branch grows in the years leading up to their birth, so its tip (and their fruit)
 * arrives the year they are born. It never starts before the point of its parent it sprouts from
 * exists; then it arrives a little later. The trunk carries no one: it stands complete from
 * `trunkYear`, the start of the timeline.
 */
export function timelineSchedule(
  branches: readonly BranchSegment[],
  reach: TreeReach,
  appearYearOf: (personId: PersonId) => number | undefined,
  trunkYear: number,
  { growYears }: TimelineGrowthConfig,
): TimelineSchedule {
  const byId = new Map(branches.map((branch) => [branch.id, branch]));
  const starts = new Map<string, number>();

  const fractionOf = (branchId: string, t: number): number => {
    const base = reach.atFraction(branchId, 0);
    const length = reach.atFraction(branchId, 1) - base;
    return length > 0 ? (reach.atParameter(branchId, t) - base) / length : 0;
  };

  const startOf = (branch: BranchSegment): number => {
    const known = starts.get(branch.id);
    if (known !== undefined) return known;
    const appear =
      branch.personId === null ? trunkYear : (appearYearOf(branch.personId) ?? trunkYear);
    const parent = branch.parentBranchId === null ? undefined : byId.get(branch.parentBranchId);
    const fork = parent
      ? startOf(parent) + fractionOf(parent.id, branch.parentT) * growYears
      : -Infinity;
    const start = Math.max(appear - growYears, fork);
    starts.set(branch.id, start);
    return start;
  };

  const atFraction = (branchId: string, u: number): number => {
    const branch = byId.get(branchId);
    if (!branch) return trunkYear;
    return startOf(branch) + Math.min(Math.max(u, 0), 1) * growYears;
  };

  return {
    atFraction,
    atParameter: (branchId, t) => atFraction(branchId, fractionOf(branchId, t)),
  };
}
