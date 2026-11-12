// A speck of light rising from a fruit. JS writes where and when it was born; the flight is here.
/** Seconds on the sparks' clock when it was born; far in the past for an unused slot. */
attribute float aBirth;
/** Life in seconds, wiggle phase, sideways drift (world units per second). */
attribute vec3 aMotion;

uniform float uTime;
uniform float uRise;
uniform float uWiggle;
uniform float uWiggleFrequency;
uniform float uSize;
uniform float uEndSize;
uniform float uFadeIn;
uniform float uFadeOutStart;
/** Pixels per world unit at distance 1, as for the pollen. */
uniform float uPixelsPerUnit;

varying float vAlpha;

void main() {
  float age = uTime - aBirth;
  float progress = age / aMotion.x;
  float alive = step(0.0, progress) * step(progress, 1.0);

  vec3 flight = vec3(
    aMotion.z * age + uWiggle * sin(uWiggleFrequency * age + aMotion.y),
    uRise * age,
    0.0
  );
  vec4 viewPosition = modelViewMatrix * vec4(position + flight, 1.0);
  gl_Position = projectionMatrix * viewPosition;

  vAlpha = alive * smoothstep(0.0, uFadeIn, progress) * (1.0 - smoothstep(uFadeOutStart, 1.0, progress));
  float size = uSize * mix(1.0, uEndSize, clamp(progress, 0.0, 1.0));
  gl_PointSize = alive * size * uPixelsPerUnit / -viewPosition.z;
}
