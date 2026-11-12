import type { PersonId } from '@/domain/types';

/** Plain vector so layout/ stays free of three. scene/ turns these into THREE.Vector3. */
export interface Vec3 {
  readonly x: number;
  readonly y: number;
  readonly z: number;
}

export type BranchKind = 'trunk' | 'branch' | 'root';

export interface BranchSegment {
  readonly id: string;
  readonly kind: BranchKind;
  /** Null only for the trunk. Roots hang from the trunk. */
  readonly parentBranchId: string | null;
  /** Where along the parent curve this branch sprouts (0 = parent base, 1 = parent tip). */
  readonly parentT: number;
  /** Control points of a centripetal Catmull-Rom curve, base first. Matches THREE.CatmullRomCurve3. */
  readonly points: readonly Vec3[];
  readonly radiusStart: number;
  readonly radiusEnd: number;
  /** Generation of the person it carries. The trunk and the roots are 0. */
  readonly generation: number;
  /** The blood member whose fruit sits at the tip. Null for the trunk and the roots. */
  readonly personId: PersonId | null;
  /** Growth sequence: a branch never grows before its parent. Unique within its list. */
  readonly order: number;
}

export type FruitKind = 'blood' | 'graft';

export interface FruitPlacement {
  readonly personId: PersonId;
  readonly position: Vec3;
  /** Radius. */
  readonly size: number;
  readonly kind: FruitKind;
  readonly anchorBranchId: string;
}

export interface LeafCluster {
  readonly branchId: string;
  /** Curve parameter (as in pointOnCurve) of the point on the branch the cluster grows from. */
  readonly branchT: number;
  readonly position: Vec3;
  readonly radius: number;
  /** 0–1: how full the cluster is. */
  readonly density: number;
}

export interface Bounds {
  readonly min: Vec3;
  readonly max: Vec3;
}

export interface TreeLayout {
  readonly branches: readonly BranchSegment[];
  readonly fruits: readonly FruitPlacement[];
  readonly roots: readonly BranchSegment[];
  readonly leafClusters: readonly LeafCluster[];
  readonly bounds: Bounds;
}
