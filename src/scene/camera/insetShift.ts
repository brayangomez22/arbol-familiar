import type { Vec3 } from '@/layout/types';
import type { ViewInset } from '@/state/store';

export interface ViewportSize {
  readonly width: number;
  readonly height: number;
}

/**
 * How far to move the point the camera looks at so that something at that point shows in the
 * middle of the part of the view the panel leaves free, instead of hidden behind it. Exact for the
 * plane at `distance` from a perspective camera looking straight ahead.
 */
export function insetShift(
  inset: ViewInset,
  viewport: ViewportSize,
  distance: number,
  fovDegrees: number,
): Vec3 {
  if (viewport.height <= 0) return { x: 0, y: 0, z: 0 };
  const halfFov = (fovDegrees * Math.PI) / 360;
  const worldPerPixel = (2 * distance * Math.tan(halfFov)) / viewport.height;
  const right = Math.min(inset.right, viewport.width);
  const bottom = Math.min(inset.bottom, viewport.height);
  // The free area's center is half the inset away from the screen's center, so the camera looks
  // that much past the person, toward the panel.
  return { x: (right / 2) * worldPerPixel, y: -(bottom / 2) * worldPerPixel, z: 0 };
}
