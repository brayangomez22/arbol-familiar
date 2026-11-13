import { useMemo } from 'react';
import { Color } from 'three';
import { MEMORIAL_LEAVES } from '@/config/constants';
import { memorialLeaf } from '@/config/theme';
import { lifeStageAt, type Lifeline } from '@/domain/timeline';
import type { PersonId } from '@/domain/types';
import { clustersNear } from '@/layout/fallingLeaves';
import type { BranchSegment, FruitPlacement, LeafCluster } from '@/layout/types';
import { useAppStore } from '@/state/store';
import { FallingLeaves } from './FallingLeaves';

interface MemorialLeafFallProps {
  readonly clusters: readonly LeafCluster[];
  readonly branches: readonly BranchSegment[];
  readonly fruits: readonly FruitPlacement[];
  readonly lives: ReadonlyMap<PersonId, Lifeline>;
}

/** The leaf's four tones, all the same gold. */
const GOLD = new Color(memorialLeaf);
const GOLD_TONES = [GOLD, GOLD, GOLD, GOLD];

/** A golden leaf, once in a long while, near those who have passed in the year the tree shows. */
export function MemorialLeafFall({ clusters, branches, fruits, lives }: MemorialLeafFallProps) {
  // A string key, so the store only re-renders this when the set of people changes.
  const deceasedKey = useAppStore((state) =>
    fruits
      .filter((fruit) => {
        const line = lives.get(fruit.personId);
        return line !== undefined && lifeStageAt(line, state.timelineYear) === 'deceased';
      })
      .map((fruit) => fruit.personId)
      .join(' '),
  );

  const near = useMemo(() => {
    const deceased = new Set(deceasedKey.split(' '));
    const unique = new Set(
      fruits
        .filter((fruit) => deceased.has(fruit.personId))
        .flatMap((fruit) =>
          clustersNear(
            clusters,
            fruit.anchorBranchId,
            fruit.position,
            MEMORIAL_LEAVES.nearestClusters,
          ),
        ),
    );
    return [...unique];
  }, [deceasedKey, fruits, clusters]);

  if (near.length === 0) return null;
  return (
    <FallingLeaves
      clusters={near}
      branches={branches}
      colors={GOLD_TONES}
      slots={MEMORIAL_LEAVES.slots}
      config={MEMORIAL_LEAVES.fall}
    />
  );
}
