/**
 * Size in pixels of one world unit at distance 1, from the drawing buffer height and the vertical
 * fov. Point sprites divide it by their view depth to keep perspective.
 */
export function pixelsPerUnit(bufferHeight: number, fovDegrees: number): number {
  return bufferHeight / (2 * Math.tan((fovDegrees * Math.PI) / 360));
}
