attribute float aSize;
attribute float aPhase;
/** Radians per second of this firefly's glow. */
attribute float aBlink;

uniform float uTime;
uniform float uSize;
uniform float uAmplitude;
uniform float uSpeed;
uniform float uBlinkSharpness;
/** Pixels per world unit at distance 1: keeps their size consistent with perspective. */
uniform float uPixelsPerUnit;

varying float vGlow;

void main() {
  float t = uTime * uSpeed + aPhase;
  // Lazy loops, wider than tall, at incommensurate frequencies so none repeats visibly.
  vec3 drift = vec3(sin(t), 0.5 * sin(t * 1.37 + 2.1), sin(t * 0.61 + 0.7)) * uAmplitude;
  vec4 viewPosition = modelViewMatrix * vec4(position + drift, 1.0);
  gl_Position = projectionMatrix * viewPosition;
  vGlow = pow(0.5 + 0.5 * sin(uTime * aBlink + aPhase * 3.0), uBlinkSharpness);
  gl_PointSize = uSize * aSize * uPixelsPerUnit / -viewPosition.z;
}
