import { CatmullRomCurve3, Vector3 } from 'three';
import { describe, expect, it } from 'vitest';
import { pointOnCurve } from '@/layout/curve';
import { createRandom } from '@/layout/random';

// scene/ will build tubes with CatmullRomCurve3, and layout/ sprouts branches on its own curve
// evaluation. They must agree, or child branches would float off their parents.
describe('layout curves match THREE.CatmullRomCurve3', () => {
  it.each([3, 4, 5])('with %i control points', (count) => {
    const rng = createRandom('parity', String(count));
    const points = Array.from({ length: count }, (_, i) => ({
      x: rng.range(-3, 3),
      y: i * 2 + rng.range(0, 1),
      z: rng.range(-0.5, 0.5),
    }));
    const curve = new CatmullRomCurve3(points.map((p) => new Vector3(p.x, p.y, p.z)));

    for (let t = 0; t <= 1; t += 0.05) {
      const expected = curve.getPoint(t);
      const actual = pointOnCurve(points, t);
      expect(actual.x).toBeCloseTo(expected.x, 9);
      expect(actual.y).toBeCloseTo(expected.y, 9);
      expect(actual.z).toBeCloseTo(expected.z, 9);
    }
  });
});
