import type { LayoutConfig } from '@/config/constants';
import { chordAngle, last, tipDirection, type GrownBranch } from './branchShape';
import { createRandom } from './random';
import type { FruitPlacement } from './types';
import { add, distanceXY, scale, vec3 } from './vec';

/**
 * A blood fruit hangs just past its branch tip. Its grafts hang beside it, across the tip direction.
 * A single graft goes on the side the branch turns away from its parent, where its fan has room;
 * several alternate left and right in union order.
 */
export function placeFruits(
  branches: readonly GrownBranch[],
  config: LayoutConfig['fruit'],
): FruitPlacement[] {
  const fruits: FruitPlacement[] = [];
  const angleById = new Map(branches.map((branch) => [branch.id, chordAngle(branch.points)]));

  for (const branch of branches) {
    const { node } = branch;
    if (!node) continue;

    const direction = tipDirection(branch.points);
    const position = add(last(branch.points), scale(direction, config.tipOffset));
    fruits.push({
      personId: node.personId,
      position,
      size: fruitSize(node.personId, config.radius, config),
      kind: 'blood',
      anchorBranchId: branch.id,
    });

    const right = vec3(direction.y, -direction.x, 0);
    const rightLength = Math.hypot(right.x, right.y);
    const angle = angleById.get(branch.id) ?? 0;
    const parentAngle = angleById.get(branch.parentBranchId ?? '') ?? 0;
    const awayFromParent = Math.sign(angle - parentAngle) || Math.sign(position.x) || 1;
    node.grafts.forEach((graftId, i) => {
      const single = node.grafts.length === 1;
      const side = single ? awayFromParent : i % 2 === 0 ? -1 : 1;
      const step = single ? 1 : Math.floor(i / 2) + 1;
      fruits.push({
        personId: graftId,
        position: add(position, scale(right, (side * step * config.graftDistance) / rightLength)),
        size: fruitSize(graftId, config.radius * config.graftScale, config),
        kind: 'graft',
        anchorBranchId: branch.id,
      });
    });
  }
  return fruits;
}

/** Larger than any grid row count, so (x, y) cells map to distinct numeric keys. */
const GRID_KEY_STRIDE = 1 << 20;

export interface FruitPair {
  readonly a: FruitPlacement;
  readonly b: FruitPlacement;
  readonly distance: number;
}

/**
 * Pairs of fruits on different branches closer than `minDistance` on the front view. Fruits on the
 * same branch (a person and their grafts) are spaced by design, so they are not compared.
 */
export function closeFruitPairs(
  fruits: readonly FruitPlacement[],
  minDistance: number,
): FruitPair[] {
  // Bucket fruits in a grid of minDistance cells: only neighbouring cells can hold close pairs.
  const cellOf = (value: number): number => Math.floor(value / minDistance);
  const keyOf = (cellX: number, cellY: number): number => cellX * GRID_KEY_STRIDE + cellY;
  const grid = new Map<number, number[]>();
  fruits.forEach((fruit, i) => {
    const key = keyOf(cellOf(fruit.position.x), cellOf(fruit.position.y));
    const cell = grid.get(key);
    if (cell) cell.push(i);
    else grid.set(key, [i]);
  });

  const pairs: FruitPair[] = [];
  fruits.forEach((a, i) => {
    const cellX = cellOf(a.position.x);
    const cellY = cellOf(a.position.y);
    for (let dx = -1; dx <= 1; dx++) {
      for (let dy = -1; dy <= 1; dy++) {
        for (const j of grid.get(keyOf(cellX + dx, cellY + dy)) ?? []) {
          const b = fruits[j];
          if (j <= i || !b || a.anchorBranchId === b.anchorBranchId) continue;
          const distance = distanceXY(a.position, b.position);
          if (distance < minDistance) pairs.push({ a, b, distance });
        }
      }
    }
  });
  return pairs;
}

/** Closest front-view distance between fruits on different branches; Infinity if there is no pair. */
export function closestFruitDistance(fruits: readonly FruitPlacement[]): number {
  let closest = Infinity;
  fruits.forEach((a, i) => {
    for (const b of fruits.slice(i + 1)) {
      if (a.anchorBranchId !== b.anchorBranchId) {
        closest = Math.min(closest, distanceXY(a.position, b.position));
      }
    }
  });
  return closest;
}

function fruitSize(personId: string, radius: number, config: LayoutConfig['fruit']): number {
  return radius * (1 + createRandom(personId, 'fruit').signed() * config.sizeJitter);
}
