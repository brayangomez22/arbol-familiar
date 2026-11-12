uniform vec3 uColor;
#ifdef USE_GROWTH
varying float vGrowthAge;
#endif

void main() {
  #ifdef USE_GROWTH
  if (vGrowthAge < 0.0) discard;
  #endif
  gl_FragColor = vec4(uColor, 1.0);
  #include <colorspace_fragment>
}
