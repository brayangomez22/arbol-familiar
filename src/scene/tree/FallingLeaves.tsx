import { useFrame } from '@react-three/fiber';
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
import { FALLING_LEAVES, LAYOUT, LEAF_MESH, SCENERY, WIND } from '@/config/constants';
import { QUALITY } from '@/config/quality';
import { dayPalette } from '@/config/theme';
import { useReducedMotion } from '@/hooks/useReducedMotion';
import {
  createLeafPose,
  leafFallPose,
  planLeafFall,
  type FallSurroundings,
  type LeafFall,
} from '@/layout/fallingLeaves';
import { groundHeight, hillTop } from '@/layout/terrain';
import type { BranchSegment, LeafCluster } from '@/layout/types';
import { vec3 } from '@/layout/vec';
import { useAppStore } from '@/state/store';
import { LeafMaterial } from '../materials/LeafMaterial';
import { WIND_DIRECTION } from '../wind/windUniforms';

interface FallingLeavesProps {
  readonly clusters: readonly LeafCluster[];
  readonly branches: readonly BranchSegment[];
}

/** Lit from the front and a little above, like the crown it came from, whichever way it turns. */
const SHADE_NORMAL = new Vector3(0, 0.5, 1).normalize();

const ignoreRaycast = () => null;

/**
 * A few leaves that let go of the crown now and then and tumble down to the grass. Only once the
 * intro has finished, and never with reduced motion.
 */
export function FallingLeaves({ clusters, branches }: FallingLeavesProps) {
  const slots = useAppStore((state) => QUALITY[state.qualityTier].fallingLeaves);
  const grown = useAppStore((state) => state.introPhase === 'done');
  const reducedMotion = useReducedMotion();
  const active = grown && !reducedMotion;

  const surroundings = useMemo<FallSurroundings>(() => {
    const top = hillTop(branches);
    return {
      clusters,
      groundAt: (x, z) => groundHeight(x, z, top, SCENERY.hill),
      downwind: vec3(WIND_DIRECTION.x, 0, WIND_DIRECTION.z),
      depthScale: LAYOUT.leaf.depthScale,
      colorCount: dayPalette.leaves.length,
    };
  }, [clusters, branches]);

  const geometry = useMemo(() => buildFallingLeafGeometry(slots), [slots]);
  const material = useMemo(() => new LeafMaterial(dayPalette, LEAF_MESH, { focus: true }), []);
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

  const colors = useMemo(() => dayPalette.leaves.map((hex) => new Color(hex)), []);
  const scratch = useMemo(
    () => ({
      pose: createLeafPose(),
      matrix: new Matrix4(),
      position: new Vector3(),
      rotation: new Euler(0, 0, 0, 'XYZ'),
      quaternion: new Quaternion(),
      scale: new Vector3(),
    }),
    [],
  );

  const mesh = useRef<InstancedMesh>(null);
  const clock = useRef(0);
  const cycles = useRef<number[]>([]);
  const falls = useRef<(LeafFall | null)[]>([]);

  useLayoutEffect(() => {
    // A fresh set of slots: each one starts its own sequence on the current clock.
    cycles.current = Array.from({ length: slots }, () => 0);
    falls.current = Array.from({ length: slots }, (_, slot) =>
      planLeafFall(slot, 0, clock.current, surroundings, FALLING_LEAVES),
    );
    const current = mesh.current;
    if (!current) return;
    // Every instance starts out of the scene; the frame loop shows them as they let go.
    scratch.matrix.makeScale(0, 0, 0);
    for (let i = 0; i < slots; i++) current.setMatrixAt(i, scratch.matrix);
    falls.current.forEach((fall, i) => {
      const color = fall && colors[fall.colorIndex];
      if (color) current.setColorAt(i, color);
    });
    current.instanceMatrix.needsUpdate = true;
    if (current.instanceColor) current.instanceColor.needsUpdate = true;
  }, [slots, surroundings, colors, scratch]);

  useFrame((_, delta) => {
    const current = mesh.current;
    if (!active || !current) return;
    clock.current += Math.min(delta, WIND.maxStep);
    const time = clock.current;
    let recolored = false;

    for (let slot = 0; slot < falls.current.length; slot++) {
      let fall = falls.current[slot] ?? null;
      while (fall && time >= fall.end) {
        const cycle = (cycles.current[slot] ?? 0) + 1;
        cycles.current[slot] = cycle;
        fall = planLeafFall(slot, cycle, fall.end, surroundings, FALLING_LEAVES);
        falls.current[slot] = fall;
        const color = fall && colors[fall.colorIndex];
        if (color) {
          current.setColorAt(slot, color);
          recolored = true;
        }
      }
      if (!fall) continue;
      const { pose, matrix, position, rotation, quaternion, scale } = scratch;
      leafFallPose(fall, time, FALLING_LEAVES, pose);
      position.set(pose.x, pose.y, pose.z);
      quaternion.setFromEuler(rotation.set(pose.pitch, pose.roll, pose.spin));
      scale.setScalar(pose.scale);
      current.setMatrixAt(slot, matrix.compose(position, quaternion, scale));
    }

    current.instanceMatrix.needsUpdate = true;
    if (recolored && current.instanceColor) current.instanceColor.needsUpdate = true;
  });

  return (
    // Recreated when the count changes: an InstancedMesh cannot grow.
    <instancedMesh
      key={slots}
      ref={mesh}
      args={[geometry, material, slots]}
      visible={active}
      // The leaves travel far from where the mesh was first measured.
      frustumCulled={false}
      raycast={ignoreRaycast}
    />
  );
}

/** A leaf quad centered on its middle, so it tumbles around itself rather than around its stem. */
function buildFallingLeafGeometry(count: number): PlaneGeometry {
  const geometry = new PlaneGeometry(LEAF_MESH.aspect, 1);
  const normals = new Float32Array(count * 3);
  const sway = new Float32Array(count * 2);
  for (let i = 0; i < count; i++) {
    normals.set([SHADE_NORMAL.x, SHADE_NORMAL.y, SHADE_NORMAL.z], i * 3);
    // No wind weight: the fall carries the leaf. A radian apart, so no two flutter in step.
    sway.set([0, i], i * 2);
  }
  geometry.setAttribute('aShadeNormal', new InstancedBufferAttribute(normals, 3));
  geometry.setAttribute('aSway', new InstancedBufferAttribute(sway, 2));
  return geometry;
}
