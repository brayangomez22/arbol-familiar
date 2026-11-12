uniform vec3 uColor;
uniform float uOpacity;
uniform vec3 uGlowColor;
uniform float uGlowOpacity;
uniform float uGlow;

varying vec2 vUv;

void main() {
  float distanceFromCenter = length(vUv - 0.5) * 2.0;
  float glow = 1.0 - smoothstep(0.0, 1.0, distanceFromCenter);
  vec3 color = mix(uColor, uGlowColor, uGlow);
  float opacity = mix(uOpacity, uGlowOpacity, uGlow);
  gl_FragColor = vec4(color, glow * glow * opacity);
  #include <colorspace_fragment>
}
