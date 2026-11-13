import { useMemo } from 'react';
import { FALLING_LEAVES, SEASON_LOOK } from '@/config/constants';
import { QUALITY } from '@/config/quality';
import { useSeason } from '@/hooks/useAmbient';
import type { BranchSegment, LeafCluster } from '@/layout/types';
import { useAppStore } from '@/state/store';
import { livePalette } from '../ambient/livePalette';
import { FallingLeaves } from './FallingLeaves';

interface CrownLeafFallProps {
  readonly clusters: readonly LeafCluster[];
  readonly branches: readonly BranchSegment[];
}

/** Leaves of the season letting go of the crown: many more in autumn, fewer in winter. */
export function CrownLeafFall({ clusters, branches }: CrownLeafFallProps) {
  const slots = useAppStore((state) => QUALITY[state.qualityTier].fallingLeaves);
  const { fallWait } = SEASON_LOOK[useSeason()];
  const config = useMemo(
    () => ({
      ...FALLING_LEAVES,
      firstWait: scaleRange(FALLING_LEAVES.firstWait, fallWait),
      wait: scaleRange(FALLING_LEAVES.wait, fallWait),
    }),
    [fallWait],
  );

  return (
    <FallingLeaves
      clusters={clusters}
      branches={branches}
      colors={livePalette.leaves}
      slots={slots}
      config={config}
    />
  );
}

function scaleRange(
  [min, max]: readonly [number, number],
  factor: number,
): readonly [number, number] {
  return [min * factor, max * factor];
}
