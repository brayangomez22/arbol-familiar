attribute float aSize;
attribute float aPhase;

uniform float uTime;
uniform float uSize;
uniform float uAmplitude;
uniform float uSpeed;
/** Pixels per world unit at distance 1: keeps the specks' size consistent with perspective. */
uniform float uPixelsPerUnit;

void main() {
  float t = uTime * uSpeed + aPhase;
  // Incommensurate frequencies so the specks wander instead of looping visibly.
  vec3 drift = vec3(sin(t), sin(t * 0.73 + 1.7), sin(t * 0.51 + 4.1)) * uAmplitude;
  vec4 viewPosition = modelViewMatrix * vec4(position + drift, 1.0);
  gl_Position = projectionMatrix * viewPosition;
  gl_PointSize = uSize * aSize * uPixelsPerUnit / -viewPosition.z;
}
