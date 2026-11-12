import { useMemo } from 'react';
import { WIND } from '@/config/constants';
import { dayPalette } from '@/config/theme';
import type { PersonId } from '@/domain/types';
import { measureReach, swayWeight } from '@/layout/reach';
import type { TreeLayout } from '@/layout/types';
import { BranchMesh } from './BranchMesh';
import type { SwayAt } from './branchGeometry';
import { Fruits } from './Fruits';
import { Leaves } from './Leaves';

interface TreeProps {
  readonly layout: TreeLayout;
  /** Display name of each person, as shown under their fruit. */
  readonly labels: ReadonlyMap<PersonId, string>;
}

export function Tree({ layout, labels }: TreeProps) {
  const reach = useMemo(() => measureReach(layout.branches, WIND.curveSamples), [layout.branches]);
  const swayAt = useMemo<SwayAt>(
    () => (branchId, u) =>
      swayWeight(reach.atFraction(branchId, u), reach.max, WIND.weightExponent),
    [reach],
  );

  return (
    <>
      {/* Roots get no weights: they stay still in the ground. */}
      <BranchMesh segments={layout.roots} color={dayPalette.trunkShadow} />
      <BranchMesh segments={layout.branches} color={dayPalette.trunk} swayAt={swayAt} />
      <Leaves clusters={layout.leafClusters} fruits={layout.fruits} reach={reach} />
      <Fruits fruits={layout.fruits} branches={layout.branches} labels={labels} reach={reach} />
    </>
  );
}
