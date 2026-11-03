import type { LayoutConfig } from '@/config/constants';
import { TRUNK_ID, type GrownBranch } from './branchShape';
import { createRandom } from './random';
import type { BranchSegment } from './types';
import { add, vec3 } from './vec';

const ROOT_CONTROL_POINTS = [
  // [fraction of the length outward, fraction of the way from start height down to the tip depth]
  [0, 0],
  [0.3, 0.55],
  [0.65, 0.8],
  [1, 1],
] as const;

/** Decorative roots flaring out of the trunk base and sinking into the ground, seeded by the root union. */
export function growRoots(
  rootUnionId: string,
  trunk: GrownBranch,
  config: LayoutConfig['roots'],
): BranchSegment[] {
  const base = trunk.points[0] ?? vec3(0, 0, 0);
  const rng = createRandom(rootUnionId, 'roots');
  const count = rng.int(config.minCount, config.maxCount);
  const startAzimuth = rng.next() * Math.PI * 2;
  const trunkHeight = trunk.points[trunk.points.length - 1]?.y ?? 1;

  return Array.from({ length: count }, (_, i) => {
    const rootRng = createRandom(rootUnionId, 'root', String(i));
    const azimuth =
      startAzimuth +
      (Math.PI * 2 * i) / count +
      rootRng.signed() * (Math.PI / count) * config.spreadJitter;
    const length = config.length * (1 + rootRng.signed() * config.lengthJitter);
    const outward = vec3(Math.cos(azimuth), 0, Math.sin(azimuth) * config.zSquash);
    const drop = config.startHeight + config.depth;
    const start = add(base, vec3(0, config.startHeight, 0));
    const wobble = rootRng.signed() * config.wobble * length;

    const points = ROOT_CONTROL_POINTS.map(([along, down], index) => {
      const interior = index > 0 && index < ROOT_CONTROL_POINTS.length - 1;
      const sideways = interior ? wobble * along : 0;
      return add(
        start,
        vec3(
          outward.x * length * along - outward.z * sideways,
          -drop * down,
          outward.z * length * along + outward.x * sideways,
        ),
      );
    });

    return {
      id: `root-${i}`,
      kind: 'root',
      parentBranchId: TRUNK_ID,
      parentT: config.startHeight / trunkHeight,
      points,
      radiusStart:
        trunk.radius.start * config.radiusRatio * (1 + rootRng.signed() * config.radiusJitter),
      radiusEnd: config.tipRadius,
      generation: 0,
      personId: null,
      order: i,
    };
  });
}
