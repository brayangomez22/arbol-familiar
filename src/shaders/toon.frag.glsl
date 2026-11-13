uniform vec3 uBaseColor;
uniform vec3 uShadeColor;
uniform vec3 uGrooveColor;
uniform float uBarkStreaks;
uniform float uBarkWarp;
uniform float uBarkStrength;
/** Light of its own (deceased fruits, lanterns at night), as a fraction of the base color. */
uniform float uGlow;

varying vec3 vWorldNormal;
varying vec3 vWorldPosition;
varying vec2 vUv;
varying float vBark;
#ifdef USE_SAP
varying float vReach;
varying float vSapLimit;
/** Reach of the pulse's head, in world units along the wood. */
uniform float uSapFront;
/** Fades the whole lineage in and out. */
uniform float uSapIntensity;
uniform float uSapHead;
uniform float uSapTrail;
uniform float uSapShine;
/** How far the sap's shaded side leans toward the bark's shade color. */
uniform float uSapShadeMix;
uniform vec3 uSapColor;
#endif
#ifdef USE_GROWTH
varying float vGrowthAge;
#endif
#ifdef USE_FOCUS
/** 1 while this object is the selected person (set per draw on shared materials). */
uniform float uFocused;
#endif

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
  #ifdef USE_GROWTH
  if (vGrowthAge < 0.0) discard;
  #endif
  vec3 normal = normalize(vWorldNormal);
  if (!gl_FrontFacing) normal = -normal;
  vec3 viewDirection = normalize(cameraPosition - vWorldPosition);

  float lit = toonLit(normal);
  vec3 color = toonRamp(uBaseColor, uShadeColor, lit);
  color = mix(color, uGrooveColor, barkGroove(vUv) * vBark * uBarkStrength);
  color += toonRim(normal, viewDirection, lit);
  color += uBaseColor * uGlow;

  float focused = 0.0;
  #ifdef USE_SAP
  // A bright head running up the lineage, leaving a warm light on the wood behind it. The trail
  // is added light, so the bark's bands and grooves still show through; only the head takes the
  // sap's own (toon-shaded) color.
  float onLineage = step(vReach, vSapLimit);
  float behind = uSapFront - vReach;
  float head = onLineage * uSapIntensity * exp(-(behind * behind) / (uSapHead * uSapHead));
  float trail = onLineage * uSapIntensity * uSapTrail * smoothstep(0.0, uSapHead, behind);
  vec3 sapColor = toonRamp(uSapColor, mix(uSapColor, uShadeColor, uSapShadeMix), lit);
  color += uSapColor * trail;
  color = mix(color, sapColor, head) + uSapColor * head * uSapShine;
  focused = onLineage;
  #endif
  #ifdef USE_FOCUS
  focused = max(focused, uFocused);
  color = applyFocus(color, focused);
  #endif

  gl_FragColor = vec4(color, 1.0);
  #include <colorspace_fragment>
}
