import type { DayPhase, DayStop } from '@/domain/dayCycle';
import type { Season } from '@/domain/seasons';
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
  /** Halo quad side, in fruit radii; its opacity depends on the hour (DAY_CYCLE.looks). */
  haloSize: 3.4,
  /** How far behind the fruit (toward the far side, in fruit radii) the halo is drawn. */
  haloDepthOffset: 1.2,
  /** Scale of a hovered or selected fruit. */
  highlightScale: 1.15,
  /**
   * The scale follows a spring: stiffness in 1/s², and a damping ratio just under 1 so it settles
   * with the smallest overshoot (no exaggerated bounce).
   */
  scaleSpring: { stiffness: 260, dampingRatio: 0.6 },
  /** A hovered or selected fruit's halo: peak opacity, how much it grows and how fast (1/s). */
  haloGlow: { opacity: 1, growth: 0.35, rate: 9 },
  /** Faint light of their own on the fruits of those who have passed. */
  deceasedGlow: 0.14,
} as const;

/** Specks of light that rise from a fruit when the pointer reaches it. */
export const HOVER_SPARKS = {
  perBurst: 6,
  /** Seconds between one speck of a burst and the next, so they don't all pop at once. */
  stagger: 0.07,
  /** Specks alive at once across all fruits; the oldest are reused first. */
  pool: 36,
  /** Seconds each speck lives. */
  minLife: 1.3,
  maxLife: 2.1,
  /** Where they start, in fruit radii from its center: a band around its lower half. */
  spread: 0.9,
  startBelow: 0.6,
  startAbove: 0.3,
  /** Toward the camera, in fruit radii, so the lantern itself never hides them. */
  startFront: 0.7,
  /** World units per second upward, and the ± sideways drift. */
  rise: 1.1,
  drift: 0.25,
  /** Side to side flicker as they rise: amplitude (world units) and angular frequency. */
  wiggle: 0.12,
  wiggleFrequency: 5,
  /** World size at birth; they shrink to `endSize` of it as they fade. */
  size: 0.32,
  endSize: 0.45,
  opacity: 1,
  /** Fractions of the life spent fading in and where the fade out starts. */
  fadeIn: 0.15,
  fadeOutStart: 0.5,
} as const;

export const FRUIT_LABEL = {
  fontSize: 0.5,
  lineHeight: 1.05,
  /** Space between the bottom of the fruit and the top of its name. */
  gap: 0.3,
  /**
   * A couple's names run away from each other, each starting this far (in fruit radii) past its
   * own fruit's center toward the partner.
   */
  pairInset: 0.55,
  /** Drawn after everything else, on top. */
  renderOrder: 10,
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
  /**
   * Names write depth where there is ink (above this alpha), so the depth of field sees them at
   * their fruit and keeps them sharp; their see-through parts write nothing.
   */
  depthAlphaTest: 0.02,
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
  /** 0: the whole leaf rides the wind with its stem. 1: rooted at the base, only the tip bends. */
  swayAnchor: 0,
  /** Extra flutter of the tip across the leaf's own plane, in world units. */
  flutter: 0.1,
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
  swayAnchor: 1,
  flutter: 0,
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
  /** At night, around the crown and low over the grass. */
  fireflies: {
    /** How many, as a fraction of the quality tier's particles. */
    share: 0.15,
    padding: 3,
    /** Share of them that stay low, over the grass. */
    lowShare: 0.4,
    lowHeight: 2.5,
    size: 0.9,
    sizeJitter: 0.35,
    /** Lazy loops: amplitude (world units) and speed (radians per second). */
    driftAmplitude: 1.2,
    driftSpeed: 0.22,
    /** Each one glows and goes dark at its own pace (radians per second). */
    blinkSpeed: [0.6, 1.4],
    /** Higher makes the glow shorter and the dark longer. */
    blinkSharpness: 3,
  },
} as const;

export type SceneryConfig = Widen<typeof SCENERY>;

/** Screen-space sky behind everything. */
export const SKY = {
  /** How wide the sun glow is; where it sits and how strong depend on the hour (DAY_CYCLE). */
  sunRadius: 0.45,
  /** Stars: share of the grid cells that hold one, cells per screen height, and their radius in cells. */
  stars: { density: 0.12, scale: 70, size: 0.09 },
  /** Bottom of the gradient (horizon color) and where it reaches the top color. */
  gradientStart: 0.15,
  gradientEnd: 1,
} as const;

/** Finishing passes; which ones run depends on quality.ts. */
export const POSTPROCESSING = {
  bloom: {
    // Intensity and threshold follow the hour (DAY_CYCLE.looks): by day only real highlights
    // glow a little, above the paper-white of clouds and labels; at night the lanterns do.
    smoothing: 0.2,
    radius: 0.6,
  },
  paper: {
    fiberScale: 3,
    fiberStrength: 0.06,
    washScale: 260,
    washStrength: 0.035,
    grainStrength: 0.025,
    tint: 0.12,
    /** Distance from the center (in screen heights) where the vignette starts and is full. */
    vignetteStart: 0.45,
    vignetteEnd: 1.05,
    vignetteStrength: 0.35,
  },
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

/**
 * A breeze that never stops. Every swaying thing reads the same field (shaders/wind.glsl, mirrored
 * in scene/wind/windField.ts), scaled by its weight: 0 at the trunk's base, 1 at the farthest tip.
 */
export const WIND = {
  /** Sway at weight 1 in calm air, in world units. */
  amplitude: 0.3,
  /** Horizontal direction the wind blows toward (x, z): mostly across the screen. */
  direction: [1, 0.2] as const,
  /** Three layered oscillations: angular frequencies (rad/s), how much each counts and its phase. */
  frequencies: [0.55, 1.2, 2.45] as const,
  mix: [0.62, 0.28, 0.1] as const,
  phases: [0, 1.7, 4.1] as const,
  /** Phase lost per world unit along each axis, so the sway rolls across the crown as a wave. */
  wave: [0.07, 0.035, 0.02] as const,
  /** Up and down bob, relative to the amplitude, and its angular frequency. */
  bobRatio: 0.3,
  bobFrequency: 0.85,
  /** Weight = (reach / farthest reach)^exponent: stiff near the trunk, supple at the twigs. */
  weightExponent: 1.6,
  /** Samples per branch when measuring its length for the weights. */
  curveSamples: 32,
  /** Grass blades all sway with this weight (at their tip; their root stays put). */
  grassWeight: 0.55,
  /** Angular frequency of a leaf's flutter (its size is LEAF_MESH.flutter). */
  flutterFrequency: 3.2,
  /** A lantern tilts this many radians per unit of sideways sway, like something hanging. */
  fruitTilt: 0.25,
  gust: {
    seed: 'wind-gust',
    /** Time is cut into slots of this many seconds; each holds at most one gust. */
    interval: 12,
    /** Probability that a slot has a gust. */
    chance: 0.65,
    minDuration: 3,
    maxDuration: 5.5,
    /** Fraction of the gust spent swelling; the rest is a slower fade. */
    rise: 0.35,
    /** Weakest gust, as a fraction of the strongest. */
    minPeak: 0.5,
    /** At the strongest gust the sway grows by this fraction… */
    boost: 1.1,
    /** …and the whole crown leans this many world units downwind (at weight 1). */
    lean: 0.45,
  },
  /** With prefers-reduced-motion: a fraction of the sway and no gusts. */
  reducedMotionScale: 0.3,
  /** How fast (1/s) the wind settles into a new strength when reduced motion changes. */
  settleRate: 1.5,
  /** Longest step the wind clock takes in one frame, so a stalled tab doesn't jump. */
  maxStep: 0.1,
} as const;

/** Selecting a person: the camera flies to them, sap runs up their lineage, the rest steps back. */
export const SELECTION = {
  camera: {
    /** Distance from the person at the end of the flight, and how far above them it looks from. */
    distance: 24,
    lift: 1.5,
    /** Mid-flight, the camera is this fraction farther from what it looks at: a small breath out. */
    pullBack: 0.25,
  },
  sap: {
    /** Seconds the pulse takes from the trunk's base to the fruit. */
    duration: 1.5,
    /** Half width of the bright head, in world units along the wood. */
    head: 1.6,
    /** Light added to the wood behind the head while the person stays selected. */
    trail: 0.4,
    /** How much the head shines past its color: above 1 it reaches the bloom. */
    shine: 0.35,
    /** How far its shaded side leans toward the bark's shade, so it keeps the toon bands. */
    shadeMix: 0.5,
    /** Seconds to fade the previous lineage before the next one starts. */
    fadeOut: 0.2,
  },
  focus: {
    /** How far everything else moves toward grey (0–1) when someone is selected. */
    desaturation: 0.55,
    /** Seconds to step back on selection, and to come back on deselection. */
    duration: 0.9,
    release: 0.7,
    /** Depth of field: world units kept sharp around the person, and the blur at full focus. */
    focusRange: 10,
    /**
     * Soft: the tree is nearly flat, so the blur mostly separates it from the landscape. Stronger
     * blur makes a faint ghost around the (sharp) names.
     */
    bokehScale: 1.5,
  },
  /** With prefers-reduced-motion: no flight, the lineage simply fades in. */
  reducedMotionFade: 0.35,
} as const;

/** The opening: a seed falls, sprouts, and the tree grows generation by generation. Seconds. */
export const INTRO = {
  seed: {
    /** Starts this far above the hilltop, just out of the opening view. */
    startHeight: 11,
    fallDuration: 1.7,
    /** Side to side drift while falling: amplitude (world units) and how many swings. */
    swayAmplitude: 0.9,
    swayTurns: 2.5,
    /** Most it tilts while swinging, in radians. */
    swayTilt: 0.5,
    /** Seed radius (world units); it sits on the ground, then sinks into it. */
    size: 0.32,
    sinkDuration: 0.5,
  },
  /** Pause between landing and the first shoot. */
  sproutDelay: 0.15,
  growth: {
    /** Time from the shoot to the last branch tip, whatever the size of the family. */
    duration: 4.4,
    /** A child branch waits this long after the growth passes the point it sprouts from. */
    generationPause: 0.25,
    /**
     * Seconds a ring takes to swell to full thickness after the tip passes it: long enough that a
     * shoot comes out slim and thickens behind its tip, as wood does.
     */
    swell: 1.2,
    /** Roots spread out over this long, starting with the shoot. */
    rootDuration: 1.2,
  },
  fruit: {
    /** A fruit pops this long after its branch reaches its tip; a partner's a little later. */
    delay: 0.1,
    graftDelay: 0.2,
  },
  leaves: {
    /** After the growth passes its cluster, the leaves open from the center outward over this long. */
    spread: 0.5,
    /** Seconds a single leaf takes to unfold, and its overshoot (back easing). */
    unfold: 0.45,
    overshoot: 1.6,
  },
  camera: {
    /** Opening view: close on the hilltop, looking at this height above it. */
    startDistance: 24,
    startLift: 3.5,
    /** The camera starts pulling back to the whole tree this long after the seed lands. */
    pullDelay: 0.3,
    /** …and arrives this long before the growth ends. */
    arriveEarly: 0.4,
  },
  /** Frames drawn after the shaders compile and before the intro starts, so it starts smooth. */
  warmUpFrames: 2,
  /** How long the UI takes to appear once the intro ends (or straight away, without one). */
  uiFade: 0.8,
  /** localStorage key that remembers the visitor has seen it. */
  storageKey: 'arbol-familiar:intro-vista',
} as const;

/** The puff where the seed lands: same particles as the hover sparks, heavier and wider. */
export const INTRO_DUST = {
  perBurst: 14,
  stagger: 0.01,
  pool: 14,
  minLife: 0.7,
  maxLife: 1.3,
  spread: 3.5,
  // Above the grass, which would hide a puff at ground level.
  startBelow: -0.3,
  startAbove: 0.9,
  startFront: 1,
  rise: 0.8,
  drift: 1.4,
  wiggle: 0.05,
  wiggleFrequency: 3,
  size: 0.4,
  endSize: 1.4,
  opacity: 0.8,
  fadeIn: 0.05,
  fadeOutStart: 0.25,
} as const;

/**
 * Now and then a leaf lets go of the crown and tumbles down to the grass. How many can be in the
 * air at once comes from quality.ts; each of those slots waits, drops one leaf, and waits again.
 */
export const FALLING_LEAVES = {
  seed: 'falling-leaf' as string,
  /** Seconds a slot waits before its first leaf, spread across the slots so they never fall together. */
  firstWait: [4, 22] as const,
  /** Seconds between one leaf touching down and the next one letting go, in the same slot. */
  wait: [10, 26] as const,
  /** Where in its cluster a leaf lets go: from this fraction of the radius out to the edge. */
  shell: 0.6,
  /** Falling speed once the leaf has caught the air, in world units per second. */
  speed: [1.3, 1.9] as const,
  /** Seconds it takes to reach that speed after letting go. */
  catchAir: 1.2,
  /** Side-to-side swing as it falls, like a pendulum: half width and angular frequency (rad/s). */
  swing: [0.9, 1.7] as const,
  swingFrequency: [1.1, 1.7] as const,
  /** World units it travels downwind per unit it falls. */
  driftPerFall: 0.18,
  /** Tilt that follows the swing (radians at the widest point) and a slow tumble around its own length. */
  rock: 0.7,
  tumble: [0.6, 1.6] as const,
  size: 1.2,
  sizeJitter: 0.2,
  /** Seconds to appear as it lets go, hidden by the crown, and to shrink away from the grass. */
  appear: 0.4,
  /** Seconds it lies on the grass before going. */
  lie: [3, 6] as const,
  vanish: 1.2,
  /** Just above the ground, so the grass half covers it. */
  restHeight: 0.15,
  /** Turn of the leaf on the grass, from lying flat (0) to facing the camera (π/2). */
  restTilt: 0.35,
} as const;

export type FallingLeavesConfig = Widen<typeof FALLING_LEAVES>;

/**
 * Now and then a golden leaf lets go near someone who has passed: rare and slow, a remembrance,
 * not a sad note. One in the air at most.
 */
export const MEMORIAL_LEAVES = {
  slots: 1,
  /** With no clusters on their own branch, the leaf comes from this many nearest ones. */
  nearestClusters: 2,
  fall: {
    ...FALLING_LEAVES,
    seed: 'memorial-leaf',
    firstWait: [8, 24] as const,
    wait: [40, 90] as const,
    speed: [0.8, 1.1] as const,
    catchAir: 1.8,
  },
} as const;

/**
 * Light through the day, by the visitor's local time. Between two stops the look blends; two stops
 * of the same phase hold it. The colors of each phase are in theme.ts (dayPhasePalettes).
 */
export const DAY_CYCLE = {
  stops: [
    { hour: 5, phase: 'night' },
    { hour: 6.25, phase: 'dawn' },
    { hour: 8, phase: 'day' },
    { hour: 16.75, phase: 'day' },
    { hour: 18, phase: 'dusk' },
    { hour: 19.25, phase: 'night' },
  ] satisfies readonly DayStop[],
  /** How fast (1/s) the scene moves toward a new look: a forced change takes a few seconds. */
  transitionRate: 0.9,
  /** How often the clock is read again, in milliseconds. */
  clockInterval: 30_000,
  looks: {
    dawn: {
      foliageShadeMix: 0.22,
      lanternGlow: 0.15,
      fireflies: 0,
      stars: 0.15,
      sunPosition: [0.18, 0.34],
      sunStrength: 0.55,
      haloOpacity: 0.55,
      bloomIntensity: 0.25,
      bloomThreshold: 0.92,
    },
    day: {
      foliageShadeMix: 0,
      lanternGlow: 0,
      fireflies: 0,
      stars: 0,
      sunPosition: [0.78, 0.82],
      sunStrength: 0.35,
      haloOpacity: 0.55,
      bloomIntensity: 0.2,
      bloomThreshold: 0.95,
    },
    dusk: {
      foliageShadeMix: 0.3,
      lanternGlow: 0.35,
      fireflies: 0.35,
      stars: 0.1,
      sunPosition: [0.84, 0.3],
      sunStrength: 0.6,
      haloOpacity: 0.7,
      bloomIntensity: 0.45,
      bloomThreshold: 0.85,
    },
    night: {
      foliageShadeMix: 0.62,
      lanternGlow: 0.5,
      fireflies: 1,
      stars: 1,
      // The moon.
      sunPosition: [0.22, 0.8],
      sunStrength: 0.3,
      haloOpacity: 0.95,
      bloomIntensity: 0.9,
      bloomThreshold: 0.7,
    },
  } satisfies Record<DayPhase, DayLook>,
} as const;

export interface DayLook {
  /** How far leaves and grass lean toward the palette's foliageShade. */
  readonly foliageShadeMix: number;
  /** Light of their own on the fruits: lanterns at night. */
  readonly lanternGlow: number;
  /** 0–1: how many fireflies are out. */
  readonly fireflies: number;
  /** 0–1: how bright the stars are. */
  readonly stars: number;
  /** Where the sun (or moon) glows on screen, 0–1 from the bottom left, and how strong. */
  readonly sunPosition: readonly [number, number];
  readonly sunStrength: number;
  readonly haloOpacity: number;
  readonly bloomIntensity: number;
  readonly bloomThreshold: number;
}

/** What each season does beyond its colors (seasonPalettes in theme.ts). */
export const SEASON_LOOK = {
  spring: { leafDensity: 1, fallWait: 1, blossomDensity: 0.55, chill: 0 },
  summer: { leafDensity: 1, fallWait: 1, blossomDensity: 0, chill: 0 },
  // More leaves let go: the wait between two falls in a slot is a third of the usual.
  autumn: { leafDensity: 0.9, fallWait: 0.3, blossomDensity: 0, chill: 0 },
  winter: { leafDensity: 0.45, fallWait: 1.6, blossomDensity: 0, chill: 0.3 },
} as const satisfies Record<Season, SeasonLook>;

export interface SeasonLook {
  /** Fraction of the leaves on the tree. */
  readonly leafDensity: number;
  /** Multiplies the wait between falling leaves: below 1, more of them. */
  readonly fallWait: number;
  /** Fraction of the leaf clusters that carry blossoms. */
  readonly blossomDensity: number;
  /** How far sky and hills lean toward the season's chill color. */
  readonly chill: number;
}

/** Flowers: scattered over the crown in spring, covering a branch on someone's birthday. */
export const BLOSSOMS = {
  season: {
    perCluster: 14,
    size: 0.6,
    sizeJitter: 0.3,
    shell: [0.65, 1] as const,
    depthScale: 0.6,
    /** World units each flower is drawn toward the camera, so leaves don't bury it. */
    pull: 0.3,
  },
  birthday: {
    count: 80,
    size: 0.85,
    sizeJitter: 0.3,
    from: 0.35,
    spread: 0.7,
    aroundFruit: 0.35,
    fruitRing: [1.15, 2.1] as const,
    /** Pulled well in front of the crown: they are the point of the day. */
    pull: 1.4,
  },
  bloom: {
    /** Seconds from the first flower of a branch opening to the last. */
    spread: 2.2,
    /** Seconds one flower takes to open, and its overshoot (back easing). */
    open: 0.5,
    overshoot: 1.8,
    /** The birthday bloom waits this long after the tree is on screen, so it is seen. */
    delay: 0.8,
  },
  /** How much darker the petals are at their center, and how much of the edge is inked. */
  petalShade: 0.18,
  edgeMix: 0.45,
} as const;

/** The family timeline: the tree as it was in a chosen year. */
export const TIMELINE = {
  /** Years a person's branch takes to grow, ending the year they are born. */
  growYears: 3,
  /** Seconds of intro growth one year stands for, so wood swells and leaves unfold alike. */
  secondsPerYear: 0.6,
  /** How fast (1/s) the tree catches up with the year picked on the slider. */
  followRate: 5,
  /** One year every this many milliseconds while ▶ plays. */
  playStepMs: 150,
  /** Leaves of a cluster open over this many years once its point of the branch exists. */
  leafSpreadYears: 0.8,
  /**
   * A year on the slider shows the tree this far into it: everyone born that year is already
   * there, and nobody born the next one yet.
   */
  yearProgress: 0.9,
} as const;

/** Seconds. */
export const TIMING = {
  introDuration: 8,
  reducedMotionIntroDuration: 0.6,
  cameraFlyDuration: 1.2,
} as const;

/**
 * The person panel: a column on the right on wide screens, a sheet pulled up from the bottom on
 * phones. Sizes in CSS pixels unless noted.
 */
export const PERSON_PANEL = {
  width: 400,
  margin: 16,
  /** Up to this viewport width the panel is a bottom sheet. */
  sheetMaxWidth: 720,
  /** Sheet heights as fractions of the viewport: resting, and pulled all the way up. */
  sheetPeek: 0.46,
  sheetFull: 0.92,
  /** Let go below this fraction of its resting height, the sheet closes. */
  sheetCloseAt: 0.6,
  /** A flick faster than this (pixels per millisecond) carries on in its direction. */
  sheetFlickVelocity: 0.5,
  /** Polaroids lean up to this many degrees either way, seeded by the photo. */
  polaroidTilt: 5,
  /** Seconds the "copied" confirmation stays on the button. */
  copiedFeedback: 2,
  /** Bars in a voice note's waveform, and the height of the quietest one (fraction of the tallest). */
  waveformBars: 44,
  waveformFloor: 0.12,
  /** Seconds the arrow keys move a voice note. */
  voiceSeekStep: 5,
} as const;

export const SEARCH = {
  maxResults: 8,
} as const;

/**
 * The origins map. Distances are SVG units of each panel (the main map and the small world map);
 * angles and margins around the land are in degrees.
 */
export const ORIGINS_MAP = {
  /** Places in this country go on the main map; the rest, on the world map beside it. */
  homeCountry: 'Colombia',
  home: {
    width: 560,
    /** Sea left around the land and the places, in degrees. */
    padding: 1.4,
  },
  world: {
    width: 360,
    lng: [-170, 180] as const,
    lat: [-56, 82] as const,
  },
  place: {
    /** Dot radius: base plus this much per square root of the people born there. */
    radius: 5,
    radiusPerPerson: 3.2,
    /** The world map is drawn smaller: its dots shrink by this factor. */
    worldScale: 0.7,
    /** Past this fraction of the width, the name prefers the left of the dot. */
    labelFlipAt: 0.72,
    /** Height of a place's name, its gap to the dot, and the width of a letter (fraction of size). */
    labelSize: 17,
    labelGap: 6,
    labelCharWidth: 0.56,
  },
  route: {
    /** How far a migration bows from the straight line, as a fraction of its length. */
    bend: 0.22,
    /** Each further line between the same two places bows this much more, so none overlap. */
    bendStep: 0.6,
  },
  animation: {
    /** Seconds a migration line takes to draw, and the wait between generations. */
    draw: 1.4,
    generationStagger: 0.45,
    /** Seconds a spark takes to travel a line, from parent to child. */
    travel: 3.2,
  },
} as const;

/** Ambient sound: music, wind and a soft pop on selecting someone. Volumes 0–1, times in seconds. */
export const AUDIO = {
  storageKey: 'arbol-familiar:audio',
  music: {
    /** Inside public/. */
    src: 'audio/ambient.mp3',
    /**
     * The loop played over and over. The file is periodic (see scripts/generate-ambient-music.ts),
     * so any window one period long loops without a seam, whatever the encoder adds at the start.
     */
    loopStart: 1,
    loopEnd: 49,
    volume: 0.55,
  },
  wind: {
    volume: 0.05,
    /** Band of the filtered noise, in Hz, and how slowly (Hz) it sways. */
    frequency: 520,
    sway: 220,
    swayRate: 0.07,
    gustRate: 0.045,
    /** How much the gusts move its volume, as a fraction of it. */
    gustDepth: 0.6,
  },
  pop: {
    volume: 0.16,
    /** MIDI notes it picks from, by person: D major pentatonic, the key of the music. */
    notes: [74, 76, 78, 81, 83, 86] as const,
    rise: 0.035,
    decay: 0.22,
  },
  fadeIn: 2.5,
  fadeOut: 1.2,
  /** Music and wind drop to this while a voice note plays, and take this long to get there. */
  duckLevel: 0.12,
  duckTime: 0.6,
} as const;

/** Photo mode: the caption stamped on each picture, as fractions of the picture's width. */
export const PHOTO = {
  caption: {
    titleSize: 0.026,
    dateSize: 0.013,
    /** Never smaller than this, in pixels, so a phone's picture still reads. */
    minTitleSize: 22,
    margin: 0.02,
    padding: 0.012,
    radius: 0.008,
  },
  /** Seconds of the white flash when the picture is taken. */
  flash: 0.45,
} as const;

/** A hidden signature carved in the bark, only readable with the camera all the way in. */
export const SIGNATURE = {
  lines: ['Hecho con amor', 'por Brayan, 2026'] as const,
  /** Height on the trunk, 0 = ground, 1 = top: over the root couple's branches, clear of the UI. */
  at: 0.68,
  fontSize: 0.13,
  lineHeight: 1.15,
  /** Sits this far out of the bark, so it never flickers into it. */
  lift: 0.015,
  /** Camera distance where it starts to show, and where it is fully there (minDistance is 7). */
  revealStart: 8.6,
  revealEnd: 7.6,
  opacity: 0.8,
  fadeRate: 4,
} as const;

/** A little bird that now and then perches on a branch, and flies off when touched. Seconds. */
export const BIRD = {
  perch: {
    /** Stretch of each branch it may sit on (curve parameter) and how many points are tried. */
    from: 0.3,
    to: 0.85,
    samples: 12,
    /** Only near-level wood: rise over run of the branch there. */
    maxSlope: 0.45,
    /** Keeps clear of the fruits, in world units from their center. */
    fruitClearance: 2,
    /** Too thin a twig would look like it should bend. */
    minRadius: 0.1,
    /** Out of the leaves: a perch inside this fraction of a cluster's radius would be hidden. */
    foliageClearance: 1,
  },
  /** Wait after the intro before the first visit, and between visits. */
  firstVisit: [12, 25] as const,
  wait: [35, 80] as const,
  stay: [14, 26] as const,
  arrive: 3.2,
  leave: 2.2,
  /** Seconds the visit fades in or out with reduced motion, where it does not fly. */
  fade: 0.8,
  /** World units: overall scale, and where flights start or end (sideways, up, toward the camera). */
  size: 0.95,
  flight: [16, 10, 5] as const,
  /** Flight arcs this much above the straight line. */
  arc: 3,
  /** Wing beat, in radians per second, and how far the wings swing either way. */
  flapRate: 24,
  flapAngle: 1.1,
  /** Perched: head bobs, a hop to turn around now and then. */
  bobRate: 2.6,
  hopEvery: [3, 7] as const,
  hopHeight: 0.25,
  hopDuration: 0.3,
} as const;

/** The loading screen: static in index.html, driven by ui/Loader/BootLoader once the app runs. */
export const LOADER = {
  /** Seconds it takes to fade away as the intro's seed starts to fall. */
  fade: 0.8,
  /** Seconds of one heartbeat of the seed. */
  beat: 1.6,
  /** What the bar shows before any JavaScript runs, so it never looks stuck at zero. */
  initial: 0.08,
  /** Share of the bar each real milestone fills; they add up to 1. */
  weights: {
    /** The app's code downloaded and running: by far the biggest part. */
    code: 0.55,
    /** Display and body fonts ready. */
    fonts: 0.1,
    /** Files through three's loading manager (drei's useProgress). */
    assets: 0.1,
    /** Shaders compiled and the first frame drawn. */
    scene: 0.25,
  },
} as const;
