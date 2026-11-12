import { Vector3 } from 'three';
import { describe, expect, it } from 'vitest';
import type { BranchSegment } from '@/layout/types';
import { buildBranchGeometry, buildTaperedTube, setSapLimits } from '../tree/branchGeometry';

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

const other: BranchSegment = {
  ...straight,
  id: 'c',
  points: straight.points.map((p) => ({ ...p, x: 4 })),
};

// Reach is height along this vertical branch; the weight is a tenth of it.
const wood = {
  reachAt: (_: string, u: number) => u * 10,
  swayOf: (reach: number) => reach / 10,
  growAt: (_: string, u: number) => 2 + u,
};

describe('buildBranchGeometry', () => {
  it('merges every segment into one indexed geometry', () => {
    const single = buildBranchGeometry([straight]).geometry;
    const double = buildBranchGeometry([straight, other]).geometry;

    expect(double.index).not.toBeNull();
    expect(double.getAttribute('position').count).toBe(2 * single.getAttribute('position').count);
  });

  it('gives every ring its reach and wind weight, and each knot those of its end', () => {
    const { geometry } = buildBranchGeometry([straight], wood);
    const position = geometry.getAttribute('position');
    const reach = geometry.getAttribute('aReach');
    const sway = geometry.getAttribute('aSway');
    expect(reach.count).toBe(position.count);
    expect(sway.count).toBe(position.count);

    // Knots sit at y = 0 and y = 10 with vertices above and below, so they are checked by value.
    const tubeCount = buildTaperedTube(straight).getAttribute('position').count;
    for (let i = 0; i < tubeCount; i++) {
      expect(reach.getX(i)).toBeCloseTo(position.getY(i), 4);
      expect(sway.getX(i)).toBeCloseTo(position.getY(i) / 10, 5);
    }
    expect(new Set(Array.from(reach.array).slice(tubeCount))).toEqual(new Set([0, 10]));
    expect(new Set(Array.from(sway.array).slice(tubeCount))).toEqual(new Set([0, 1]));
  });

  it('keeps branches still and off the lineage by default', () => {
    const { geometry } = buildBranchGeometry([straight]);
    expect(Array.from(geometry.getAttribute('aSway').array).every((v) => v === 0)).toBe(true);
    expect(Array.from(geometry.getAttribute('aSapLimit').array).every((v) => v < 0)).toBe(true);
  });

  it("records where each segment's vertices are", () => {
    const { geometry, ranges } = buildBranchGeometry([straight, other]);
    const first = ranges.get('b');
    const second = ranges.get('c');
    expect(first?.start).toBe(0);
    expect(second?.start).toBe(first?.count);
    expect((first?.count ?? 0) + (second?.count ?? 0)).toBe(
      geometry.getAttribute('position').count,
    );
  });
});

describe('growth attributes', () => {
  it('gives every vertex the center of its ring and the moment it grows', () => {
    const { geometry } = buildBranchGeometry([straight], wood);
    const position = geometry.getAttribute('position');
    const axis = geometry.getAttribute('aAxis');
    const growAt = geometry.getAttribute('aGrowAt');
    const tubeCount = buildTaperedTube(straight).getAttribute('position').count;
    for (let i = 0; i < tubeCount; i++) {
      // The branch is the y axis: each ring's center is (0, y, 0).
      expect(axis.getX(i)).toBeCloseTo(0, 5);
      expect(axis.getY(i)).toBeCloseTo(position.getY(i), 4);
      expect(growAt.getX(i)).toBeCloseTo(2 + position.getY(i) / 10, 4);
    }
    // Knots grow with their end: the base at 2 s, the tip at 3 s.
    expect(new Set(Array.from(growAt.array).slice(tubeCount))).toEqual(new Set([2, 3]));
  });
});

describe('setSapLimits', () => {
  it('lights only the listed segments, up to their limit, and clears again', () => {
    const built = buildBranchGeometry([straight, other], wood);
    const limit = built.geometry.getAttribute('aSapLimit');
    const range = built.ranges.get('c');
    if (!range) throw new Error('missing range');

    setSapLimits(built, new Map([['c', 7]]));
    for (let i = 0; i < limit.count; i++) {
      const inC = i >= range.start && i < range.start + range.count;
      expect(limit.getX(i)).toBe(inC ? 7 : -1);
    }

    setSapLimits(built, null);
    expect(Array.from(limit.array).every((v) => v === -1)).toBe(true);
  });
});
