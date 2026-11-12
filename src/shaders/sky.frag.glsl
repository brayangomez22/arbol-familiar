uniform vec3 uTopColor;
uniform vec3 uHorizonColor;
uniform vec3 uSunColor;
uniform vec2 uSunPosition;
uniform float uSunRadius;
uniform float uSunStrength;
uniform float uGradientStart;
uniform float uGradientEnd;
uniform float uAspect;

varying vec2 vScreen;

void main() {
  float t = smoothstep(uGradientStart, uGradientEnd, vScreen.y);
  vec3 color = mix(uHorizonColor, uTopColor, t);

  vec2 fromSun = (vScreen - uSunPosition) * vec2(uAspect, 1.0);
  float glow = 1.0 - smoothstep(0.0, uSunRadius, length(fromSun));
  color = mix(color, uSunColor, glow * glow * uSunStrength);

  gl_FragColor = vec4(color, 1.0);
  #include <colorspace_fragment>
}
