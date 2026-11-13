import type { MapRoute, Vec2 } from '@/layout/originsMap';

const round = (value: number) => Math.round(value * 10) / 10;
const point = ({ x, y }: Vec2) => `${round(x)} ${round(y)}`;

/**
 * Catmull-Rom through the points, as cubic Béziers: hand-drawn coasts and rivers, never the jagged
 * polyline of the raw data.
 */
function smooth(points: readonly Vec2[], closed: boolean): string {
  const count = points.length;
  if (count < 2) return '';
  const at = (i: number): Vec2 => {
    const index = closed ? (i + count) % count : Math.min(count - 1, Math.max(0, i));
    return points[index] ?? { x: 0, y: 0 };
  };
  const first = at(0);
  let path = `M${point(first)}`;
  const segments = closed ? count : count - 1;
  for (let i = 0; i < segments; i++) {
    const p0 = at(i - 1);
    const p1 = at(i);
    const p2 = at(i + 1);
    const p3 = at(i + 2);
    const c1 = { x: p1.x + (p2.x - p0.x) / 6, y: p1.y + (p2.y - p0.y) / 6 };
    const c2 = { x: p2.x - (p3.x - p1.x) / 6, y: p2.y - (p3.y - p1.y) / 6 };
    path += `C${point(c1)} ${point(c2)} ${point(p2)}`;
  }
  return closed ? `${path}Z` : path;
}

export function closedPath(points: readonly Vec2[]): string {
  return smooth(points, true);
}

export function openPath(points: readonly Vec2[]): string {
  return smooth(points, false);
}

export function routePath(route: MapRoute): string {
  return `M${point(route.start)}Q${point(route.control)} ${point(route.end)}`;
}

/** Two little ink peaks, the larger one first, as on old maps. */
export function mountainPath({ x, y }: Vec2, size: number): string {
  const small = size * 0.65;
  return (
    `M${point({ x: x - size, y: y + size * 0.7 })}L${point({ x, y: y - size * 0.7 })}` +
    `L${point({ x: x + size, y: y + size * 0.7 })}` +
    `M${point({ x: x + size * 0.55, y: y + size * 0.7 - small * 0.1 })}` +
    `L${point({ x: x + size * 0.55 + small, y: y + size * 0.7 - small * 1.3 })}` +
    `L${point({ x: x + size * 0.55 + small * 2, y: y + size * 0.7 })}`
  );
}
