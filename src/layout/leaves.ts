import type { LayoutConfig } from '@/config/constants';
import type { GrownBranch } from './branchShape';
import { pointOnCurve } from './curve';
import { createRandom } from './random';
import type { LeafCluster } from './types';
import { add, vec3 } from './vec';

/**
 * Foliage zones: a full cluster near every tip and, on branches that carry children, a sparser one
 * further down so the crown reads as one mass. The root couple's twigs stay bare against the trunk.
 */
export function placeLeafClusters(
  branches: readonly GrownBranch[],
  config: LayoutConfig['leaves'],
): LeafCluster[] {
  const clusters: LeafCluster[] = [];

  for (const branch of branches) {
    const { node } = branch;
    if (!node || node.generation === 0) continue;

    const rng = createRandom(node.personId, 'leaves');
    const radius =
      config.radius *
      (1 + config.radiusPerFruitDoubling * Math.log2(node.fruitCount)) *
      (1 + rng.signed() * config.radiusJitter);
    const density = (base: number): number =>
      Math.min(1, Math.max(0, base * (1 + rng.signed() * config.densityJitter)));

    clusters.push({
      branchId: branch.id,
      branchT: config.tipT,
      position: add(pointOnCurve(branch.points, config.tipT), vec3(0, config.lift, 0)),
      radius,
      density: density(config.tipDensity),
    });

    if (node.children.length > 0) {
      clusters.push({
        branchId: branch.id,
        branchT: config.innerT,
        position: add(pointOnCurve(branch.points, config.innerT), vec3(0, config.lift, 0)),
        radius: radius * config.innerRadiusScale,
        density: density(config.innerDensity),
      });
    }
  }
  return clusters;
}
