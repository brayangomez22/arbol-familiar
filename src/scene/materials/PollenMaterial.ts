import { Color, ShaderMaterial } from 'three';
import { SCENERY } from '@/config/constants';
import type { Palette } from '@/config/theme';
import fragmentShader from '@/shaders/pollen.frag.glsl?raw';
import vertexShader from '@/shaders/pollen.vert.glsl?raw';
import { pixelsPerUnit } from './pixelsPerUnit';

/** Soft round specks that float on their own in the vertex shader; JS only advances the clock. */
export class PollenMaterial extends ShaderMaterial {
  constructor(palette: Palette) {
    super({
      vertexShader,
      fragmentShader,
      transparent: true,
      depthWrite: false,
      uniforms: {
        uTime: { value: 0 },
        uSize: { value: SCENERY.pollen.size },
        uAmplitude: { value: SCENERY.pollen.driftAmplitude },
        uSpeed: { value: SCENERY.pollen.driftSpeed },
        uPixelsPerUnit: { value: 1 },
        uColor: { value: new Color(palette.pollen) },
        uOpacity: { value: SCENERY.pollen.opacity },
      },
    });
  }

  setTime(seconds: number): void {
    const uniform = this.uniforms.uTime;
    if (uniform) uniform.value = seconds;
  }

  /** Size in pixels of one world unit at distance 1, from the drawing buffer height and the fov. */
  setViewport(bufferHeight: number, fovDegrees: number): void {
    const uniform = this.uniforms.uPixelsPerUnit;
    if (uniform) uniform.value = pixelsPerUnit(bufferHeight, fovDegrees);
  }
}
