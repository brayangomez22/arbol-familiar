attribute float bark;
#ifdef USE_WIND
/** Wind weight: 0 at the trunk's base, 1 at the farthest tip (see layout/reach.ts). */
attribute float aSway;
#endif

varying vec3 vWorldNormal;
varying vec3 vWorldPosition;
varying vec2 vUv;
varying float vBark;

void main() {
  vec4 worldPosition = modelMatrix * vec4(position, 1.0);
  #ifdef USE_WIND
  // The field is sampled at the rest position, so the outline (outline.vert.glsl) moves identically.
  worldPosition.xyz += windSway(worldPosition.xyz, aSway);
  #endif
  vWorldPosition = worldPosition.xyz;
  // Every toon mesh is scaled uniformly, so the model matrix is enough to carry the normal.
  vWorldNormal = normalize(mat3(modelMatrix) * normal);
  vUv = uv;
  vBark = bark;
  gl_Position = projectionMatrix * viewMatrix * worldPosition;
}
