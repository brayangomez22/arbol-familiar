import type { RefObject } from 'react';
import { dayPalette } from '@/config/theme';
import type { TreeLayout } from '@/layout/types';
import { BoundsOutline } from './BoundsOutline';
import { BranchLines } from './BranchLines';
import { DebugCamera } from './DebugCamera';
import { FruitMarkers } from './FruitMarkers';
import { LabelProjector } from './LabelProjector';
import { LeafClusterRings } from './LeafClusterRings';

interface LayoutDebugSceneProps {
  readonly layout: TreeLayout;
  /** Present when name tags are shown. */
  readonly labelRefs: RefObject<(HTMLElement | null)[]> | null;
}

export function LayoutDebugScene({ layout, labelRefs }: LayoutDebugSceneProps) {
  const leafColor = dayPalette.leaves[0] ?? dayPalette.ink;
  return (
    <>
      <DebugCamera bounds={layout.bounds} />
      <BoundsOutline bounds={layout.bounds} groundColor={dayPalette.ground} boxColor={leafColor} />
      <LeafClusterRings clusters={layout.leafClusters} color={leafColor} />
      <BranchLines branches={layout.roots} color={dayPalette.trunkShadow} />
      <BranchLines branches={layout.branches} color={dayPalette.trunk} />
      <FruitMarkers fruits={layout.fruits} />
      {labelRefs && <LabelProjector fruits={layout.fruits} labelRefs={labelRefs} />}
    </>
  );
}
