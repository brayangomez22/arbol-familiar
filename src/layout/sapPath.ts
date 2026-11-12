import type { TreeReach } from './reach';
import type { BranchSegment } from './types';

/** The wood the sap runs through, from the trunk's base to a branch's tip. */
export interface SapPath {
  /** For each branch on the way, the reach where the sap leaves it (its fork into the next one). */
  readonly limits: ReadonlyMap<string, number>;
  /** Reach of the destination tip: how far the sap travels in total. */
  readonly length: number;
}

/**
 * Walks from `branchId` down to the trunk through each branch's parent. The branch tree mirrors
 * the lineage (domain.lineagePath): every branch grows from the branch of the parent it descends
 * from, so this is the person's line of ancestors, in wood.
 */
export function sapPath(
  branches: readonly BranchSegment[],
  reach: TreeReach,
  branchId: string,
): SapPath {
  const byId = new Map(branches.map((branch) => [branch.id, branch]));
  const limits = new Map<string, number>();
  const length = reach.atFraction(branchId, 1);

  let current = byId.get(branchId);
  let limit = length;
  while (current && !limits.has(current.id)) {
    limits.set(current.id, limit);
    const parent = current.parentBranchId === null ? undefined : byId.get(current.parentBranchId);
    if (!parent) break;
    // The sap leaves the parent where this branch sprouts, never running on toward its tip.
    limit = reach.atParameter(parent.id, current.parentT);
    current = parent;
  }
  return { limits, length };
}
