import { ShaderMaterial } from 'three';
import { SKY } from '@/config/constants';
import fragmentShader from '@/shaders/sky.frag.glsl?raw';
import vertexShader from '@/shaders/sky.vert.glsl?raw';
import { ambientUniforms, type LivePalette } from '../ambient/livePalette';

/**
 * Screen-space sky: vertical gradient plus a round sun (or moon) glow that stays round at any
 * aspect, and stars that come out at night.
 */
export class SkyMaterial extends ShaderMaterial {
  constructor(palette: LivePalette) {
    super({
      vertexShader,
      fragmentShader,
      depthTest: false,
      depthWrite: false,
      uniforms: {
        uTopColor: { value: palette.sky.top },
        uHorizonColor: { value: palette.sky.horizon },
        uSunColor: { value: palette.sunGlow },
        uSunPosition: ambientUniforms.uSunPosition,
        uSunRadius: { value: SKY.sunRadius },
        uSunStrength: ambientUniforms.uSunStrength,
        uStarColor: { value: palette.stars },
        uStars: ambientUniforms.uStars,
        uStarDensity: { value: SKY.stars.density },
        uStarScale: { value: SKY.stars.scale },
        uStarSize: { value: SKY.stars.size },
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
