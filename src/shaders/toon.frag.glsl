uniform vec3 uBaseColor;
uniform vec3 uShadeColor;
uniform vec3 uLightColor;
uniform vec3 uRimColor;
uniform vec3 uGrooveColor;
uniform vec3 uSunDirection;
/** Lit amount (half-Lambert, 0–1) where each of the three band edges sits. */
uniform vec3 uBandEdges;
uniform float uBandSoftness;
/** How far the two middle bands move from the shade color toward the base color. */
uniform vec2 uBandMix;
uniform float uHighlightMix;
uniform float uRimStrength;
uniform float uRimPower;
uniform float uBarkStreaks;
uniform float uBarkWarp;
uniform float uBarkStrength;

varying vec3 vWorldNormal;
varying vec3 vWorldPosition;
varying vec2 vUv;
varying float vBark;

const float TAU = 6.28318530718;

float band(float lit, float edge) {
  return smoothstep(edge - uBandSoftness, edge + uBandSoftness, lit);
}

/**
 * Grooves running along the branch. uv.x is arc length in world units and uv.y goes once around
 * the tube; the phase only uses whole turns of uv.y so the seam never shows.
 */
float barkGroove(vec2 uv) {
  float phase = uv.y * uBarkStreaks
    + uBarkWarp * sin(uv.x * 0.9 + uv.y * TAU)
    + 0.5 * uBarkWarp * sin(uv.x * 2.3 + uv.y * 2.0 * TAU);
  float ridge = abs(fract(phase) - 0.5) * 2.0;
  return smoothstep(0.72, 0.92, ridge);
}

void main() {
  vec3 normal = normalize(vWorldNormal);
  if (!gl_FrontFacing) normal = -normal;
  vec3 viewDirection = normalize(cameraPosition - vWorldPosition);

  float lit = dot(normal, normalize(uSunDirection)) * 0.5 + 0.5;

  vec3 color = uShadeColor;
  color = mix(color, mix(uShadeColor, uBaseColor, uBandMix.x), band(lit, uBandEdges.x));
  color = mix(color, mix(uShadeColor, uBaseColor, uBandMix.y), band(lit, uBandEdges.y));
  color = mix(color, mix(uBaseColor, uLightColor, uHighlightMix), band(lit, uBandEdges.z));

  float groove = barkGroove(vUv) * vBark * uBarkStrength;
  color = mix(color, uGrooveColor, groove);

  // Rim only on the sunny side, so it reads as back light rather than a glow around everything.
  float fresnel = pow(1.0 - max(dot(normal, viewDirection), 0.0), uRimPower);
  color += uRimColor * fresnel * uRimStrength * smoothstep(0.3, 0.7, lit);

  gl_FragColor = vec4(color, 1.0);
  #include <colorspace_fragment>
}
