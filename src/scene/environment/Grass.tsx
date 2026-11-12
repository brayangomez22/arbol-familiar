import { useEffect, useLayoutEffect, useMemo, useRef } from 'react';
import {
  Color,
  Euler,
  InstancedBufferAttribute,
  Matrix4,
  PlaneGeometry,
  Quaternion,
  Vector3,
  type InstancedMesh,
} from 'three';
import { GRASS_MESH, SCENERY } from '@/config/constants';
import { QUALITY } from '@/config/quality';
import { dayPalette } from '@/config/theme';
import { placeGrass, type GrassBlade } from '@/layout/terrain';
import type { Vec3 } from '@/layout/types';
import { useAppStore } from '@/state/store';
import { LeafMaterial } from '../materials/LeafMaterial';

interface GrassProps {
  /** The hilltop: where the trunk meets the ground. */
  readonly top: Vec3;
}

const ignoreRaycast = () => null;

/** Tufts of grass around the trunk, in one instanced draw call sized by the quality tier. */
export function Grass({ top }: GrassProps) {
  const count = useAppStore((state) => QUALITY[state.qualityTier].grassBlades);
  const blades = useMemo(
    () =>
      placeGrass(count, top, dayPalette.grass.length, SCENERY.hill, SCENERY.grass, SCENERY.seed),
    [count, top],
  );
  const geometry = useMemo(() => buildBladeGeometry(blades), [blades]);
  const material = useMemo(() => new LeafMaterial(dayPalette, GRASS_MESH), []);
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

  const mesh = useRef<InstancedMesh>(null);
  useLayoutEffect(() => {
    if (mesh.current) writeInstances(mesh.current, blades);
  }, [blades]);

  return (
    <instancedMesh
      key={blades.length}
      ref={mesh}
      args={[geometry, material, blades.length]}
      raycast={ignoreRaycast}
    />
  );
}

function buildBladeGeometry(blades: readonly GrassBlade[]): PlaneGeometry {
  const geometry = new PlaneGeometry(GRASS_MESH.aspect, 1);
  geometry.translate(0, 1 / 2, 0);
  const normals = new Float32Array(blades.length * 3);
  blades.forEach(({ shadeNormal }, i) => {
    normals.set([shadeNormal.x, shadeNormal.y, shadeNormal.z], i * 3);
  });
  geometry.setAttribute('aShadeNormal', new InstancedBufferAttribute(normals, 3));
  return geometry;
}

function writeInstances(mesh: InstancedMesh, blades: readonly GrassBlade[]): void {
  const matrix = new Matrix4();
  const position = new Vector3();
  const scale = new Vector3();
  const rotation = new Quaternion();
  // Yaw first, then the lean within the blade's own plane.
  const euler = new Euler(0, 0, 0, 'YXZ');
  const colors = dayPalette.grass.map((hex) => new Color(hex));

  blades.forEach((blade, i) => {
    position.set(blade.position.x, blade.position.y, blade.position.z);
    rotation.setFromEuler(euler.set(0, blade.yaw, blade.lean));
    scale.setScalar(blade.height);
    mesh.setMatrixAt(i, matrix.compose(position, rotation, scale));
    const color = colors[blade.colorIndex];
    if (color) mesh.setColorAt(i, color);
  });
  mesh.instanceMatrix.needsUpdate = true;
  if (mesh.instanceColor) mesh.instanceColor.needsUpdate = true;
  mesh.computeBoundingSphere();
}
