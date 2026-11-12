import { Vector3 } from 'three';
import { describe, expect, it } from 'vitest';
import type { BranchSegment } from '@/layout/types';
import { buildBranchGeometry, buildTaperedTube } from '../tree/branchGeometry';

const straight: BranchSegment = {
  id: 'b',
  kind: 'branch',
  parentBranchId: null,
  parentT: 0,
  points: [
    { x: 0, y: 0, z: 0 },
    { x: 0, y: 5, z: 0 },
    { x: 0, y: 10, z: 0 },
  ],
  radiusStart: 2,
  radiusEnd: 0.5,
  generation: 1,
  personId: null,
  order: 0,
};

describe('buildTaperedTube', () => {
  it('goes from the start radius at the base to the end radius at the tip', () => {
    const tube = buildTaperedTube(straight);
    const position = tube.getAttribute('position');
    const vertex = new Vector3();
    const ringSize = tube.parameters.radialSegments + 1;

    for (let i = 0; i < ringSize; i++) {
      vertex.fromBufferAttribute(position, i);
      expect(Math.hypot(vertex.x, vertex.z)).toBeCloseTo(2, 6);
      expect(vertex.y).toBeCloseTo(0, 6);

      vertex.fromBufferAttribute(position, position.count - ringSize + i);
      expect(Math.hypot(vertex.x, vertex.z)).toBeCloseTo(0.5, 6);
      expect(vertex.y).toBeCloseTo(10, 6);
    }
  });
});

describe('bark coordinates', () => {
  it('measures uv.x in world units along the branch and marks tubes as bark', () => {
    const tube = buildTaperedTube(straight);
    const uv = tube.getAttribute('uv');
    const bark = tube.getAttribute('bark');

    expect(uv.getX(0)).toBeCloseTo(0, 6);
    expect(uv.getX(uv.count - 1)).toBeCloseTo(10, 4);
    expect(bark.count).toBe(uv.count);
    expect(Array.from(bark.array).every((value) => value === 1)).toBe(true);
  });
});

describe('buildBranchGeometry', () => {
  it('merges every segment into one indexed geometry', () => {
    const other = { ...straight, id: 'c', points: straight.points.map((p) => ({ ...p, x: 4 })) };
    const single = buildBranchGeometry([straight]);
    const double = buildBranchGeometry([straight, other]);

    expect(double.index).not.toBeNull();
    expect(double.getAttribute('position').count).toBe(2 * single.getAttribute('position').count);
  });

  it('gives every ring its wind weight and each knot the weight of its end', () => {
    const geometry = buildBranchGeometry([straight], (_, u) => u);
    const position = geometry.getAttribute('position');
    const sway = geometry.getAttribute('aSway');
    expect(sway.count).toBe(position.count);

    // Along this vertical branch the weight is height / 10; knots sit at y = 0 and y = 10 with
    // vertices above and below, so they are checked by their center instead.
    const tube = buildTaperedTube(straight);
    const tubeCount = tube.getAttribute('position').count;
    for (let i = 0; i < tubeCount; i++) {
      expect(sway.getX(i)).toBeCloseTo(position.getY(i) / 10, 5);
    }
    const values = new Set(Array.from(sway.array).slice(tubeCount));
    expect(values).toEqual(new Set([0, 1]));
  });

  it('keeps branches still when no weights are given', () => {
    const sway = buildBranchGeometry([straight]).getAttribute('aSway');
    expect(Array.from(sway.array).every((value) => value === 0)).toBe(true);
  });
});
