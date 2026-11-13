import { ShaderMaterial, Vector2 } from 'three';
import { SCENERY, TOON } from '@/config/constants';
import fragmentShader from '@/shaders/cloud.frag.glsl?raw';
import vertexShader from '@/shaders/cloud.vert.glsl?raw';
import type { LivePalette } from '../ambient/livePalette';

/** Flat clouds: every puff gets a crescent of shade away from the sun, and the base is shaded. */
export class CloudMaterial extends ShaderMaterial {
  constructor(palette: LivePalette) {
    super({
      vertexShader,
      fragmentShader,
      uniforms: {
        uColor: { value: palette.cloud },
        uShadeColor: { value: palette.cloudShade },
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
