uniform vec3 uPetalColor;
uniform vec3 uHeartColor;
uniform vec3 uEdgeColor;
/** Shade of the petals toward their center, and how much of the edge is inked. */
uniform float uPetalShade;
uniform float uEdgeMix;

varying vec2 vUv;

const float PETALS = 5.0;

void main() {
  vec2 p = (vUv - 0.5) * 2.0;
  float radius = length(p);
  float angle = atan(p.y, p.x);
  // Five round petals: the outline swells at each petal and dips between them.
  float outline = 0.62 + 0.38 * pow(abs(cos(angle * PETALS * 0.5)), 0.7);
  float edge = radius / outline;
  // A hard cut, like the leaves: SMAA smooths it.
  if (edge > 1.0) discard;

  vec3 color = mix(uPetalColor * (1.0 - uPetalShade), uPetalColor, smoothstep(0.2, 0.75, edge));
  color = mix(color, uEdgeColor, smoothstep(0.82, 1.0, edge) * uEdgeMix);
  color = mix(color, uHeartColor, 1.0 - smoothstep(0.2, 0.28, radius));
  #ifdef USE_FOCUS
  color = applyFocus(color, 0.0);
  #endif

  gl_FragColor = vec4(color, 1.0);
  #include <colorspace_fragment>
}
