# Mario Star Fog Shader

A 3D rotating five-pointed Mario-style star rendered in [p5.js](https://p5js.org/)
WEBGL mode with depth-based fog applied through a custom GLSL shader pair. It
replicates the WebGLFundamentals depth-based fog demo
([webgl-3d-fog-depth-based-gl_FragCoord](https://webglfundamentals.org/webgl/webgl-3d-fog-depth-based-gl_FragCoord.html),
explained in the [WebGL fog lesson](https://webglfundamentals.org/webgl/lessons/webgl-fog.html)):
the farther a fragment sits from the camera, the more its color blends toward the
fog color, so the star fades into the background as it rotates and recedes.

## How the fog works

Linear, depth-based fog:

1. The vertex shader (`shaders/fog.vert`) transforms each vertex by
   `uModelViewMatrix` into view (eye) space and passes that position to the
   fragment shader as a varying.
2. The fragment shader (`shaders/fog.frag`) computes the view-space depth,
   `dist = -vViewPosition.z` (the camera looks down -Z, so negating gives a
   positive forward distance). This matches the reference demo's depth-based
   (`gl_FragCoord`) variant, which fogs on view-space depth rather than radial
   distance. It then computes a fog factor
   `fogAmount = clamp((uFogFar - dist) / (uFogFar - uFogNear), 0.0, 1.0)`, and
   finally `mix(uFogColor.rgb, uObjectColor, fogAmount)`.

The sketch sets the canvas `background()` to the same color as `uFogColor` so
fully-fogged fragments blend seamlessly into the backdrop.

## File layout

```
index.html        Full-viewport page; loads lib/p5.min.js then sketch.js (relative paths)
sketch.js         p5 sketch: star geometry, shader wiring, rotation
shaders/fog.vert  GLSL vertex shader (view-space position -> varying)
shaders/fog.frag  GLSL fragment shader (depth-based linear fog)
lib/p5.min.js     Vendored p5.js 1.11.1 (not a CDN; see below)
README.md         This file
```

## Running it

The page must be served over HTTP. It **cannot** be opened directly as a
`file://` URL because p5's `loadShader()` fetches `shaders/fog.vert` and
`shaders/fog.frag` over the network, and browsers block those fetches on the
`file://` scheme.

From the project root (`/projects/sandbox`), start any static server, for
example:

```sh
python3 -m http.server 8080
```

Then open <http://localhost:8080/> in a WebGL-capable browser. You should see a
gold five-pointed star rotating in 3D, its far side fading into the blue-grey
fog.

## Fog slider

A labelled slider in the top-left corner adjusts the fog at runtime. It shifts
the whole fog band (the `uFogNear` / `uFogFar` distances together, keeping the
band width fixed) nearer to or farther from the camera. Dragging it toward the
camera fogs more of the star; dragging it away reveals more of it. The live
near/far distances are shown in the label above the slider. The slider is a p5
DOM control (`createSlider`) positioned over the canvas; its value is read each
frame in `draw()` and fed into the shader's fog uniforms.

## Why p5.js is vendored

The p5.js library is committed locally at `lib/p5.min.js` (version 1.11.1) rather
than loaded from a CDN. The sandbox this project was built in blocks general CDNs
(cdnjs / jsdelivr return 403), so vendoring the library keeps the deliverable
self-contained and runnable offline with no runtime CDN dependency. `index.html`
references it with a relative `<script>` tag.

## Configuration

The base fog parameters are named constants in `sketch.js`: `FOG_NEAR` and
`FOG_FAR` define the default fog band, `FOG_RGB` the fog/background color, and
`FOG_OFFSET_MIN` / `FOG_OFFSET_MAX` the range the slider can shift that band
over. The fog color (`FOG_RGB`) is still fixed; adding a color control would be
a natural further extension.
