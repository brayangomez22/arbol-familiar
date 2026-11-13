import { AdditiveBlending, ShaderMaterial } from 'three';
import { SCENERY } from '@/config/constants';
import fragmentShader from '@/shaders/firefly.frag.glsl?raw';
import vertexShader from '@/shaders/firefly.vert.glsl?raw';
import { ambientUniforms, type LivePalette } from '../ambient/livePalette';
import { pixelsPerUnit } from './pixelsPerUnit';

/**
 * Specks that wander and glow on and off. Additive: on the night sky added light is exactly what
 * a firefly is. They fade in with the night (ambientUniforms.uFireflies).
 */
export class FireflyMaterial extends ShaderMaterial {
  constructor(palette: LivePalette) {
    const { fireflies } = SCENERY;
    super({
      vertexShader,
      fragmentShader,
      transparent: true,
      depthWrite: false,
      blending: AdditiveBlending,
      uniforms: {
        uTime: { value: 0 },
        uSize: { value: fireflies.size },
        uAmplitude: { value: fireflies.driftAmplitude },
        uSpeed: { value: fireflies.driftSpeed },
        uBlinkSharpness: { value: fireflies.blinkSharpness },
        uPixelsPerUnit: { value: 1 },
        uColor: { value: palette.firefly },
        uOpacity: ambientUniforms.uFireflies,
      },
    });
  }

  setTime(seconds: number): void {
    const uniform = this.uniforms.uTime;
    if (uniform) uniform.value = seconds;
  }

  setViewport(bufferHeight: number, fovDegrees: number): void {
    const uniform = this.uniforms.uPixelsPerUnit;
    if (uniform) uniform.value = pixelsPerUnit(bufferHeight, fovDegrees);
  }
}
