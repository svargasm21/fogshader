// Depth-based fog: fragment shader.
// Replicates the WebGLFundamentals depth-based linear fog lesson
// (https://webglfundamentals.org/webgl/lessons/webgl-fog.html): the farther a
// fragment is from the camera, the more its color blends toward the fog color.
precision highp float;

// View-space position of this fragment (camera is at the origin in view space).
varying vec3 vViewPosition;

uniform vec4 uFogColor;    // fog / background color (rgb used, a kept for parity)
uniform float uFogNear;    // distance at which fog begins (no fog nearer than this)
uniform float uFogFar;     // distance at which fog is fully opaque
uniform vec3 uObjectColor; // the star's base color

void main() {
  // View-space depth of this fragment: distance along the camera's view axis.
  // In p5/WebGL view space the camera looks down -Z, so negating the view-space
  // Z gives a positive forward distance. This matches the reference demo's
  // depth-based (gl_FragCoord) fog, which fogs on linear view-space depth rather
  // than the radial distance to the camera.
  float dist = -vViewPosition.z;

  // Linear fog factor: 1.0 = fully the object color (near), 0.0 = fully fog (far).
  float fogAmount = clamp((uFogFar - dist) / (uFogFar - uFogNear), 0.0, 1.0);

  // Blend object color toward the fog color as distance grows.
  gl_FragColor = vec4(mix(uFogColor.rgb, uObjectColor, fogAmount), 1.0);
}
