import { CatmullRomCurve3, SphereGeometry, TubeGeometry, Vector3, BufferGeometry } from 'three';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';
import { TREE_MESH } from '@/config/constants';
import type { BranchSegment, Vec3 } from '@/layout/types';

export type TreeMeshDetail = typeof TREE_MESH;

/**
 * Every segment as a tapered tube, with a sphere at each end so joints and tips read as one smooth
 * piece of wood. Merged into a single geometry: one draw call for the whole tree.
 */
export function buildBranchGeometry(
  segments: readonly BranchSegment[],
  detail: TreeMeshDetail = TREE_MESH,
): BufferGeometry {
  const parts = segments.flatMap((segment) => {
    const base = segment.points[0];
    const tip = segment.points.at(-1);
    if (!base || !tip) return [];
    return [
      buildTaperedTube(segment, detail),
      buildKnot(base, segment.radiusStart, detail),
      buildKnot(tip, segment.radiusEnd, detail),
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
  return tube;
}

function buildKnot(center: Vec3, radius: number, detail: TreeMeshDetail): SphereGeometry {
  const width = radialSegments(radius, detail);
  const knot = new SphereGeometry(radius, width, Math.ceil(width / 2));
  knot.translate(center.x, center.y, center.z);
  return knot;
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
