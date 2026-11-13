import { describe, expect, it } from 'vitest';
import { signaturePlacement } from '../signature';
import type { BranchSegment } from '../types';

const trunk: BranchSegment = {
  id: 'trunk',
  kind: 'trunk',
  parentBranchId: null,
  parentT: 0,
  points: [
    { x: 0, y: 0, z: 0 },
    { x: 0, y: 5, z: 0 },
    { x: 0, y: 10, z: 0 },
  ],
  radiusStart: 1.2,
  radiusEnd: 0.8,
  generation: 0,
  personId: null,
  order: 0,
};

describe('signaturePlacement', () => {
  it('sits on the bark facing the viewer, at the trunk’s radius for that height', () => {
    const { position, radius } = signaturePlacement(trunk, 0.5, 0.01);
    expect(radius).toBeCloseTo(1);
    expect(position.y).toBeCloseTo(5);
    expect(position.x).toBeCloseTo(0);
    expect(position.z).toBeCloseTo(1.01);
  });
});
