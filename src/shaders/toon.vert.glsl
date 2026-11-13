attribute float bark;
#ifdef USE_WIND
/** Wind weight: 0 at the trunk's base, 1 at the farthest tip (see layout/reach.ts). */
attribute float aSway;
#endif
#ifdef USE_SAP
/** World distance along the wood from the trunk's base. */
attribute float aReach;
/** Reach where the sap leaves this vertex's branch; below 0 when the branch is off the lineage. */
attribute float aSapLimit;
varying float vReach;
varying float vSapLimit;
#endif

#ifdef USE_GROWTH
/** Point on the branch's axis this vertex belongs to, and when it appears (seconds). */
attribute vec3 aAxis;
attribute float aGrowAt;
/** Year on the family timeline from which this vertex exists. */
attribute float aBornYear;
varying float vGrowthAge;
#endif

varying vec3 vWorldNormal;
varying vec3 vWorldPosition;
varying vec2 vUv;
varying float vBark;

void main() {
  vec3 grown = position;
  #ifdef USE_GROWTH
  grown = growWood(position, aAxis, aGrowAt, aBornYear, vGrowthAge);
  #endif
  vec4 worldPosition = modelMatrix * vec4(grown, 1.0);
  #ifdef USE_WIND
  // The field is sampled at the rest position, so the outline (outline.vert.glsl) moves identically.
  worldPosition.xyz += windSway(worldPosition.xyz, aSway);
  #endif
  #ifdef USE_SAP
  vReach = aReach;
  vSapLimit = aSapLimit;
  #endif
  vWorldPosition = worldPosition.xyz;
  // Every toon mesh is scaled uniformly, so the model matrix is enough to carry the normal.
  vWorldNormal = normalize(mat3(modelMatrix) * normal);
  vUv = uv;
  vBark = bark;
  gl_Position = projectionMatrix * viewMatrix * worldPosition;
}
