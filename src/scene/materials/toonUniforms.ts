import { Color, Vector2, Vector3, type IUniform } from 'three';
import { TOON } from '@/config/constants';
import type { Palette } from '@/config/theme';
import toonShading from '@/shaders/toonShading.glsl?raw';

/** Uniforms read by shaders/toonShading.glsl, the light model every toon material shares. */
export function toonUniforms(palette: Palette): Record<string, IUniform> {
  return {
    uLightColor: { value: new Color(palette.light) },
    uRimColor: { value: new Color(palette.rim) },
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
