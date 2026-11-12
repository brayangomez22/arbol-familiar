import { Color, ShaderMaterial, Vector2 } from 'three';
import { SCENERY, TOON } from '@/config/constants';
import type { Palette } from '@/config/theme';
import fragmentShader from '@/shaders/cloud.frag.glsl?raw';
import vertexShader from '@/shaders/cloud.vert.glsl?raw';

/** Flat clouds: every puff gets a crescent of shade away from the sun, and the base is shaded. */
export class CloudMaterial extends ShaderMaterial {
  constructor(palette: Palette) {
    super({
      vertexShader,
      fragmentShader,
      uniforms: {
        uColor: { value: new Color(palette.cloud) },
        uShadeColor: { value: new Color(palette.cloudShade) },
        // The sun as seen on the screen plane.
        uSunDirection: {
          value: new Vector2(TOON.sunDirection[0], TOON.sunDirection[1]).normalize(),
        },
        uShadeOffset: { value: SCENERY.clouds.shadeOffset },
        uBottomShade: { value: SCENERY.clouds.bottomShade },
      },
    });
  }
}
