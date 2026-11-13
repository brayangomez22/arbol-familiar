import { describe, expect, it } from 'vitest';
import { FALLING_LEAVES, LAYOUT } from '@/config/constants';
import familyJson from '@/data/family.json';
import { loadFamily } from '@/data/loadFamily';
import { buildTreeLayout } from '../buildTreeLayout';
import {
  clustersNear,
  createLeafPose,
  leafFallPose,
  planLeafFall,
  type FallSurroundings,
  type LeafFall,
} from '../fallingLeaves';
import type { LeafCluster } from '../types';
import { normalize, vec3 } from '../vec';

const layout = buildTreeLayout(loadFamily(familyJson));
const groundAt = (x: number) => -0.01 * x * x;
const surroundings: FallSurroundings = {
  clusters: layout.leafClusters,
  groundAt,
  downwind: normalize(vec3(1, 0, 0.2)),
  depthScale: LAYOUT.leaf.depthScale,
  colorCount: 4,
};

function plan(slot: number, cycle: number, after = 0): LeafFall {
  const fall = planLeafFall(slot, cycle, after, surroundings, FALLING_LEAVES);
  if (!fall) throw new Error('expected a fall');
  return fall;
}

const pose = (fall: LeafFall, time: number) =>
  leafFallPose(fall, time, FALLING_LEAVES, createLeafPose());

describe('planLeafFall', () => {
  it('is deterministic per slot and cycle', () => {
    expect(plan(2, 5, 30)).toEqual(plan(2, 5, 30));
    expect(plan(2, 5, 30)).not.toEqual(plan(3, 5, 30));
    expect(plan(2, 5, 30)).not.toEqual(plan(2, 6, 30));
  });

  it('waits after the previous leaf and keeps its pieces in order', () => {
    for (let cycle = 0; cycle < 20; cycle++) {
      const fall = plan(0, cycle, 100);
      const [min, max] = cycle === 0 ? FALLING_LEAVES.firstWait : FALLING_LEAVES.wait;
      expect(fall.start).toBeGreaterThanOrEqual(100 + min);
      expect(fall.start).toBeLessThan(100 + max);
      expect(fall.end).toBeCloseTo(fall.start + fall.fallTime + fall.lie + FALLING_LEAVES.vanish);
      expect(fall.colorIndex).toBeGreaterThanOrEqual(0);
      expect(fall.colorIndex).toBeLessThan(surroundings.colorCount);
    }
  });

  it('lets go from the crown and rests on the ground, downwind', () => {
    for (let cycle = 0; cycle < 20; cycle++) {
      const fall = plan(1, cycle);
      expect(fall.origin.y).toBeGreaterThan(fall.rest.y);
      expect(fall.rest.y).toBeCloseTo(groundAt(fall.rest.x) + FALLING_LEAVES.restHeight, 6);
      expect(fall.rest.x).toBeGreaterThanOrEqual(fall.origin.x);
    }
  });

  it('has nothing to drop without foliage', () => {
    expect(planLeafFall(0, 0, 0, { ...surroundings, clusters: [] }, FALLING_LEAVES)).toBeNull();
  });
});

describe('leafFallPose', () => {
  const fall = plan(0, 3);
  const landing = fall.start + fall.fallTime;

  it('is hidden before it lets go and after it is gone', () => {
    expect(pose(fall, fall.start - 0.01).scale).toBe(0);
    expect(pose(fall, fall.end).scale).toBe(0);
    expect(pose(fall, fall.start + FALLING_LEAVES.appear).scale).toBeCloseTo(fall.size);
  });

  it('starts at its origin, still', () => {
    const first = pose(fall, fall.start);
    expect(first.x).toBeCloseTo(fall.origin.x);
    expect(first.y).toBeCloseTo(fall.origin.y);
    expect(first.z).toBeCloseTo(fall.origin.z);
  });

  it('only ever goes down, and lies still where it was meant to rest', () => {
    let previous = Infinity;
    for (let time = fall.start; time <= landing; time += 0.05) {
      const { y } = pose(fall, time);
      expect(y).toBeLessThanOrEqual(previous + 1e-9);
      previous = y;
    }
    const landed = pose(fall, landing);
    const later = pose(fall, landing + fall.lie / 2);
    for (const resting of [landed, later]) {
      expect(resting.x).toBeCloseTo(fall.rest.x, 6);
      expect(resting.y).toBeCloseTo(fall.rest.y, 6);
      expect(resting.z).toBeCloseTo(fall.rest.z, 6);
      expect(resting.roll).toBeCloseTo(fall.restRoll, 6);
      expect(resting.pitch).toBeCloseTo(-(Math.PI / 2 - FALLING_LEAVES.restTilt), 6);
    }
  });

  it('moves smoothly: no jumps between close frames', () => {
    const step = 1 / 60;
    const maxMove = 0.2;
    for (let time = fall.start; time < fall.end - step; time += step) {
      const a = { ...pose(fall, time) };
      const b = pose(fall, time + step);
      expect(Math.hypot(b.x - a.x, b.y - a.y, b.z - a.z)).toBeLessThan(maxMove);
      expect(Math.abs(b.roll - a.roll)).toBeLessThan(maxMove);
      expect(Math.abs(b.pitch - a.pitch)).toBeLessThan(maxMove);
      expect(Math.abs(b.spin - a.spin)).toBeLessThan(maxMove);
    }
  });
});

describe('clustersNear', () => {
  const cluster = (branchId: string, x: number): LeafCluster => ({
    branchId,
    branchT: 0.5,
    position: vec3(x, 0, 0),
    radius: 1,
    density: 1,
  });
  const clusters = [cluster('a', 0), cluster('b', 5), cluster('b', 6), cluster('c', 20)];

  it('takes the clusters of the branch itself', () => {
    expect(clustersNear(clusters, 'b', vec3(100, 0, 0), 1).map((c) => c.position.x)).toEqual([
      5, 6,
    ]);
  });

  it('falls back to the nearest clusters when the branch has none', () => {
    expect(clustersNear(clusters, 'trunk', vec3(4, 0, 0), 2).map((c) => c.position.x)).toEqual([
      5, 6,
    ]);
  });
});
