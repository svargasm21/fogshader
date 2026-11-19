// Depth-based fog: vertex shader.
// p5.js (WEBGL mode) automatically supplies the attribute aPosition and the
// uniforms uModelViewMatrix / uProjectionMatrix for geometry drawn with p5
// primitives or custom buildGeometry() models.
precision highp float;

attribute vec3 aPosition;

uniform mat4 uModelViewMatrix;
uniform mat4 uProjectionMatrix;

// View-space position passed to the fragment shader so each fragment knows
// how far it sits from the camera (the camera is at the origin in view space).
varying vec3 vViewPosition;

void main() {
  // Transform the vertex into view (eye) space.
  vec4 viewPos = uModelViewMatrix * vec4(aPosition, 1.0);

  // Hand the view-space position to the fragment shader for the fog distance.
  vViewPosition = viewPos.xyz;

  // Standard clip-space output.
  gl_Position = uProjectionMatrix * viewPos;
}
