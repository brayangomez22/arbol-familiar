import { BackSide, Color, ShaderMaterial, Vector2, type ColorRepresentation } from 'three';
import fragmentShader from '@/shaders/outline.frag.glsl?raw';
import vertexShader from '@/shaders/outline.vert.glsl?raw';
import { windUniforms, withWind } from '../wind/windUniforms';

export interface OutlineMaterialOptions {
  readonly color: ColorRepresentation;
  /** Line width in drawing-buffer pixels. */
  readonly thickness: number;
  /** Follow the wind like a ToonMaterial with `wind`; the geometry must carry `aSway`. */
  readonly wind?: boolean;
}

/**
 * Ink outline for a mesh whose vertex shader moves it (wind, growth): drei's <Outlines> draws a
 * static copy of the geometry, which would come apart from the moving branch.
 */
export class OutlineMaterial extends ShaderMaterial {
  constructor({ color, thickness, wind = false }: OutlineMaterialOptions) {
    super({
      vertexShader: withWind(vertexShader),
      fragmentShader,
      side: BackSide,
      defines: wind ? { USE_WIND: '' } : {},
      uniforms: {
        ...windUniforms,
        uColor: { value: new Color(color) },
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
