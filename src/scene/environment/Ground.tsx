import { useEffect, useMemo } from 'react';
import { GROUND } from '@/config/constants';
import { dayPalette } from '@/config/theme';
import type { Bounds } from '@/layout/types';
import { ToonMaterial } from '../materials/ToonMaterial';

interface GroundProps {
  readonly bounds: Bounds;
}

/** Flat ground at y = 0 that the roots sink into. Later in phase 3 it becomes a hill. */
export function Ground({ bounds }: GroundProps) {
  const size = (bounds.max.x - bounds.min.x) * GROUND.sizeFactor;
  const centerX = (bounds.min.x + bounds.max.x) / 2;
  const material = useMemo(
    () => new ToonMaterial({ color: dayPalette.ground, palette: dayPalette }),
    [],
  );
  useEffect(
    () => () => {
      material.dispose();
    },
    [material],
  );
  return (
    <mesh position={[centerX, 0, 0]} rotation-x={-Math.PI / 2} material={material}>
      <planeGeometry args={[size, size]} />
    </mesh>
  );
}
