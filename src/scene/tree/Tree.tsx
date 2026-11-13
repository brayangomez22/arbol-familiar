import { useMemo, useRef } from 'react';
import { INTRO, TIMELINE, WIND } from '@/config/constants';
import { livePalette } from '../ambient/livePalette';
import type { PersonId } from '@/domain/types';
import { growthSchedule } from '@/layout/growth';
import { measureReach, swayWeight } from '@/layout/reach';
import { timelineSchedule } from '@/layout/timelineGrowth';
import type { TreeLayout } from '@/layout/types';
import { IntroDirector } from '../intro/IntroDirector';
import { SelectionDirector } from '../selection/SelectionDirector';
import type { FamilyTime } from '../timeline/familyTime';
import { TimelineDirector } from '../timeline/TimelineDirector';
import { BranchMesh, type BranchMeshHandle } from './BranchMesh';
import type { WoodMeasure } from './branchGeometry';
import { BirthdayBlossoms } from './BirthdayBlossoms';
import type { BlossomTiming } from './Blossoms';
import { CrownLeafFall } from './CrownLeafFall';
import { Fruits } from './Fruits';
import { Leaves } from './Leaves';
import { MemorialLeafFall } from './MemorialLeafFall';
import { SeasonBlossoms } from './SeasonBlossoms';

interface TreeProps {
  readonly layout: TreeLayout;
  /** Display name of each person, as shown under their fruit. */
  readonly labels: ReadonlyMap<PersonId, string>;
  readonly time: FamilyTime;
}

export function Tree({ layout, labels, time }: TreeProps) {
  const reach = useMemo(() => measureReach(layout.branches, WIND.curveSamples), [layout.branches]);
  const schedule = useMemo(
    () => growthSchedule(layout.branches, reach, INTRO.growth),
    [layout.branches, reach],
  );
  const timeline = useMemo(
    () =>
      timelineSchedule(
        layout.branches,
        reach,
        (id) => time.lives.get(id)?.appearYear,
        time.range.first,
        TIMELINE,
      ),
    [layout.branches, reach, time],
  );
  const wood = useMemo<WoodMeasure>(
    () => ({
      reachAt: (branchId, u) => reach.atFraction(branchId, u),
      swayOf: (value) => swayWeight(value, reach.max, WIND.weightExponent),
      growAt: (branchId, u) => schedule.atFraction(branchId, u),
      bornYearAt: (branchId, u) => timeline.atFraction(branchId, u),
    }),
    [reach, schedule, timeline],
  );
  // Roots stay still in the ground, but spread out as the trunk sprouts.
  const roots = useMemo<WoodMeasure>(
    () => ({ reachAt: () => 0, swayOf: () => 0, growAt: (_, u) => u * INTRO.growth.rootDuration }),
    [],
  );
  const blossomTiming = useMemo<BlossomTiming>(
    () => ({ reach, schedule, timeline }),
    [reach, schedule, timeline],
  );
  const branches = useRef<BranchMeshHandle>(null);

  return (
    <>
      <BranchMesh segments={layout.roots} color={livePalette.trunkShadow} wood={roots} />
      <BranchMesh
        ref={branches}
        segments={layout.branches}
        color={livePalette.trunk}
        wood={wood}
        sap
      />
      <Leaves
        clusters={layout.leafClusters}
        fruits={layout.fruits}
        reach={reach}
        schedule={schedule}
        timeline={timeline}
      />
      <SeasonBlossoms clusters={layout.leafClusters} timing={blossomTiming} />
      <BirthdayBlossoms
        fruits={layout.fruits}
        branches={layout.branches}
        timing={blossomTiming}
        time={time}
      />
      <CrownLeafFall clusters={layout.leafClusters} branches={layout.branches} />
      <MemorialLeafFall
        clusters={layout.leafClusters}
        branches={layout.branches}
        fruits={layout.fruits}
        lives={time.lives}
      />
      <Fruits
        fruits={layout.fruits}
        branches={layout.branches}
        labels={labels}
        reach={reach}
        schedule={schedule}
        timeline={timeline}
        lives={time.lives}
      />
      <SelectionDirector layout={layout} reach={reach} branches={branches} />
      <IntroDirector layout={layout} schedule={schedule} />
      <TimelineDirector time={time} />
    </>
  );
}
