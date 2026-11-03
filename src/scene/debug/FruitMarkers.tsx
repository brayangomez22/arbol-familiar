import { useEffect, useMemo } from 'react';
import { CircleGeometry } from 'three';
import { DEBUG_VIEW } from '@/config/constants';
import { dayPalette } from '@/config/theme';
import type { FruitPlacement } from '@/layout/types';

interface FruitMarkersProps {
  readonly fruits: readonly FruitPlacement[];
}

const KIND_COLORS = { blood: dayPalette.fruits[0], graft: dayPalette.fruits[3] } as const;

/** Flat discs at each fruit, colored by kind. */
export function FruitMarkers({ fruits }: FruitMarkersProps) {
  const disc = useMemo(() => new CircleGeometry(1, DEBUG_VIEW.circleSegments), []);
  useEffect(
    () => () => {
      disc.dispose();
    },
    [disc],
  );

  return fruits.map((fruit) => {
    const { x, y, z } = fruit.position;
    return (
      <mesh key={fruit.personId} geometry={disc} position={[x, y, z]} scale={fruit.size}>
        <meshBasicMaterial color={KIND_COLORS[fruit.kind]} />
      </mesh>
    );
  });
}
