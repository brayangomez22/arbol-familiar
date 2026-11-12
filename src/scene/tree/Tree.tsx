import { dayPalette } from '@/config/theme';
import type { PersonId } from '@/domain/types';
import type { TreeLayout } from '@/layout/types';
import { BranchMesh } from './BranchMesh';
import { Fruits } from './Fruits';
import { Leaves } from './Leaves';

interface TreeProps {
  readonly layout: TreeLayout;
  /** Display name of each person, as shown under their fruit. */
  readonly labels: ReadonlyMap<PersonId, string>;
}

export function Tree({ layout, labels }: TreeProps) {
  return (
    <>
      <BranchMesh segments={layout.roots} color={dayPalette.trunkShadow} />
      <BranchMesh segments={layout.branches} color={dayPalette.trunk} />
      <Leaves clusters={layout.leafClusters} fruits={layout.fruits} />
      <Fruits fruits={layout.fruits} branches={layout.branches} labels={labels} />
    </>
  );
}
