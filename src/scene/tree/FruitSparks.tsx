import { useFrame, useThree } from '@react-three/fiber';
import { useEffect, useMemo, useRef } from 'react';
import { Vector3 } from 'three';
import { HOVER_SPARKS } from '@/config/constants';
import { dayPalette } from '@/config/theme';
import type { PersonId } from '@/domain/types';
import { useReducedMotion } from '@/hooks/useReducedMotion';
import type { Vec3 } from '@/layout/types';
import { useAppStore } from '@/state/store';
import { SparkMaterial } from '../materials/SparkMaterial';
import { windSway } from '../wind/windField';
import { windFrame } from '../wind/windUniforms';
import { SparkPool } from './sparkPool';

/** Where a fruit is, so its sparks start from where it is drawn right now. */
export interface SparkSource {
  readonly position: Vec3;
  readonly size: number;
  readonly swayAnchor: Vec3;
  readonly swayWeight: number;
}

interface FruitSparksProps {
  readonly sources: ReadonlyMap<PersonId, SparkSource>;
}

const ignoreRaycast = () => null;

/** A few specks of light rise from a fruit each time the pointer reaches it. One draw call for all. */
export function FruitSparks({ sources }: FruitSparksProps) {
  const reducedMotion = useReducedMotion();
  const pool = useMemo(() => new SparkPool(HOVER_SPARKS), []);
  const material = useMemo(() => new SparkMaterial(dayPalette), []);
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

  const sway = useMemo(() => new Vector3(), []);
  useEffect(
    () =>
      useAppStore.subscribe((state, previous) => {
        const id = state.hoveredPersonId;
        // Rising specks are motion the visitor asked not to see.
        if (id === null || id === previous.hoveredPersonId || reducedMotion) return;
        const source = sources.get(id);
        if (!source) return;
        windSway(source.swayAnchor, source.swayWeight, windFrame, sway);
        const { position } = source;
        pool.emit(
          id,
          { x: position.x + sway.x, y: position.y + sway.y, z: position.z + sway.z },
          source.size,
          clock.current,
        );
      }),
    [sources, reducedMotion, pool, sway],
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
