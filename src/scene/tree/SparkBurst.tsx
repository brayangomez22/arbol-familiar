import { useFrame, useThree } from '@react-three/fiber';
import { useEffect, useImperativeHandle, useMemo, useRef, type Ref } from 'react';
import type { Color } from 'three';
import type { Vec3 } from '@/layout/types';
import { SparkMaterial } from '../materials/SparkMaterial';
import { SparkPool, type SparkConfig } from './sparkPool';

export interface SparkBurstHandle {
  /** A burst around `center`, offsets in units of `scale`; `seed` keeps it deterministic. */
  emit(seed: string, center: Vec3, scale: number): void;
}

interface SparkBurstProps {
  readonly config: SparkConfig;
  readonly color: Color;
  readonly ref?: Ref<SparkBurstHandle>;
}

const ignoreRaycast = () => null;

/** Short-lived specks in one draw call: hover sparks, the dust where the seed lands. */
export function SparkBurst({ config, color, ref }: SparkBurstProps) {
  const pool = useMemo(() => new SparkPool(config), [config]);
  const material = useMemo(() => new SparkMaterial(color, config), [color, config]);
  useEffect(
    () => () => {
      pool.dispose();
    },
    [pool],
  );
  useEffect(
    () => () => {
      material.dispose();
    },
    [material],
  );

  const bufferHeight = useThree((state) => state.size.height * state.viewport.dpr);
  const fov = useThree((state) => ('fov' in state.camera ? state.camera.fov : 0));
  useEffect(() => {
    material.setViewport(bufferHeight, fov);
  }, [material, bufferHeight, fov]);

  const clock = useRef(0);
  useFrame((_, delta) => {
    clock.current += delta;
    material.setTime(clock.current);
  });

  useImperativeHandle(
    ref,
    () => ({
      emit: (seed, center, scale) => {
        pool.emit(seed, center, scale, clock.current);
      },
    }),
    [pool],
  );

  return (
    <points
      geometry={pool.geometry}
      material={material}
      raycast={ignoreRaycast}
      // The flight happens in the shader, so the geometry's bounds say nothing about where they are.
      frustumCulled={false}
    />
  );
}
