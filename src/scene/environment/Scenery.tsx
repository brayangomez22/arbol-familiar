import { useMemo } from 'react';
import type { TreeLayout } from '@/layout/types';
import { vec3 } from '@/layout/vec';
import { Clouds } from './Clouds';
import { Grass } from './Grass';
import { Hill } from './Hill';
import { Pollen } from './Pollen';
import { Ridges } from './Ridges';
import { Sky } from './Sky';

interface SceneryProps {
  readonly layout: TreeLayout;
}

/** Everything around the tree: sky, clouds, distant hills, the hill it stands on, grass and pollen. */
export function Scenery({ layout }: SceneryProps) {
  const top = useMemo(() => {
    const base = layout.branches.find((branch) => branch.kind === 'trunk')?.points[0];
    // The hill is centered under the trunk but its top stays at ground level (y = 0).
    return vec3(base?.x ?? 0, 0, base?.z ?? 0);
  }, [layout.branches]);

  return (
    <>
      <Sky />
      <Ridges bounds={layout.bounds} />
      <Clouds bounds={layout.bounds} />
      <Hill top={top} />
      <Grass top={top} />
      <Pollen bounds={layout.bounds} />
    </>
  );
}
