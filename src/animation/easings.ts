/**
 * The motion curves of the whole site. The scene (GSAP) and the UI (CSS) use the same control
 * points, so a panel sliding in moves like the camera flying.
 */
export const EASE_CURVES = {
  /** Leaves and arrives softly: camera flights, focus. */
  standard: [0.45, 0, 0.2, 1],
  /** Starts at full speed and settles: things appearing. */
  out: [0.16, 1, 0.3, 1],
  /** Starts gently and leaves fast: things going away. */
  in: [0.5, 0, 0.75, 0.2],
} as const;

export type EaseName = keyof typeof EASE_CURVES;
export type Ease = (progress: number) => number;

/** For CSS: `transition-timing-function: ${cssEase('standard')}`. */
export function cssEase(name: EaseName): string {
  return `cubic-bezier(${EASE_CURVES[name].join(', ')})`;
}

/** A CSS-style cubic Bézier timing function (from (0,0) to (1,1)) as a plain function for GSAP. */
export function cubicBezier(x1: number, y1: number, x2: number, y2: number): Ease {
  const bezier = (t: number, a: number, b: number) =>
    3 * a * t * (1 - t) ** 2 + 3 * b * t * t * (1 - t) + t ** 3;
  const slope = (t: number, a: number, b: number) =>
    3 * a * (1 - t) ** 2 + 6 * (b - a) * t * (1 - t) + 3 * (1 - b) * t * t;

  return (progress) => {
    if (progress <= 0) return 0;
    if (progress >= 1) return 1;
    // Solve x(t) = progress: Newton first, bisection if the slope is too flat to trust.
    let t = progress;
    for (let i = 0; i < 6; i++) {
      const error = bezier(t, x1, x2) - progress;
      const derivative = slope(t, x1, x2);
      if (Math.abs(error) < 1e-7) return bezier(t, y1, y2);
      if (Math.abs(derivative) < 1e-6) break;
      t -= error / derivative;
    }
    let low = 0;
    let high = 1;
    t = progress;
    for (let i = 0; i < 30; i++) {
      if (bezier(t, x1, x2) < progress) low = t;
      else high = t;
      t = (low + high) / 2;
    }
    return bezier(t, y1, y2);
  };
}

export const ease: Record<EaseName, Ease> = {
  standard: cubicBezier(...EASE_CURVES.standard),
  out: cubicBezier(...EASE_CURVES.out),
  in: cubicBezier(...EASE_CURVES.in),
};
