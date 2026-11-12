import { useMemo, useRef } from 'react';
import { WIND } from '@/config/constants';
import { dayPalette } from '@/config/theme';
import type { PersonId } from '@/domain/types';
import { measureReach, swayWeight } from '@/layout/reach';
import type { TreeLayout } from '@/layout/types';
import { SelectionDirector } from '../selection/SelectionDirector';
import { BranchMesh, type BranchMeshHandle } from './BranchMesh';
import type { WoodMeasure } from './branchGeometry';
import { Fruits } from './Fruits';
import { Leaves } from './Leaves';

interface TreeProps {
  readonly layout: TreeLayout;
  /** Display name of each person, as shown under their fruit. */
  readonly labels: ReadonlyMap<PersonId, string>;
}

export function Tree({ layout, labels }: TreeProps) {
  const reach = useMemo(() => measureReach(layout.branches, WIND.curveSamples), [layout.branches]);
  const wood = useMemo<WoodMeasure>(
    () => ({
      reachAt: (branchId, u) => reach.atFraction(branchId, u),
      swayOf: (value) => swayWeight(value, reach.max, WIND.weightExponent),
    }),
    [reach],
  );
  const branches = useRef<BranchMeshHandle>(null);

  return (
    <>
      {/* Roots get no measure: they stay still in the ground and carry no sap. */}
      <BranchMesh segments={layout.roots} color={dayPalette.trunkShadow} />
      <BranchMesh ref={branches} segments={layout.branches} color={dayPalette.trunk} wood={wood} />
      <Leaves clusters={layout.leafClusters} fruits={layout.fruits} reach={reach} />
      <Fruits fruits={layout.fruits} branches={layout.branches} labels={labels} reach={reach} />
      <SelectionDirector layout={layout} reach={reach} branches={branches} />
    </>
  );
}
