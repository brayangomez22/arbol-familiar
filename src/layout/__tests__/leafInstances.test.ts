import { describe, expect, it } from 'vitest';
import { LAYOUT } from '@/config/constants';
import familyJson from '@/data/family.json';
import { loadFamily } from '@/data/loadFamily';
import { syntheticFamily } from '@/dev/syntheticFamily';
import { buildTreeLayout } from '../buildTreeLayout';
import { placeLeaves } from '../leafInstances';
import type { TreeLayout } from '../types';
import { length } from '../vec';

const COLORS = 4;
const PER_CLUSTER = 40;

const layouts: [string, TreeLayout][] = [
  ['family.json', buildTreeLayout(loadFamily(familyJson))],
  ['synthetic 60', buildTreeLayout(syntheticFamily(60, 'a'))],
];

const leavesOf = (layout: TreeLayout) =>
  placeLeaves(layout.leafClusters, layout.fruits, PER_CLUSTER, COLORS, LAYOUT.leaf);

describe.each(layouts)('placeLeaves (%s)', (_, layout) => {
  const leaves = leavesOf(layout);

  it('is deterministic', () => {
    expect(leavesOf(layout)).toEqual(leaves);
  });

  it('never puts more leaves in a cluster than asked for', () => {
    const asked = layout.leafClusters.reduce(
      (total, cluster) => total + Math.round(PER_CLUSTER * cluster.density),
      0,
    );
    expect(leaves.length).toBeGreaterThan(0);
    expect(leaves.length).toBeLessThanOrEqual(asked);
  });

  it('gives every leaf unit vectors and a valid color', () => {
    for (const leaf of leaves) {
      expect(length(leaf.facing)).toBeCloseTo(1, 6);
      expect(length(leaf.shadeNormal)).toBeCloseTo(1, 6);
      expect(leaf.facing.z).toBeGreaterThan(0);
      expect(leaf.colorIndex).toBeGreaterThanOrEqual(0);
      expect(leaf.colorIndex).toBeLessThan(COLORS);
    }
  });

  it('keeps every fruit and its name clear of leaves in front of them', () => {
    const { keepOut } = LAYOUT.leaf;
    for (const leaf of leaves) {
      for (const fruit of layout.fruits) {
        const dx = leaf.position.x - fruit.position.x;
        const dy = leaf.position.y - fruit.position.y;
        const inBox = Math.abs(dx) < keepOut.halfWidth && dy < keepOut.above && dy > -keepOut.below;
        if (inBox)
          expect(leaf.position.z).toBeLessThanOrEqual(fruit.position.z - keepOut.frontMargin);
      }
    }
  });
});

describe('placeLeaves with fewer leaves', () => {
  it('scales the count with the quality setting', () => {
    const [, layout] = layouts[0] ?? [];
    if (!layout) throw new Error('missing layout');
    const few = placeLeaves(layout.leafClusters, layout.fruits, 10, COLORS, LAYOUT.leaf);
    expect(few.length).toBeLessThan(leavesOf(layout).length);
  });
});
