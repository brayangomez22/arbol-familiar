attribute float bark;

varying vec3 vWorldNormal;
varying vec3 vWorldPosition;
varying vec2 vUv;
varying float vBark;

void main() {
  vec4 worldPosition = modelMatrix * vec4(position, 1.0);
  vWorldPosition = worldPosition.xyz;
  // Every toon mesh is scaled uniformly, so the model matrix is enough to carry the normal.
  vWorldNormal = normalize(mat3(modelMatrix) * normal);
  vUv = uv;
  vBark = bark;
  gl_Position = projectionMatrix * viewMatrix * worldPosition;
}
