/** World units: 1 unit ≈ the radius of a fruit. */
export const CAMERA = {
  fov: 30,
  near: 0.1,
  far: 500,
  position: [0, 12, 60] as const,
} as const;

const DEG = Math.PI / 180;

/**
 * Shape of the tree. Angles are in radians, measured from the vertical (positive leans right).
 * Lengths are world units. "Jitter" values are the ± range of the seeded per-person variation.
 */
export const LAYOUT = {
  fruit: {
    radius: 1,
    sizeJitter: 0.06,
    graftScale: 0.92,
    /** How far past the branch tip the fruit hangs, along the tip direction. */
    tipOffset: 0.9,
    /** Distance between a blood fruit and the grafts hanging beside it. */
    graftDistance: 2.3,
    /** Fruits on different branches never end up closer than this (on the front view). */
    minDistance: 3,
  },
  trunk: {
    height: 10,
    /** Horizontal lean of the top, as a fraction of the height. */
    lean: 0.05,
    /** Sideways wobble along the trunk, as a fraction of the height. */
    sway: 0.05,
    controlPoints: 5,
    /** Base radius relative to the top: the trunk widens where it meets the ground. */
    flare: 1.45,
    /** The main limbs fork off the trunk between this point (0 = ground, 1 = top) and the top. */
    forkStart: 0.8,
  },
  rootCouple: {
    /** Where along the trunk the root couple's twigs sprout. */
    attachT: 0.62,
    angle: 98 * DEG,
    angleJitter: 5 * DEG,
    length: 3.4,
  },
  branch: {
    /** Length of a generation-1 limb. Each generation is `lengthDecay` times the previous one. */
    baseLength: 9,
    lengthDecay: 0.75,
    minLength: 3.8,
    /** Extra length per doubling of the fruits a branch carries, so big families reach further out. */
    lengthPerFruitDoubling: 0.1,
    lengthJitter: 0.1,
    /** Total fan the trunk's limbs spread over; narrower by `fanDecay` per generation, down to `minFan`. */
    fan: 120 * DEG,
    fanDecay: 0.85,
    minFan: 70 * DEG,
    /** Slot width ∝ fruits^exponent: below 1 keeps small families from being squeezed. */
    fruitWeightExponent: 0.7,
    /**
     * On a leaning branch, how much of its children's weight moves to its upper side
     * (0 = half and half, 0.5 = all of it on a horizontal branch).
     */
    upperSideBias: 0.3,
    /** Angles beyond `softAngle` ease toward `maxAngle` instead of growing freely. */
    softAngle: 45 * DEG,
    maxAngle: 82 * DEG,
    angleJitter: 5 * DEG,
    /** Children sprout along this stretch of the parent (0 = base, 1 = tip); outer ones lower. */
    forkStart: 0.62,
    forkEnd: 0.92,
    /** Random shift of each sprout point, as a fraction of the spacing between sprouts. */
    forkJitter: 0.3,
    /** Upward arch of sideways branches, as a fraction of their length… */
    bend: 0.18,
    /** …but never more than this, so long limbs stay sturdy while twigs curl. */
    maxArch: 1.2,
    /** Roughly one control point every this many units (3 to 5 per branch). */
    pointSpacing: 2.5,
    /** Perpendicular wobble of the control points, as a fraction of the length. */
    curveNoise: 0.07,
    /** Forward/backward tilt range (z per unit of length) before depth is normalized. */
    depthTilt: 0.3,
    /** Radius at every branch tip; thicker branches follow the pipe model from here. */
    tipRadius: 0.13,
    /** A branch without children is this much thicker at its base than at its tip. */
    leafTaper: 1.35,
    /** r^e = Σ r_child^e. 2 is da Vinci's area-preserving rule. */
    pipeExponent: 2,
  },
  growth: {
    /** Families up to this many fruits use the lengths above as they are… */
    referenceFruitCount: 24,
    /** …bigger ones scale every length by (fruits / reference)^exponent. 0.5 keeps the density. */
    exponent: 0.5,
  },
  depth: {
    /** Largest |z| of the crown, as a fraction of its width: almost flat, with some parallax. */
    ratio: 0.08,
  },
  relax: {
    maxIterations: 120,
    /** Fraction of the overlap corrected per iteration. */
    step: 0.6,
    maxStepAngle: 6 * DEG,
    /**
     * Stretch per unit of turn: small, so branches mostly turn and only lengthen when their fan is
     * full and turning alone cannot make room.
     */
    stretchRate: 0.7,
    /** A branch never grows more than this fraction past its natural length. */
    maxStretch: 1.2,
    /** Relaxation aims slightly past `fruit.minDistance` so it converges cleanly. */
    margin: 1.05,
  },
  roots: {
    minCount: 5,
    maxCount: 8,
    length: 5.5,
    lengthJitter: 0.3,
    /** Random turn of each root, as a fraction of half the even spacing between roots. */
    spreadJitter: 0.5,
    /** Sideways wobble of the middle control points, as a fraction of the length. */
    wobble: 0.15,
    /** Height on the trunk where the roots start to flare out. */
    startHeight: 0.6,
    /** How deep the tips sink below the ground. */
    depth: 1.4,
    /** Roots pointing at or away from the camera are squashed so the root plate reads from the front. */
    zSquash: 0.55,
    /** Root base radius relative to the trunk base. */
    radiusRatio: 0.42,
    radiusJitter: 0.2,
    tipRadius: 0.08,
  },
  leaves: {
    radius: 2.4,
    radiusJitter: 0.2,
    /** Extra radius per doubling of the fruits a branch carries. */
    radiusPerFruitDoubling: 0.12,
    /** Where the cluster sits along the branch (0 = base, 1 = tip), and how far above it. */
    tipT: 0.82,
    lift: 0.6,
    tipDensity: 1,
    /** Branches with children also get a sparser cluster further down. */
    innerT: 0.45,
    innerRadiusScale: 0.8,
    innerDensity: 0.55,
    densityJitter: 0.15,
  },
} as const;

type Widen<T> = { readonly [K in keyof T]: T[K] extends number ? number : Widen<T[K]> };

export type LayoutConfig = Widen<typeof LAYOUT>;

/** Developer view at ?debug=layout. */
export const DEBUG_VIEW = {
  /** Polyline segments drawn per branch curve. */
  curveSegments: 24,
  circleSegments: 40,
  /** Extra room around the layout bounds when framing the camera. */
  framingMargin: 1.1,
  defaultSeed: 'debug',
} as const;

/** Seconds. */
export const TIMING = {
  introDuration: 8,
  reducedMotionIntroDuration: 0.6,
  cameraFlyDuration: 1.6,
} as const;
