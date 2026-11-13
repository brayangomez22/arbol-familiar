import { useFrame } from '@react-three/fiber';
import { useEffect, useMemo } from 'react';
import { Color } from 'three';
import { BLOSSOMS, DAY_CYCLE } from '@/config/constants';
import { birthdayBlossom } from '@/config/theme';
import { useNow } from '@/hooks/useNow';
import { useReducedMotion } from '@/hooks/useReducedMotion';
import { placeBranchBlossoms, type Blossom } from '@/layout/blossoms';
import type { BranchSegment, FruitPlacement } from '@/layout/types';
import { useAppStore } from '@/state/store';
import { livePalette } from '../ambient/livePalette';
import { FULLY_GROWN } from '../intro/growthUniforms';
import { BlossomMaterial } from '../materials/BlossomMaterial';
import type { FamilyTime } from '../timeline/familyTime';
import { Blossoms, type BlossomTiming } from './Blossoms';

interface BirthdayBlossomsProps {
  readonly fruits: readonly FruitPlacement[];
  readonly branches: readonly BranchSegment[];
  readonly timing: BlossomTiming;
  readonly time: FamilyTime;
}

/** Birthday flowers keep their colors whatever the season or the hour: it is a party. */
const PETALS = new Color(birthdayBlossom.petals);
const HEART = new Color(birthdayBlossom.heart);

/**
 * On someone's birthday their branch fills with flowers, opening from the base of its outer
 * stretch to the fruit once the tree is on screen. With reduced motion they are simply open.
 */
export function BirthdayBlossoms({ fruits, branches, timing, time }: BirthdayBlossomsProps) {
  const now = useNow(DAY_CYCLE.clockInterval);
  const day = now.toDateString();
  const reducedMotion = useReducedMotion();
  const grown = useAppStore((state) => state.introPhase === 'done');

  const blossoms = useMemo(() => {
    const celebrated = new Set(time.birthdaysOn(new Date(day)));
    const branchById = new Map(branches.map((branch) => [branch.id, branch]));
    return fruits.flatMap((fruit): Blossom[] => {
      const branch = branchById.get(fruit.anchorBranchId);
      if (!celebrated.has(fruit.personId) || !branch) return [];
      return placeBranchBlossoms(branch, fruit, BLOSSOMS.birthday);
    });
  }, [day, time, fruits, branches]);

  const material = useMemo(
    () =>
      new BlossomMaterial({
        petals: PETALS,
        heart: HEART,
        edge: livePalette.outline,
        density: { value: 1 },
        bloomTime: { value: -BLOSSOMS.bloom.delay },
      }),
    [],
  );
  useEffect(
    () => () => {
      material.dispose();
    },
    [material],
  );

  useFrame((_, delta) => {
    if (reducedMotion) material.setBloomTime(FULLY_GROWN);
    else if (grown) material.setBloomTime(material.bloomTime + delta);
  });

  return <Blossoms blossoms={blossoms} timing={timing} material={material} />;
}
