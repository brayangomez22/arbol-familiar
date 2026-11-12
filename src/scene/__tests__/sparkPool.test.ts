import { describe, expect, it } from 'vitest';
import { HOVER_SPARKS } from '@/config/constants';
import { SparkPool } from '../tree/sparkPool';

const center = { x: 2, y: 10, z: 0.5 };

function births(pool: SparkPool): number[] {
  return Array.from(pool.geometry.getAttribute('aBirth').array);
}

describe('SparkPool', () => {
  it('starts with every slot dead', () => {
    const pool = new SparkPool(HOVER_SPARKS);
    expect(births(pool).every((birth) => birth < -1000)).toBe(true);
  });

  it('fills perBurst slots per burst, staggered from the given time', () => {
    const pool = new SparkPool(HOVER_SPARKS);
    pool.emit('ana', center, 1, 5);
    const used = births(pool).filter((birth) => birth >= 5);
    expect(used).toHaveLength(HOVER_SPARKS.perBurst);
    expect(Math.max(...used)).toBeCloseTo(
      5 + (HOVER_SPARKS.perBurst - 1) * HOVER_SPARKS.stagger,
      6,
    );
  });

  it('starts sparks around the fruit and in front of it', () => {
    const pool = new SparkPool(HOVER_SPARKS);
    pool.emit('ana', center, 2, 0);
    const position = pool.geometry.getAttribute('position');
    for (let i = 0; i < HOVER_SPARKS.perBurst; i++) {
      expect(Math.abs(position.getX(i) - center.x)).toBeLessThanOrEqual(HOVER_SPARKS.spread * 2);
      expect(position.getZ(i)).toBeCloseTo(center.z + HOVER_SPARKS.startFront * 2, 5);
    }
  });

  it('reuses the oldest slots once the ring is full', () => {
    const pool = new SparkPool(HOVER_SPARKS);
    const bursts = Math.ceil(HOVER_SPARKS.pool / HOVER_SPARKS.perBurst) + 1;
    for (let burst = 0; burst < bursts; burst++) pool.emit('ana', center, 1, burst * 10);
    const all = births(pool);
    expect(all).toHaveLength(HOVER_SPARKS.pool);
    expect(all.every((birth) => birth >= 0)).toBe(true);
    expect(all.some((birth) => birth >= (bursts - 1) * 10)).toBe(true);
  });
});
