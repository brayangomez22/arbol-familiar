// Growth, shared by the wood, its outline and the leaves (see scene/intro/growthUniforms.ts):
// the intro's, in seconds, and the family timeline's, in years. Prepended to their vertex shaders.
/** Seconds since the trunk sprouted. Far in the future when there is no intro: all grown. */
uniform float uGrowth;
/** Seconds a ring takes to swell to full thickness after the growing tip passes it. */
uniform float uGrowthSwell;
/** Year the timeline shows; far in the future when it shows today. */
uniform float uTimelineYear;
/** How a year on the timeline converts to seconds of growth, so both swell and unfold alike. */
uniform float uSecondsPerYear;

/**
 * Seconds since a point appeared: whichever came last, the intro reaching it (`growAt`, seconds)
 * or the timeline reaching the year it exists from (`bornYear`). Below 0: not there yet.
 */
float growthAge(float growAt, float bornYear) {
  return min(uGrowth - growAt, (uTimelineYear - bornYear) * uSecondsPerYear);
}

/**
 * Where a vertex of growing wood sits now. Near the tip it is pulled toward the branch's axis, so
 * the shoot ends in a point instead of a cut. `age` < 0 means not grown yet (discard it).
 */
vec3 growWood(vec3 position, vec3 axis, float growAt, float bornYear, out float age) {
  age = growthAge(growAt, bornYear);
  float swell = smoothstep(0.0, 1.0, clamp(age / uGrowthSwell, 0.0, 1.0));
  return axis + (position - axis) * swell;
}
