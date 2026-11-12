import gsap from 'gsap';
import { ease } from './easings';

export interface Point3 {
  x: number;
  y: number;
  z: number;
}

/** Where the camera is and the point it looks at. */
export interface CameraPose {
  readonly position: Point3;
  readonly target: Point3;
}

export interface FlightOptions {
  readonly duration: number;
  /** Extra distance mid-flight, as a fraction: 0 flies straight, 0.25 breathes out a little. */
  readonly pullBack: number;
}

/**
 * The pose at `progress` (0–1, already eased) of a flight from `from` to `to`. The look-at point
 * travels straight; the camera keeps its offset from it, blending direction and length, and drifts
 * back by `pullBack` at the midpoint so the viewer sees where they are going. Writes into `out`.
 */
export function flightPose(
  from: CameraPose,
  to: CameraPose,
  progress: number,
  pullBack: number,
  out: { position: Point3; target: Point3 },
): void {
  const breath = 1 + pullBack * Math.sin(Math.PI * progress);
  for (const axis of ['x', 'y', 'z'] as const) {
    const target = from.target[axis] + (to.target[axis] - from.target[axis]) * progress;
    const fromOffset = from.position[axis] - from.target[axis];
    const toOffset = to.position[axis] - to.target[axis];
    out.target[axis] = target;
    out.position[axis] = target + (fromOffset + (toOffset - fromOffset) * progress) * breath;
  }
}

/**
 * A GSAP tween that flies the camera; `apply` receives every pose (the same object, mutated).
 * Kill it to stop the flight where it is.
 */
export function flyCamera(
  from: CameraPose,
  to: CameraPose,
  { duration, pullBack }: FlightOptions,
  apply: (pose: CameraPose) => void,
): gsap.core.Tween {
  const start: CameraPose = { position: { ...from.position }, target: { ...from.target } };
  const end: CameraPose = { position: { ...to.position }, target: { ...to.target } };
  const pose = { position: { ...start.position }, target: { ...start.target } };
  const clock = { progress: 0 };
  return gsap.to(clock, {
    progress: 1,
    duration,
    ease: ease.standard,
    onUpdate: () => {
      flightPose(start, end, clock.progress, pullBack, pose);
      apply(pose);
    },
  });
}
