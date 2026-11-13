import type { SceneryConfig } from '@/config/constants';
import { createRandom } from './random';
import type { Bounds, Vec3 } from './types';
import { vec3 } from './vec';

type CloudConfig = SceneryConfig['clouds'];
type RidgeConfig = SceneryConfig['ridges'];

export interface CloudPuff {
  /** Center relative to the cloud's anchor, whose y = 0 is the cloud's flat bottom. */
  readonly x: number;
  readonly y: number;
  readonly radius: number;
}

export interface Cloud {
  readonly position: Vec3;
  readonly puffs: readonly CloudPuff[];
  readonly layer: number;
  /** Sideways speed (units per second); clouds wrap around within `wrapWidth`. */
  readonly drift: number;
  readonly wrapWidth: number;
}

/** Flat illustrated clouds in layers behind the tree, spread to cover the view at every depth. */
export function placeClouds(bounds: Bounds, config: CloudConfig, seed: string): Cloud[] {
  const centerX = (bounds.min.x + bounds.max.x) / 2;
  const centerY = (bounds.min.y + bounds.max.y) / 2;
  const width = bounds.max.x - bounds.min.x;
  const height = bounds.max.y - bounds.min.y;

  return config.layers.flatMap((layer, layerIndex) => {
    const rng = createRandom(seed, 'clouds', String(layerIndex));
    // Farther layers must spread wider and higher to fill the same part of the view.
    const depthSpread = 1 + Math.abs(layer.z) / config.referenceDistance;
    const spanX = width * config.spreadX * depthSpread;

    return Array.from({ length: layer.count }, (_, i): Cloud => {
      // Even slots across the span with a random shift, so clouds never pile up.
      const slot = (i + 0.5 + rng.signed() * config.slotJitter) / layer.count - 0.5;
      const elevation = config.minHeight + (config.maxHeight - config.minHeight) * rng.next();
      return {
        position: vec3(centerX + slot * spanX, centerY + elevation * height * depthSpread, layer.z),
        puffs: cloudPuffs(rng, config, layer.scale),
        layer: layerIndex,
        drift: layer.drift,
        wrapWidth: spanX,
      };
    });
  });
}

function cloudPuffs(
  rng: ReturnType<typeof createRandom>,
  config: CloudConfig,
  scale: number,
): CloudPuff[] {
  const count = rng.int(config.minPuffs, config.maxPuffs);
  const width = config.width * scale * (1 + rng.signed() * config.widthJitter);
  return Array.from({ length: count }, (_, i) => {
    const t = count === 1 ? 0.5 : i / (count - 1);
    // Bigger puffs in the middle give the classic rounded heap.
    const bulge = 1 + config.puffBulge * Math.sin(Math.PI * t);
    const radius = config.puffRadius * scale * bulge * (1 + rng.signed() * config.puffJitter);
    return {
      x: (t - 0.5) * width,
      y: radius * rng.range(config.minPuffLift, config.maxPuffLift),
      radius,
    };
  });
}

export interface Ridge {
  /** Top silhouette, left to right, at depth `z`. */
  readonly line: readonly { readonly x: number; readonly y: number }[];
  readonly z: number;
  /** How far down the ridge's body reaches below its lowest point. */
  readonly depth: number;
  /** 0–1: how much the ridge fades into the sky's horizon color. */
  readonly fog: number;
}

/** Distant hills behind the tree's hill, low enough to keep the crown against the sky. */
export function buildRidges(bounds: Bounds, config: RidgeConfig, seed: string): Ridge[] {
  const centerX = (bounds.min.x + bounds.max.x) / 2;
  const base = bounds.min.y - config.baseDrop;

  return config.layers.map((layer, layerIndex) => {
    const rng = createRandom(seed, 'ridge', String(layerIndex));
    const halfWidth = Math.abs(layer.z) * config.halfWidthFactor;
    const phases = config.waves.map(() => rng.next() * Math.PI * 2);
    const line = Array.from({ length: config.points + 1 }, (_, i) => {
      const t = i / config.points;
      const wave = config.waves.reduce(
        (sum, [frequency, weight], w) =>
          sum + weight * (0.5 + 0.5 * Math.sin(t * frequency * Math.PI * 2 + (phases[w] ?? 0))),
        0,
      );
      return { x: centerX + (t * 2 - 1) * halfWidth, y: base + wave * layer.height };
    });
    return { line, z: layer.z, depth: config.depth, fog: layer.fog };
  });
}

export interface PollenMote {
  readonly position: Vec3;
  /** Relative size, around 1. */
  readonly size: number;
  /** Start of its floating cycle, in radians. */
  readonly phase: number;
}

/** Specks of pollen scattered through the air around the tree. */
export function placePollen(
  count: number,
  bounds: Bounds,
  config: SceneryConfig['pollen'],
  seed: string,
): PollenMote[] {
  const rng = createRandom(seed, 'pollen');
  const { min, max } = bounds;
  const pad = config.padding;
  return Array.from({ length: count }, () => ({
    position: vec3(
      rng.range(min.x - pad, max.x + pad),
      rng.range(Math.max(min.y, 0), max.y + pad),
      rng.range(min.z - pad, max.z + pad),
    ),
    size: 1 + rng.signed() * config.sizeJitter,
    phase: rng.next() * Math.PI * 2,
  }));
}

export interface Firefly {
  readonly position: Vec3;
  readonly size: number;
  readonly phase: number;
  /** Radians per second of its glow. */
  readonly blink: number;
}

/**
 * Fireflies in the crown's box, and some low over the grass, where they gather on real summer
 * nights. Seeded, so the same ones come out every night.
 */
export function placeFireflies(
  count: number,
  bounds: Bounds,
  config: SceneryConfig['fireflies'],
  seed: string,
): Firefly[] {
  const rng = createRandom(seed, 'fireflies');
  const { min, max } = bounds;
  const pad = config.padding;
  const [slowest, fastest] = config.blinkSpeed;
  return Array.from({ length: count }, () => {
    const low = rng.next() < config.lowShare;
    const floor = Math.max(min.y, 0);
    return {
      position: vec3(
        rng.range(min.x - pad, max.x + pad),
        low ? rng.range(floor, floor + config.lowHeight) : rng.range(floor, max.y + pad),
        rng.range(min.z - pad, max.z + pad),
      ),
      size: 1 + rng.signed() * config.sizeJitter,
      phase: rng.next() * Math.PI * 2,
      blink: rng.range(slowest, fastest),
    };
  });
}
