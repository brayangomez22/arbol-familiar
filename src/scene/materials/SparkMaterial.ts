import { ShaderMaterial, type Color } from 'three';
import fragmentShader from '@/shaders/spark.frag.glsl?raw';
import vertexShader from '@/shaders/spark.vert.glsl?raw';
import type { SparkConfig } from '../tree/sparkPool';
import { pixelsPerUnit } from './pixelsPerUnit';

/**
 * Rising specks of light. Normal blending, not additive: over the pale day sky, added light would
 * vanish, while a warm gold reads as light against it (and still does on the night sky).
 */
export class SparkMaterial extends ShaderMaterial {
  /** `color` is a live palette color, shared by reference. */
  constructor(color: Color, config: SparkConfig) {
    super({
      vertexShader,
      fragmentShader,
      transparent: true,
      depthWrite: false,
      uniforms: {
        uTime: { value: 0 },
        uRise: { value: config.rise },
        uWiggle: { value: config.wiggle },
        uWiggleFrequency: { value: config.wiggleFrequency },
        uSize: { value: config.size },
        uEndSize: { value: config.endSize },
        uFadeIn: { value: config.fadeIn },
        uFadeOutStart: { value: config.fadeOutStart },
        uPixelsPerUnit: { value: 1 },
        uColor: { value: color },
        uOpacity: { value: config.opacity },
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
