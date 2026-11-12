attribute vec3 aShadeNormal;

varying vec3 vShadeNormal;
varying vec3 vWorldPosition;
varying vec3 vColor;
varying vec2 vUv;

void main() {
  vec4 worldPosition = modelMatrix * instanceMatrix * vec4(position, 1.0);
  vWorldPosition = worldPosition.xyz;
  vShadeNormal = normalize(mat3(modelMatrix) * aShadeNormal);
  vColor = instanceColor;
  vUv = uv;
  gl_Position = projectionMatrix * viewMatrix * worldPosition;
}
