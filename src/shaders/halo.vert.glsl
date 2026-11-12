uniform float uDepthOffset;
/** 0 at rest, 1 for a hovered or selected fruit. */
uniform float uGlow;
uniform float uGlowGrowth;

varying vec2 vUv;

void main() {
  // Billboard in the shader: the quad always faces the camera without a per-frame update in JS.
  float scale = length(modelMatrix[0].xyz);
  vec4 center = modelViewMatrix * vec4(0.0, 0.0, 0.0, 1.0);
  center.xy += position.xy * scale * (1.0 + uGlowGrowth * uGlow);
  center.z -= uDepthOffset * scale;
  vUv = uv;
  gl_Position = projectionMatrix * center;
}
