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

describe('buildBranchGeometry', () => {
  it('merges every segment into one indexed geometry', () => {
    const other = { ...straight, id: 'c', points: straight.points.map((p) => ({ ...p, x: 4 })) };
    const single = buildBranchGeometry([straight]);
    const double = buildBranchGeometry([straight, other]);

    expect(double.index).not.toBeNull();
    expect(double.getAttribute('position').count).toBe(2 * single.getAttribute('position').count);
  });
});
