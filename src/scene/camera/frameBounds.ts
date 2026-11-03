import type { Bounds } from '@/layout/types';

export interface Framing {
  readonly target: readonly [number, number, number];
  readonly position: readonly [number, number, number];
}

/** Camera straight in front of the bounds, far enough for the whole box to fit the view. */
export function frameBounds(
  bounds: Bounds,
  fovDegrees: number,
  aspect: number,
  margin: number,
): Framing {
  const { min, max } = bounds;
  const center = [(min.x + max.x) / 2, (min.y + max.y) / 2, (min.z + max.z) / 2] as const;
  const halfFov = (fovDegrees * Math.PI) / 360;
  const fitHeight = (max.y - min.y) / 2 / Math.tan(halfFov);
  const fitWidth = (max.x - min.x) / 2 / (Math.tan(halfFov) * aspect);
  const distance = Math.max(fitHeight, fitWidth) * margin + (max.z - center[2]);
  return { target: center, position: [center[0], center[1], center[2] + distance] };
}
