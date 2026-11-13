uniform vec3 uColor;
/** 0 by day, 1 on a full night. */
uniform float uOpacity;

varying float vGlow;

void main() {
  float distanceFromCenter = length(gl_PointCoord - 0.5) * 2.0;
  // A bright core inside a soft halo: the bloom does the rest.
  float halo = 1.0 - smoothstep(0.0, 1.0, distanceFromCenter);
  float core = 1.0 - smoothstep(0.0, 0.25, distanceFromCenter);
  float alpha = (halo * halo * 0.6 + core) * vGlow * uOpacity;
  if (alpha < 0.01) discard;
  gl_FragColor = vec4(uColor * (1.0 + core), alpha);
  #include <colorspace_fragment>
}
