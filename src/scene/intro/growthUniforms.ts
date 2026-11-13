import { INTRO, TIMELINE } from '@/config/constants';
import growthChunk from '@/shaders/growth.glsl?raw';

/** Growth time that counts as "fully grown": every appear time is far below it. */
export const FULLY_GROWN = 1e6;

/**
 * The uniforms of shaders/growth.glsl, shared by reference by every growing material. Fully grown
 * by default, so the tree is complete whenever there is no intro (and in the debug view).
 */
export const growthUniforms = {
  uGrowth: { value: FULLY_GROWN },
  uGrowthSwell: { value: INTRO.growth.swell },
  /** Year the timeline shows (fractional while it moves); see scene/timeline/TimelineDirector. */
  uTimelineYear: { value: FULLY_GROWN },
  uSecondsPerYear: { value: TIMELINE.secondsPerYear },
};

/** A vertex shader with the growth helpers in front of it. */
export function withGrowth(vertexShader: string): string {
  return `${growthChunk}\n${vertexShader}`;
}

/** Popped in the intro (seconds of growth) and present in the year the timeline shows. */
export function isGrown(bornAt: number, appearYear: number): boolean {
  return growthUniforms.uGrowth.value >= bornAt && growthUniforms.uTimelineYear.value >= appearYear;
}
