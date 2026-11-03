import type { Bounds, TreeLayout, Vec3 } from './types';

/** Box around everything drawn, including branch thickness, fruit size and foliage. */
export function computeBounds(layout: Omit<TreeLayout, 'bounds'>): Bounds {
  const min = { x: Infinity, y: Infinity, z: Infinity };
  const max = { x: -Infinity, y: -Infinity, z: -Infinity };
  const include = (point: Vec3, padding: number): void => {
    min.x = Math.min(min.x, point.x - padding);
    min.y = Math.min(min.y, point.y - padding);
    min.z = Math.min(min.z, point.z - padding);
    max.x = Math.max(max.x, point.x + padding);
    max.y = Math.max(max.y, point.y + padding);
    max.z = Math.max(max.z, point.z + padding);
  };

  for (const branch of [...layout.branches, ...layout.roots]) {
    for (const point of branch.points) include(point, branch.radiusStart);
  }
  for (const fruit of layout.fruits) include(fruit.position, fruit.size);
  for (const cluster of layout.leafClusters) include(cluster.position, cluster.radius);
  return { min, max };
}
