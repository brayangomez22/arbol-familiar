import type { SceneryConfig } from '@/config/constants';
import { createRandom } from './random';
import type { BranchSegment, Vec3 } from './types';
import { normalize, vec3 } from './vec';

type HillConfig = SceneryConfig['hill'];
type GrassConfig = SceneryConfig['grass'];

/** The hilltop: centered under the trunk's base, at ground level (y = 0). */
export function hillTop(branches: readonly BranchSegment[]): Vec3 {
  const base = branches.find((branch) => branch.kind === 'trunk')?.points[0];
  return vec3(base?.x ?? 0, 0, base?.z ?? 0);
}

/**
 * Height of the ground around a hilltop at `top` (the trunk's base): 0 at the top, falling toward
 * `-drop` far away. Faster front to back than sideways, so its back edge hides close behind.
 */
export function groundHeight(x: number, z: number, top: Vec3, hill: HillConfig): number {
  const dx = (x - top.x) / hill.radiusX;
  const dz = (z - top.z) / hill.radiusZ;
  return top.y - hill.drop * (1 - Math.exp(-(dx * dx + dz * dz)));
}

/** Unit normal of the ground at (x, z). */
export function groundNormal(x: number, z: number, top: Vec3, hill: HillConfig): Vec3 {
  const dx = (x - top.x) / hill.radiusX;
  const dz = (z - top.z) / hill.radiusZ;
  const falloff = 2 * hill.drop * Math.exp(-(dx * dx + dz * dz));
  // Normal of y = h(x, z) is (-∂h/∂x, 1, -∂h/∂z).
  return normalize(vec3((falloff * dx) / hill.radiusX, 1, (falloff * dz) / hill.radiusZ));
}

export interface GrassBlade {
  /** Root of the blade, on the ground. */
  readonly position: Vec3;
  /** Turn around the vertical, in radians: 0 faces the camera. */
  readonly yaw: number;
  /** Lean away from vertical, in radians, along the blade's own plane. */
  readonly lean: number;
  readonly height: number;
  readonly colorIndex: number;
  /** Normal used for lighting: the ground's, slightly varied, so the grass shades like the hill. */
  readonly shadeNormal: Vec3;
}

/** Tufts of grass around the trunk's base, crowded near it and thinning out. Deterministic. */
export function placeGrass(
  count: number,
  top: Vec3,
  colorCount: number,
  hill: HillConfig,
  grass: GrassConfig,
  seed: string,
): GrassBlade[] {
  const blades: GrassBlade[] = [];
  const tufts = Math.ceil(count / grass.bladesPerTuft);

  for (let tuft = 0; tuft < tufts && blades.length < count; tuft++) {
    const rng = createRandom(seed, 'grass', String(tuft));
    const angle = rng.next() * Math.PI * 2;
    const distance =
      grass.innerRadius +
      (grass.outerRadius - grass.innerRadius) * Math.pow(rng.next(), grass.falloff);
    const centerX = top.x + Math.cos(angle) * distance;
    const centerZ = top.z + Math.sin(angle) * distance;

    for (let i = 0; i < grass.bladesPerTuft && blades.length < count; i++) {
      const x = centerX + rng.signed() * grass.tuftRadius;
      const z = centerZ + rng.signed() * grass.tuftRadius;
      if (Math.hypot(x - top.x, z - top.z) < grass.innerRadius) continue;
      const ground = groundNormal(x, z, top, hill);
      blades.push({
        position: vec3(x, groundHeight(x, z, top, hill), z),
        yaw: rng.signed() * grass.yawJitter,
        lean: rng.signed() * grass.maxLean,
        height: grass.height * (1 + rng.signed() * grass.heightJitter),
        colorIndex: rng.int(0, colorCount - 1),
        shadeNormal: normalize(
          vec3(
            ground.x + rng.signed() * grass.normalJitter,
            ground.y,
            ground.z + rng.signed() * grass.normalJitter,
          ),
        ),
      });
    }
  }
  return blades;
}
