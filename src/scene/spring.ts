/** One number moving like a mass on a spring; mutated in place so frame callbacks allocate nothing. */
export interface SpringState {
  value: number;
  velocity: number;
}

export interface SpringConfig {
  /** 1/s²: higher is snappier. */
  readonly stiffness: number;
  /** 1 settles without overshoot; below 1 overshoots a little before settling. */
  readonly dampingRatio: number;
}

/** Longest integration step: keeps the spring stable and the same at 30 or 144 fps. */
const MAX_STEP = 1 / 120;

/** Advances `state` toward `target` by `delta` seconds (semi-implicit Euler, in small steps). */
export function stepSpring(
  state: SpringState,
  target: number,
  { stiffness, dampingRatio }: SpringConfig,
  delta: number,
): void {
  const damping = 2 * dampingRatio * Math.sqrt(stiffness);
  const steps = Math.max(1, Math.ceil(delta / MAX_STEP));
  const dt = delta / steps;
  for (let i = 0; i < steps; i++) {
    const acceleration = stiffness * (target - state.value) - damping * state.velocity;
    state.velocity += acceleration * dt;
    state.value += state.velocity * dt;
  }
}
