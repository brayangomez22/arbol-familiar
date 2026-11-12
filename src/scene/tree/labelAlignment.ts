import type { PersonId } from '@/domain/types';
import type { FruitPlacement } from '@/layout/types';

/** Which way a name runs from its anchor: centered under the fruit, or toward one side. */
export type LabelAlign = 'center' | 'left' | 'right';

/**
 * A couple's fruits hang side by side, closer than two names are wide. So each name runs away from
 * its partner: a graft to the right of its blood fruit is left-aligned (it grows rightward), and the
 * blood fruit's name grows leftward. A blood fruit with grafts on both sides stays centered.
 */
export function labelAlignments(fruits: readonly FruitPlacement[]): Map<PersonId, LabelAlign> {
  const bloodByBranch = new Map(
    fruits.filter((fruit) => fruit.kind === 'blood').map((fruit) => [fruit.anchorBranchId, fruit]),
  );
  const alignments = new Map<PersonId, LabelAlign>();
  const graftSides = new Map<PersonId, Set<LabelAlign>>();

  for (const fruit of fruits) {
    if (fruit.kind !== 'graft') continue;
    const blood = bloodByBranch.get(fruit.anchorBranchId);
    if (!blood) {
      alignments.set(fruit.personId, 'center');
      continue;
    }
    const side: LabelAlign = fruit.position.x >= blood.position.x ? 'left' : 'right';
    alignments.set(fruit.personId, side);
    const sides = graftSides.get(blood.personId) ?? new Set<LabelAlign>();
    sides.add(side);
    graftSides.set(blood.personId, sides);
  }

  for (const fruit of fruits) {
    if (fruit.kind !== 'blood') continue;
    const sides = graftSides.get(fruit.personId);
    // Grafts on the right ('left'-aligned) push the blood name leftward ('right'-aligned).
    const only = sides?.size === 1 ? [...sides][0] : undefined;
    alignments.set(
      fruit.personId,
      only === 'left' ? 'right' : only === 'right' ? 'left' : 'center',
    );
  }
  return alignments;
}
