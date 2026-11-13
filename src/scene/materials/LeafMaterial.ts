import { DoubleSide, ShaderMaterial, type Color } from 'three';
import { INTRO, WIND, type LEAF_MESH } from '@/config/constants';
import fragmentShader from '@/shaders/leaf.frag.glsl?raw';
import vertexShader from '@/shaders/leaf.vert.glsl?raw';
import { ambientUniforms, type LivePalette } from '../ambient/livePalette';
import { growthUniforms, withGrowth } from '../intro/growthUniforms';
import { focusUniforms, withFocus } from '../selection/focusUniforms';
import { windUniforms, withWind } from '../wind/windUniforms';
import { toonUniforms, withToonShading } from './toonUniforms';

/** How the quad is cut and inked: LEAF_MESH for leaves, GRASS_MESH for blades of grass. */
export type LeafShape = { readonly [K in keyof typeof LEAF_MESH]: number };

/** Leaves and grass blades pick one of this many live colors per instance. */
export const FOLIAGE_TONES = 4;

/**
 * Toon leaves (or blades) for an InstancedMesh: each instance brings which of the four live colors
 * it takes (aColorIndex), the normal it is lit by (aShadeNormal) and its wind weight and phase
 * (aSway). The outline is cut in the shader as a hard edge, so no
 * sorting is needed; the SMAA pass smooths it.
 */
export class LeafMaterial extends ShaderMaterial {
  /**
   * Leaves, not grass: `focus` steps back with the rest of the tree when someone is selected,
   * `growth` unfolds each leaf in the intro and on the timeline (the geometry must carry
   * `aGrowAt` and `aBornYear` per instance), and `density` thins the crown in winter (it must
   * carry `aRank`, 0–1 per instance: the higher, the sooner it goes).
   */
  constructor(
    palette: LivePalette,
    colors: readonly Color[],
    shape: LeafShape,
    {
      focus = false,
      growth = false,
      density = false,
    }: { focus?: boolean; growth?: boolean; density?: boolean } = {},
  ) {
    super({
      vertexShader: withGrowth(withWind(vertexShader)),
      fragmentShader: withFocus(withToonShading(fragmentShader)),
      side: DoubleSide,
      defines: {
        ...(focus ? { USE_FOCUS: '' } : {}),
        ...(growth ? { USE_GROWTH: '' } : {}),
        ...(density ? { USE_DENSITY: '' } : {}),
        FOLIAGE_TONES,
      },
      uniforms: {
        ...windUniforms,
        ...growthUniforms,
        uLeafUnfold: { value: INTRO.leaves.unfold },
        uLeafOvershoot: { value: INTRO.leaves.overshoot },
        ...focusUniforms,
        ...toonUniforms(palette),
        uColors: { value: colors },
        uLeafDensity: ambientUniforms.uLeafDensity,
        uShadeTint: { value: palette.shade },
        uShadeMix: { value: shape.shadeMix },
        uEdgeColor: { value: palette.outline },
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
