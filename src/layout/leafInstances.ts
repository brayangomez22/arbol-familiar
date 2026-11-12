import type { LayoutConfig } from '@/config/constants';
import { createRandom } from './random';
import type { FruitPlacement, LeafCluster, Vec3 } from './types';
import { add, normalize, scale, vec3 } from './vec';

export interface LeafInstance {
  readonly position: Vec3;
  /** Unit normal of the leaf's own plane. */
  readonly facing: Vec3;
  /** Turn around `facing`, in radians: 0 points the tip up (+y). */
  readonly spin: number;
  /** Length from stem to tip. */
  readonly size: number;
  /** Index into the theme's leaf colors. */
  readonly colorIndex: number;
  /** Normal used for lighting: the cluster's, so foliage shades as soft masses, not single leaves. */
  readonly shadeNormal: Vec3;
}

const CAMERA_FACING: Vec3 = { x: 0, y: 0, z: 1 };

/**
 * Scatters leaves through the clusters, seeded per cluster so the same family always grows the
 * same leaves. A full cluster gets `leavesPerCluster`; sparser ones get fewer.
 */
export function placeLeaves(
  clusters: readonly LeafCluster[],
  fruits: readonly FruitPlacement[],
  leavesPerCluster: number,
  colorCount: number,
  config: LayoutConfig['leaf'],
): LeafInstance[] {
  const leaves: LeafInstance[] = [];

  clusters.forEach((cluster, clusterIndex) => {
    const rng = createRandom(cluster.branchId, 'leaf', String(clusterIndex));
    const wanted = Math.round(leavesPerCluster * cluster.density);
    const attempts = wanted * config.attemptsPerLeaf;
    let placed = 0;

    for (let attempt = 0; attempt < attempts && placed < wanted; attempt++) {
      const direction = randomDirection(rng.next(), rng.next());
      // Cube root fills a ball evenly; pulling toward 1 favors the surface.
      const depth = Math.cbrt(rng.next()) * (1 - config.shellBias) + config.shellBias;
      const offset = vec3(
        direction.x * cluster.radius * depth,
        direction.y * cluster.radius * depth,
        direction.z * cluster.radius * depth * config.depthScale,
      );
      const position = add(cluster.position, offset);
      if (hidesAFruit(position, fruits, config.keepOut)) continue;

      const outward = normalize(
        add(direction, scale(randomDirection(rng.next(), rng.next()), config.normalJitter)),
      );
      const facing = normalize(add(CAMERA_FACING, scale(direction, config.facingTilt)));
      leaves.push({
        position,
        facing,
        // Tips point away from the cluster's center, as leaves on the outside of a crown do.
        spin: Math.atan2(-direction.x, direction.y) + rng.signed() * config.spinJitter,
        size: config.size * (1 + rng.signed() * config.sizeJitter),
        colorIndex: rng.int(0, colorCount - 1),
        shadeNormal: outward,
      });
      placed++;
    }
  });
  return leaves;
}

/** Uniform direction on the unit sphere from two uniform numbers in [0, 1). */
function randomDirection(u: number, v: number): Vec3 {
  const z = u * 2 - 1;
  const ring = Math.sqrt(1 - z * z);
  const angle = v * Math.PI * 2;
  return vec3(ring * Math.cos(angle), ring * Math.sin(angle), z);
}

function hidesAFruit(
  position: Vec3,
  fruits: readonly FruitPlacement[],
  keepOut: LayoutConfig['leaf']['keepOut'],
): boolean {
  return fruits.some((fruit) => {
    const dx = position.x - fruit.position.x;
    const dy = position.y - fruit.position.y;
    return (
      Math.abs(dx) < keepOut.halfWidth &&
      dy < keepOut.above &&
      dy > -keepOut.below &&
      position.z > fruit.position.z - keepOut.frontMargin
    );
  });
}
