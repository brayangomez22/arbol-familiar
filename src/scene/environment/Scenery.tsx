import { useMemo } from 'react';
import { hillTop } from '@/layout/terrain';
import type { TreeLayout } from '@/layout/types';
import { Clouds } from './Clouds';
import { Fireflies } from './Fireflies';
import { Grass } from './Grass';
import { Hill } from './Hill';
import { Pollen } from './Pollen';
import { Ridges } from './Ridges';
import { Sky } from './Sky';

interface SceneryProps {
  readonly layout: TreeLayout;
}

/** Everything around the tree: sky, clouds, distant hills, the hill it stands on, grass, pollen and, at night, fireflies. */
export function Scenery({ layout }: SceneryProps) {
  const top = useMemo(() => hillTop(layout.branches), [layout.branches]);

  return (
    <>
      <Sky />
      <Ridges bounds={layout.bounds} />
      <Clouds bounds={layout.bounds} />
      <Hill top={top} />
      <Grass top={top} />
      <Pollen bounds={layout.bounds} />
      <Fireflies bounds={layout.bounds} />
    </>
  );
}
