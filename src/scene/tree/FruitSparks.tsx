import { useEffect, useMemo, useRef } from 'react';
import { Vector3 } from 'three';
import { HOVER_SPARKS } from '@/config/constants';
import { dayPalette } from '@/config/theme';
import type { PersonId } from '@/domain/types';
import { useReducedMotion } from '@/hooks/useReducedMotion';
import type { Vec3 } from '@/layout/types';
import { useAppStore } from '@/state/store';
import { windSway } from '../wind/windField';
import { windFrame } from '../wind/windUniforms';
import { SparkBurst, type SparkBurstHandle } from './SparkBurst';

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

/** A few specks of light rise from a fruit each time the pointer reaches it. One draw call for all. */
export function FruitSparks({ sources }: FruitSparksProps) {
  const reducedMotion = useReducedMotion();
  const burst = useRef<SparkBurstHandle>(null);
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
        burst.current?.emit(
          id,
          { x: position.x + sway.x, y: position.y + sway.y, z: position.z + sway.z },
          source.size,
        );
      }),
    [sources, reducedMotion, sway],
  );

  return <SparkBurst ref={burst} config={HOVER_SPARKS} color={dayPalette.spark} />;
}
