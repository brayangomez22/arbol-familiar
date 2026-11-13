import { DoubleSide, ShaderMaterial, type Color } from 'three';
import { BLOSSOMS } from '@/config/constants';
import fragmentShader from '@/shaders/blossom.frag.glsl?raw';
import vertexShader from '@/shaders/blossom.vert.glsl?raw';
import { growthUniforms, withGrowth } from '../intro/growthUniforms';
import { focusUniforms, withFocus } from '../selection/focusUniforms';
import { windUniforms, withWind } from '../wind/windUniforms';

export interface BlossomMaterialOptions {
  /** Colors shared by reference (the live palette's, or fixed ones). */
  readonly petals: Color;
  readonly heart: Color;
  readonly edge: Color;
  /** Share of the flowers that open: a shared uniform for spring, or 1. */
  readonly density: { value: number };
  /** Seconds since the bloom began: a shared uniform, or far in the future (all open). */
  readonly bloomTime: { value: number };
  /** World units the flowers are drawn toward the camera. */
  readonly pull: number;
  /** Steps back with the tree when someone is selected (season flowers, not a birthday's). */
  readonly focus: boolean;
}

/**
 * Small five-petal flowers for an InstancedMesh (see blossom.vert.glsl for the attributes each
 * instance carries). They ride the wind and grow with the intro and the timeline.
 */
export class BlossomMaterial extends ShaderMaterial {
  constructor({ petals, heart, edge, density, bloomTime, pull, focus }: BlossomMaterialOptions) {
    super({
      vertexShader: withGrowth(withWind(vertexShader)),
      fragmentShader: withFocus(fragmentShader),
      side: DoubleSide,
      defines: focus ? { USE_FOCUS: '' } : {},
      uniforms: {
        ...windUniforms,
        ...growthUniforms,
        ...focusUniforms,
        uDensity: density,
        uBloomTime: bloomTime,
        uBloomSpread: { value: BLOSSOMS.bloom.spread },
        uBloomOpen: { value: BLOSSOMS.bloom.open },
        uBloomOvershoot: { value: BLOSSOMS.bloom.overshoot },
        uPetalColor: { value: petals },
        uHeartColor: { value: heart },
        uEdgeColor: { value: edge },
        uPetalShade: { value: BLOSSOMS.petalShade },
        uEdgeMix: { value: BLOSSOMS.edgeMix },
        uPull: { value: pull },
      },
    });
  }

  /** Seconds since the bloom began (negative: it has yet to begin). */
  setBloomTime(seconds: number): void {
    const uniform = this.uniforms.uBloomTime;
    if (uniform) uniform.value = seconds;
  }

  get bloomTime(): number {
    return (this.uniforms.uBloomTime?.value as number | undefined) ?? 0;
  }
}
