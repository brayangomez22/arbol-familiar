import { useEffect, useLayoutEffect, useMemo, useRef } from 'react';
import {
  Color,
  InstancedBufferAttribute,
  Matrix4,
  PlaneGeometry,
  Quaternion,
  Vector3,
  type InstancedMesh,
} from 'three';
import { LAYOUT, LEAF_MESH } from '@/config/constants';
import { QUALITY } from '@/config/quality';
import { dayPalette } from '@/config/theme';
import { placeLeaves, type LeafInstance } from '@/layout/leafInstances';
import type { FruitPlacement, LeafCluster } from '@/layout/types';
import { useAppStore } from '@/state/store';
import { LeafMaterial } from '../materials/LeafMaterial';

interface LeavesProps {
  readonly clusters: readonly LeafCluster[];
  readonly fruits: readonly FruitPlacement[];
}

/** Every leaf of the tree in one instanced draw call. How many depends on the quality tier. */
export function Leaves({ clusters, fruits }: LeavesProps) {
  const leavesPerCluster = useAppStore((state) => QUALITY[state.qualityTier].leavesPerCluster);
  const leaves = useMemo(
    () => placeLeaves(clusters, fruits, leavesPerCluster, dayPalette.leaves.length, LAYOUT.leaf),
    [clusters, fruits, leavesPerCluster],
  );
  const geometry = useMemo(() => buildLeafGeometry(leaves), [leaves]);
  const material = useMemo(() => new LeafMaterial(dayPalette), []);
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
    const current = mesh.current;
    if (!current) return;
    writeInstances(current, leaves);
  }, [leaves]);

  return (
    // Recreated when the count changes: an InstancedMesh cannot grow.
    <instancedMesh
      key={leaves.length}
      ref={mesh}
      args={[geometry, material, leaves.length]}
      // Leaves never take a click meant for a fruit or for panning.
      raycast={ignoreRaycast}
    />
  );
}

const ignoreRaycast = () => null;

/** A quad with its stem at the origin and its tip at +y, plus each leaf's shading normal. */
function buildLeafGeometry(leaves: readonly LeafInstance[]): PlaneGeometry {
  const geometry = new PlaneGeometry(LEAF_MESH.aspect, 1);
  geometry.translate(0, 1 / 2, 0);
  const normals = new Float32Array(leaves.length * 3);
  leaves.forEach(({ shadeNormal }, i) => {
    normals.set([shadeNormal.x, shadeNormal.y, shadeNormal.z], i * 3);
  });
  geometry.setAttribute('aShadeNormal', new InstancedBufferAttribute(normals, 3));
  return geometry;
}

function writeInstances(mesh: InstancedMesh, leaves: readonly LeafInstance[]): void {
  const matrix = new Matrix4();
  const position = new Vector3();
  const scale = new Vector3();
  const facing = new Vector3();
  const align = new Quaternion();
  const spin = new Quaternion();
  const forward = new Vector3(0, 0, 1);
  const colors = dayPalette.leaves.map((hex) => new Color(hex));

  leaves.forEach((leaf, i) => {
    facing.set(leaf.facing.x, leaf.facing.y, leaf.facing.z);
    // Spin around the quad's own normal first, then turn that normal to face where it should.
    spin.setFromAxisAngle(forward, leaf.spin);
    align.setFromUnitVectors(forward, facing).multiply(spin);
    position.set(leaf.position.x, leaf.position.y, leaf.position.z);
    scale.setScalar(leaf.size);
    mesh.setMatrixAt(i, matrix.compose(position, align, scale));
    const color = colors[leaf.colorIndex];
    if (color) mesh.setColorAt(i, color);
  });
  mesh.instanceMatrix.needsUpdate = true;
  if (mesh.instanceColor) mesh.instanceColor.needsUpdate = true;
  mesh.computeBoundingSphere();
}
