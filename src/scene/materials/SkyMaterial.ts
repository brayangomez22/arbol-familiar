import { Color, ShaderMaterial, Vector2 } from 'three';
import { SKY } from '@/config/constants';
import type { Palette } from '@/config/theme';
import fragmentShader from '@/shaders/sky.frag.glsl?raw';
import vertexShader from '@/shaders/sky.vert.glsl?raw';

/** Screen-space sky: vertical gradient plus a round sun glow that stays round at any aspect. */
export class SkyMaterial extends ShaderMaterial {
  constructor(palette: Palette) {
    super({
      vertexShader,
      fragmentShader,
      depthTest: false,
      depthWrite: false,
      uniforms: {
        uTopColor: { value: new Color(palette.sky.top) },
        uHorizonColor: { value: new Color(palette.sky.horizon) },
        uSunColor: { value: new Color(palette.sunGlow) },
        uSunPosition: { value: new Vector2(...SKY.sunPosition) },
        uSunRadius: { value: SKY.sunRadius },
        uSunStrength: { value: SKY.sunStrength },
        uGradientStart: { value: SKY.gradientStart },
        uGradientEnd: { value: SKY.gradientEnd },
        uAspect: { value: 1 },
      },
    });
  }

  setAspect(aspect: number): void {
    const uniform = this.uniforms.uAspect;
    if (uniform) uniform.value = aspect;
  }
}
