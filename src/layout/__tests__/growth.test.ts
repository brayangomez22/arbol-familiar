import { describe, expect, it } from 'vitest';
import familyJson from '@/data/family.json';
import { loadFamily } from '@/data/loadFamily';
import { syntheticFamily } from '@/dev/syntheticFamily';
import { buildTreeLayout } from '../buildTreeLayout';
import { growthSchedule } from '../growth';
import { measureReach } from '../reach';
import type { TreeLayout } from '../types';

const CONFIG = { duration: 4.4, generationPause: 0.25 };

const layouts: [string, TreeLayout][] = [
  ['family.json', buildTreeLayout(loadFamily(familyJson))],
  ['synthetic 150', buildTreeLayout(syntheticFamily(150, 'c'))],
];

describe.each(layouts)('growthSchedule (%s)', (_, layout) => {
  const reach = measureReach(layout.branches, 32);
  const schedule = growthSchedule(layout.branches, reach, CONFIG);
  const byId = new Map(layout.branches.map((branch) => [branch.id, branch]));

  it('starts at the trunk base and fits the whole tree in the duration', () => {
    const trunk = layout.branches.find((branch) => branch.kind === 'trunk');
    expect(trunk && schedule.atFraction(trunk.id, 0)).toBe(0);
    expect(schedule.end).toBeLessThanOrEqual(CONFIG.duration + 1e-9);
    expect(schedule.end).toBeGreaterThan(CONFIG.duration * 0.6);
  });

  it('grows every branch from base to tip', () => {
    for (const branch of layout.branches) {
      expect(schedule.atFraction(branch.id, 1)).toBeGreaterThan(schedule.atFraction(branch.id, 0));
    }
  });

  it('never starts a branch before the growth reaches its fork', () => {
    for (const branch of layout.branches) {
      if (branch.parentBranchId === null) continue;
      const fork = schedule.atParameter(branch.parentBranchId, branch.parentT);
      const start = schedule.atFraction(branch.id, 0);
      const parent = byId.get(branch.parentBranchId);
      expect(start).toBeGreaterThanOrEqual(fork - 1e-9);
      // A deeper generation waits; the same generation (the root couple's twigs) does not.
      if (parent && branch.generation > parent.generation) expect(start).toBeGreaterThan(fork);
    }
  });

  it('follows the growth order of the layout', () => {
    const sorted = [...layout.branches].sort((a, b) => a.order - b.order);
    for (const branch of sorted) {
      const parent = branch.parentBranchId === null ? undefined : byId.get(branch.parentBranchId);
      if (parent) {
        expect(parent.order).toBeLessThan(branch.order);
        expect(schedule.atFraction(parent.id, 0)).toBeLessThanOrEqual(
          schedule.atFraction(branch.id, 0),
        );
      }
    }
  });
});
