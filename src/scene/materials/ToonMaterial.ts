import { Color, ShaderMaterial, type ColorRepresentation } from 'three';
import { TOON } from '@/config/constants';
import type { Palette } from '@/config/theme';
import fragmentShader from '@/shaders/toon.frag.glsl?raw';
import vertexShader from '@/shaders/toon.vert.glsl?raw';
import { toonUniforms, withToonShading } from './toonUniforms';

export interface ToonMaterialOptions {
  readonly color: ColorRepresentation;
  readonly palette: Palette;
  /** Draws grooves along meshes that carry a `bark` attribute (see branchGeometry.ts). */
  readonly bark?: boolean;
  /**
   * Rim light on the sunny edge. Off for the ground: seen from the side, its upward normals would
   * light up all over.
   */
  readonly rim?: boolean;
}

/**
 * Banded "illustrated" shading: four flat tones from a colored shadow up to a warm highlight, plus
 * a soft rim on the sunny edge. Lit by a fixed sun from TOON, not by three's lights, so the look
 * never depends on what else is in the scene.
 */
export class ToonMaterial extends ShaderMaterial {
  constructor({ color, palette, bark = false, rim = true }: ToonMaterialOptions) {
    const base = new Color(color);
    super({
      vertexShader,
      fragmentShader: withToonShading(fragmentShader),
      uniforms: {
        ...toonUniforms(palette),
        uBaseColor: { value: base },
        uShadeColor: { value: base.clone().lerp(new Color(palette.shade), TOON.shadeMix) },
        uGrooveColor: { value: new Color(palette.trunkShadow) },
        uBarkStreaks: { value: TOON.bark.streaks },
        uBarkWarp: { value: TOON.bark.warp },
        uBarkStrength: { value: bark ? TOON.bark.strength : 0 },
        uRimStrength: { value: rim ? TOON.rimStrength : 0 },
      },
    });
  }
}
