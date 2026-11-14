import { Canvas } from '@react-three/fiber';
import { useMemo, useRef } from 'react';
import { CAMERA } from '@/config/constants';
import { dayPalette } from '@/config/theme';
import type { Family } from '@/domain/types';
import { syntheticFamily } from '@/dev/syntheticFamily';
import { buildTreeLayout } from '@/layout/buildTreeLayout';
import { FruitLabels } from './FruitLabels';
import type { LayoutDebugOptions } from './layoutDebugOptions';
import { LayoutDebugScene } from './LayoutDebugScene';
import { LayoutStats } from './LayoutStats';

/** Developer view (?debug=layout): the raw layout as lines and discs, to tune its shape. */
interface LayoutDebugProps extends LayoutDebugOptions {
  /** The family the site shows, used unless a synthetic one is asked for. */
  readonly realFamily: Family;
}

export function LayoutDebug({ syntheticSize, seed, showLabels, realFamily }: LayoutDebugProps) {
  const family = useMemo(
    () => (syntheticSize === null ? realFamily : syntheticFamily(syntheticSize, seed)),
    [syntheticSize, seed, realFamily],
  );
  const layout = useMemo(() => buildTreeLayout(family), [family]);
  const labelRefs = useRef<(HTMLElement | null)[]>([]);

  const names = useMemo(
    () =>
      new Map(
        [...family.people.values()].map((person) => [
          person.id,
          `${person.firstName} ${person.lastName}`,
        ]),
      ),
    [family],
  );

  return (
    <>
      <Canvas camera={{ fov: CAMERA.fov, near: CAMERA.near, far: CAMERA.far }}>
        <color attach="background" args={[dayPalette.paper]} />
        <LayoutDebugScene layout={layout} labelRefs={showLabels ? labelRefs : null} />
      </Canvas>
      {showLabels && <FruitLabels fruits={layout.fruits} names={names} labelRefs={labelRefs} />}
      <LayoutStats title={family.meta.title} people={family.people.size} layout={layout} />
    </>
  );
}
