import { describe, expect, it } from 'vitest';
import { pointOnCurve, sampleCurve } from '../curve';
import type { Vec3 } from '../types';
import { vec3 } from '../vec';

const points: Vec3[] = [vec3(0, 0, 0), vec3(1, 2, 0.5), vec3(3, 3, -0.2), vec3(4, 5, 0)];

describe('pointOnCurve', () => {
  it('passes through every control point', () => {
    points.forEach((point, i) => {
      const onCurve = pointOnCurve(points, i / (points.length - 1));
      expect(onCurve.x).toBeCloseTo(point.x, 12);
      expect(onCurve.y).toBeCloseTo(point.y, 12);
      expect(onCurve.z).toBeCloseTo(point.z, 12);
    });
  });

  it('clamps t to the ends', () => {
    expect(pointOnCurve(points, -1)).toEqual(pointOnCurve(points, 0));
    expect(pointOnCurve(points, 2)).toEqual(pointOnCurve(points, 1));
  });

  it('is a straight line for collinear points', () => {
    const line = [vec3(0, 0, 0), vec3(0, 1, 0), vec3(0, 2, 0)];
    for (const t of [0.1, 0.33, 0.5, 0.9]) {
      const point = pointOnCurve(line, t);
      expect(point.x).toBeCloseTo(0, 12);
      expect(point.y).toBeGreaterThan(0);
      expect(point.y).toBeLessThan(2);
    }
  });

  it('handles degenerate curves', () => {
    expect(pointOnCurve([vec3(1, 2, 3)], 0.5)).toEqual(vec3(1, 2, 3));
    expect(() => pointOnCurve([], 0.5)).toThrow();
  });
});

describe('sampleCurve', () => {
  it('returns segments + 1 points from the first to the last control point', () => {
    const samples = sampleCurve(points, 8);
    expect(samples).toHaveLength(9);
    expect(samples[0]).toEqual(pointOnCurve(points, 0));
    expect(samples[8]).toEqual(pointOnCurve(points, 1));
  });
});
