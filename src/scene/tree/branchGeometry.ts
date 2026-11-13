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

/** How the wood is measured: reach along it from the trunk's base, and the wind weight of a reach. */
export interface WoodMeasure {
  /** Reach (world units) of the point at fraction `u` (0 = base, 1 = tip) of a segment's length. */
  readonly reachAt: (segmentId: string, u: number) => number;
  readonly swayOf: (reach: number) => number;
  /** When the point at fraction `u` appears in the intro, in seconds of growth. */
  readonly growAt: (segmentId: string, u: number) => number;
  /** Year on the family timeline from which that point exists; always, when left out. */
  readonly bornYearAt?: (segmentId: string, u: number) => number;
}

/** Wood that never moves, carries no sap and is there from the first moment of growth. */
const STILL: WoodMeasure = { reachAt: () => 0, swayOf: () => 0, growAt: () => 0 };

/** Earlier than any year on the timeline. */
const ALWAYS_THERE = -1e6;

/** No lineage: the sap limit of every vertex is below any reach. */
const OFF_LINEAGE = -1;

export interface VertexRange {
  readonly start: number;
  readonly count: number;
}

export interface BranchGeometry {
  readonly geometry: BufferGeometry;
  /** Where each segment's vertices sit in the merged geometry. */
  readonly ranges: ReadonlyMap<string, VertexRange>;
}

/**
 * Every segment as a tapered tube, with a sphere at each end so joints and tips read as one smooth
 * piece of wood. Merged into a single geometry: one draw call for the whole tree.
 *
 * Tubes carry `bark = 1` and a `uv` whose x is arc length in world units, so the bark grooves keep
 * the same spacing on a long limb and a short twig. Knots carry `bark = 0` and stay smooth.
 *
 * Every vertex also carries its reach (`aReach`), wind weight (`aSway`) and the moment it grows
 * (`aGrowAt`): per ring along a tube, and those of its end for a knot, so a joint moves as one
 * piece. `aAxis` is the center of its ring (or knot), which growth shrinks it toward.
 * `aSapLimit` starts off the lineage; setSapLimits() lights a path.
 */
export function buildBranchGeometry(
  segments: readonly BranchSegment[],
  wood: WoodMeasure = STILL,
  detail: TreeMeshDetail = TREE_MESH,
): BranchGeometry {
  const ranges = new Map<string, VertexRange>();
  let offset = 0;
  const parts = segments.flatMap((segment) => {
    const base = segment.points[0];
    const tip = segment.points.at(-1);
    if (!base || !tip) return [];
    const tube = buildTaperedTube(segment, detail);
    const rings = tube.parameters.tubularSegments;
    const ringSize = tube.parameters.radialSegments + 1;
    const vertexCount = tube.getAttribute('position').count;
    const tubeReach = new Float32Array(vertexCount);
    const tubeGrowth = new Float32Array(vertexCount);
    const tubeBorn = new Float32Array(vertexCount);
    for (let ring = 0; ring <= rings; ring++) {
      const from = ring * ringSize;
      const to = (ring + 1) * ringSize;
      tubeReach.fill(wood.reachAt(segment.id, ring / rings), from, to);
      tubeGrowth.fill(wood.growAt(segment.id, ring / rings), from, to);
      tubeBorn.fill(bornYearOf(wood, segment.id, ring / rings), from, to);
    }
    withWood(tube, tubeReach, tubeGrowth, tubeBorn, wood);
    const ends = [
      buildKnot(base, segment.radiusStart, detail, segment.id, 0, wood),
      buildKnot(tip, segment.radiusEnd, detail, segment.id, 1, wood),
    ];
    const count =
      vertexCount + ends.reduce((sum, knot) => sum + knot.getAttribute('position').count, 0);
    ranges.set(segment.id, { start: offset, count });
    offset += count;
    return [tube, ...ends];
  });
  if (parts.length === 0) return { geometry: new BufferGeometry(), ranges };
  const geometry = mergeGeometries(parts);
  for (const part of parts) part.dispose();
  return { geometry, ranges };
}

/**
 * Lights a lineage: each listed segment carries the sap up to its limit (a reach), every other
 * segment none. `null` clears it.
 */
export function setSapLimits(
  { geometry, ranges }: BranchGeometry,
  limits: ReadonlyMap<string, number> | null,
): void {
  const attribute = geometry.getAttribute('aSapLimit');
  if (!(attribute instanceof BufferAttribute)) return;
  const values = attribute.array;
  values.fill(OFF_LINEAGE);
  if (limits) {
    for (const [segmentId, limit] of limits) {
      const range = ranges.get(segmentId);
      if (range) values.fill(limit, range.start, range.start + range.count);
    }
  }
  attribute.needsUpdate = true;
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
  const axis = new Float32Array(position.count * 3);
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
      axis.set([center.x, center.y, center.z], index * 3);
    }
  }
  tube.setAttribute('aAxis', new BufferAttribute(axis, 3));

  const uv = tube.getAttribute('uv');
  const length = curve.getLength();
  for (let i = 0; i < uv.count; i++) uv.setX(i, uv.getX(i) * length);
  return withBark(tube, 1);
}

/** A sphere at one end (`u` = 0 or 1) of a segment, which grows when that end does. */
function buildKnot(
  center: Vec3,
  radius: number,
  detail: TreeMeshDetail,
  segmentId: string,
  u: number,
  wood: WoodMeasure,
): SphereGeometry {
  const width = radialSegments(radius, detail);
  const knot = new SphereGeometry(radius, width, Math.ceil(width / 2));
  knot.translate(center.x, center.y, center.z);
  const count = knot.getAttribute('position').count;
  const axis = new Float32Array(count * 3);
  for (let i = 0; i < count; i++) axis.set([center.x, center.y, center.z], i * 3);
  knot.setAttribute('aAxis', new BufferAttribute(axis, 3));
  return withWood(
    withBark(knot, 0),
    new Float32Array(count).fill(wood.reachAt(segmentId, u)),
    new Float32Array(count).fill(wood.growAt(segmentId, u)),
    new Float32Array(count).fill(bornYearOf(wood, segmentId, u)),
    wood,
  );
}

function bornYearOf(wood: WoodMeasure, segmentId: string, u: number): number {
  return wood.bornYearAt ? wood.bornYearAt(segmentId, u) : ALWAYS_THERE;
}

function withWood<T extends BufferGeometry>(
  geometry: T,
  reach: Float32Array,
  growAt: Float32Array,
  bornYear: Float32Array,
  wood: WoodMeasure,
): T {
  geometry.setAttribute('aReach', new BufferAttribute(reach, 1));
  geometry.setAttribute('aGrowAt', new BufferAttribute(growAt, 1));
  geometry.setAttribute('aBornYear', new BufferAttribute(bornYear, 1));
  geometry.setAttribute('aSway', new BufferAttribute(reach.map(wood.swayOf), 1));
  geometry.setAttribute(
    'aSapLimit',
    new BufferAttribute(new Float32Array(reach.length).fill(OFF_LINEAGE), 1),
  );
  return geometry;
}

function withBark<T extends BufferGeometry>(geometry: T, value: number): T {
  const count = geometry.getAttribute('position').count;
  geometry.setAttribute('bark', new BufferAttribute(new Float32Array(count).fill(value), 1));
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
