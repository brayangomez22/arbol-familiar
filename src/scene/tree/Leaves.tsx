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
import { INTRO, LAYOUT, LEAF_MESH, WIND } from '@/config/constants';
import { QUALITY } from '@/config/quality';
import { dayPalette } from '@/config/theme';
import { placeLeaves, type LeafInstance } from '@/layout/leafInstances';
import type { GrowthSchedule } from '@/layout/growth';
import { swayWeight, type TreeReach } from '@/layout/reach';
import type { FruitPlacement, LeafCluster } from '@/layout/types';
import { useAppStore } from '@/state/store';
import { LeafMaterial } from '../materials/LeafMaterial';

interface LeavesProps {
  readonly clusters: readonly LeafCluster[];
  readonly fruits: readonly FruitPlacement[];
  /** Gives each leaf the wind weight of the point its cluster grows from. */
  readonly reach: TreeReach;
  /** When each cluster's leaves open in the intro. */
  readonly schedule: GrowthSchedule;
}

/** Every leaf of the tree in one instanced draw call. How many depends on the quality tier. */
export function Leaves({ clusters, fruits, reach, schedule }: LeavesProps) {
  const leavesPerCluster = useAppStore((state) => QUALITY[state.qualityTier].leavesPerCluster);
  const leaves = useMemo(
    () => placeLeaves(clusters, fruits, leavesPerCluster, dayPalette.leaves.length, LAYOUT.leaf),
    [clusters, fruits, leavesPerCluster],
  );
  const geometry = useMemo(() => {
    const clusterWeights = clusters.map(({ branchId, branchT }) =>
      swayWeight(reach.atParameter(branchId, branchT), reach.max, WIND.weightExponent),
    );
    // Once the growth passes a cluster, its leaves open from the center outward.
    const growAt = leaves.map(({ clusterIndex, position }) => {
      const cluster = clusters[clusterIndex];
      if (!cluster) return 0;
      const { x, y, z } = cluster.position;
      const out = Math.hypot(position.x - x, position.y - y, position.z - z) / cluster.radius;
      return schedule.atParameter(cluster.branchId, cluster.branchT) + out * INTRO.leaves.spread;
    });
    return buildLeafGeometry(leaves, clusterWeights, growAt);
  }, [leaves, clusters, reach, schedule]);
  const material = useMemo(
    () => new LeafMaterial(dayPalette, LEAF_MESH, { focus: true, growth: true }),
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

/**
 * A quad with its stem at the origin and its tip at +y, plus each leaf's shading normal and its
 * wind weight and flutter phase (its random spin, so neighbors never flutter in step).
 */
function buildLeafGeometry(
  leaves: readonly LeafInstance[],
  clusterWeights: readonly number[],
  growAt: readonly number[],
): PlaneGeometry {
  const geometry = new PlaneGeometry(LEAF_MESH.aspect, 1);
  geometry.translate(0, 1 / 2, 0);
  const normals = new Float32Array(leaves.length * 3);
  const sway = new Float32Array(leaves.length * 2);
  leaves.forEach(({ shadeNormal, clusterIndex, spin }, i) => {
    normals.set([shadeNormal.x, shadeNormal.y, shadeNormal.z], i * 3);
    sway.set([clusterWeights[clusterIndex] ?? 0, spin], i * 2);
  });
  geometry.setAttribute('aShadeNormal', new InstancedBufferAttribute(normals, 3));
  geometry.setAttribute('aSway', new InstancedBufferAttribute(sway, 2));
  geometry.setAttribute('aGrowAt', new InstancedBufferAttribute(Float32Array.from(growAt), 1));
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
