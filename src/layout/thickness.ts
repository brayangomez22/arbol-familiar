import type { LayoutConfig } from '@/config/constants';
import type { PersonId } from '@/domain/types';
import type { FamilyTree, TreeNode } from './familyTree';

export interface BranchRadius {
  readonly start: number;
  readonly end: number;
}

export interface TreeRadii {
  readonly trunk: BranchRadius;
  readonly byPerson: ReadonlyMap<PersonId, BranchRadius>;
}

/**
 * Pipe model: a branch carries as much "sap area" as everything it feeds, r^e = Σ r_child^e.
 * Every branch ends at the tip radius, so thickness grows only with the family hanging from it.
 */
export function computeRadii(
  tree: FamilyTree,
  config: LayoutConfig['branch'],
  trunkFlare: number,
): TreeRadii {
  const { tipRadius, leafTaper, pipeExponent } = config;
  const byPerson = new Map<PersonId, BranchRadius>();

  const combine = (radii: readonly number[]): number =>
    Math.pow(
      radii.reduce((sum, r) => sum + Math.pow(r, pipeExponent), 0),
      1 / pipeExponent,
    );

  const radiusOf = (node: TreeNode): number => {
    const childRadii = node.children.map(radiusOf);
    const start =
      childRadii.length === 0 ? tipRadius * leafTaper : combine([tipRadius, ...childRadii]);
    byPerson.set(node.personId, { start, end: tipRadius });
    return start;
  };

  const top = combine([...tree.rootPartners, ...tree.limbs].map(radiusOf));
  return { trunk: { start: top * trunkFlare, end: top }, byPerson };
}
