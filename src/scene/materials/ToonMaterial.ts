import { Color, ShaderMaterial, Vector2, Vector3, type ColorRepresentation } from 'three';
import { TOON } from '@/config/constants';
import type { Palette } from '@/config/theme';
import fragmentShader from '@/shaders/toon.frag.glsl?raw';
import vertexShader from '@/shaders/toon.vert.glsl?raw';

export interface ToonMaterialOptions {
  readonly color: ColorRepresentation;
  readonly palette: Palette;
  /** Draws grooves along meshes that carry a `bark` attribute (see branchGeometry.ts). */
  readonly bark?: boolean;
}

/**
 * Banded "illustrated" shading: four flat tones from a colored shadow up to a warm highlight, plus
 * a soft rim on the sunny edge. Lit by a fixed sun from TOON, not by three's lights, so the look
 * never depends on what else is in the scene.
 */
export class ToonMaterial extends ShaderMaterial {
  constructor({ color, palette, bark = false }: ToonMaterialOptions) {
    const base = new Color(color);
    super({
      vertexShader,
      fragmentShader,
      uniforms: {
        uBaseColor: { value: base },
        uShadeColor: { value: base.clone().lerp(new Color(palette.shade), TOON.shadeMix) },
        uLightColor: { value: new Color(palette.light) },
        uRimColor: { value: new Color(palette.rim) },
        uGrooveColor: { value: new Color(palette.trunkShadow) },
        uSunDirection: { value: new Vector3(...TOON.sunDirection).normalize() },
        uBandEdges: { value: new Vector3(...TOON.bandEdges) },
        uBandSoftness: { value: TOON.bandSoftness },
        uBandMix: { value: new Vector2(...TOON.bandMix) },
        uHighlightMix: { value: TOON.highlightMix },
        uRimStrength: { value: TOON.rimStrength },
        uRimPower: { value: TOON.rimPower },
        uBarkStreaks: { value: TOON.bark.streaks },
        uBarkWarp: { value: TOON.bark.warp },
        uBarkStrength: { value: bark ? TOON.bark.strength : 0 },
      },
    });
  }
}
