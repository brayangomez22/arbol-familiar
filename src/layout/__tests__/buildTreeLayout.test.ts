import { describe, expect, it } from 'vitest';
import { LAYOUT } from '@/config/constants';
import familyJson from '@/data/family.json';
import { loadFamily } from '@/data/loadFamily';
import { syntheticFamily } from '@/dev/syntheticFamily';
import { family as makeFamily, person, sampleFamily, union } from '@/domain/__tests__/fixtures';
import { indexFamily, isBlood, bloodPartnerOf } from '@/domain/genealogy';
import type { Family } from '@/domain/types';
import { buildTreeLayout } from '../buildTreeLayout';
import { pointOnCurve } from '../curve';
import { closeFruitPairs } from '../fruits';
import type { BranchSegment, TreeLayout } from '../types';
import { distanceXY } from '../vec';

const realFamily = loadFamily(familyJson);

const families: [string, Family][] = [
  ['family.json', realFamily],
  ['fixture', sampleFamily()],
  ...[30, 60, 100, 150].flatMap((size) =>
    ['a', 'b', 'c'].map((seed): [string, Family] => [
      `synthetic ${size} (${seed})`,
      syntheticFamily(size, seed),
    ]),
  ),
];

const layouts = new Map(families.map(([name, family]) => [name, buildTreeLayout(family)]));

function layoutOf(name: string): TreeLayout {
  const layout = layouts.get(name);
  if (!layout) throw new Error(`No layout for ${name}`);
  return layout;
}

function byId(branches: readonly BranchSegment[]): Map<string, BranchSegment> {
  return new Map(branches.map((branch) => [branch.id, branch]));
}

describe('determinism', () => {
  it('produces the exact same layout twice', () => {
    expect(buildTreeLayout(realFamily)).toEqual(buildTreeLayout(realFamily));
  });

  it('does not depend on object identity, only on the data', () => {
    expect(buildTreeLayout(loadFamily(structuredClone(familyJson)))).toEqual(
      layoutOf('family.json'),
    );
  });

  it('changes slightly, not wholesale, when one id changes', () => {
    const renamed = loadFamily({
      ...familyJson,
      people: familyJson.people.map((p) =>
        p.id === 'lucas-alvarez' ? { ...p, id: 'lucas-alvarez-2' } : p,
      ),
      unions: familyJson.unions.map((u) => ({
        ...u,
        children: u.children.map((id) => (id === 'lucas-alvarez' ? 'lucas-alvarez-2' : id)),
      })),
    });
    const before = layoutOf('family.json');
    const after = buildTreeLayout(renamed);

    expect(after).not.toEqual(before);
    expect(after.branches[0]).toEqual(before.branches[0]);
    const lucasBefore = before.fruits.find((f) => f.personId === 'lucas-alvarez');
    const lucasAfter = after.fruits.find((f) => f.personId === 'lucas-alvarez-2');
    if (!lucasBefore || !lucasAfter) throw new Error('Lucas is missing');
    expect(lucasAfter.position).not.toEqual(lucasBefore.position);
    expect(distanceXY(lucasAfter.position, lucasBefore.position)).toBeLessThan(
      LAYOUT.branch.baseLength / 2,
    );
  });
});

describe.each(families)('%s', (name, family) => {
  const layout = layoutOf(name);
  const index = indexFamily(family);
  const branches = byId(layout.branches);

  it('gives every blood member exactly one branch and nobody else', () => {
    const owners = layout.branches.flatMap((branch) => (branch.personId ? [branch.personId] : []));
    const blood = [...family.people.keys()].filter((id) => isBlood(index, id));
    expect([...owners].sort()).toEqual([...blood].sort());
  });

  it('gives every person exactly one fruit; grafts hang on their blood partner', () => {
    const fruitOwners = layout.fruits.map((fruit) => fruit.personId);
    expect([...fruitOwners].sort()).toEqual([...family.people.keys()].sort());

    for (const fruit of layout.fruits) {
      const anchorOwner = branches.get(fruit.anchorBranchId)?.personId;
      if (fruit.kind === 'blood') expect(anchorOwner).toBe(fruit.personId);
      else expect(anchorOwner).toBe(bloodPartnerOf(index, fruit.personId));
    }
  });

  it('keeps fruits on different branches at least minDistance apart', () => {
    expect(closeFruitPairs(layout.fruits, LAYOUT.fruit.minDistance)).toEqual([]);
  });

  it('never makes a branch thicker than its parent', () => {
    for (const branch of [...layout.branches, ...layout.roots]) {
      if (branch.parentBranchId === null) continue;
      const parent = branches.get(branch.parentBranchId);
      expect(parent?.radiusStart).toBeGreaterThanOrEqual(branch.radiusStart);
    }
  });

  it('sprouts every branch exactly on its parent curve', () => {
    for (const branch of layout.branches) {
      if (branch.parentBranchId === null) continue;
      const parent = branches.get(branch.parentBranchId);
      if (!parent) throw new Error(`Missing parent of ${branch.id}`);
      const sprout = pointOnCurve(parent.points, branch.parentT);
      const base = branch.points[0];
      expect(base?.x).toBeCloseTo(sprout.x, 9);
      expect(base?.y).toBeCloseTo(sprout.y, 9);
      expect(base?.z).toBeCloseTo(sprout.z, 9);
    }
  });

  it('grows parents before children, in a unique order', () => {
    const orders = layout.branches.map((branch) => branch.order);
    expect(new Set(orders).size).toBe(orders.length);
    for (const branch of layout.branches) {
      if (branch.parentBranchId === null) continue;
      expect(branches.get(branch.parentBranchId)?.order).toBeLessThan(branch.order);
    }
  });

  it('uses 3 to 5 control points per branch', () => {
    for (const branch of layout.branches.filter((b) => b.kind === 'branch')) {
      expect(branch.points.length).toBeGreaterThanOrEqual(3);
      expect(branch.points.length).toBeLessThanOrEqual(5);
    }
  });

  it('is almost flat: depth stays within the configured share of the width', () => {
    const xs = layout.fruits.map((fruit) => fruit.position.x);
    const width = Math.max(...xs) - Math.min(...xs);
    for (const branch of layout.branches) {
      for (const point of branch.points) {
        expect(Math.abs(point.z)).toBeLessThanOrEqual(LAYOUT.depth.ratio * width * 1.2);
      }
    }
  });

  it('grows the crown above the ground and the roots into it', () => {
    for (const fruit of layout.fruits) expect(fruit.position.y).toBeGreaterThan(0);
    expect(layout.roots.length).toBeGreaterThanOrEqual(LAYOUT.roots.minCount);
    expect(layout.roots.length).toBeLessThanOrEqual(LAYOUT.roots.maxCount);
    for (const root of layout.roots) expect(root.points.at(-1)?.y).toBeLessThan(0);
  });

  it('puts foliage on every branch and everything inside the bounds', () => {
    const personBranches = layout.branches.filter((b) => b.generation > 0 && b.personId);
    const leafy = new Set(layout.leafClusters.map((cluster) => cluster.branchId));
    for (const branch of personBranches) expect(leafy.has(branch.id)).toBe(true);

    const { min, max } = layout.bounds;
    for (const { position: p } of layout.fruits) {
      expect(p.x).toBeGreaterThan(min.x);
      expect(p.y).toBeGreaterThan(min.y);
      expect(p.x).toBeLessThan(max.x);
      expect(p.y).toBeLessThan(max.y);
    }
  });
});

describe('shape', () => {
  it('starts the trunk on the ground and hangs the root couple from it', () => {
    const layout = layoutOf('family.json');
    const trunk = layout.branches[0];
    expect(trunk?.kind).toBe('trunk');
    expect(trunk?.points[0]).toEqual({ x: 0, y: 0, z: 0 });

    const rootCouple = layout.branches.filter((b) => b.generation === 0 && b.personId);
    expect(rootCouple.map((b) => b.personId)).toEqual(['jose-gomez', 'rosa-manco']);
    for (const twig of rootCouple) expect(twig.parentBranchId).toBe(trunk?.id);
  });

  it('makes branches carrying more family thicker', () => {
    const branches = byId(layoutOf('family.json').branches);
    const radius = (id: string): number => branches.get(`branch-${id}`)?.radiusStart ?? 0;
    expect(radius('carlos-gomez')).toBeGreaterThan(radius('andres-gomez'));
    expect(radius('andres-gomez')).toBeGreaterThan(radius('tomas-gomez'));
    expect(branches.get('trunk')?.radiusStart).toBeGreaterThan(radius('carlos-gomez'));
  });

  it('spreads siblings in birth order, left to right', () => {
    const fruits = layoutOf('family.json').fruits;
    const x = (id: string): number => fruits.find((f) => f.personId === id)?.position.x ?? NaN;
    expect(x('carlos-gomez')).toBeLessThan(x('lucia-gomez'));
    expect(x('lucia-gomez')).toBeLessThan(x('jorge-gomez'));
  });

  it('handles a lone founder with no children', () => {
    const lone = makeFamily([person('solo')], [union('u-solo', ['solo'])], 'u-solo');
    const layout = buildTreeLayout(lone);
    expect(layout.fruits.map((f) => f.personId)).toEqual(['solo']);
    expect(layout.branches.map((b) => b.kind)).toEqual(['trunk', 'branch']);
  });

  it('builds a 150-person family in under 50 ms', () => {
    const big = syntheticFamily(150, 'perf');
    buildTreeLayout(big);
    // The fastest of several runs: a busy machine slows some of them, never the layout itself.
    const runs = Array.from({ length: 5 }, () => {
      const start = performance.now();
      buildTreeLayout(big);
      return performance.now() - start;
    });
    expect(Math.min(...runs)).toBeLessThan(50);
  });
});
