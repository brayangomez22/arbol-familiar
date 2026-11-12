uniform vec3 uColor;
uniform float uOpacity;

varying vec2 vUv;

void main() {
  float distanceFromCenter = length(vUv - 0.5) * 2.0;
  float glow = 1.0 - smoothstep(0.0, 1.0, distanceFromCenter);
  gl_FragColor = vec4(uColor, glow * glow * uOpacity);
  #include <colorspace_fragment>
}
