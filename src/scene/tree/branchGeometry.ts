import {
  BufferAttribute,
  BufferGeometry,
  CatmullRomCurve3,
  SphereGeometry,
  TubeGeometry,
  Vector3,
} from 'three';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';
import { TREE_MESH } from '@/config/constants';
import type { BranchSegment, Vec3 } from '@/layout/types';

export type TreeMeshDetail = typeof TREE_MESH;

/** Wind weight of the point at fraction `u` (0 = base, 1 = tip) of a segment's length. */
export type SwayAt = (segmentId: string, u: number) => number;

const still: SwayAt = () => 0;

/**
 * Every segment as a tapered tube, with a sphere at each end so joints and tips read as one smooth
 * piece of wood. Merged into a single geometry: one draw call for the whole tree.
 *
 * Tubes carry `bark = 1` and a `uv` whose x is arc length in world units, so the bark grooves keep
 * the same spacing on a long limb and a short twig. Knots carry `bark = 0` and stay smooth.
 *
 * Every vertex also carries `aSway`, its wind weight from `swayAt`: per ring along a tube, and the
 * weight of its end for a knot, so a joint moves as one piece.
 */
export function buildBranchGeometry(
  segments: readonly BranchSegment[],
  swayAt: SwayAt = still,
  detail: TreeMeshDetail = TREE_MESH,
): BufferGeometry {
  const parts = segments.flatMap((segment) => {
    const base = segment.points[0];
    const tip = segment.points.at(-1);
    if (!base || !tip) return [];
    const tube = buildTaperedTube(segment, detail);
    const rings = tube.parameters.tubularSegments;
    const ringSize = tube.parameters.radialSegments + 1;
    const tubeSway = new Float32Array(tube.getAttribute('position').count);
    for (let ring = 0; ring <= rings; ring++) {
      tubeSway.fill(swayAt(segment.id, ring / rings), ring * ringSize, (ring + 1) * ringSize);
    }
    tube.setAttribute('aSway', new BufferAttribute(tubeSway, 1));
    return [
      tube,
      withSway(buildKnot(base, segment.radiusStart, detail), swayAt(segment.id, 0)),
      withSway(buildKnot(tip, segment.radiusEnd, detail), swayAt(segment.id, 1)),
    ];
  });
  if (parts.length === 0) return new BufferGeometry();
  const merged = mergeGeometries(parts);
  for (const part of parts) part.dispose();
  return merged;
}

/** A tube along the segment's curve whose radius goes linearly from base to tip. */
export function buildTaperedTube(
  segment: BranchSegment,
  detail: TreeMeshDetail = TREE_MESH,
): TubeGeometry {
  // Centripetal, like layout/curve.ts, so children sprout exactly on this surface.
  const curve = new CatmullRomCurve3(segment.points.map(({ x, y, z }) => new Vector3(x, y, z)));
  const tubular = clamp(
    Math.round(curve.getLength() * detail.tubularSegmentsPerUnit),
    detail.minTubularSegments,
    detail.maxTubularSegments,
  );
  const radial = radialSegments(segment.radiusStart, detail);
  const tube = new TubeGeometry(curve, tubular, 1, radial, false);

  // TubeGeometry lays out `tubular + 1` rings of `radial + 1` vertices at unit distance from the
  // arc-length point of the curve; pushing each ring out to its own radius gives the taper.
  const position = tube.getAttribute('position');
  const center = new Vector3();
  const vertex = new Vector3();
  for (let ring = 0; ring <= tubular; ring++) {
    const u = ring / tubular;
    const radius = segment.radiusStart + (segment.radiusEnd - segment.radiusStart) * u;
    curve.getPointAt(u, center);
    for (let j = 0; j <= radial; j++) {
      const index = ring * (radial + 1) + j;
      vertex.fromBufferAttribute(position, index).sub(center).multiplyScalar(radius).add(center);
      position.setXYZ(index, vertex.x, vertex.y, vertex.z);
    }
  }

  const uv = tube.getAttribute('uv');
  const length = curve.getLength();
  for (let i = 0; i < uv.count; i++) uv.setX(i, uv.getX(i) * length);
  return withBark(tube, 1);
}

function buildKnot(center: Vec3, radius: number, detail: TreeMeshDetail): SphereGeometry {
  const width = radialSegments(radius, detail);
  const knot = new SphereGeometry(radius, width, Math.ceil(width / 2));
  knot.translate(center.x, center.y, center.z);
  return withBark(knot, 0);
}

function withBark<T extends BufferGeometry>(geometry: T, value: number): T {
  const count = geometry.getAttribute('position').count;
  geometry.setAttribute('bark', new BufferAttribute(new Float32Array(count).fill(value), 1));
  return geometry;
}

function withSway<T extends BufferGeometry>(geometry: T, value: number): T {
  const count = geometry.getAttribute('position').count;
  geometry.setAttribute('aSway', new BufferAttribute(new Float32Array(count).fill(value), 1));
  return geometry;
}

function radialSegments(radius: number, detail: TreeMeshDetail): number {
  return clamp(
    Math.ceil(radius * detail.radialSegmentsPerUnit),
    detail.minRadialSegments,
    detail.maxRadialSegments,
  );
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}
