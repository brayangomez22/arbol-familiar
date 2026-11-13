import { useFrame, useThree } from '@react-three/fiber';
import { useEffect, useMemo, useRef } from 'react';
import { BufferGeometry, Float32BufferAttribute, type Points } from 'three';
import { SCENERY } from '@/config/constants';
import { QUALITY } from '@/config/quality';
import { useReducedMotion } from '@/hooks/useReducedMotion';
import { placeFireflies, type Firefly } from '@/layout/scenery';
import type { Bounds } from '@/layout/types';
import { useAppStore } from '@/state/store';
import { ambientUniforms, livePalette } from '../ambient/livePalette';
import { FireflyMaterial } from '../materials/FireflyMaterial';

interface FirefliesProps {
  readonly bounds: Bounds;
}

const ignoreRaycast = () => null;

/**
 * Fireflies that come out at dusk and fill the night. Not drawn at all by day. With reduced
 * motion they hold still and keep a steady glow.
 */
export function Fireflies({ bounds }: FirefliesProps) {
  const count = useAppStore((state) =>
    Math.round(QUALITY[state.qualityTier].particles * SCENERY.fireflies.share),
  );
  const reducedMotion = useReducedMotion();
  const bufferHeight = useThree((state) => state.size.height * state.viewport.dpr);
  const fov = useThree((state) => ('fov' in state.camera ? state.camera.fov : 0));

  const geometry = useMemo(
    () => buildFireflyGeometry(placeFireflies(count, bounds, SCENERY.fireflies, SCENERY.seed)),
    [count, bounds],
  );
  const material = useMemo(() => new FireflyMaterial(livePalette), []);
  useEffect(() => {
    material.setViewport(bufferHeight, fov);
  }, [material, bufferHeight, fov]);
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

  const points = useRef<Points>(null);
  useFrame(({ clock }) => {
    if (points.current) points.current.visible = ambientUniforms.uFireflies.value > 0;
    // A fixed moment: still, and at a point where most of them glow.
    material.setTime(reducedMotion ? 0 : clock.elapsedTime);
  });

  return (
    <points
      ref={points}
      geometry={geometry}
      material={material}
      raycast={ignoreRaycast}
      // They wander away from where the geometry was measured.
      frustumCulled={false}
    />
  );
}

function buildFireflyGeometry(flies: readonly Firefly[]): BufferGeometry {
  const geometry = new BufferGeometry();
  const attribute = (values: number[], size: number) => new Float32BufferAttribute(values, size);
  geometry.setAttribute(
    'position',
    attribute(
      flies.flatMap(({ position }) => [position.x, position.y, position.z]),
      3,
    ),
  );
  geometry.setAttribute(
    'aSize',
    attribute(
      flies.map(({ size }) => size),
      1,
    ),
  );
  geometry.setAttribute(
    'aPhase',
    attribute(
      flies.map(({ phase }) => phase),
      1,
    ),
  );
  geometry.setAttribute(
    'aBlink',
    attribute(
      flies.map(({ blink }) => blink),
      1,
    ),
  );
  return geometry;
}
