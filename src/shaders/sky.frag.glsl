uniform vec3 uTopColor;
uniform vec3 uHorizonColor;
uniform vec3 uSunColor;
uniform vec2 uSunPosition;
uniform float uSunRadius;
uniform float uSunStrength;
uniform float uGradientStart;
uniform float uGradientEnd;
uniform float uAspect;
uniform vec3 uStarColor;
/** 0 by day, 1 on a full night. */
uniform float uStars;
uniform float uStarDensity;
uniform float uStarScale;
uniform float uStarSize;

varying vec2 vScreen;

float hash(vec2 p) {
  return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453);
}

void main() {
  float t = smoothstep(uGradientStart, uGradientEnd, vScreen.y);
  vec3 color = mix(uHorizonColor, uTopColor, t);

  vec2 fromSun = (vScreen - uSunPosition) * vec2(uAspect, 1.0);
  float glow = 1.0 - smoothstep(0.0, uSunRadius, length(fromSun));
  color = mix(color, uSunColor, glow * glow * uSunStrength);

  // Stars: one per lucky grid cell, at a random spot in it, twinkle-free (nothing restless at
  // night). Fainter toward the horizon, and none under the moon's glow.
  if (uStars > 0.0) {
    vec2 grid = vScreen * vec2(uAspect, 1.0) * uStarScale;
    vec2 cell = floor(grid);
    float lucky = hash(cell);
    vec2 spot = vec2(hash(cell + 17.1), hash(cell + 41.7)) * 0.7 + 0.15;
    float star = 1.0 - smoothstep(uStarSize * 0.4, uStarSize, length(grid - cell - spot));
    star *= step(1.0 - uStarDensity, lucky) * smoothstep(uGradientStart, 0.7, vScreen.y);
    star *= 1.0 - glow;
    color = mix(color, uStarColor, star * uStars * (0.45 + 0.55 * hash(cell + 3.3)));
  }

  gl_FragColor = vec4(color, 1.0);
  #include <colorspace_fragment>
}
