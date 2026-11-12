import type { Vector3 } from 'three';
import { WIND } from '@/config/constants';
import type { Vec3 } from '@/layout/types';
import { WIND_DIRECTION, type WindFrame } from './windUniforms';

const [frequency0, frequency1, frequency2] = WIND.frequencies;
const [mix0, mix1, mix2] = WIND.mix;
const [phase0, phase1, phase2] = WIND.phases;
const [waveX, waveY, waveZ] = WIND.wave;

/**
 * CPU twin of windSway() in shaders/wind.glsl, for things moved from JS (the fruits, so they stay
 * on their tip and their click area follows them). Writes into `out` to allocate nothing per frame.
 */
export function windSway(position: Vec3, weight: number, wind: WindFrame, out: Vector3): Vector3 {
  const travel = position.x * waveX + position.y * waveY + position.z * waveZ;
  const amplitude = WIND.amplitude * wind.strength;
  const along =
    mix0 * Math.sin(frequency0 * wind.time + phase0 - travel) +
    mix1 * Math.sin(frequency1 * wind.time + phase1 - travel) +
    mix2 * Math.sin(frequency2 * wind.time + phase2 - travel);
  const bob = Math.sin(WIND.bobFrequency * wind.time - travel);
  const push = wind.lean + amplitude * along;
  return out
    .copy(WIND_DIRECTION)
    .multiplyScalar(push * weight)
    .setY(weight * amplitude * WIND.bobRatio * bob);
}
