uniform vec3 uShadeTint;
uniform float uShadeMix;
uniform vec3 uEdgeColor;
uniform float uEdgeMix;
uniform float uEdgeStart;
uniform float uVeinWidth;
uniform float uVeinMix;
/** Below 1 the leaf is fuller near the stem; above 1, near the tip. */
uniform float uShapeBias;
/** 0 is a pointed oval, 1 a straight taper from a wide base. */
uniform float uTaper;

varying vec3 vShadeNormal;
varying vec3 vWorldPosition;
varying vec3 vColor;
varying vec2 vUv;

const float PI = 3.14159265359;

void main() {
  // The leaf outline lives here, not in the geometry: a quad cut to a pointed oval. uv.y runs
  // from the stem (0) to the tip (1); halfWidth is in the same units as uv.x.
  float oval = sin(PI * pow(vUv.y, uShapeBias));
  float halfWidth = 0.5 * mix(oval, 1.0 - vUv.y, uTaper);
  float across = abs(vUv.x - 0.5);
  float edge = across / max(halfWidth, 1e-4);
  // A hard cut: SMAA smooths it afterward. Alpha to coverage would dither without MSAA.
  if (edge > 1.0) discard;

  vec3 normal = normalize(vShadeNormal);
  vec3 viewDirection = normalize(cameraPosition - vWorldPosition);
  float lit = toonLit(normal);
  vec3 color = toonRamp(vColor, mix(vColor, uShadeTint, uShadeMix), lit);

  float vein = (1.0 - smoothstep(0.0, uVeinWidth, across)) * step(vUv.y, 0.85);
  color = mix(color, uEdgeColor, vein * uVeinMix);
  color = mix(color, uEdgeColor, smoothstep(uEdgeStart, 1.0, edge) * uEdgeMix);
  color += toonRim(normal, viewDirection, lit);
  #ifdef USE_FOCUS
  color = applyFocus(color, 0.0);
  #endif

  gl_FragColor = vec4(color, 1.0);
  #include <colorspace_fragment>
}
