import { describe, expect, it } from 'vitest';
import familyJson from '@/data/family.json';
import { loadFamily } from '@/data/loadFamily';
import { syntheticFamily } from '@/dev/syntheticFamily';
import { buildTreeLayout } from '../buildTreeLayout';
import { measureReach, swayWeight } from '../reach';
import type { BranchSegment, TreeLayout } from '../types';

const SAMPLES = 32;

const segment = (overrides: Partial<BranchSegment>): BranchSegment => ({
  id: 'trunk',
  kind: 'trunk',
  parentBranchId: null,
  parentT: 0,
  points: [
    { x: 0, y: 0, z: 0 },
    { x: 0, y: 5, z: 0 },
    { x: 0, y: 10, z: 0 },
  ],
  radiusStart: 1,
  radiusEnd: 0.5,
  generation: 0,
  personId: null,
  order: 0,
  ...overrides,
});

describe('measureReach on a straight trunk with one branch', () => {
  const trunk = segment({});
  const branch = segment({
    id: 'limb',
    kind: 'branch',
    parentBranchId: 'trunk',
    parentT: 0.5,
    points: [
      { x: 0, y: 5, z: 0 },
      { x: 2, y: 5, z: 0 },
      { x: 4, y: 5, z: 0 },
    ],
    generation: 1,
    order: 1,
  });
  // Children listed before their parent must still be measured from it.
  const reach = measureReach([branch, trunk], SAMPLES);

  it('starts at 0 on the trunk base and grows with length', () => {
    expect(reach.atFraction('trunk', 0)).toBe(0);
    expect(reach.atFraction('trunk', 1)).toBeCloseTo(10, 6);
    expect(reach.atParameter('trunk', 0.5)).toBeCloseTo(5, 6);
  });

  it('starts a branch at the reach of the point it sprouts from', () => {
    expect(reach.atFraction('limb', 0)).toBeCloseTo(reach.atParameter('trunk', 0.5), 9);
    expect(reach.atFraction('limb', 1)).toBeCloseTo(9, 6);
  });

  it('reports the farthest tip and gives unknown branches no reach', () => {
    expect(reach.max).toBeCloseTo(10, 6);
    expect(reach.atFraction('nope', 1)).toBe(0);
  });
});

describe('swayWeight', () => {
  it('goes from 0 at the base to 1 at the farthest tip, and is clamped', () => {
    expect(swayWeight(0, 10, 1.6)).toBe(0);
    expect(swayWeight(10, 10, 1.6)).toBe(1);
    expect(swayWeight(20, 10, 1.6)).toBe(1);
    expect(swayWeight(5, 10, 2)).toBeCloseTo(0.25, 9);
    expect(swayWeight(5, 0, 2)).toBe(0);
  });
});

const layouts: [string, TreeLayout][] = [
  ['family.json', buildTreeLayout(loadFamily(familyJson))],
  ['synthetic 100', buildTreeLayout(syntheticFamily(100, 'b'))],
];

describe.each(layouts)('measureReach on a real tree (%s)', (_, layout) => {
  const reach = measureReach(layout.branches, SAMPLES);
  const byId = new Map(layout.branches.map((branch) => [branch.id, branch]));

  it('is continuous at every fork', () => {
    for (const branch of layout.branches) {
      if (branch.parentBranchId === null) continue;
      expect(byId.has(branch.parentBranchId)).toBe(true);
      expect(reach.atFraction(branch.id, 0)).toBeCloseTo(
        reach.atParameter(branch.parentBranchId, branch.parentT),
        9,
      );
    }
  });

  it('always reaches further at a child tip than at its base', () => {
    for (const branch of layout.branches) {
      expect(reach.atFraction(branch.id, 1)).toBeGreaterThan(reach.atFraction(branch.id, 0));
      expect(reach.atFraction(branch.id, 1)).toBeLessThanOrEqual(reach.max + 1e-9);
    }
  });
});
