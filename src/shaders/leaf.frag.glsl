uniform vec3 uShadeTint;
uniform float uShadeMix;
uniform vec3 uEdgeColor;
uniform float uEdgeMix;
uniform float uEdgeStart;
uniform float uVeinWidth;
uniform float uVeinMix;
/** Below 1 the leaf is fuller near the stem; above 1, near the tip. */
uniform float uShapeBias;

varying vec3 vShadeNormal;
varying vec3 vWorldPosition;
varying vec3 vColor;
varying vec2 vUv;

const float PI = 3.14159265359;

void main() {
  // The leaf outline lives here, not in the geometry: a quad cut to a pointed oval. uv.y runs
  // from the stem (0) to the tip (1); halfWidth is in the same units as uv.x.
  float halfWidth = 0.5 * sin(PI * pow(vUv.y, uShapeBias));
  float across = abs(vUv.x - 0.5);
  float edge = across / max(halfWidth, 1e-4);
  float edgeWidth = fwidth(edge);
  float alpha = 1.0 - smoothstep(1.0 - edgeWidth, 1.0, edge);
  if (alpha < 0.01) discard;

  vec3 normal = normalize(vShadeNormal);
  vec3 viewDirection = normalize(cameraPosition - vWorldPosition);
  float lit = toonLit(normal);
  vec3 color = toonRamp(vColor, mix(vColor, uShadeTint, uShadeMix), lit);

  float vein = (1.0 - smoothstep(0.0, uVeinWidth, across)) * step(vUv.y, 0.85);
  color = mix(color, uEdgeColor, vein * uVeinMix);
  color = mix(color, uEdgeColor, smoothstep(uEdgeStart, 1.0, edge) * uEdgeMix);
  color += toonRim(normal, viewDirection, lit);

  gl_FragColor = vec4(color, alpha);
  #include <colorspace_fragment>
}
