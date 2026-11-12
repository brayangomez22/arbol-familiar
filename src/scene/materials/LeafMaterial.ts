import { Color, DoubleSide, ShaderMaterial } from 'three';
import type { LEAF_MESH } from '@/config/constants';
import type { Palette } from '@/config/theme';
import fragmentShader from '@/shaders/leaf.frag.glsl?raw';
import vertexShader from '@/shaders/leaf.vert.glsl?raw';
import { toonUniforms, withToonShading } from './toonUniforms';

/** How the quad is cut and inked: LEAF_MESH for leaves, GRASS_MESH for blades of grass. */
export type LeafShape = { readonly [K in keyof typeof LEAF_MESH]: number };

/**
 * Toon leaves (or blades) for an InstancedMesh: each instance brings its color (instanceColor) and
 * the normal it is lit by (aShadeNormal). The outline is cut in the shader, with alpha to coverage
 * so the edges stay smooth under MSAA without sorting.
 */
export class LeafMaterial extends ShaderMaterial {
  constructor(palette: Palette, shape: LeafShape) {
    super({
      vertexShader,
      fragmentShader: withToonShading(fragmentShader),
      side: DoubleSide,
      alphaToCoverage: true,
      uniforms: {
        ...toonUniforms(palette),
        uShadeTint: { value: new Color(palette.shade) },
        uShadeMix: { value: shape.shadeMix },
        uEdgeColor: { value: new Color(palette.outline) },
        uEdgeMix: { value: shape.edgeMix },
        uEdgeStart: { value: shape.edgeStart },
        uVeinWidth: { value: shape.veinWidth },
        uVeinMix: { value: shape.veinMix },
        uShapeBias: { value: shape.shapeBias },
        uTaper: { value: shape.taper },
        uRimStrength: { value: shape.rimStrength },
      },
    });
  }
}
