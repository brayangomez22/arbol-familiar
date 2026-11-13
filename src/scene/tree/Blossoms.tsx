import { useFrame } from '@react-three/fiber';
import { useEffect, useLayoutEffect, useMemo, useRef } from 'react';
import { InstancedBufferAttribute, Matrix4, PlaneGeometry, type InstancedMesh } from 'three';
import { WIND } from '@/config/constants';
import type { Blossom } from '@/layout/blossoms';
import type { GrowthSchedule } from '@/layout/growth';
import { swayWeight, type TreeReach } from '@/layout/reach';
import type { TimelineSchedule } from '@/layout/timelineGrowth';
import type { BlossomMaterial } from '../materials/BlossomMaterial';

/** How each flower is measured: wind weight, and when its point of the wood exists. */
export interface BlossomTiming {
  readonly reach: TreeReach;
  readonly schedule: GrowthSchedule;
  readonly timeline: TimelineSchedule;
}

interface BlossomsProps {
  readonly blossoms: readonly Blossom[];
  readonly timing: BlossomTiming;
  /** Owned by the caller, which decides colors, density and bloom. */
  readonly material: BlossomMaterial;
  /** Read every frame: false skips the draw entirely (no flowers this season). */
  readonly isShown?: () => boolean;
}

const ignoreRaycast = () => null;

/** A set of flowers in one instanced draw call. */
export function Blossoms({ blossoms, timing, material, isShown }: BlossomsProps) {
  const geometry = useMemo(() => buildBlossomGeometry(blossoms, timing), [blossoms, timing]);
  useEffect(
    () => () => {
      geometry.dispose();
    },
    [geometry],
  );

  const mesh = useRef<InstancedMesh>(null);
  useLayoutEffect(() => {
    const current = mesh.current;
    if (!current) return;
    const matrix = new Matrix4();
    blossoms.forEach(({ position, size }, i) => {
      matrix.makeScale(size, size, size).setPosition(position.x, position.y, position.z);
      current.setMatrixAt(i, matrix);
    });
    current.instanceMatrix.needsUpdate = true;
    current.computeBoundingSphere();
  }, [blossoms]);

  useFrame(() => {
    if (mesh.current && isShown) mesh.current.visible = isShown();
  });

  if (blossoms.length === 0) return null;
  return (
    <instancedMesh
      // Recreated when the count changes: an InstancedMesh cannot grow.
      key={blossoms.length}
      ref={mesh}
      args={[geometry, material, blossoms.length]}
      raycast={ignoreRaycast}
      // The quads turn toward the camera in the shader, beyond the bounds three measures.
      frustumCulled={false}
    />
  );
}

function buildBlossomGeometry(
  blossoms: readonly Blossom[],
  { reach, schedule, timeline }: BlossomTiming,
): PlaneGeometry {
  const geometry = new PlaneGeometry(1, 1);
  const attribute = (values: (blossom: Blossom) => number) =>
    new InstancedBufferAttribute(Float32Array.from(blossoms, values), 1);
  geometry.setAttribute(
    'aSway',
    attribute(({ branchId, branchT }) =>
      swayWeight(reach.atParameter(branchId, branchT), reach.max, WIND.weightExponent),
    ),
  );
  geometry.setAttribute(
    'aSpin',
    attribute(({ spin }) => spin),
  );
  geometry.setAttribute(
    'aRank',
    attribute(({ rank }) => rank),
  );
  geometry.setAttribute(
    'aOrder',
    attribute(({ order }) => order),
  );
  geometry.setAttribute(
    'aGrowAt',
    attribute(({ branchId, branchT }) => schedule.atParameter(branchId, branchT)),
  );
  geometry.setAttribute(
    'aBornYear',
    attribute(({ branchId, branchT }) => timeline.atParameter(branchId, branchT)),
  );
  return geometry;
}
