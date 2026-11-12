attribute vec3 aShadeNormal;
/** Per instance: wind weight, and a phase so neighbors don't flutter in step. */
attribute vec2 aSway;

/** 0: the whole quad rides the wind with its stem. 1: rooted at the base (grass). */
uniform float uSwayAnchor;
/** Extra sway of the tip across the quad's own plane, in world units. */
uniform float uFlutter;
uniform float uFlutterFrequency;

varying vec3 vShadeNormal;
varying vec3 vWorldPosition;
varying vec3 vColor;
varying vec2 vUv;

void main() {
  mat4 instanceToWorld = modelMatrix * instanceMatrix;
  vec4 worldPosition = instanceToWorld * vec4(position, 1.0);

  // The field is sampled once per instance, at its stem, so a leaf moves as one piece with its
  // cluster; only its tip flutters on top of that.
  vec3 stem = (instanceToWorld * vec4(0.0, 0.0, 0.0, 1.0)).xyz;
  float rooted = mix(1.0, uv.y * uv.y, uSwayAnchor);
  worldPosition.xyz += windSway(stem, aSway.x) * rooted;
  vec3 facing = normalize(mat3(instanceToWorld) * vec3(0.0, 0.0, 1.0));
  float flutter = sin(uFlutterFrequency * uWindTime + aSway.y) * uFlutter * uWindStrength;
  worldPosition.xyz += facing * flutter * uv.y;

  vWorldPosition = worldPosition.xyz;
  vShadeNormal = normalize(mat3(modelMatrix) * aShadeNormal);
  vColor = instanceColor;
  vUv = uv;
  gl_Position = projectionMatrix * viewMatrix * worldPosition;
}
