import gsap from 'gsap';
import type { Animated } from './selectionTimeline';
import { ease } from './easings';

/** What the intro moves in the scene. */
export interface IntroTargets {
  /** 0 → 1: the seed's fall, from above the view to the hilltop. */
  readonly seedFall: Animated;
  /** 1 → 0: the seed sinking into the ground once the shoot starts. */
  readonly seedSink: Animated;
  /** Seconds of growth (the uGrowth uniform): negative before the shoot. */
  readonly growth: Animated;
  /** The seed touches the ground (dust). */
  readonly onLand: () => void;
  /** The camera pulling back to the whole tree over `duration`; null without a camera. */
  readonly pullBack: (duration: number) => gsap.core.Tween | null;
}

export interface IntroTiming {
  readonly fall: number;
  readonly sink: number;
  readonly sproutDelay: number;
  /** Growth seconds until the last fruit has popped and the last leaf has opened. */
  readonly growth: number;
  /** The camera starts pulling back this long after landing and arrives this early. */
  readonly pullDelay: number;
  readonly arriveEarly: number;
}

/** Growth value while nothing has sprouted yet: everything is hidden. */
export const BEFORE_SPROUT = -1;

/**
 * Seed falls swaying, lands (dust), sinks as the trunk shoots up, and the tree grows in real time
 * (one second of timeline = one second of growth) while the camera pulls back to frame it all.
 * Jump to the end with `progress(1)` to skip.
 */
export function introTimeline(targets: IntroTargets, timing: IntroTiming): gsap.core.Timeline {
  const sprout = timing.fall + timing.sproutDelay;
  const timeline = gsap.timeline();
  timeline
    .set(targets.seedFall, { value: 0 }, 0)
    .set(targets.seedSink, { value: 1 }, 0)
    .set(targets.growth, { value: BEFORE_SPROUT }, 0)
    .to(targets.seedFall, { value: 1, duration: timing.fall, ease: ease.in }, 0)
    .call(targets.onLand, undefined, timing.fall)
    .to(targets.seedSink, { value: 0, duration: timing.sink, ease: ease.in }, sprout)
    .fromTo(
      targets.growth,
      { value: 0 },
      { value: timing.growth, duration: timing.growth, ease: 'none' },
      sprout,
    );

  const pullStart = timing.fall + timing.pullDelay;
  const pullDuration = sprout + timing.growth - timing.arriveEarly - pullStart;
  const pull = targets.pullBack(Math.max(pullDuration, 0));
  if (pull) timeline.add(pull, pullStart);
  return timeline;
}
