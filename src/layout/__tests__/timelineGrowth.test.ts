import { describe, expect, it } from 'vitest';
import familyJson from '@/data/family.json';
import { loadFamily } from '@/data/loadFamily';
import { syntheticFamily } from '@/dev/syntheticFamily';
import { indexFamily } from '@/domain/genealogy';
import { lifelines, timelineRange } from '@/domain/timeline';
import type { Family } from '@/domain/types';
import { buildTreeLayout } from '../buildTreeLayout';
import { measureReach } from '../reach';
import { timelineSchedule } from '../timelineGrowth';

const CONFIG = { growYears: 3 };
const CURRENT_YEAR = 2026;

const families: [string, Family][] = [
  ['family.json', loadFamily(familyJson)],
  ['synthetic 150', syntheticFamily(150, 'c')],
];

describe.each(families)('timelineSchedule (%s)', (_, family) => {
  const layout = buildTreeLayout(family);
  const reach = measureReach(layout.branches, 32);
  const lines = lifelines(indexFamily(family), CURRENT_YEAR);
  const { first } = timelineRange(lines, CURRENT_YEAR);
  const appearYearOf = (id: string) => lines.get(id)?.appearYear;
  const schedule = timelineSchedule(layout.branches, reach, appearYearOf, first, CONFIG);
  const byId = new Map(layout.branches.map((branch) => [branch.id, branch]));

  it('has the trunk complete at the start of the timeline', () => {
    const trunk = layout.branches.find((branch) => branch.kind === 'trunk');
    expect(trunk && schedule.atFraction(trunk.id, 1)).toBe(first);
  });

  it('grows each branch from base to tip over the configured years', () => {
    for (const branch of layout.branches) {
      const span = schedule.atFraction(branch.id, 1) - schedule.atFraction(branch.id, 0);
      expect(span).toBeCloseTo(CONFIG.growYears);
    }
  });

  it('brings each tip no earlier than its person is born', () => {
    for (const branch of layout.branches) {
      if (branch.personId === null) continue;
      const appear = appearYearOf(branch.personId) ?? first;
      expect(schedule.atFraction(branch.id, 1)).toBeGreaterThanOrEqual(appear - 1e-9);
    }
  });

  it('brings the tip exactly on the birth year when the parent is already there', () => {
    let exact = 0;
    for (const branch of layout.branches) {
      if (branch.personId === null) continue;
      const appear = appearYearOf(branch.personId) ?? first;
      if (Math.abs(schedule.atFraction(branch.id, 1) - appear) < 1e-9) exact += 1;
    }
    // Most people are born years after the point their branch sprouts from exists.
    expect(exact).toBeGreaterThan(layout.branches.length / 2);
  });

  it('never starts a branch before the point it sprouts from exists', () => {
    for (const branch of layout.branches) {
      if (branch.parentBranchId === null || !byId.has(branch.parentBranchId)) continue;
      const fork = schedule.atParameter(branch.parentBranchId, branch.parentT);
      expect(schedule.atFraction(branch.id, 0)).toBeGreaterThanOrEqual(fork - 1e-6);
    }
  });

  it('is deterministic', () => {
    const again = timelineSchedule(layout.branches, reach, appearYearOf, first, CONFIG);
    for (const branch of layout.branches) {
      expect(again.atFraction(branch.id, 0.5)).toBe(schedule.atFraction(branch.id, 0.5));
    }
  });
});
