import { describe, expect, it } from 'vitest';
import type { FruitPlacement } from '@/layout/types';
import { labelAlignments } from '../tree/labelAlignment';

function fruit(personId: string, x: number, kind: FruitPlacement['kind'], branch: string) {
  return { personId, position: { x, y: 0, z: 0 }, size: 1, kind, anchorBranchId: branch };
}

describe('labelAlignments', () => {
  it('runs a couple’s names away from each other', () => {
    const result = labelAlignments([
      fruit('jorge', 0, 'blood', 'b1'),
      fruit('patricia', 2, 'graft', 'b1'),
    ]);
    expect(result.get('jorge')).toBe('right');
    expect(result.get('patricia')).toBe('left');
  });

  it('mirrors when the graft hangs on the left', () => {
    const result = labelAlignments([
      fruit('ana', 0, 'blood', 'b1'),
      fruit('luis', -2, 'graft', 'b1'),
    ]);
    expect(result.get('ana')).toBe('left');
    expect(result.get('luis')).toBe('right');
  });

  it('centers single people and blood fruits with grafts on both sides', () => {
    const result = labelAlignments([
      fruit('solo', 10, 'blood', 'b2'),
      fruit('eva', 0, 'blood', 'b1'),
      fruit('p1', -2, 'graft', 'b1'),
      fruit('p2', 2, 'graft', 'b1'),
    ]);
    expect(result.get('solo')).toBe('center');
    expect(result.get('eva')).toBe('center');
  });
});
