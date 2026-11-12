import type { BufferGeometry} from 'three';
import { CylinderGeometry, LatheGeometry, Vector2, Vector3 } from 'three';
import { mergeGeometries, mergeVertices } from 'three/addons/utils/BufferGeometryUtils.js';
import { FRUIT_MESH } from '@/config/constants';

export type FruitMeshDetail = typeof FRUIT_MESH;

/**
 * The body of a fruit: a rounded lantern of radius 1 around its center, with shallow ribs. Built
 * as a lathe whose radius dips where the ribs meet.
 */
export function buildLanternBody(detail: FruitMeshDetail = FRUIT_MESH): BufferGeometry {
  const profile: Vector2[] = [];
  for (let i = 0; i <= detail.profileSegments; i++) {
    const angle = -Math.PI / 2 + (Math.PI * i) / detail.profileSegments;
    const sin = Math.sin(angle);
    // A superellipse: below 1 the sides stay full longer before rounding off at the poles.
    const radius = Math.pow(Math.max(Math.cos(angle), 0), detail.roundness);
    const height = sin * (sin < 0 ? detail.bottom : detail.top);
    profile.push(new Vector2(radius, height));
  }

  const lathe = new LatheGeometry(profile, detail.radialSegments);
  // Welding the seam and the poles keeps the toon bands from breaking along them.
  lathe.deleteAttribute('normal');
  lathe.deleteAttribute('uv');
  const body = mergeVertices(lathe);
  lathe.dispose();

  // Normals of the smooth body, before the ribs: shading mostly follows these so the bands stay
  // clean arcs, and the ribs show in the silhouette and a hint of the shading.
  body.computeVertexNormals();
  const smoothNormals = body.getAttribute('normal').clone();

  const position = body.getAttribute('position');
  for (let i = 0; i < position.count; i++) {
    const x = position.getX(i);
    const z = position.getZ(i);
    const groove = Math.pow(
      Math.abs(Math.cos((Math.atan2(z, x) * detail.ribs) / 2)),
      detail.ribSharpness,
    );
    const scale = 1 - detail.ribDepth * groove;
    position.setX(i, x * scale);
    position.setZ(i, z * scale);
  }
  body.computeVertexNormals();

  const normal = body.getAttribute('normal');
  const blended = new Vector3();
  const smooth = new Vector3();
  for (let i = 0; i < normal.count; i++) {
    smooth.fromBufferAttribute(smoothNormals, i);
    blended
      .fromBufferAttribute(normal, i)
      .lerp(smooth, 1 - detail.ribShading)
      .normalize();
    normal.setXYZ(i, blended.x, blended.y, blended.z);
  }
  return body;
}

/** The little cap and stem on top of the body, in the same units. */
export function buildLanternCap(detail: FruitMeshDetail = FRUIT_MESH): BufferGeometry {
  const cap = new CylinderGeometry(
    detail.capRadius * detail.capTaper,
    detail.capRadius,
    detail.capHeight,
    detail.capSegments,
  );
  // Sunk partly into the body so no gap shows where the curved top meets the flat cap.
  const capBottom = detail.top - detail.capHeight * detail.capSink;
  cap.translate(0, capBottom + detail.capHeight / 2, 0);

  const stem = new CylinderGeometry(
    detail.stemRadius * detail.stemTaper,
    detail.stemRadius,
    detail.stemHeight,
    detail.capSegments,
  );
  stem.translate(0, capBottom + detail.capHeight + detail.stemHeight / 2, 0);

  // Dropping uv lets both merge with the same attribute set as everything else.
  for (const part of [cap, stem]) part.deleteAttribute('uv');
  const merged = mergeGeometries([cap, stem]);
  cap.dispose();
  stem.dispose();
  return merged;
}
