import { pointOnCurve } from './curve';
import { createRandom } from './random';
import type { BranchSegment, FruitPlacement, LeafCluster, Vec3 } from './types';
import { vec3 } from './vec';

/** One flower: a small camera-facing disc that opens in place. */
export interface Blossom {
  readonly position: Vec3;
  readonly size: number;
  /** Turn in the picture plane, in radians, so no two flowers look alike. */
  readonly spin: number;
  /** The branch and curve parameter it grows from: its growth time and its wind weight. */
  readonly branchId: string;
  readonly branchT: number;
  /** 0–1, seeded: in spring, flowers above the season's density stay closed. */
  readonly rank: number;
  /** 0–1: when it opens within its bloom, base of the branch first. */
  readonly order: number;
}

export interface ClusterBlossomConfig {
  /** Flowers in a full cluster. */
  readonly perCluster: number;
  readonly size: number;
  readonly sizeJitter: number;
  /** Out from the cluster's center, as a fraction of its radius: flowers sit on the surface. */
  readonly shell: readonly [number, number];
  /** How much the crown is flattened toward the camera (as LAYOUT.leaf.depthScale). */
  readonly depthScale: number;
}

/** Spring flowers scattered over the outside of every leaf cluster. */
export function placeClusterBlossoms(
  clusters: readonly LeafCluster[],
  config: ClusterBlossomConfig,
): Blossom[] {
  return clusters.flatMap((cluster, clusterIndex) => {
    const rng = createRandom(cluster.branchId, 'blossom', String(clusterIndex));
    const count = Math.round(config.perCluster * cluster.density);
    return Array.from({ length: count }, (): Blossom => {
      const direction = onSphere(rng.next(), rng.next());
      const out = cluster.radius * rng.range(config.shell[0], config.shell[1]);
      return {
        position: vec3(
          cluster.position.x + direction.x * out,
          cluster.position.y + direction.y * out,
          // Toward the front of the crown, where they can be seen.
          cluster.position.z + Math.abs(direction.z) * out * config.depthScale,
        ),
        size: config.size * (1 + rng.signed() * config.sizeJitter),
        spin: rng.next() * Math.PI * 2,
        branchId: cluster.branchId,
        branchT: cluster.branchT,
        rank: rng.next(),
        order: rng.next(),
      };
    });
  });
}

export interface BranchBlossomConfig {
  readonly count: number;
  readonly size: number;
  readonly sizeJitter: number;
  /** Part of the branch that flowers, as curve parameters: the outer stretch up to the tip. */
  readonly from: number;
  /** How far from the wood a flower can sit, in branch radii plus this many world units. */
  readonly spread: number;
  /** Share of the flowers that crowd around the fruit itself. */
  readonly aroundFruit: number;
  /** Ring around the fruit, in fruit radii. */
  readonly fruitRing: readonly [number, number];
}

/**
 * A branch covered in flowers for someone's birthday: along its outer stretch, and crowding
 * around their fruit. Seeded by the person, so the same flowers open every year.
 */
export function placeBranchBlossoms(
  branch: BranchSegment,
  fruit: FruitPlacement,
  config: BranchBlossomConfig,
): Blossom[] {
  const rng = createRandom(fruit.personId, 'birthday-blossom');
  return Array.from({ length: config.count }, (_, i): Blossom => {
    const nearFruit = i < config.count * config.aroundFruit;
    const angle = rng.next() * Math.PI * 2;
    const size = config.size * (1 + rng.signed() * config.sizeJitter);
    const spin = rng.next() * Math.PI * 2;
    if (nearFruit) {
      const ring = fruit.size * rng.range(config.fruitRing[0], config.fruitRing[1]);
      return {
        position: vec3(
          fruit.position.x + Math.cos(angle) * ring,
          fruit.position.y + Math.sin(angle) * ring,
          fruit.position.z + fruit.size * 0.5,
        ),
        size,
        spin,
        branchId: branch.id,
        branchT: 1,
        rank: 0,
        order: 1 - rng.next() * 0.25,
      };
    }
    const t = rng.range(config.from, 1);
    const center = pointOnCurve(branch.points, t);
    const radius = branch.radiusStart + (branch.radiusEnd - branch.radiusStart) * t;
    const out = radius + rng.next() * config.spread;
    return {
      position: vec3(
        center.x + Math.cos(angle) * out,
        center.y + Math.sin(angle) * out,
        center.z + radius,
      ),
      size,
      spin,
      branchId: branch.id,
      branchT: t,
      rank: 0,
      order: (t - config.from) / (1 - config.from),
    };
  });
}

function onSphere(u: number, v: number): Vec3 {
  const z = u * 2 - 1;
  const ring = Math.sqrt(1 - z * z);
  const angle = v * Math.PI * 2;
  return vec3(ring * Math.cos(angle), ring * Math.sin(angle), z);
}
