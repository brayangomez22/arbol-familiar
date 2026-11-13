import { useFrame } from '@react-three/fiber';
import { useEffect, useMemo, useRef } from 'react';
import type { Group } from 'three';
import { SCENERY } from '@/config/constants';
import { QUALITY } from '@/config/quality';
import { livePalette } from '../ambient/livePalette';
import { useReducedMotion } from '@/hooks/useReducedMotion';
import { placeClouds } from '@/layout/scenery';
import type { Bounds } from '@/layout/types';
import { useAppStore } from '@/state/store';
import { CloudMaterial } from '../materials/CloudMaterial';
import { buildCloudGeometry } from './cloudGeometry';

interface CloudsProps {
  readonly bounds: Bounds;
}

const ignoreRaycast = () => null;

/** Flat illustrated clouds in layers behind the tree, drifting slowly sideways. */
export function Clouds({ bounds }: CloudsProps) {
  const segments = useAppStore((state) => QUALITY[state.qualityTier].cloudPuffSegments);
  const reducedMotion = useReducedMotion();
  const clouds = useMemo(() => placeClouds(bounds, SCENERY.clouds, SCENERY.seed), [bounds]);
  const geometries = useMemo(
    () =>
      clouds.map((cloud) =>
        buildCloudGeometry(cloud.puffs, segments, SCENERY.clouds.puffDepthStep),
      ),
    [clouds, segments],
  );
  const material = useMemo(() => new CloudMaterial(livePalette), []);
  useEffect(
    () => () => {
      for (const geometry of geometries) geometry.dispose();
    },
    [geometries],
  );
  useEffect(
    () => () => {
      material.dispose();
    },
    [material],
  );

  const groups = useRef<(Group | null)[]>([]);
  const centerX = (bounds.min.x + bounds.max.x) / 2;
  useFrame(({ clock }) => {
    if (reducedMotion) return;
    const time = clock.elapsedTime;
    clouds.forEach((cloud, i) => {
      const group = groups.current[i];
      if (!group) return;
      const half = cloud.wrapWidth / 2;
      const offset = cloud.position.x - centerX + time * cloud.drift;
      // Wrap within the layer's span, so a cloud leaving one side comes back on the other.
      group.position.x =
        centerX +
        ((((offset + half) % cloud.wrapWidth) + cloud.wrapWidth) % cloud.wrapWidth) -
        half;
    });
  });

  return clouds.map((cloud, i) => (
    <group
      key={i}
      ref={(group) => {
        groups.current[i] = group;
      }}
      position={[cloud.position.x, cloud.position.y, cloud.position.z]}
    >
      <mesh geometry={geometries[i]} material={material} raycast={ignoreRaycast} />
    </group>
  ));
}
