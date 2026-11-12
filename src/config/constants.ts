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
    startHeight: 0.9,
    /** How deep the tips sink below the ground: shallow, so the roots show as they leave the trunk. */
    depth: 0.7,
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
  /** Individual leaves inside the clusters. How many per full cluster comes from quality.ts. */
  leaf: {
    /** Length from stem to tip. */
    size: 1.3,
    sizeJitter: 0.25,
    /** Clusters are flattened toward the camera, like the crown itself. */
    depthScale: 0.45,
    /** 0 fills the cluster evenly, 1 puts every leaf on its surface where the light reads. */
    shellBias: 0.55,
    /** How far each leaf turns from facing the camera toward facing out of its cluster. */
    facingTilt: 0.55,
    /** Random turn of each leaf around its own facing, in radians. */
    spinJitter: 0.7,
    /** Random tilt of the shading normal, so a cluster is lit as a lumpy mass, not a ball. */
    normalJitter: 0.35,
    /** Tries per leaf before giving up on a crowded cluster. */
    attemptsPerLeaf: 4,
    /**
     * No leaf in front of a fruit or its name: a box around each fruit's center, as seen from the
     * front, that leaves may only fill from behind (`frontMargin` behind the fruit's center).
     */
    keepOut: {
      halfWidth: 2.3,
      above: 1.6,
      below: 3,
      frontMargin: 1,
    },
  },
} as const;

type Widen<T> = { readonly [K in keyof T]: T[K] extends number ? number : Widen<T[K]> };

export type LayoutConfig = Widen<typeof LAYOUT>;

/** Canvas-like navigation: drag to pan, wheel/pinch to zoom toward the cursor. */
export const NAVIGATION = {
  /** Closest the camera gets to the point it looks at. */
  minDistance: 7,
  /** Farthest zoom, as a multiple of the distance that frames the whole tree. */
  maxDistanceFactor: 1.6,
  /** Extra room around the layout bounds when framing everything. */
  framingMargin: 1.08,
  /** The point the camera looks at may wander this far past the layout bounds. */
  boundaryMargin: 4,
  /** Right drag tilts the view at most this much either way: a hint of depth, never a turn. */
  parallaxAngle: 8 * DEG,
  /** Each zoom button press multiplies or divides the distance by this. */
  zoomStep: 1.5,
  /** Seconds the camera takes to catch up with the input. */
  smoothTime: 0.25,
  draggingSmoothTime: 0.08,
  /** A press that moves farther than this many pixels is a drag, never a click. */
  clickTolerance: 6,
} as const;

/** How the layout becomes meshes. Segment counts follow length and thickness. */
export const TREE_MESH = {
  tubularSegmentsPerUnit: 3,
  minTubularSegments: 8,
  maxTubularSegments: 64,
  radialSegmentsPerUnit: 24,
  minRadialSegments: 6,
  maxRadialSegments: 20,
} as const;

/** A lantern-like fruit: a ribbed body of radius 1 under a small cap and stem. */
export const FRUIT_MESH = {
  /** Points along the body profile, from the bottom pole to the top pole. */
  profileSegments: 24,
  radialSegments: 48,
  /** Top and bottom of the body, in radii from its center: slightly taller than wide. */
  top: 1.08,
  bottom: 1.02,
  /** Below 1 the sides bulge out like a paper lantern; 1 is an ellipse. */
  roundness: 0.75,
  ribs: 8,
  /** How deep the grooves between ribs are, as a fraction of the radius. */
  ribDepth: 0.06,
  /** Higher makes the grooves narrower. */
  ribSharpness: 6,
  /** How much the ribs bend the shading normals (0 = shaded like a smooth body). */
  ribShading: 0.3,
  capRadius: 0.32,
  capHeight: 0.14,
  /** Top radius of the cap relative to its bottom. */
  capTaper: 0.85,
  /** Fraction of the cap sunk into the body. */
  capSink: 0.4,
  stemRadius: 0.06,
  stemTaper: 0.7,
  stemHeight: 0.38,
  capSegments: 16,
  /** Halo quad side, in fruit radii, and its peak opacity. */
  haloSize: 3.4,
  haloOpacity: 0.55,
  /** How far behind the fruit (toward the far side, in fruit radii) the halo is drawn. */
  haloDepthOffset: 1.2,
  /** Scale of a hovered or selected fruit. */
  highlightScale: 1.18,
  /** Higher eases faster (1/s). */
  scaleRate: 14,
} as const;

export const FRUIT_LABEL = {
  fontSize: 0.5,
  lineHeight: 1.05,
  /** Space between the bottom of the fruit and the top of its name. */
  gap: 0.3,
  outlineWidth: 0.05,
  outlineOpacity: 0.85,
  /** Names of generations up to this one are always shown, however far the camera is. */
  alwaysVisibleGenerations: 1,
  /** Other names fade out between these camera distances. */
  fadeStart: 38,
  fadeEnd: 52,
  /** Higher eases faster (1/s). */
  fadeRate: 10,
  /** Below this opacity the label is not drawn at all. */
  minOpacity: 0.01,
} as const;

/** One leaf quad; its outline is cut in shaders/leaf.frag.glsl. */
export const LEAF_MESH = {
  /** Width of the quad relative to its length. */
  aspect: 0.55,
  /** Below 1 the leaf is fuller near the stem. */
  shapeBias: 0.8,
  /** 0 is a pointed oval, 1 a straight taper from a wide base (a blade of grass). */
  taper: 0,
  /** Where the darker rim starts (1 = the very edge) and how dark it gets. */
  edgeStart: 0.72,
  edgeMix: 0.45,
  /** Half width of the central vein, in uv units, and how dark it is. */
  veinWidth: 0.025,
  veinMix: 0.25,
  rimStrength: 0.28,
  /** Leaves lean less toward the shade tint than wood does, so dark foliage stays green, not grey. */
  shadeMix: 0.35,
} as const;

/** A blade of grass: the same shader as a leaf, cut as a thin taper with no rim or vein. */
export const GRASS_MESH = {
  aspect: 0.16,
  shapeBias: 1,
  taper: 1,
  edgeStart: 0.9,
  edgeMix: 0,
  veinWidth: 0.01,
  veinMix: 0,
  /** Blades are lit by the ground's normal, which faces up: a rim there would wash them out. */
  rimStrength: 0,
  shadeMix: 0.35,
} as const;

/** Illustrated shading shared by every toon material. Colors live in theme.ts. */
export const TOON = {
  /** Toward the sun: upper right, a bit in front. Need not be normalized. */
  sunDirection: [0.55, 0.8, 0.45] as const,
  /** Half-Lambert light amount where the bands change: shade → mid → base → light. */
  bandEdges: [0.38, 0.6, 0.86] as const,
  /** Half width of each band edge: just enough to anti-alias it. */
  bandSoftness: 0.015,
  /** How far the mid and base bands go from the shade color to the base color. */
  bandMix: [0.55, 1] as const,
  highlightMix: 0.3,
  /** How far a shape's shade color leans from its base color toward the theme's shade tint. */
  shadeMix: 0.55,
  rimStrength: 0.28,
  rimPower: 3,
  outline: {
    /** In CSS pixels: thin like an ink line. */
    branchThickness: 1.6,
    fruitThickness: 1.4,
  },
  bark: {
    /** Grooves around the circumference of every branch. A whole number keeps the seam hidden. */
    streaks: 7,
    /** How much the grooves wander as they run along the branch. */
    warp: 0.35,
    strength: 0.5,
  },
} as const;

/**
 * Everything around the tree. The tree stands on top of a hill whose back falls away, so the
 * ground's edge sits low behind the trunk and the crown stands against the sky.
 */
export const SCENERY = {
  seed: 'scenery',
  hill: {
    /** How far the ground drops from the top (under the trunk) to the far plain. */
    drop: 22,
    /** Gaussian widths of the hilltop: wide sideways, short front to back so its back drops fast. */
    radiusX: 34,
    radiusZ: 20,
    /** Side of the square ground mesh and its grid resolution. */
    /** Large enough that its far edge hides behind the first ridge. */
    size: 480,
    segments: 220,
  },
  grass: {
    /** Blades grow in tufts around the trunk, between these distances from its base. */
    innerRadius: 1.4,
    outerRadius: 16,
    /** Above 1 crowds the tufts toward the trunk. */
    falloff: 1.6,
    bladesPerTuft: 9,
    tuftRadius: 0.7,
    height: 0.9,
    heightJitter: 0.4,
    /** Largest lean away from vertical, in radians. */
    maxLean: 0.35,
    /** Random turn around the vertical, in radians: blades mostly face the camera. */
    yawJitter: 0.9,
    /** Large on purpose: blades spread over several toon bands, which reads as texture. */
    normalJitter: 0.9,
  },
  clouds: {
    /** Each layer is farther back, so panning slides it less: parallax from the real perspective. */
    layers: [
      { z: -60, count: 4, scale: 1, drift: 0.25 },
      { z: -130, count: 5, scale: 1.8, drift: 0.15 },
      { z: -220, count: 6, scale: 2.8, drift: 0.08 },
    ],
    /**
     * Camera distance the layouts are designed around; layers farther than this spread out
     * proportionally so they cover the same part of the view.
     */
    referenceDistance: 60,
    /** Horizontal spread, as a multiple of the tree's width, before the depth spread. */
    spreadX: 1.6,
    /** Height above the tree's center, as fractions of the tree's height. */
    minHeight: 0.15,
    maxHeight: 0.75,
    /** Random shift of each cloud within its even slot, as a fraction of the slot. */
    slotJitter: 0.35,
    /** Puff centers sit this far above the flat bottom, as a fraction of their radius. */
    minPuffLift: 0.1,
    maxPuffLift: 0.45,
    minPuffs: 4,
    maxPuffs: 7,
    width: 9,
    widthJitter: 0.35,
    puffRadius: 1.9,
    /** Puffs in the middle are up to this much bigger than the ones at the ends. */
    puffBulge: 0.9,
    puffJitter: 0.25,
    /** Each puff sits this much in front of the previous one, so they never z-fight. */
    puffDepthStep: 0.04,
    /**
     * Each puff is lit by a copy of itself shifted this far toward the sun (in puff radii): what
     * the copy does not cover is a crescent of shade on the far side.
     */
    shadeOffset: 0.32,
    /** The bottom of every cloud is in shade up to this height, as a fraction of its puff radius. */
    bottomShade: 0.35,
  },
  ridges: {
    layers: [
      { z: -150, height: 9, fog: 0.12 },
      { z: -260, height: 16, fog: 0.55 },
    ],
    /** Where the ridge line sits, below the tree's lowest point. */
    baseDrop: 6,
    /** Half width of each ridge, as a multiple of its distance from the camera. */
    halfWidthFactor: 2.2,
    points: 96,
    /** Sine waves summed into the ridge line: frequency (cycles over its width) and weight. */
    waves: [
      [2, 0.55],
      [5, 0.3],
      [11, 0.15],
    ],
    /** How far down the ridge's body reaches below its line. */
    depth: 300,
  },
  pollen: {
    /** Box the pollen floats in, as padding around the tree's bounds. */
    padding: 6,
    size: 0.16,
    sizeJitter: 0.5,
    /** Floating motion: amplitude (world units) and speed (radians per second). */
    driftAmplitude: 0.6,
    driftSpeed: 0.35,
    opacity: 0.75,
  },
} as const;

export type SceneryConfig = Widen<typeof SCENERY>;

/** Screen-space sky behind everything. */
export const SKY = {
  /** Where the sun glow sits on screen (0–1 from the bottom left), how wide and how strong. */
  sunPosition: [0.78, 0.82] as const,
  sunRadius: 0.45,
  sunStrength: 0.35,
  /** Bottom of the gradient (horizon color) and where it reaches the top color. */
  gradientStart: 0.15,
  gradientEnd: 1,
} as const;

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
