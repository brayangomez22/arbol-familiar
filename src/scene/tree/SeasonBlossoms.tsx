import { useEffect, useMemo } from 'react';
import { BLOSSOMS } from '@/config/constants';
import { placeClusterBlossoms } from '@/layout/blossoms';
import type { LeafCluster } from '@/layout/types';
import { ambientUniforms, livePalette } from '../ambient/livePalette';
import { FULLY_GROWN } from '../intro/growthUniforms';
import { BlossomMaterial } from '../materials/BlossomMaterial';
import { Blossoms, type BlossomTiming } from './Blossoms';

interface SeasonBlossomsProps {
  readonly clusters: readonly LeafCluster[];
  readonly timing: BlossomTiming;
}

/** Always open: the season's density alone decides how many show. */
const ALL_OPEN = { value: FULLY_GROWN };

const isSpring = () => ambientUniforms.uBlossomDensity.value > 0;

/** Spring flowers over the crown; they open and close as the season's density eases. */
export function SeasonBlossoms({ clusters, timing }: SeasonBlossomsProps) {
  const blossoms = useMemo(() => placeClusterBlossoms(clusters, BLOSSOMS.season), [clusters]);
  const material = useMemo(
    () =>
      new BlossomMaterial({
        petals: livePalette.blossom,
        heart: livePalette.blossomHeart,
        edge: livePalette.outline,
        density: ambientUniforms.uBlossomDensity,
        bloomTime: ALL_OPEN,
      }),
    [],
  );
  useEffect(
    () => () => {
      material.dispose();
    },
    [material],
  );

  return <Blossoms blossoms={blossoms} timing={timing} material={material} isShown={isSpring} />;
}
