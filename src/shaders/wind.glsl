// Shared wind field, prepended to every vertex shader that sways (see scene/wind/windUniforms.ts).
// scene/wind/windField.ts is its CPU twin for the fruits: keep the two in step.
uniform float uWindTime;
/** Sway at weight 1 in calm air, in world units. */
uniform float uWindAmplitude;
/** 1 in calm air; more during a gust, less with reduced motion. */
uniform float uWindStrength;
/** Steady push downwind during a gust, in world units at weight 1. */
uniform float uWindLean;
/** Horizontal and unit length. */
uniform vec3 uWindDirection;
uniform vec3 uWindFrequencies;
uniform vec3 uWindMix;
uniform vec3 uWindPhases;
/** Phase lost per world unit along each axis: the sway rolls across the crown as a wave. */
uniform vec3 uWindWave;
uniform float uWindBobRatio;
uniform float uWindBobFrequency;

/**
 * How far the wind moves a point resting at `position` (world space). Smooth in both space and
 * time, so pieces that touch at rest (a twig and its parent, a fruit and its tip) keep touching.
 */
vec3 windSway(vec3 position, float weight) {
  float travel = dot(position, uWindWave);
  float amplitude = uWindAmplitude * uWindStrength;
  float along = dot(uWindMix, sin(uWindFrequencies * uWindTime + uWindPhases - travel));
  float bob = sin(uWindBobFrequency * uWindTime - travel);
  vec3 push = uWindDirection * (uWindLean + amplitude * along);
  return weight * (push + vec3(0.0, amplitude * uWindBobRatio * bob, 0.0));
}
