import { BufferAttribute, CircleGeometry, type BufferGeometry } from 'three';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';
import type { CloudPuff } from '@/layout/scenery';

/**
 * One cloud as overlapping discs. Each vertex knows where it sits within its own puff (aPuff, -1
 * to 1) so the shader can shade every puff as a little ball.
 */
export function buildCloudGeometry(
  puffs: readonly CloudPuff[],
  segments: number,
  depthStep: number,
): BufferGeometry {
  const discs = puffs.map((puff, index) => {
    const disc = new CircleGeometry(1, segments);
    const position = disc.getAttribute('position');
    const local = new Float32Array(position.count * 2);
    for (let i = 0; i < position.count; i++) {
      local[i * 2] = position.getX(i);
      local[i * 2 + 1] = position.getY(i);
    }
    disc.setAttribute('aPuff', new BufferAttribute(local, 2));
    disc.setAttribute(
      'aPuffRadius',
      new BufferAttribute(new Float32Array(position.count).fill(puff.radius), 1),
    );
    disc.deleteAttribute('uv');
    disc.deleteAttribute('normal');
    disc.scale(puff.radius, puff.radius, 1);
    disc.translate(puff.x, puff.y, index * depthStep);
    return disc;
  });
  const merged = mergeGeometries(discs);
  for (const disc of discs) disc.dispose();
  return merged;
}
