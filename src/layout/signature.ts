import { pointOnCurve } from './curve';
import type { BranchSegment, Vec3 } from './types';

export interface SignaturePlacement {
  /** On the bark, on the side facing the viewer (+z). */
  readonly position: Vec3;
  /** Of the trunk there, so the letters can wrap around it. */
  readonly radius: number;
}

/**
 * Where the hidden signature goes: on the trunk at height `at` (0 = ground, 1 = top), on the face
 * the camera looks at. The radius follows the tube's own linear taper.
 */
export function signaturePlacement(
  trunk: BranchSegment,
  at: number,
  lift: number,
): SignaturePlacement {
  const center = pointOnCurve(trunk.points, at);
  const radius = trunk.radiusStart + (trunk.radiusEnd - trunk.radiusStart) * at;
  return { position: { x: center.x, y: center.y, z: center.z + radius + lift }, radius };
}
