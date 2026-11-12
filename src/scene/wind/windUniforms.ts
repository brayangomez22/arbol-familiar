import { Vector3, type IUniform } from 'three';
import { WIND } from '@/config/constants';
import windChunk from '@/shaders/wind.glsl?raw';

/** Horizontal unit vector the wind blows toward. */
export const WIND_DIRECTION = new Vector3(WIND.direction[0], 0, WIND.direction[1]).normalize();

/**
 * The uniforms of shaders/wind.glsl. Materials share these very objects (spread, never cloned), so
 * one write per frame from <Wind/> reaches every swaying material at once.
 */
export const windUniforms = {
  uWindTime: { value: 0 },
  uWindAmplitude: { value: WIND.amplitude },
  uWindStrength: { value: 1 },
  uWindLean: { value: 0 },
  uWindDirection: { value: WIND_DIRECTION },
  uWindFrequencies: { value: new Vector3(...WIND.frequencies) },
  uWindMix: { value: new Vector3(...WIND.mix) },
  uWindPhases: { value: new Vector3(...WIND.phases) },
  uWindWave: { value: new Vector3(...WIND.wave) },
  uWindBobRatio: { value: WIND.bobRatio },
  uWindBobFrequency: { value: WIND.bobFrequency },
} satisfies Record<string, IUniform>;

/** The part of the wind that changes every frame; the CPU side (fruits) reads it from here. */
export interface WindFrame {
  time: number;
  strength: number;
  lean: number;
}

export const windFrame: WindFrame = { time: 0, strength: 1, lean: 0 };

export function setWindFrame(time: number, strength: number, lean: number): void {
  windFrame.time = time;
  windFrame.strength = strength;
  windFrame.lean = lean;
  windUniforms.uWindTime.value = time;
  windUniforms.uWindStrength.value = strength;
  windUniforms.uWindLean.value = lean;
}

/** A vertex shader with the wind field in front of it. */
export function withWind(vertexShader: string): string {
  return `${windChunk}\n${vertexShader}`;
}
