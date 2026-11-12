import { useMemo, useRef } from 'react';
import { INTRO, WIND } from '@/config/constants';
import { dayPalette } from '@/config/theme';
import type { PersonId } from '@/domain/types';
import { growthSchedule } from '@/layout/growth';
import { measureReach, swayWeight } from '@/layout/reach';
import type { TreeLayout } from '@/layout/types';
import { IntroDirector } from '../intro/IntroDirector';
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
  const schedule = useMemo(
    () => growthSchedule(layout.branches, reach, INTRO.growth),
    [layout.branches, reach],
  );
  const wood = useMemo<WoodMeasure>(
    () => ({
      reachAt: (branchId, u) => reach.atFraction(branchId, u),
      swayOf: (value) => swayWeight(value, reach.max, WIND.weightExponent),
      growAt: (branchId, u) => schedule.atFraction(branchId, u),
    }),
    [reach, schedule],
  );
  // Roots stay still in the ground, but spread out as the trunk sprouts.
  const roots = useMemo<WoodMeasure>(
    () => ({ reachAt: () => 0, swayOf: () => 0, growAt: (_, u) => u * INTRO.growth.rootDuration }),
    [],
  );
  const branches = useRef<BranchMeshHandle>(null);

  return (
    <>
      <BranchMesh segments={layout.roots} color={dayPalette.trunkShadow} wood={roots} />
      <BranchMesh
        ref={branches}
        segments={layout.branches}
        color={dayPalette.trunk}
        wood={wood}
        sap
      />
      <Leaves
        clusters={layout.leafClusters}
        fruits={layout.fruits}
        reach={reach}
        schedule={schedule}
      />
      <Fruits
        fruits={layout.fruits}
        branches={layout.branches}
        labels={labels}
        reach={reach}
        schedule={schedule}
      />
      <SelectionDirector layout={layout} reach={reach} branches={branches} />
      <IntroDirector layout={layout} schedule={schedule} />
    </>
  );
}
