uniform vec3 uColor;
uniform vec3 uShadeColor;
/** Sun direction on the screen plane. */
uniform vec2 uSunDirection;
uniform float uShadeOffset;
uniform float uBottomShade;

varying vec2 vPuff;
varying float vCloudY;
varying float vPuffRadius;

void main() {
  if (vCloudY < 0.0) discard;
  // A crescent of shade on the side of each puff away from the sun, plus a shaded flat bottom.
  float fromLitCenter = length(vPuff - uSunDirection * uShadeOffset);
  float edge = fwidth(fromLitCenter);
  float crescent = smoothstep(1.0 - edge, 1.0 + edge, fromLitCenter);
  float bottom = 1.0 - smoothstep(0.0, fwidth(vCloudY), vCloudY - uBottomShade * vPuffRadius);
  float shade = max(crescent, bottom);
  gl_FragColor = vec4(mix(uColor, uShadeColor, shade), 1.0);
  #include <colorspace_fragment>
}
