import { Color, DoubleSide, ShaderMaterial } from 'three';
import { LEAF_MESH } from '@/config/constants';
import type { Palette } from '@/config/theme';
import fragmentShader from '@/shaders/leaf.frag.glsl?raw';
import vertexShader from '@/shaders/leaf.vert.glsl?raw';
import { toonUniforms, withToonShading } from './toonUniforms';

/**
 * Toon leaves for an InstancedMesh: each instance brings its color (instanceColor) and the normal
 * it is lit by (aShadeNormal). The leaf outline is cut in the shader, with alpha to coverage so the
 * edges stay smooth under MSAA without sorting.
 */
export class LeafMaterial extends ShaderMaterial {
  constructor(palette: Palette) {
    super({
      vertexShader,
      fragmentShader: withToonShading(fragmentShader),
      side: DoubleSide,
      alphaToCoverage: true,
      uniforms: {
        ...toonUniforms(palette),
        uShadeTint: { value: new Color(palette.shade) },
        uShadeMix: { value: LEAF_MESH.shadeMix },
        uEdgeColor: { value: new Color(palette.outline) },
        uEdgeMix: { value: LEAF_MESH.edgeMix },
        uEdgeStart: { value: LEAF_MESH.edgeStart },
        uVeinWidth: { value: LEAF_MESH.veinWidth },
        uVeinMix: { value: LEAF_MESH.veinMix },
        uShapeBias: { value: LEAF_MESH.shapeBias },
      },
    });
  }
}
