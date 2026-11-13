import { Vector2, Vector3, type IUniform } from 'three';
import { TOON } from '@/config/constants';
import type { LivePalette } from '../ambient/livePalette';
import toonShading from '@/shaders/toonShading.glsl?raw';

/** Uniforms read by shaders/toonShading.glsl, the light model every toon material shares. */
export function toonUniforms(palette: LivePalette): Record<string, IUniform> {
  // The live colors themselves, so the light of the hour reaches every toon material.
  return {
    uLightColor: { value: palette.light },
    uRimColor: { value: palette.rim },
    uSunDirection: { value: new Vector3(...TOON.sunDirection).normalize() },
    uBandEdges: { value: new Vector3(...TOON.bandEdges) },
    uBandSoftness: { value: TOON.bandSoftness },
    uBandMix: { value: new Vector2(...TOON.bandMix) },
    uHighlightMix: { value: TOON.highlightMix },
    uRimStrength: { value: TOON.rimStrength },
    uRimPower: { value: TOON.rimPower },
  };
}

/** A toon fragment shader with the shared light model in front of it. */
export function withToonShading(fragmentShader: string): string {
  return `${toonShading}\n${fragmentShader}`;
}
