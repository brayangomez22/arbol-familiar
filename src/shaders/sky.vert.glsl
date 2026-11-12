varying vec2 vScreen;

void main() {
  // A quad straight in clip space: the sky is painted on the screen, behind everything.
  vScreen = position.xy * 0.5 + 0.5;
  gl_Position = vec4(position.xy, 1.0, 1.0);
}
