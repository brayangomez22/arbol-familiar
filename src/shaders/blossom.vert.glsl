// A flower on a camera-facing quad. The instance matrix only places it (translation) and sizes it
// (uniform scale); the quad is turned toward the camera here, so flowers always show their face.
/** Per instance: wind weight, turn in the picture plane, rank and bloom order (see layout/blossoms.ts). */
attribute float aSway;
attribute float aSpin;
attribute float aRank;
attribute float aOrder;
/** When the point it grows from exists: in the intro (seconds) and on the timeline (year). */
attribute float aGrowAt;
attribute float aBornYear;

/** Flowers whose rank is above this stay closed (spring's share of the crown). */
uniform float uDensity;
/** Seconds since this bloom began; each flower opens `aOrder × uBloomSpread` after that. */
uniform float uBloomTime;
uniform float uBloomSpread;
/** Seconds a flower takes to open, and how far it overshoots (back easing). */
uniform float uBloomOpen;
uniform float uBloomOvershoot;
/** World units toward the camera, so the crown's leaves don't bury the flowers. */
uniform float uPull;

varying vec2 vUv;

float easeOutBack(float t) {
  float s = t - 1.0;
  return 1.0 + (uBloomOvershoot + 1.0) * s * s * s + uBloomOvershoot * s * s;
}

void main() {
  vec4 center = modelMatrix * instanceMatrix * vec4(0.0, 0.0, 0.0, 1.0);
  float size = length((modelMatrix * instanceMatrix)[0].xyz);
  center.xyz += windSway(center.xyz, aSway);

  float grown = step(0.0, growthAge(aGrowAt, aBornYear));
  float kept = 1.0 - smoothstep(uDensity, uDensity + 0.08, aRank);
  float opening = clamp((uBloomTime - aOrder * uBloomSpread) / uBloomOpen, 0.0, 1.0);
  float open = grown * kept * easeOutBack(opening);

  float c = cos(aSpin);
  float s = sin(aSpin);
  vec2 corner = (uv - 0.5) * size * open;
  corner = vec2(c * corner.x - s * corner.y, s * corner.x + c * corner.y);
  vec4 viewPosition = viewMatrix * center;
  viewPosition.xy += corner;
  viewPosition.z += uPull;
  gl_Position = projectionMatrix * viewPosition;
  vUv = uv;
}
