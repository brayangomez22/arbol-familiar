import type { Vec3 } from './types';

export const ZERO: Vec3 = { x: 0, y: 0, z: 0 };

export function vec3(x: number, y: number, z: number): Vec3 {
  return { x, y, z };
}

export function add(a: Vec3, b: Vec3): Vec3 {
  return { x: a.x + b.x, y: a.y + b.y, z: a.z + b.z };
}

export function sub(a: Vec3, b: Vec3): Vec3 {
  return { x: a.x - b.x, y: a.y - b.y, z: a.z - b.z };
}

export function scale(v: Vec3, factor: number): Vec3 {
  return { x: v.x * factor, y: v.y * factor, z: v.z * factor };
}

export function lerp(a: Vec3, b: Vec3, t: number): Vec3 {
  return { x: a.x + (b.x - a.x) * t, y: a.y + (b.y - a.y) * t, z: a.z + (b.z - a.z) * t };
}

export function length(v: Vec3): number {
  return Math.hypot(v.x, v.y, v.z);
}

export function normalize(v: Vec3): Vec3 {
  const len = length(v);
  return len === 0 ? ZERO : scale(v, 1 / len);
}

/** Distance as seen from the front (ignores z): what matters for fruits not covering each other. */
export function distanceXY(a: Vec3, b: Vec3): number {
  return Math.hypot(a.x - b.x, a.y - b.y);
}

/** Unit vector in the xy plane at `angle` from the vertical, positive toward +x. */
export function directionXY(angle: number): Vec3 {
  return { x: Math.sin(angle), y: Math.cos(angle), z: 0 };
}

/** Angle from the vertical of the xy part of a vector, positive toward +x. */
export function angleXY(v: Vec3): number {
  return Math.atan2(v.x, v.y);
}
