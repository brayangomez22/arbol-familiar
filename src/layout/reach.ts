import { pointOnCurve } from './curve';
import type { BranchSegment } from './types';

/**
 * How far along the wood each point of the tree is from the trunk's base, in world units. It is
 * what makes the wind bend twigs more than limbs, and it is continuous across every fork: a
 * branch's base has the same reach as the point of its parent it sprouts from.
 */
export interface TreeReach {
  /** Farthest reach of any branch tip. */
  readonly max: number;
  /** Reach of the point at curve parameter `t` (the parameterization of `parentT` and pointOnCurve). */
  atParameter(branchId: string, t: number): number;
  /** Reach of the point at fraction `u` of the branch's length (arc-length parameterization). */
  atFraction(branchId: string, u: number): number;
}

interface MeasuredBranch {
  readonly start: number;
  /** Cumulative length at t = i / samples. */
  readonly lengths: readonly number[];
}

/** Measures every branch with `samples` straight pieces; unknown ids have reach 0. */
export function measureReach(branches: readonly BranchSegment[], samples: number): TreeReach {
  const byId = new Map(branches.map((branch) => [branch.id, branch]));
  const measured = new Map<string, MeasuredBranch>();

  const measure = (branch: BranchSegment): MeasuredBranch => {
    const known = measured.get(branch.id);
    if (known) return known;
    const parent = branch.parentBranchId === null ? undefined : byId.get(branch.parentBranchId);
    const start = parent ? reachOf(measure(parent), branch.parentT) : 0;
    const result = { start, lengths: cumulativeLengths(branch.points, samples) };
    measured.set(branch.id, result);
    return result;
  };

  let max = 0;
  for (const branch of branches) {
    const { start, lengths } = measure(branch);
    max = Math.max(max, start + (lengths.at(-1) ?? 0));
  }

  return {
    max,
    atParameter: (branchId, t) => {
      const branch = measured.get(branchId);
      return branch ? reachOf(branch, t) : 0;
    },
    atFraction: (branchId, u) => {
      const branch = measured.get(branchId);
      if (!branch) return 0;
      return branch.start + (branch.lengths.at(-1) ?? 0) * clamp01(u);
    },
  };
}

/** 0 at the trunk's base, 1 at the farthest tip, eased by `exponent` so the wood near the trunk stays stiff. */
export function swayWeight(reach: number, max: number, exponent: number): number {
  if (max <= 0) return 0;
  return Math.pow(clamp01(reach / max), exponent);
}

function reachOf({ start, lengths }: MeasuredBranch, t: number): number {
  const steps = lengths.length - 1;
  if (steps <= 0) return start;
  const position = clamp01(t) * steps;
  const index = Math.min(Math.floor(position), steps - 1);
  const from = lengths[index] ?? 0;
  const to = lengths[index + 1] ?? from;
  return start + from + (to - from) * (position - index);
}

function cumulativeLengths(points: BranchSegment['points'], samples: number): number[] {
  const lengths = [0];
  let previous = pointOnCurve(points, 0);
  let total = 0;
  for (let i = 1; i <= samples; i++) {
    const point = pointOnCurve(points, i / samples);
    total += Math.hypot(point.x - previous.x, point.y - previous.y, point.z - previous.z);
    lengths.push(total);
    previous = point;
  }
  return lengths;
}

function clamp01(value: number): number {
  return Math.min(Math.max(value, 0), 1);
}
