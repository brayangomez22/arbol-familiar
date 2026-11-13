import { useFrame } from '@react-three/fiber';
import { useEffect, useMemo } from 'react';
import { BufferGeometry, Float32BufferAttribute, MeshBasicMaterial } from 'three';
import { SCENERY, TOON } from '@/config/constants';
import { livePalette } from '../ambient/livePalette';
import { buildRidges, type Ridge } from '@/layout/scenery';
import type { Bounds } from '@/layout/types';

interface RidgesProps {
  readonly bounds: Bounds;
}

const ignoreRaycast = () => null;

/** Distant hills as flat silhouettes that fade into the horizon the farther they are. */
export function Ridges({ bounds }: RidgesProps) {
  const parts = useMemo(
    () =>
      buildRidges(bounds, SCENERY.ridges, SCENERY.seed).map((ridge) => ({
        geometry: buildRidgeGeometry(ridge),
        fog: ridge.fog,
        material: new MeshBasicMaterial(),
      })),
    [bounds],
  );
  useEffect(
    () => () => {
      for (const { geometry, material } of parts) {
        geometry.dispose();
        material.dispose();
      }
    },
    [parts],
  );
  // Starts from the tone the toon ramp gives the sunlit plain, so the plain runs into the ridges
  // without a seam, then fades toward the horizon with distance. Mixed again every frame from
  // the live palette, so the ridges follow the light of the hour.
  useFrame(() => {
    for (const { material, fog } of parts) {
      material.color
        .copy(livePalette.hill)
        .lerp(livePalette.light, TOON.highlightMix)
        .lerp(livePalette.sky.horizon, fog);
    }
  });

  return parts.map(({ geometry, material }, i) => (
    <mesh key={i} geometry={geometry} material={material} raycast={ignoreRaycast} />
  ));
}

/** A strip from the ridge line straight down to below the view. */
function buildRidgeGeometry(ridge: Ridge): BufferGeometry {
  const lowest = Math.min(...ridge.line.map((point) => point.y)) - ridge.depth;
  const positions: number[] = [];
  const indices: number[] = [];
  ridge.line.forEach((point, i) => {
    positions.push(point.x, point.y, ridge.z, point.x, lowest, ridge.z);
    if (i === 0) return;
    const a = (i - 1) * 2;
    const b = i * 2;
    indices.push(a, a + 1, b, b, a + 1, b + 1);
  });
  const geometry = new BufferGeometry();
  geometry.setAttribute('position', new Float32BufferAttribute(positions, 3));
  geometry.setIndex(indices);
  return geometry;
}
