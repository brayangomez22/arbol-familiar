import { Color, ShaderMaterial } from 'three';
import { HOVER_SPARKS } from '@/config/constants';
import type { Palette } from '@/config/theme';
import fragmentShader from '@/shaders/spark.frag.glsl?raw';
import vertexShader from '@/shaders/spark.vert.glsl?raw';
import { pixelsPerUnit } from './pixelsPerUnit';

/**
 * Rising specks of light. Normal blending, not additive: over the pale day sky, added light would
 * vanish, while a warm gold reads as light against it (and still does on the night sky).
 */
export class SparkMaterial extends ShaderMaterial {
  constructor(palette: Palette) {
    super({
      vertexShader,
      fragmentShader,
      transparent: true,
      depthWrite: false,
      uniforms: {
        uTime: { value: 0 },
        uRise: { value: HOVER_SPARKS.rise },
        uWiggle: { value: HOVER_SPARKS.wiggle },
        uWiggleFrequency: { value: HOVER_SPARKS.wiggleFrequency },
        uSize: { value: HOVER_SPARKS.size },
        uEndSize: { value: HOVER_SPARKS.endSize },
        uFadeIn: { value: HOVER_SPARKS.fadeIn },
        uFadeOutStart: { value: HOVER_SPARKS.fadeOutStart },
        uPixelsPerUnit: { value: 1 },
        uColor: { value: new Color(palette.spark) },
        uOpacity: { value: HOVER_SPARKS.opacity },
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
