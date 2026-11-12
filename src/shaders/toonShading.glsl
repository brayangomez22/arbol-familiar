// Shared by every toon shader: banded light and rim. Prepended to their fragment source.
uniform vec3 uLightColor;
uniform vec3 uRimColor;
uniform vec3 uSunDirection;
/** Lit amount (half-Lambert, 0–1) where each of the three band edges sits. */
uniform vec3 uBandEdges;
uniform float uBandSoftness;
/** How far the two middle bands move from the shade color toward the base color. */
uniform vec2 uBandMix;
uniform float uHighlightMix;
uniform float uRimStrength;
uniform float uRimPower;

float toonLit(vec3 normal) {
  return dot(normal, normalize(uSunDirection)) * 0.5 + 0.5;
}

float toonBand(float lit, float edge) {
  return smoothstep(edge - uBandSoftness, edge + uBandSoftness, lit);
}

vec3 toonRamp(vec3 base, vec3 shade, float lit) {
  vec3 color = shade;
  color = mix(color, mix(shade, base, uBandMix.x), toonBand(lit, uBandEdges.x));
  color = mix(color, mix(shade, base, uBandMix.y), toonBand(lit, uBandEdges.y));
  color = mix(color, mix(base, uLightColor, uHighlightMix), toonBand(lit, uBandEdges.z));
  return color;
}

// Only on the sunny side, so it reads as back light rather than a glow around everything.
vec3 toonRim(vec3 normal, vec3 viewDirection, float lit) {
  float fresnel = pow(1.0 - max(dot(normal, viewDirection), 0.0), uRimPower);
  return uRimColor * fresnel * uRimStrength * smoothstep(0.3, 0.7, lit);
}
