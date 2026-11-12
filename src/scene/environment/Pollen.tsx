import { useFrame, useThree } from '@react-three/fiber';
import { useEffect, useMemo } from 'react';
import { BufferGeometry, Float32BufferAttribute } from 'three';
import { SCENERY } from '@/config/constants';
import { QUALITY } from '@/config/quality';
import { dayPalette } from '@/config/theme';
import { useReducedMotion } from '@/hooks/useReducedMotion';
import { placePollen, type PollenMote } from '@/layout/scenery';
import type { Bounds } from '@/layout/types';
import { useAppStore } from '@/state/store';
import { PollenMaterial } from '../materials/PollenMaterial';

interface PollenProps {
  readonly bounds: Bounds;
}

const ignoreRaycast = () => null;

/** Pollen floating in the air. The motion lives in the vertex shader; JS only advances the clock. */
export function Pollen({ bounds }: PollenProps) {
  const count = useAppStore((state) => QUALITY[state.qualityTier].particles);
  const reducedMotion = useReducedMotion();
  const viewportHeight = useThree((state) => state.size.height * state.viewport.dpr);
  const fov = useThree((state) => ('fov' in state.camera ? state.camera.fov : 0));

  const geometry = useMemo(
    () => buildPollenGeometry(placePollen(count, bounds, SCENERY.pollen, SCENERY.seed)),
    [count, bounds],
  );
  const material = useMemo(() => new PollenMaterial(dayPalette), []);
  useEffect(() => {
    material.setViewport(viewportHeight, fov);
  }, [material, viewportHeight, fov]);
  useEffect(
    () => () => {
      geometry.dispose();
    },
    [geometry],
  );
  useEffect(
    () => () => {
      material.dispose();
    },
    [material],
  );

  useFrame(({ clock }) => {
    if (!reducedMotion) material.setTime(clock.elapsedTime);
  });

  return <points geometry={geometry} material={material} raycast={ignoreRaycast} />;
}

function buildPollenGeometry(motes: readonly PollenMote[]): BufferGeometry {
  const geometry = new BufferGeometry();
  geometry.setAttribute(
    'position',
    new Float32BufferAttribute(
      motes.flatMap(({ position }) => [position.x, position.y, position.z]),
      3,
    ),
  );
  geometry.setAttribute(
    'aSize',
    new Float32BufferAttribute(
      motes.map(({ size }) => size),
      1,
    ),
  );
  geometry.setAttribute(
    'aPhase',
    new Float32BufferAttribute(
      motes.map(({ phase }) => phase),
      1,
    ),
  );
  return geometry;
}
