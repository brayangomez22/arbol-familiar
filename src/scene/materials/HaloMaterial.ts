import { Color, ShaderMaterial, type ColorRepresentation } from 'three';
import fragmentShader from '@/shaders/halo.frag.glsl?raw';
import vertexShader from '@/shaders/halo.vert.glsl?raw';

export interface HaloMaterialOptions {
  readonly color: ColorRepresentation;
  readonly opacity: number;
  /** How far behind the object's center the glow sits, in units of the object's scale. */
  readonly depthOffset: number;
}

/** A soft round glow on a camera-facing quad, drawn behind whatever it surrounds. */
export class HaloMaterial extends ShaderMaterial {
  constructor({ color, opacity, depthOffset }: HaloMaterialOptions) {
    super({
      vertexShader,
      fragmentShader,
      transparent: true,
      depthWrite: false,
      uniforms: {
        uColor: { value: new Color(color) },
        uOpacity: { value: opacity },
        uDepthOffset: { value: depthOffset },
      },
    });
  }
}
