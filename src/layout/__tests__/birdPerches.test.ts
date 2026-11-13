import { describe, expect, it } from 'vitest';
import { BIRD } from '@/config/constants';
import { birdPerches } from '../birdPerches';
import type { BranchSegment, FruitPlacement } from '../types';

function branch(id: string, points: [number, number][], radius = 0.3): BranchSegment {
  return {
    id,
    kind: 'branch',
    parentBranchId: 'trunk',
    parentT: 1,
    points: points.map(([x, y]) => ({ x, y, z: 0 })),
    radiusStart: radius,
    radiusEnd: radius,
    generation: 1,
    personId: id,
    order: 1,
  };
}

const level = branch('level', [
  [0, 10],
  [5, 10.5],
  [10, 11],
]);
const steep = branch('steep', [
  [0, 10],
  [1, 15],
  [2, 20],
]);

describe('birdPerches', () => {
  it('perches on top of level wood and never on steep wood', () => {
    const perches = birdPerches([level, steep], [], [], BIRD.perch);
    expect(perches.map((perch) => perch.branchId)).toEqual(['level']);
    const [perch] = perches;
    // On the bark, not inside it: the branch's center line is at y ≈ 10–11 here.
    expect(perch?.position.y).toBeGreaterThan(10 + 0.3 - 0.01);
  });

  it('keeps clear of fruits', () => {
    const fruit = (x: number, y: number): FruitPlacement => ({
      personId: 'p',
      position: { x, y, z: 0 },
      size: 1,
      kind: 'blood',
      anchorBranchId: 'level',
    });
    const covered = Array.from({ length: 11 }, (_, i) => fruit(i, 10.5));
    expect(birdPerches([level], covered, [], BIRD.perch)).toEqual([]);
  });

  it('stays out of the leaves, where nobody would see it', () => {
    const crown = {
      branchId: 'level',
      branchT: 0.5,
      position: { x: 5, y: 10.5, z: -3 },
      radius: 6,
      density: 1,
    };
    expect(birdPerches([level], [], [crown], BIRD.perch)).toEqual([]);
  });

  it('skips twigs too thin to sit on, and the trunk', () => {
    const twig = branch(
      'twig',
      [
        [0, 0],
        [5, 0.2],
        [10, 0.4],
      ],
      0.02,
    );
    const trunk = { ...level, id: 'trunk', kind: 'trunk' as const };
    expect(birdPerches([twig, trunk], [], [], BIRD.perch)).toEqual([]);
  });

  it('is deterministic', () => {
    expect(birdPerches([level, steep], [], [], BIRD.perch)).toEqual(
      birdPerches([level, steep], [], [], BIRD.perch),
    );
  });
});
