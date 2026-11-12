// The intro's growth, shared by the wood, its outline and the leaves (see
// scene/intro/growthUniforms.ts). Prepended to their vertex shaders.
/** Seconds since the trunk sprouted. Far in the future when there is no intro: all grown. */
uniform float uGrowth;
/** Seconds a ring takes to swell to full thickness after the growing tip passes it. */
uniform float uGrowthSwell;

/**
 * Where a vertex of growing wood sits now. Near the tip it is pulled toward the branch's axis, so
 * the shoot ends in a point instead of a cut. `age` < 0 means not grown yet (discard it).
 */
vec3 growWood(vec3 position, vec3 axis, float growAt, out float age) {
  age = uGrowth - growAt;
  float swell = smoothstep(0.0, 1.0, clamp(age / uGrowthSwell, 0.0, 1.0));
  return axis + (position - axis) * swell;
}
