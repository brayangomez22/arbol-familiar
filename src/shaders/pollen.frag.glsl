uniform vec3 uColor;
uniform float uOpacity;

void main() {
  float distanceFromCenter = length(gl_PointCoord - 0.5) * 2.0;
  float alpha = 1.0 - smoothstep(0.4, 1.0, distanceFromCenter);
  if (alpha < 0.01) discard;
  gl_FragColor = vec4(uColor, alpha * uOpacity);
  #include <colorspace_fragment>
}
