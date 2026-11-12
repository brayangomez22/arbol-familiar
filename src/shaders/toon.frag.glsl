uniform vec3 uBaseColor;
uniform vec3 uShadeColor;
uniform vec3 uGrooveColor;
uniform float uBarkStreaks;
uniform float uBarkWarp;
uniform float uBarkStrength;

varying vec3 vWorldNormal;
varying vec3 vWorldPosition;
varying vec2 vUv;
varying float vBark;

const float TAU = 6.28318530718;

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

  float lit = toonLit(normal);
  vec3 color = toonRamp(uBaseColor, uShadeColor, lit);
  color = mix(color, uGrooveColor, barkGroove(vUv) * vBark * uBarkStrength);
  color += toonRim(normal, viewDirection, lit);

  gl_FragColor = vec4(color, 1.0);
  #include <colorspace_fragment>
}
