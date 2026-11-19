// 3D rotating Mario-style star with depth-based fog.
//
// A five-pointed star outline (5 outer + 5 inner vertices) is extruded along Z
// to give it real thickness, then rendered in p5.js WEBGL mode through a custom
// GLSL shader pair (shaders/fog.vert + shaders/fog.frag). The shader applies
// linear, depth-based fog: fragments farther from the camera blend toward the
// fog color, matching the WebGLFundamentals depth-based fog demo.

let fogShader;      // the loaded GLSL program
let starGeometry;   // cached p5.Geometry for the extruded star
let fogSlider;      // on-screen DOM slider that shifts the fog band
let fogLabel;       // readout showing the current near/far distances

// --- Fog + color configuration (shared by background() and the shader) ---
// Fog color is a light blue-grey. background() is set to the SAME color so the
// star dissolves into the backdrop as it recedes, exactly like the reference.
const FOG_RGB = [0.53, 0.6, 0.67]; // 0..1 range for the shader
const OBJECT_COLOR = [1.0, 0.85, 0.1]; // Mario-star gold

// Camera distance from the world origin. Set explicitly in setup() so the fog
// math below does not depend on p5's default camera (which is also z = 800).
const CAMERA_Z = 800;

// How far the star is pushed back from the world origin (see draw()).
const STAR_Z = 620;

// View-space depth of the star's center = camera distance + push-back.
// The fog shader measures depth from the CAMERA, not from the world origin,
// so the fog band must be placed around this value.
const STAR_DEPTH = CAMERA_Z + STAR_Z; // 1420

// Rotation swings the star's points roughly +/- (OUTER_R + DEPTH/2) ~ 260
// units nearer/farther than its center. The base band starts just in front of
// the nearest point and ends a bit past the farthest, so near tips stay gold
// and far tips fade strongly into the fog as the star turns.
const FOG_NEAR = STAR_DEPTH - 250; // nearer than this: no fog
const FOG_FAR = STAR_DEPTH + 350;  // farther than this: fully fogged

// The slider shifts the whole fog band (near and far together) along view-space
// depth without changing its width. At -400 the star is almost fully fogged,
// at +400 it is almost fog-free.
const FOG_OFFSET_MIN = -400;
const FOG_OFFSET_MAX = 400;
const FOG_OFFSET_DEFAULT = 0;
const FOG_OFFSET_STEP = 1;

// Star dimensions. DEPTH is generous so the extruded thickness itself adds
// visible near-to-far depth variation independent of rotation.
const OUTER_R = 180;
const INNER_R = 72;
const DEPTH = 160;

function preload() {
  // loadShader fetches these files over HTTP, so the page must be served
  // (not opened as file://). See README.
  fogShader = loadShader('shaders/fog.vert', 'shaders/fog.frag');
}

function setup() {
  createCanvas(windowWidth, windowHeight, WEBGL);

  // Pin the camera so view-space depth = CAMERA_Z + STAR_Z at the star center.
  camera(0, 0, CAMERA_Z, 0, 0, 0, 0, 1, 0);

  // Build the star geometry exactly once and cache it.
  starGeometry = buildGeometry(() => makeStar(OUTER_R, INNER_R, DEPTH));

  // On-screen fog control. The WEBGL canvas is full-viewport with
  // overflow:hidden, so the slider and its label are positioned explicitly in
  // the top-left corner to sit above the canvas.
  fogLabel = createDiv('Fog distance');
  fogLabel.position(16, 12);
  fogLabel.style('color', '#ffffff');
  fogLabel.style('font', '14px sans-serif');
  fogLabel.style('text-shadow', '0 1px 2px rgba(0,0,0,0.6)');
  fogLabel.style('user-select', 'none');

  fogSlider = createSlider(
    FOG_OFFSET_MIN,
    FOG_OFFSET_MAX,
    FOG_OFFSET_DEFAULT,
    FOG_OFFSET_STEP
  );
  fogSlider.position(16, 34);
  fogSlider.style('width', '220px');
}

function draw() {
  // Clear to the fog color so fogged-out fragments blend into the background.
  background(FOG_RGB[0] * 255, FOG_RGB[1] * 255, FOG_RGB[2] * 255);

  // Shift the base fog band by the slider offset. Moving the band nearer the
  // camera fogs more of the star; moving it farther reveals more of it.
  const offset = fogSlider.value();
  const near = FOG_NEAR + offset;
  const far = FOG_FAR + offset;
  fogLabel.html('Fog distance: near ' + Math.round(near) + ' / far ' + Math.round(far));

  shader(fogShader);
  fogShader.setUniform('uFogColor', [FOG_RGB[0], FOG_RGB[1], FOG_RGB[2], 1.0]);
  fogShader.setUniform('uFogNear', near);
  fogShader.setUniform('uFogFar', far);
  fogShader.setUniform('uObjectColor', OBJECT_COLOR);

  // Push the star away from the camera so its depth spans the fog range; the
  // continuous rotation then sweeps points nearer and farther, making the fog
  // visibly vary across the shape.
  translate(0, 0, -STAR_Z);

  // Continuous rotation, advanced every frame.
  const t = frameCount * 0.01;
  rotateY(t);
  rotateX(t * 0.35);

  model(starGeometry);
}

// Build a 3D five-pointed star: a 10-vertex outline (5 outer + 5 inner points
// alternating around a circle) extruded along Z into a front face, a back face
// and connecting side walls.
function makeStar(outerR, innerR, depth) {
  const points = 5;
  const halfDepth = depth / 2;

  // 10 outline vertices (x, y) alternating outer/inner, going around the circle.
  const outline = [];
  for (let i = 0; i < points * 2; i++) {
    const r = i % 2 === 0 ? outerR : innerR;
    // Start at the top (-PI/2) so the star points straight up.
    const angle = -HALF_PI + (i * PI) / points;
    outline.push([Math.cos(angle) * r, Math.sin(angle) * r]);
  }

  const n = outline.length;

  // Front face (z = +halfDepth): a triangle fan around the center.
  beginShape(TRIANGLES);
  for (let i = 0; i < n; i++) {
    const a = outline[i];
    const b = outline[(i + 1) % n];
    vertex(0, 0, halfDepth);
    vertex(a[0], a[1], halfDepth);
    vertex(b[0], b[1], halfDepth);
  }

  // Back face (z = -halfDepth): wound the opposite way.
  for (let i = 0; i < n; i++) {
    const a = outline[i];
    const b = outline[(i + 1) % n];
    vertex(0, 0, -halfDepth);
    vertex(b[0], b[1], -halfDepth);
    vertex(a[0], a[1], -halfDepth);
  }

  // Side walls: two triangles per outline edge connecting front to back.
  for (let i = 0; i < n; i++) {
    const a = outline[i];
    const b = outline[(i + 1) % n];
    // Triangle 1
    vertex(a[0], a[1], halfDepth);
    vertex(a[0], a[1], -halfDepth);
    vertex(b[0], b[1], -halfDepth);
    // Triangle 2
    vertex(a[0], a[1], halfDepth);
    vertex(b[0], b[1], -halfDepth);
    vertex(b[0], b[1], halfDepth);
  }
  endShape();
}

function windowResized() {
  resizeCanvas(windowWidth, windowHeight);
}
