import { Color, ShaderMaterial, type ColorRepresentation } from 'three';
import fragmentShader from '@/shaders/halo.frag.glsl?raw';
import vertexShader from '@/shaders/halo.vert.glsl?raw';

export interface HaloMaterialOptions {
  readonly color: ColorRepresentation;
  readonly opacity: number;
  /** How far behind the object's center the glow sits, in units of the object's scale. */
  readonly depthOffset: number;
  /** What the halo becomes at full glow (hover, selection): warmer, stronger and a bit larger. */
  readonly glowColor: ColorRepresentation;
  readonly glowOpacity: number;
  /** Extra size at full glow, as a fraction of the resting size. */
  readonly glowGrowth: number;
}

/**
 * A soft round glow on a camera-facing quad, drawn behind whatever it surrounds. One material is
 * shared by every fruit; each sets its own glow right before it is drawn (see setGlow).
 */
export class HaloMaterial extends ShaderMaterial {
  constructor({
    color,
    opacity,
    depthOffset,
    glowColor,
    glowOpacity,
    glowGrowth,
  }: HaloMaterialOptions) {
    super({
      vertexShader,
      fragmentShader,
      transparent: true,
      depthWrite: false,
      uniforms: {
        uColor: { value: new Color(color) },
        uOpacity: { value: opacity },
        uDepthOffset: { value: depthOffset },
        uGlowColor: { value: new Color(glowColor) },
        uGlowOpacity: { value: glowOpacity },
        uGlowGrowth: { value: glowGrowth },
        uGlow: { value: 0 },
      },
    });
  }

  /**
   * Called from a mesh's onBeforeRender: the renderer then uploads the uniforms again for that
   * draw, so each fruit glows on its own while sharing the material.
   */
  setGlow(glow: number): void {
    const uniform = this.uniforms.uGlow;
    if (!uniform || uniform.value === glow) return;
    uniform.value = glow;
    this.uniformsNeedUpdate = true;
  }
}
