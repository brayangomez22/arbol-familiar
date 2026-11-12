import { BufferAttribute, BufferGeometry } from 'three';
import type { HOVER_SPARKS } from '@/config/constants';
import { createRandom } from '@/layout/random';
import type { Vec3 } from '@/layout/types';

export type SparkConfig = typeof HOVER_SPARKS;

/** Birth time of a slot never used: so long ago that the shader sees it as dead. */
const NEVER = -1e6;

/**
 * A fixed ring of spark slots in one geometry. Emitting overwrites the oldest slots; the flight
 * itself runs in shaders/spark.vert.glsl, so nothing is touched per frame.
 */
export class SparkPool {
  readonly geometry = new BufferGeometry();
  private readonly origins: BufferAttribute;
  private readonly births: BufferAttribute;
  private readonly motions: BufferAttribute;
  private readonly config: SparkConfig;
  private next = 0;
  private bursts = 0;

  constructor(config: SparkConfig) {
    this.config = config;
    const size = config.pool;
    this.origins = new BufferAttribute(new Float32Array(size * 3), 3);
    this.births = new BufferAttribute(new Float32Array(size).fill(NEVER), 1);
    // Life 1 for unused slots keeps the shader's division safe.
    const motions = new Float32Array(size * 3);
    for (let i = 0; i < size; i++) motions[i * 3] = 1;
    this.motions = new BufferAttribute(motions, 3);
    this.geometry.setAttribute('position', this.origins);
    this.geometry.setAttribute('aBirth', this.births);
    this.geometry.setAttribute('aMotion', this.motions);
  }

  /** A burst around a fruit centered at `center` with radius `fruitSize`, born at `time`. */
  emit(seed: string, center: Vec3, fruitSize: number, time: number): void {
    const { config } = this;
    const rng = createRandom(seed, 'sparks', String(this.bursts++));
    for (let i = 0; i < config.perHover; i++) {
      const slot = this.next;
      this.next = (this.next + 1) % config.pool;
      this.origins.setXYZ(
        slot,
        center.x + rng.signed() * config.spread * fruitSize,
        center.y + rng.range(-config.startBelow, config.startAbove) * fruitSize,
        center.z + config.startFront * fruitSize,
      );
      this.births.setX(slot, time + i * config.stagger);
      this.motions.setXYZ(
        slot,
        rng.range(config.minLife, config.maxLife),
        rng.next() * Math.PI * 2,
        rng.signed() * config.drift,
      );
    }
    this.origins.needsUpdate = true;
    this.births.needsUpdate = true;
    this.motions.needsUpdate = true;
  }

  dispose(): void {
    this.geometry.dispose();
  }
}
