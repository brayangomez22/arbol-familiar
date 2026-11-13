import { describe, expect, it } from 'vitest';
import familyJson from '@/data/family.json';
import { loadFamily } from '@/data/loadFamily';
import { placeBranchBlossoms, placeClusterBlossoms } from '../blossoms';
import { buildTreeLayout } from '../buildTreeLayout';

const layout = buildTreeLayout(loadFamily(familyJson));

const CLUSTER_CONFIG = {
  perCluster: 10,
  size: 0.5,
  sizeJitter: 0.3,
  shell: [0.7, 1] as const,
  depthScale: 0.6,
};

const BRANCH_CONFIG = {
  count: 40,
  size: 0.5,
  sizeJitter: 0.3,
  from: 0.4,
  spread: 0.6,
  aroundFruit: 0.4,
  fruitRing: [1.2, 2] as const,
};

describe('placeClusterBlossoms', () => {
  const blossoms = placeClusterBlossoms(layout.leafClusters, CLUSTER_CONFIG);

  it('is deterministic', () => {
    expect(placeClusterBlossoms(layout.leafClusters, CLUSTER_CONFIG)).toEqual(blossoms);
  });

  it('puts flowers on the outside of their cluster', () => {
    expect(blossoms.length).toBeGreaterThan(0);
    for (const blossom of blossoms) {
      const cluster = layout.leafClusters.find(
        (c) => c.branchId === blossom.branchId && c.branchT === blossom.branchT,
      );
      expect(cluster).toBeDefined();
      if (!cluster) continue;
      const { x, y } = cluster.position;
      const distance = Math.hypot(blossom.position.x - x, blossom.position.y - y);
      expect(distance).toBeLessThanOrEqual(cluster.radius * CLUSTER_CONFIG.shell[1] + 1e-9);
    }
  });

  it('ranks flowers between 0 and 1 so a density can thin them', () => {
    for (const { rank, order } of blossoms) {
      expect(rank).toBeGreaterThanOrEqual(0);
      expect(rank).toBeLessThan(1);
      expect(order).toBeGreaterThanOrEqual(0);
      expect(order).toBeLessThan(1);
    }
  });
});

describe('placeBranchBlossoms', () => {
  const fruit = layout.fruits.find((f) => f.kind === 'blood' && f.anchorBranchId !== 'trunk');
  const branch = layout.branches.find((b) => b.id === fruit?.anchorBranchId);

  it('covers the branch and crowds around the fruit, the same way every time', () => {
    expect(fruit && branch).toBeTruthy();
    if (!fruit || !branch) return;
    const blossoms = placeBranchBlossoms(branch, fruit, BRANCH_CONFIG);
    expect(placeBranchBlossoms(branch, fruit, BRANCH_CONFIG)).toEqual(blossoms);
    expect(blossoms).toHaveLength(BRANCH_CONFIG.count);

    const around = blossoms.filter(
      ({ position }) =>
        Math.hypot(position.x - fruit.position.x, position.y - fruit.position.y) <=
        fruit.size * BRANCH_CONFIG.fruitRing[1] + 1e-9,
    );
    expect(around.length).toBeGreaterThanOrEqual(BRANCH_CONFIG.count * BRANCH_CONFIG.aroundFruit);
    for (const blossom of blossoms) {
      expect(blossom.branchId).toBe(branch.id);
      expect(blossom.branchT).toBeGreaterThanOrEqual(BRANCH_CONFIG.from);
    }
  });

  it('opens from the base of the stretch toward the tip', () => {
    if (!fruit || !branch) return;
    const alongWood = placeBranchBlossoms(branch, fruit, BRANCH_CONFIG).filter(
      ({ branchT }) => branchT < 1,
    );
    for (const { branchT, order } of alongWood) {
      expect(order).toBeCloseTo((branchT - BRANCH_CONFIG.from) / (1 - BRANCH_CONFIG.from));
    }
  });
});
