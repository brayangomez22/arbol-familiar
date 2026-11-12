import { BlendFunction, Effect } from 'postprocessing';
import { Color, Uniform } from 'three';
import { POSTPROCESSING } from '@/config/constants';
import type { Palette } from '@/config/theme';
import fragmentShader from '@/shaders/paper.frag.glsl?raw';

/** Paper fibers, soft watercolor washes, grain and a warm vignette, in a single pass. */
export class PaperEffect extends Effect {
  constructor(palette: Palette) {
    const { paper } = POSTPROCESSING;
    super('PaperEffect', fragmentShader, {
      blendFunction: BlendFunction.NORMAL,
      uniforms: new Map<string, Uniform>([
        ['uPaperColor', new Uniform(new Color(palette.paper))],
        ['uVignetteColor', new Uniform(new Color(palette.vignette))],
        ['uPixelRatio', new Uniform(1)],
        ['uFiberScale', new Uniform(paper.fiberScale)],
        ['uFiberStrength', new Uniform(paper.fiberStrength)],
        ['uWashScale', new Uniform(paper.washScale)],
        ['uWashStrength', new Uniform(paper.washStrength)],
        ['uGrainStrength', new Uniform(paper.grainStrength)],
        ['uPaperTint', new Uniform(paper.tint)],
        ['uVignetteStart', new Uniform(paper.vignetteStart)],
        ['uVignetteEnd', new Uniform(paper.vignetteEnd)],
        ['uVignetteStrength', new Uniform(paper.vignetteStrength)],
      ]),
    });
  }

  setPixelRatio(pixelRatio: number): void {
    const uniform = this.uniforms.get('uPixelRatio');
    if (uniform) uniform.value = pixelRatio;
  }
}
