attribute vec2 aPuff;
attribute float aPuffRadius;

varying vec2 vPuff;
varying float vCloudY;
varying float vPuffRadius;

void main() {
  vPuff = aPuff;
  vPuffRadius = aPuffRadius;
  // The cloud's own y: 0 is its flat bottom.
  vCloudY = position.y;
  gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
}
