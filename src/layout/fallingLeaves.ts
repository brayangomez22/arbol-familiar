import type { FallingLeavesConfig } from '@/config/constants';
import { createRandom, type Random } from './random';
import type { LeafCluster, Vec3 } from './types';
import { vec3 } from './vec';

/** One leaf's trip from the crown to the grass, decided when it lets go. */
export interface LeafFall {
  /** Seconds on the falling-leaves clock when it lets go. */
  readonly start: number;
  /** Seconds from letting go to touching down. */
  readonly fallTime: number;
  /** Seconds it lies on the grass before shrinking away. */
  readonly lie: number;
  /** When it is gone: the slot is free for the next leaf from then on. */
  readonly end: number;
  readonly origin: Vec3;
  /** Where it lies on the grass. */
  readonly rest: Vec3;
  readonly speed: number;
  readonly swing: number;
  readonly swingFrequency: number;
  readonly phase: number;
  /** Turn around its own normal, in radians: 0 points the tip up. */
  readonly spin: number;
  /** Angular speed of the tumble, in rad/s (signed). */
  readonly tumble: number;
  /** Tumble angle it settles on as it lands: a whole half turn, so it lies flat. */
  readonly restRoll: number;
  readonly size: number;
  /** Index into the theme's leaf colors. */
  readonly colorIndex: number;
}

/** Where a falling leaf is at one moment. Written in place, so a frame allocates nothing. */
export interface LeafPose {
  x: number;
  y: number;
  z: number;
  /** Euler angles in XYZ order: lying back (x), tumbling (y), spinning in its plane (z). */
  pitch: number;
  roll: number;
  spin: number;
  /** 0 while it is not in the scene. */
  scale: number;
}

export interface FallSurroundings {
  readonly clusters: readonly LeafCluster[];
  /** Height of the ground at (x, z). */
  readonly groundAt: (x: number, z: number) => number;
  /** Horizontal unit vector the wind blows toward. */
  readonly downwind: Vec3;
  /** How the crown is flattened toward the camera, so leaves let go from its visible surface. */
  readonly depthScale: number;
  readonly colorCount: number;
}

export function createLeafPose(): LeafPose {
  return { x: 0, y: 0, z: 0, pitch: 0, roll: 0, spin: 0, scale: 0 };
}

/**
 * The `cycle`-th leaf of a slot, letting go no sooner than `after` (when the slot's previous leaf
 * was gone). Seeded by slot and cycle, so every visit sees the same leaves fall. Null when the
 * tree has no foliage to drop from.
 */
export function planLeafFall(
  slot: number,
  cycle: number,
  after: number,
  surroundings: FallSurroundings,
  config: FallingLeavesConfig,
): LeafFall | null {
  const { clusters, groundAt, downwind, depthScale, colorCount } = surroundings;
  if (clusters.length === 0) return null;
  const rng = createRandom(config.seed, String(slot), String(cycle));
  const start = after + range(rng, cycle === 0 ? config.firstWait : config.wait);

  const cluster = clusters[rng.int(0, clusters.length - 1)];
  if (!cluster) return null;
  const direction = randomDirection(rng.next(), rng.next());
  const depth = cluster.radius * rng.range(config.shell, 1);
  const origin = vec3(
    cluster.position.x + direction.x * depth,
    cluster.position.y + direction.y * depth,
    // Out of the front of the crown, where the leaf can be seen letting go.
    cluster.position.z + Math.abs(direction.z) * depth * depthScale,
  );

  const speed = range(rng, config.speed);
  // Measured against the ground under the leaf, which is close enough to where it lands: the
  // drift is short and the hill is broad.
  const height = Math.max(0, origin.y - groundAt(origin.x, origin.z) - config.restHeight);
  const drift = height * config.driftPerFall;
  const restX = origin.x + downwind.x * drift;
  const restZ = origin.z + downwind.z * drift;
  const rest = vec3(restX, groundAt(restX, restZ) + config.restHeight, restZ);
  const fallTime = timeToFall(origin.y - rest.y, speed, config.catchAir);
  const tumble = range(rng, config.tumble) * (rng.next() < 0.5 ? -1 : 1);
  const lie = range(rng, config.lie);

  return {
    start,
    fallTime,
    lie,
    end: start + fallTime + lie + config.vanish,
    origin,
    rest,
    speed,
    swing: range(rng, config.swing),
    swingFrequency: range(rng, config.swingFrequency),
    phase: rng.next() * Math.PI * 2,
    spin: rng.signed() * Math.PI,
    tumble,
    restRoll: Math.round((tumble * fallTime) / Math.PI) * Math.PI,
    size: config.size * (1 + rng.signed() * config.sizeJitter),
    colorIndex: rng.int(0, colorCount - 1),
  };
}

/**
 * Pose of `fall` at `time`: it speeds up to its falling speed, swings side to side and tumbles,
 * then the swing dies down and it settles flat right where it touches the grass.
 */
export function leafFallPose(
  fall: LeafFall,
  time: number,
  config: FallingLeavesConfig,
  out: LeafPose,
): LeafPose {
  const age = time - fall.start;
  if (age < 0 || time >= fall.end) {
    out.scale = 0;
    return out;
  }

  const falling = Math.min(age, fall.fallTime);
  const total = fall.origin.y - fall.rest.y;
  const progress = total > 0 ? fallenBy(falling, fall.speed, config.catchAir) / total : 1;
  // Calm as it lets go and as it lands; the swing and tilt only open up while it is in the air.
  const calm = Math.min(
    smoothstep(falling / config.catchAir),
    smoothstep((fall.fallTime - falling) / config.catchAir),
  );
  const swingAngle = fall.phase + fall.swingFrequency * falling;
  const settled = 1 - smoothstep((fall.fallTime - falling) / config.catchAir);

  out.x =
    fall.origin.x +
    (fall.rest.x - fall.origin.x) * progress +
    Math.sin(swingAngle) * fall.swing * calm;
  out.y = fall.origin.y - total * Math.min(progress, 1);
  out.z = fall.origin.z + (fall.rest.z - fall.origin.z) * progress;
  // Leans into the direction it is swinging, as a leaf gliding on its face does.
  out.spin = fall.spin + Math.cos(swingAngle) * config.rock * calm;
  out.roll = fall.tumble * falling + (fall.restRoll - fall.tumble * fall.fallTime) * settled;
  out.pitch = -(Math.PI / 2 - config.restTilt) * settled;

  const appear = smoothstep(age / config.appear);
  const vanish = smoothstep((fall.end - time) / config.vanish);
  out.scale = fall.size * Math.min(appear, vanish);
  return out;
}

/** Distance fallen after `t` seconds: speeding up evenly for `catchAir` seconds, then steady. */
function fallenBy(t: number, speed: number, catchAir: number): number {
  if (catchAir <= 0) return speed * t;
  return t < catchAir ? (speed * t * t) / (2 * catchAir) : speed * (t - catchAir / 2);
}

/** Inverse of fallenBy. */
function timeToFall(distance: number, speed: number, catchAir: number): number {
  if (distance <= 0) return 0;
  const speedingUp = (speed * catchAir) / 2;
  return distance <= speedingUp
    ? Math.sqrt((2 * distance * catchAir) / speed)
    : distance / speed + catchAir / 2;
}

function range(rng: Random, [min, max]: readonly [number, number]): number {
  return rng.range(min, max);
}

function smoothstep(x: number): number {
  const t = Math.min(Math.max(x, 0), 1);
  return t * t * (3 - 2 * t);
}

/** Uniform direction on the unit sphere from two uniform numbers in [0, 1). */
function randomDirection(u: number, v: number): Vec3 {
  const z = u * 2 - 1;
  const ring = Math.sqrt(1 - z * z);
  const angle = v * Math.PI * 2;
  return vec3(ring * Math.cos(angle), ring * Math.sin(angle), z);
}

/**
 * The clusters on the branch a fruit hangs from, or else the `fallback` nearest to it: where a
 * leaf can let go "near" someone.
 */
export function clustersNear(
  clusters: readonly LeafCluster[],
  branchId: string,
  position: Vec3,
  fallback: number,
): LeafCluster[] {
  const own = clusters.filter((cluster) => cluster.branchId === branchId);
  if (own.length > 0) return own;
  const distance = (cluster: LeafCluster) =>
    Math.hypot(
      cluster.position.x - position.x,
      cluster.position.y - position.y,
      cluster.position.z - position.z,
    );
  return [...clusters].sort((a, b) => distance(a) - distance(b)).slice(0, fallback);
}
