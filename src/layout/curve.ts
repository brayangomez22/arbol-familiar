import type { Vec3 } from './types';
import { sub } from './vec';

const MIN_KNOT_SPACING = 1e-4;

/**
 * Point at `t` (0–1) on the centripetal Catmull-Rom curve through `points`. Same formulation and
 * parameterization as THREE.CatmullRomCurve3#getPoint, so branches sprout exactly on the rendered
 * parent curve.
 */
export function pointOnCurve(points: readonly Vec3[], t: number): Vec3 {
  const count = points.length;
  if (count < 2) return at(points, 0);

  const progress = (count - 1) * Math.min(Math.max(t, 0), 1);
  let segment = Math.floor(progress);
  let weight = progress - segment;
  if (segment === count - 1) {
    segment = count - 2;
    weight = 1;
  }

  const p1 = at(points, segment);
  const p2 = at(points, segment + 1);
  const p0 = segment > 0 ? at(points, segment - 1) : reflect(p1, p2);
  const p3 = segment + 2 < count ? at(points, segment + 2) : reflect(p2, p1);

  let dt0 = Math.pow(squaredDistance(p0, p1), 0.25);
  let dt1 = Math.pow(squaredDistance(p1, p2), 0.25);
  let dt2 = Math.pow(squaredDistance(p2, p3), 0.25);
  if (dt1 < MIN_KNOT_SPACING) dt1 = 1;
  if (dt0 < MIN_KNOT_SPACING) dt0 = dt1;
  if (dt2 < MIN_KNOT_SPACING) dt2 = dt1;

  return {
    x: nonUniformCatmullRom(p0.x, p1.x, p2.x, p3.x, dt0, dt1, dt2, weight),
    y: nonUniformCatmullRom(p0.y, p1.y, p2.y, p3.y, dt0, dt1, dt2, weight),
    z: nonUniformCatmullRom(p0.z, p1.z, p2.z, p3.z, dt0, dt1, dt2, weight),
  };
}

/** `segments + 1` evenly parameterized points along the curve, for polylines. */
export function sampleCurve(points: readonly Vec3[], segments: number): Vec3[] {
  return Array.from({ length: segments + 1 }, (_, i) => pointOnCurve(points, i / segments));
}

function at(points: readonly Vec3[], i: number): Vec3 {
  const point = points[i];
  if (point === undefined) throw new Error(`Curve point ${i} out of range`);
  return point;
}

/** Mirror `b` through `a`: the phantom end point Catmull-Rom needs before the first point. */
function reflect(a: Vec3, b: Vec3): Vec3 {
  const d = sub(a, b);
  return { x: a.x + d.x, y: a.y + d.y, z: a.z + d.z };
}

function squaredDistance(a: Vec3, b: Vec3): number {
  return (a.x - b.x) ** 2 + (a.y - b.y) ** 2 + (a.z - b.z) ** 2;
}

function nonUniformCatmullRom(
  x0: number,
  x1: number,
  x2: number,
  x3: number,
  dt0: number,
  dt1: number,
  dt2: number,
  t: number,
): number {
  const tangent1 = ((x1 - x0) / dt0 - (x2 - x0) / (dt0 + dt1) + (x2 - x1) / dt1) * dt1;
  const tangent2 = ((x2 - x1) / dt1 - (x3 - x1) / (dt1 + dt2) + (x3 - x2) / dt2) * dt1;
  const c2 = -3 * x1 + 3 * x2 - 2 * tangent1 - tangent2;
  const c3 = 2 * x1 - 2 * x2 + tangent1 + tangent2;
  return x1 + tangent1 * t + c2 * t * t + c3 * t * t * t;
}
