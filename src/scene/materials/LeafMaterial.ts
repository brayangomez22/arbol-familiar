import { Color, DoubleSide, ShaderMaterial } from 'three';
import { WIND, type LEAF_MESH } from '@/config/constants';
import type { Palette } from '@/config/theme';
import fragmentShader from '@/shaders/leaf.frag.glsl?raw';
import vertexShader from '@/shaders/leaf.vert.glsl?raw';
import { windUniforms, withWind } from '../wind/windUniforms';
import { toonUniforms, withToonShading } from './toonUniforms';

/** How the quad is cut and inked: LEAF_MESH for leaves, GRASS_MESH for blades of grass. */
export type LeafShape = { readonly [K in keyof typeof LEAF_MESH]: number };

/**
 * Toon leaves (or blades) for an InstancedMesh: each instance brings its color (instanceColor) and
 * the normal it is lit by (aShadeNormal) and its wind weight and phase (aSway). The outline is cut in the shader as a hard edge, so no
 * sorting is needed; the SMAA pass smooths it.
 */
export class LeafMaterial extends ShaderMaterial {
  constructor(palette: Palette, shape: LeafShape) {
    super({
      vertexShader: withWind(vertexShader),
      fragmentShader: withToonShading(fragmentShader),
      side: DoubleSide,
      uniforms: {
        ...windUniforms,
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
        uSwayAnchor: { value: shape.swayAnchor },
        uFlutter: { value: shape.flutter },
        uFlutterFrequency: { value: WIND.flutterFrequency },
      },
    });
  }
}
