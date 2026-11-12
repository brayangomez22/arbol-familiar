// Shared by tree fragment shaders: when someone is selected, everything but them steps back.
// Prepended to the fragment source (see scene/selection/focusUniforms.ts).
/** 0 with nobody selected, 1 at full focus; eased from JS. */
uniform float uFocus;
/** How far toward grey the unfocused parts go at full focus. */
uniform float uFocusDesaturation;

/** `focused` is 1 for the selected person (or their lineage), 0 for everything else. */
vec3 applyFocus(vec3 color, float focused) {
  float amount = uFocus * uFocusDesaturation * (1.0 - focused);
  float luma = dot(color, vec3(0.2126, 0.7152, 0.0722));
  return mix(color, vec3(luma), amount);
}
