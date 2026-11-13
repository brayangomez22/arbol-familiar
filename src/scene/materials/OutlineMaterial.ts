import { BackSide, ShaderMaterial, Vector2, type Color } from 'three';
import fragmentShader from '@/shaders/outline.frag.glsl?raw';
import vertexShader from '@/shaders/outline.vert.glsl?raw';
import { growthUniforms, withGrowth } from '../intro/growthUniforms';
import { windUniforms, withWind } from '../wind/windUniforms';

export interface OutlineMaterialOptions {
  /** A live palette color, shared by reference. */
  readonly color: Color;
  /** Line width in drawing-buffer pixels. */
  readonly thickness: number;
  /** Follow the wind like a ToonMaterial with `wind`; the geometry must carry `aSway`. */
  readonly wind?: boolean;
  /** Grow in the intro like a ToonMaterial with `growth`. */
  readonly growth?: boolean;
}

/**
 * Ink outline for a mesh whose vertex shader moves it (wind, growth): drei's <Outlines> draws a
 * static copy of the geometry, which would come apart from the moving branch.
 */
export class OutlineMaterial extends ShaderMaterial {
  constructor({ color, thickness, wind = false, growth = false }: OutlineMaterialOptions) {
    super({
      vertexShader: withGrowth(withWind(vertexShader)),
      fragmentShader,
      side: BackSide,
      defines: {
        ...(wind ? { USE_WIND: '' } : {}),
        ...(growth ? { USE_GROWTH: '' } : {}),
      },
      uniforms: {
        ...windUniforms,
        ...growthUniforms,
        uColor: { value: color },
        uThickness: { value: thickness },
        uResolution: { value: new Vector2(1, 1) },
      },
    });
  }

  setResolution(width: number, height: number): void {
    const resolution = this.uniforms.uResolution?.value as Vector2 | undefined;
    resolution?.set(width, height);
  }
}
