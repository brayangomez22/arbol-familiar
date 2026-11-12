// Postprocessing effect: the frame printed on warm paper. `resolution` comes from the EffectPass.
uniform vec3 uPaperColor;
uniform vec3 uVignetteColor;
uniform float uPixelRatio;
/** Paper fibers: size in CSS pixels and how much they darken. */
uniform float uFiberScale;
uniform float uFiberStrength;
/** Big soft watercolor blotches: size in CSS pixels and strength. */
uniform float uWashScale;
uniform float uWashStrength;
uniform float uGrainStrength;
/** How much of the paper's own color shows through, like ink that is not fully opaque. */
uniform float uPaperTint;
uniform float uVignetteStart;
uniform float uVignetteEnd;
uniform float uVignetteStrength;

float hash(vec2 p) {
  p = fract(p * vec2(123.34, 456.21));
  p += dot(p, p + 45.32);
  return fract(p.x * p.y);
}

float valueNoise(vec2 p) {
  vec2 cell = floor(p);
  vec2 f = fract(p);
  vec2 u = f * f * (3.0 - 2.0 * f);
  float a = hash(cell);
  float b = hash(cell + vec2(1.0, 0.0));
  float c = hash(cell + vec2(0.0, 1.0));
  float d = hash(cell + vec2(1.0, 1.0));
  return mix(mix(a, b, u.x), mix(c, d, u.x), u.y);
}

float fbm(vec2 p) {
  float sum = 0.0;
  float amplitude = 0.5;
  for (int i = 0; i < 4; i++) {
    sum += amplitude * valueNoise(p);
    p = p * 2.03 + 17.0;
    amplitude *= 0.5;
  }
  return sum;
}

void mainImage(const in vec4 inputColor, const in vec2 uv, out vec4 outputColor) {
  // CSS pixels, so the paper looks the same on every screen density. Fixed to the screen: it is
  // the sheet the picture is printed on, not part of the world.
  vec2 pixel = uv * resolution / uPixelRatio;

  // Fibers: noise stretched sideways, like the grain of pressed paper.
  float fibers = fbm(pixel / uFiberScale * vec2(0.35, 1.0));
  float wash = fbm(pixel / uWashScale);
  float grain = hash(floor(pixel)) - 0.5;

  vec3 color = mix(inputColor.rgb, inputColor.rgb * uPaperColor, uPaperTint);
  color *= 1.0 - uFiberStrength * fibers;
  color *= 1.0 + uWashStrength * (wash - 0.5) * 2.0;
  color += grain * uGrainStrength;

  vec2 centered = (uv - 0.5) * vec2(resolution.x / resolution.y, 1.0);
  float vignette = smoothstep(uVignetteStart, uVignetteEnd, length(centered));
  color = mix(color, color * uVignetteColor, vignette * uVignetteStrength);

  // The picture is always opaque: leaf edges may carry partial alpha into the buffer, and passing
  // it on would let the page show through as a pale fringe.
  outputColor = vec4(color, 1.0);
}
