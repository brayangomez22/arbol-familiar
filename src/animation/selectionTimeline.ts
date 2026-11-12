import gsap from 'gsap';
import { ease } from './easings';

/** A uniform-like number a timeline can tween. */
export interface Animated {
  value: number;
}

/** What a selection moves in the scene. */
export interface SelectionTargets {
  /** Reach of the sap's bright head along the wood. */
  readonly sapFront: Animated;
  /** 0–1: the lineage glow as a whole. */
  readonly sapIntensity: Animated;
  /** 0–1: how far the rest of the tree has stepped back. */
  readonly focus: Animated;
  /** Which wood carries the sap: branch id → reach where it leaves that branch. Null clears it. */
  readonly showLineage: (limits: ReadonlyMap<string, number> | null) => void;
}

export interface LineageRoute {
  readonly limits: ReadonlyMap<string, number>;
  /** Reach of the person's branch tip: where the sap ends. */
  readonly length: number;
}

export interface SelectionTiming {
  readonly sapDuration: number;
  /** Half width of the sap's head, in world units. */
  readonly sapHead: number;
  /** Fade of the previous lineage before the next one runs. */
  readonly fadeOut: number;
  readonly focusDuration: number;
  readonly release: number;
  /** With reduced motion, every change is a fade of this length. */
  readonly reducedFade: number;
}

/**
 * Someone was selected: the previous lineage (if any) fades, the new one is lit and the sap runs
 * from the trunk's base to their fruit while the rest of the tree steps back. The camera flight
 * runs alongside (see cameraFly.ts). Kill the timeline to stop it where it is.
 */
export function selectTimeline(
  targets: SelectionTargets,
  route: LineageRoute,
  timing: SelectionTiming,
  reducedMotion: boolean,
): gsap.core.Timeline {
  const timeline = gsap.timeline();
  if (targets.sapIntensity.value > 0) {
    timeline.to(targets.sapIntensity, { value: 0, duration: timing.fadeOut, ease: ease.in });
  }
  timeline.call(() => {
    targets.showLineage(route.limits);
  });
  // Past the tip by two head widths, so the head fades out at the fruit and leaves only the trail.
  const end = route.length + 2 * timing.sapHead;
  if (reducedMotion) {
    timeline.set(targets.sapFront, { value: end });
    timeline.to(targets.sapIntensity, { value: 1, duration: timing.reducedFade, ease: ease.out });
  } else {
    timeline.set(targets.sapFront, { value: -timing.sapHead });
    timeline.set(targets.sapIntensity, { value: 1 });
    timeline.to(targets.sapFront, {
      value: end,
      duration: timing.sapDuration,
      ease: ease.standard,
    });
  }
  // Alongside the sap from the very start, not after it.
  timeline.to(
    targets.focus,
    {
      value: 1,
      duration: reducedMotion ? timing.reducedFade : timing.focusDuration,
      ease: ease.standard,
    },
    0,
  );
  return timeline;
}

/** Nobody is selected any more: the lineage and the focus fade away together. */
export function releaseTimeline(
  targets: SelectionTargets,
  timing: SelectionTiming,
  reducedMotion: boolean,
): gsap.core.Timeline {
  const duration = reducedMotion ? timing.reducedFade : timing.release;
  return gsap
    .timeline()
    .to(targets.sapIntensity, { value: 0, duration, ease: ease.standard }, 0)
    .to(targets.focus, { value: 0, duration, ease: ease.standard }, 0)
    .call(() => {
      targets.showLineage(null);
    });
}
