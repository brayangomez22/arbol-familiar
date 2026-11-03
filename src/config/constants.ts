/** World units: 1 unit ≈ the radius of a fruit. */
export const CAMERA = {
  fov: 30,
  near: 0.1,
  far: 500,
  position: [0, 12, 60] as const,
} as const;

export const TREE = {
  trunkHeight: 10,
  trunkRadius: 1.2,
  fruitRadius: 1,
} as const;

/** Seconds. */
export const TIMING = {
  introDuration: 8,
  reducedMotionIntroDuration: 0.6,
  cameraFlyDuration: 1.6,
} as const;
