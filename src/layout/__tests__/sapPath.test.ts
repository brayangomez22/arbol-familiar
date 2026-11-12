import { describe, expect, it } from 'vitest';
import familyJson from '@/data/family.json';
import { loadFamily } from '@/data/loadFamily';
import { indexFamily, lineagePath } from '@/domain/genealogy';
import { buildTreeLayout } from '../buildTreeLayout';
import { measureReach } from '../reach';
import { sapPath } from '../sapPath';

const family = loadFamily(familyJson);
const layout = buildTreeLayout(family);
const reach = measureReach(layout.branches, 32);
const index = indexFamily(family);

describe('sapPath', () => {
  it.each(layout.fruits.map((fruit) => [fruit.personId, fruit] as const))(
    'follows the lineage of %s through the wood',
    (personId, fruit) => {
      const path = sapPath(layout.branches, reach, fruit.anchorBranchId);
      const trunk = layout.branches.find((branch) => branch.kind === 'trunk');
      expect(trunk && path.limits.has(trunk.id)).toBe(true);
      expect(path.length).toBeCloseTo(reach.atFraction(fruit.anchorBranchId, 1), 9);

      // Every person on the way with a branch of their own has it lit, except the root couple:
      // the trunk is theirs, and their own twigs carry no descendants.
      const lit = new Set(
        layout.branches
          .filter((branch) => path.limits.has(branch.id))
          .flatMap((branch) => (branch.personId ? [branch.personId] : [])),
      );
      const owners = new Set(
        layout.branches.flatMap((b) =>
          b.personId && (b.generation > 0 || b.personId === personId) ? [b.personId] : [],
        ),
      );
      const expected = lineagePath(index, personId).filter((id) => owners.has(id));
      expect([...lit].sort()).toEqual([...expected].sort());
    },
  );

  it('stops on each ancestor branch where the next one sprouts', () => {
    const deepest = layout.fruits.reduce((best, fruit) =>
      reach.atFraction(fruit.anchorBranchId, 1) > reach.atFraction(best.anchorBranchId, 1)
        ? fruit
        : best,
    );
    const path = sapPath(layout.branches, reach, deepest.anchorBranchId);
    const byId = new Map(layout.branches.map((branch) => [branch.id, branch]));
    for (const [id, limit] of path.limits) {
      expect(limit).toBeGreaterThan(reach.atFraction(id, 0));
      expect(limit).toBeLessThanOrEqual(reach.atFraction(id, 1) + 1e-9);
      const child = [...path.limits.keys()].find((other) => byId.get(other)?.parentBranchId === id);
      if (child) expect(limit).toBeCloseTo(reach.atFraction(child, 0), 9);
    }
  });

  it('is empty for an unknown branch', () => {
    expect(sapPath(layout.branches, reach, 'nope').limits.size).toBe(0);
  });
});
