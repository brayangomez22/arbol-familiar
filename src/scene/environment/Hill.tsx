import { useEffect, useMemo } from 'react';
import { PlaneGeometry } from 'three';
import { SCENERY } from '@/config/constants';
import { livePalette } from '../ambient/livePalette';
import { groundHeight } from '@/layout/terrain';
import type { Vec3 } from '@/layout/types';
import { ToonMaterial } from '../materials/ToonMaterial';

interface HillProps {
  /** The hilltop: where the trunk meets the ground. */
  readonly top: Vec3;
}

const ignoreRaycast = () => null;

/** The hill the tree stands on; its back falls away so the ground's edge stays low. */
export function Hill({ top }: HillProps) {
  const geometry = useMemo(() => buildHillGeometry(top), [top]);
  const material = useMemo(
    () => new ToonMaterial({ color: livePalette.hill, palette: livePalette, rim: false }),
    [],
  );
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
  return <mesh geometry={geometry} material={material} raycast={ignoreRaycast} />;
}

function buildHillGeometry(top: Vec3): PlaneGeometry {
  const { size, segments } = SCENERY.hill;
  const geometry = new PlaneGeometry(size, size, segments, segments);
  geometry.rotateX(-Math.PI / 2);
  geometry.translate(top.x, 0, top.z);
  const position = geometry.getAttribute('position');
  for (let i = 0; i < position.count; i++) {
    position.setY(i, groundHeight(position.getX(i), position.getZ(i), top, SCENERY.hill));
  }
  geometry.computeVertexNormals();
  return geometry;
}
