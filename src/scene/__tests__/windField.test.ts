import { Vector3 } from 'three';
import { describe, expect, it } from 'vitest';
import { WIND } from '@/config/constants';
import { windSway } from '../wind/windField';
import { WIND_DIRECTION } from '../wind/windUniforms';

const point = { x: 3, y: 12, z: -1 };

describe('windSway', () => {
  it('leaves weight-0 points (the trunk base) where they are', () => {
    const out = windSway(point, 0, { time: 7.3, strength: 2, lean: 1 }, new Vector3());
    expect(out.length()).toBe(0);
  });

  it('scales linearly with weight', () => {
    const wind = { time: 4.2, strength: 1, lean: 0 };
    const full = windSway(point, 1, wind, new Vector3());
    const half = windSway(point, 0.5, wind, new Vector3());
    expect(half.clone().multiplyScalar(2).distanceTo(full)).toBeLessThan(1e-12);
  });

  it('stays within the amplitude in calm air', () => {
    const limit =
      WIND.amplitude *
      Math.hypot(
        WIND.mix.reduce((a, b) => a + b, 0),
        WIND.bobRatio,
      );
    const out = new Vector3();
    for (let time = 0; time < 60; time += 0.37) {
      expect(windSway(point, 1, { time, strength: 1, lean: 0 }, out).length()).toBeLessThanOrEqual(
        limit + 1e-9,
      );
    }
  });

  it('leans downwind during a gust', () => {
    const wind = { time: 1, strength: 0, lean: 0.5 };
    const out = windSway(point, 1, wind, new Vector3());
    expect(out.distanceTo(WIND_DIRECTION.clone().multiplyScalar(0.5))).toBeLessThan(1e-12);
  });
});
