uniform vec3 uColor;
uniform float uOpacity;

varying float vAlpha;

void main() {
  float distanceFromCenter = length(gl_PointCoord - 0.5) * 2.0;
  // A solid core with a soft edge: a speck of light, not a smudge.
  float alpha = (1.0 - smoothstep(0.3, 1.0, distanceFromCenter)) * vAlpha * uOpacity;
  if (alpha < 0.005) discard;
  gl_FragColor = vec4(uColor, alpha);
  #include <colorspace_fragment>
}
