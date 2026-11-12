import { useFrame } from '@react-three/fiber';
import { useMemo, useRef } from 'react';
import { WIND } from '@/config/constants';
import { useReducedMotion } from '@/hooks/useReducedMotion';
import { damp } from '../damp';
import { createGustSchedule } from './gusts';
import { setWindFrame } from './windUniforms';

/** Before every other frame callback, so fruits read this frame's wind. Negative never takes over rendering. */
const WIND_PRIORITY = -1;

/** Drives the shared wind uniforms: its own clock, the gusts and the reduced-motion calm. */
export function Wind() {
  const reducedMotion = useReducedMotion();
  const gustAt = useMemo(() => createGustSchedule(WIND.gust), []);
  const clock = useRef(0);
  // 0 = full wind, 1 = reduced-motion calm. Eased, so toggling the setting never jolts the tree.
  const calm = useRef(reducedMotion ? 1 : 0);

  useFrame((_, delta) => {
    const step = Math.min(delta, WIND.maxStep);
    clock.current += step;
    calm.current = damp(calm.current, reducedMotion ? 1 : 0, WIND.settleRate, step);
    const gust = gustAt(clock.current) * (1 - calm.current);
    const scale = 1 + (WIND.reducedMotionScale - 1) * calm.current;
    setWindFrame(clock.current, scale * (1 + WIND.gust.boost * gust), WIND.gust.lean * gust);
  }, WIND_PRIORITY);

  return null;
}
