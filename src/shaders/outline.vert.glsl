// Inverted-hull ink line, drawn with back faces. Same screen-space push as drei's <Outlines>, but
// the hull rides the wind and grows with the mesh it outlines.
uniform float uThickness;
/** Drawing buffer size in pixels. */
uniform vec2 uResolution;
#ifdef USE_WIND
attribute float aSway;
#endif
#ifdef USE_GROWTH
attribute vec3 aAxis;
attribute float aGrowAt;
attribute float aBornYear;
varying float vGrowthAge;
#endif

void main() {
  vec3 grown = position;
  #ifdef USE_GROWTH
  grown = growWood(position, aAxis, aGrowAt, aBornYear, vGrowthAge);
  #endif
  vec4 worldPosition = modelMatrix * vec4(grown, 1.0);
  #ifdef USE_WIND
  worldPosition.xyz += windSway(worldPosition.xyz, aSway);
  #endif
  vec4 clipPosition = projectionMatrix * viewMatrix * worldPosition;
  vec4 clipNormal = projectionMatrix * viewMatrix * vec4(mat3(modelMatrix) * normal, 0.0);
  clipPosition.xy += normalize(clipNormal.xy) * uThickness / uResolution * clipPosition.w * 2.0;
  gl_Position = clipPosition;
}
