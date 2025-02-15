'use strict';

// ColoredPoint.js (c) 2012 matsuda
// Vertex shader program
var VSHADER_SOURCE =`
attribute vec4 a_Position;
attribute vec2 a_UV;
varying vec2 v_UV;
uniform mat4 u_ModelMatrix;
uniform mat4 u_ViewMatrix;
uniform mat4 u_ProjectionMatrix;

uniform int u_doingInstances;
attribute vec3 a_offset;
void main() {
  if (u_doingInstances == 1){
    gl_Position = u_ProjectionMatrix * u_ViewMatrix * (a_Position + vec4(a_offset, 0));
    v_UV = a_UV;
  } else {
    gl_Position = u_ProjectionMatrix * u_ViewMatrix * u_ModelMatrix * a_Position;
    v_UV = a_UV;
  }
  
}`;

// Fragment shader program
var FSHADER_SOURCE =`
precision mediump float;
uniform vec4 u_FragColor;
uniform sampler2D u_Sampler0;
uniform sampler2D u_Sampler1;
uniform int u_colorSrc;
varying vec2 v_UV;
void main() {
  if (u_colorSrc == 1) {
    gl_FragColor = u_FragColor;
  } else if (u_colorSrc == 2){
    gl_FragColor = vec4(v_UV, 0, 1);
  } else if (u_colorSrc == 3){
    gl_FragColor = texture2D(u_Sampler0, v_UV);
  } else if (u_colorSrc == 4){
    gl_FragColor = texture2D(u_Sampler1, v_UV);
  } else {
    gl_FragColor = vec4(1, 0, 1, 1);
  }
}`;

let a_Position, a_UV, a_offset, u_ModelMatrix, u_FragColor, 
    u_ViewMatrix, u_ProjectionMatrix, u_Sampler0,
    u_ColorSrc, u_Sampler1, u_doingInstances;

/** @type {Camera} */
let camera;

const moveSpeed = .2;
const panSpeed = 5;

/**
 * Get the canvas and gl context
 * @returns {[WebGLRenderingContext, HTMLCanvasElement]} gl context
 */
function setupWebGL(){
  var canvas = document.getElementById('webgl');

  // Get the rendering context for WebGL
  // var gl = getWebGLContext(canvas);
  var gl = canvas.getContext("webgl", {preserveDrawingBuffer: false});
  if (!gl) {
    throw new Error('Failed to get the rendering context for WebGL');
  }

  return [gl, canvas];
}

/**
 * Compile the shader programs, attach the javascript variables to the GLSL variables
 * @param {WebGLRenderingContext} gl Rendering context
 * @param {string[]} attrs Attributes to locate
 * @param {string[]} unifs Uniforms to locate
 * @returns {[GLint[], WebGLUniformLocation[]]} attribute variables and uniform vairabl
 */
function connectVariablesToGLSL(gl, attrs, unifs){
  var out = [[], []];

  // Initialize shaders
  if (!initShaders(gl, VSHADER_SOURCE, FSHADER_SOURCE)) {
    throw new Error('Failed to intialize shaders.');
  }

  // Get the storage location of attributes
  for (var i = 0; i < attrs.length; i++){
    var attr = gl.getAttribLocation(gl.program, attrs[i]);
    if (attr < 0) {
      throw new Error(`Failed to get the storage location of attribute ${attrs[i]}`);
    }
    out[0].push(attr);
  }

  // Get the storage location of uniforms
  for (var i = 0; i < unifs.length; i++){
    var unif = gl.getUniformLocation(gl.program, unifs[i]);
    if (unif < 0) {
      throw new Error(`Failed to get the storage location of uniform ${unifs[i]}`);
    }
    out[1].push(unif);
  }

  return out;
}

/**
 * 
 * @param {WebGLRenderingContext} gl 
 * @param {WebGLTexture} texture 
 * @param {WebGLUniformLocation} u_Sampler 
 * @param {HTMLImageElement} image 
 */
function loadTexture(gl, texture, u_Sampler, image, num) {
  gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, 1); // Flip the image's y axis
  // Enable the texture unit num
  gl.activeTexture(gl.TEXTURE0 + num);
  // Bind the texture object to the target
  gl.bindTexture(gl.TEXTURE_2D, texture);
 
  // Set the texture parameters
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR_MIPMAP_LINEAR);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, !num ? gl.LINEAR : gl.NEAREST);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.REPEAT);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.REPEAT);
  // Set the texture image
  gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGB, gl.RGB, gl.UNSIGNED_BYTE, image);
  gl.generateMipmap(gl.TEXTURE_2D);

  // Set the texture unit 0 to the sampler
  gl.uniform1i(u_Sampler, num);
}

/**
 * Clears canvas
 * @param {WebGLRenderingContext} gl 
 */
function clearCanvas(gl){
  gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
}

/**
 * 
 * @param {WebGLRenderingContext} gl 
 * @param {WebGLUniformLocation} u_Sampler 
 */
function initTextures(gl, src, u_Sampler, num){

  var texture = gl.createTexture();
  if (!texture) {
    throw new Error("Could not create texture!");
  }

  // Load image
  var image = new Image();
  if (!image){
    throw new Error("Could not create image");
  }
  image.onload = () => loadTexture(gl, texture, u_Sampler, image, num);
  image.src = src;

}

var world = [
  [4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4],
  [4, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 4],
  [4, 2, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 2, 2, 2, 2, 0, 4, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 2, 4],
  [4, 2, 0, 4, 2, 4, 2, 4, 2, 4, 2, 4, 2, 0, 2, 0, 0, 2, 0, 4, 0, 4, 4, 4, 4, 4, 4, 4, 4, 0, 2, 4],
  [4, 2, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 2, 0, 0, 2, 0, 4, 0, 4, 0, 0, 0, 0, 0, 0, 4, 0, 2, 4],
  [4, 2, 0, 3, 3, 3, 3, 3, 3, 3, 3, 3, 2, 0, 2, 2, 0, 2, 0, 4, 0, 4, 0, 4, 4, 4, 4, 0, 4, 0, 2, 4],
  [4, 2, 0, 3, 0, 0, 0, 0, 0, 0, 0, 0, 2, 0, 0, 2, 0, 2, 0, 4, 0, 4, 0, 4, 0, 0, 4, 0, 4, 0, 2, 4],
  [4, 2, 0, 3, 0, 3, 4, 3, 4, 3, 4, 0, 2, 0, 0, 1, 0, 2, 0, 4, 0, 4, 0, 0, 0, 0, 4, 0, 4, 0, 2, 4],
  [4, 2, 0, 3, 0, 3, 0, 0, 0, 0, 2, 0, 2, 0, 0, 2, 0, 1, 0, 4, 0, 4, 4, 4, 4, 4, 4, 0, 4, 0, 2, 4],
  [4, 2, 0, 2, 0, 3, 0, 1, 0, 0, 2, 0, 2, 0, 0, 1, 0, 2, 0, 4, 0, 0, 0, 0, 0, 0, 0, 0, 4, 0, 2, 4],
  [4, 2, 0, 1, 0, 3, 0, 0, 2, 0, 2, 0, 2, 0, 0, 2, 0, 1, 0, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 0, 2, 4],
  [4, 2, 0, 1, 0, 3, 0, 1, 0, 0, 2, 0, 1, 0, 0, 1, 0, 2, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 2, 4],
  [4, 2, 0, 2, 0, 3, 0, 0, 2, 0, 2, 0, 1, 0, 0, 2, 0, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 2, 4],
  [4, 2, 0, 2, 0, 3, 0, 1, 0, 0, 2, 0, 1, 0, 0, 1, 0, 2, 0, 0, 0, 0, 0, 0, 1, 1, 1, 1, 1, 1, 2, 4],
  [4, 2, 0, 3, 0, 3, 0, 0, 2, 0, 2, 0, 1, 1, 1, 1, 0, 1, 0, 0, 0, 0, 0, 0, 2, 0, 0, 0, 2, 1, 2, 4],
  [4, 2, 0, 3, 0, 3, 0, 2, 0, 0, 2, 0, 0, 0, 0, 0, 0, 1, 2, 3, 4, 3, 2, 1, 3, 0, 0, 0, 3, 1, 2, 4],
  [4, 2, 0, 3, 0, 3, 0, 0, 1, 0, 2, 2, 2, 2, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 4, 1, 2, 4],
  [4, 2, 0, 3, 0, 3, 0, 1, 0, 0, 0, 0, 0, 0, 1, 1, 1, 1, 2, 3, 4, 3, 2, 1, 3, 0, 0, 0, 3, 1, 2, 4],
  [4, 2, 0, 4, 0, 2, 0, 0, 2, 0, 2, 0, 2, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 2, 0, 0, 0, 2, 1, 2, 4],
  [4, 2, 0, 4, 0, 2, 0, 1, 0, 2, 0, 1, 0, 1, 0, 4, 0, 4, 0, 0, 0, 0, 0, 0, 1, 1, 1, 1, 1, 1, 2, 4],
  [4, 2, 0, 4, 0, 2, 0, 0, 2, 0, 2, 0, 2, 0, 2, 0, 4, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 2, 4],
  [4, 2, 0, 4, 0, 2, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 4, 0, 4, 4, 4, 4, 4, 4, 4, 4, 0, 2, 0, 2, 4],
  [4, 2, 0, 4, 0, 3, 3, 3, 3, 3, 3, 3, 3, 3, 2, 1, 0, 0, 0, 4, 0, 0, 0, 0, 0, 0, 4, 0, 3, 0, 2, 4],
  [4, 2, 0, 4, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 0, 0, 0, 4, 0, 5, 5, 5, 5, 0, 4, 0, 5, 0, 2, 4],
  [4, 2, 0, 4, 4, 4, 4, 3, 3, 3, 3, 3, 3, 3, 0, 1, 0, 0, 0, 4, 0, 5, 8, 7, 5, 0, 4, 0, 7, 0, 2, 4],
  [4, 2, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 2, 0, 1, 0, 0, 0, 4, 0, 5, 9, 6, 5, 0, 4, 0, 9, 0, 2, 4],
  [4, 2, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 0, 2, 0, 1, 1, 1, 1, 1, 0, 5, 5, 5, 5, 0, 4, 0, 7, 0, 2, 4],
  [4, 2, 0, 1, 1, 1, 0, 1, 1, 1, 0, 1, 0, 3, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 4, 0, 5, 0, 2, 4],
  [4, 2, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 0, 2, 1, 1, 1, 1, 1, 1, 4, 4, 4, 4, 4, 4, 4, 0, 3, 0, 2, 4],
  [4, 2, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 2, 4],
  [4, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 4],
  [4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4],
];

const wallHeight = 20000;
world[0] = Array(32).fill(wallHeight);
world[31] = Array(32).fill(wallHeight);
for (var y = 0; y < world.length; y++){
  world[y][0] = wallHeight;
  world[y][31] = wallHeight;
}



var ground = null;
var skybox = null;
var wObj = null;
const cubeSize = .5;
var mouseSensitivity = 0.5;

const frameTimeText = document.getElementById("frameTime");
const fpsText = document.getElementById("fps");
const blockCountText = document.getElementById("blockCount");


let cone1 = new Cone(new Matrix4(), [1, 0, 0], .5, 2);
let cone2 = new Cone(new Matrix4(), [0, 1, 0], .5, 1);
let cone3 = new Cone(new Matrix4(), [0, 0, 1], .5, .5);

var ext;

function main() {


  var [gl, canvas] = setupWebGL();
  init_world();

  gl.enable(gl.DEPTH_TEST);
  gl.clearColor(.5, .75, 1, 1.0);

  ext = gl.getExtension('ANGLE_instanced_arrays');
  if (!ext) {
    throw Error("Could not get extension ''ANGLE_instanced_arrays''");
  }

  
  [[a_Position, a_UV, a_offset], 
    [u_FragColor, u_ModelMatrix, u_ViewMatrix, 
     u_ProjectionMatrix, u_Sampler0, u_ColorSrc,
     u_Sampler1, u_doingInstances]] = connectVariablesToGLSL(
      gl, ["a_Position", "a_UV", "a_offset"], 
      ["u_FragColor", "u_ModelMatrix", "u_ViewMatrix", 
       "u_ProjectionMatrix", "u_Sampler0", "u_colorSrc", "u_Sampler1",
      "u_doingInstances"]
  );

  camera = new Camera(canvas.width/canvas.height);
  gl.uniformMatrix4fv(u_ProjectionMatrix, false, camera.projectionMatrix.elements);

  initTextures(gl, "stone.jpg", u_Sampler0, 0);
  initTextures(gl, "grass.png", u_Sampler1, 1);

  // Clear <canvas>
  clearCanvas(gl);

  document.onkeydown = function(ev){
    switch (ev.key){
      case "w":
        camera.moveForwards(moveSpeed);
        break;
      case "s":
        camera.moveBackwards(moveSpeed);
        break;
      case "a":
        camera.moveLeft(moveSpeed);
        break;
      case "d":
        camera.moveRight(moveSpeed);
        break;
      case "q":
        camera.panLeft(panSpeed);
        break;
      case "e":
        camera.panRight(panSpeed);
        break;
    }

  }

  document.onmousedown = function(ev){
    if (ev.button == 0){
      wObj.changePoint(...camera.at.elements, false);
    } else if (ev.button == 2){
      wObj.changePoint(...camera.at.elements, true);
    }
  }

  canvas.onclick = async (ev) => {
    await canvas.requestPointerLock();
  }

  let yPan = 0;
  const MAX_Y_PAN = 90;
  canvas.onmousemove = (ev) => {

    // Don't pan if mouse is not locked
    if (document.pointerLockElement != canvas) return;

    camera.panRight(ev.movementX * mouseSensitivity);
    yPan += ev.movementY * mouseSensitivity;
    if (Math.abs(yPan) > MAX_Y_PAN){
      yPan = Math.sign(yPan) * MAX_Y_PAN;
    } else {
      camera.panUp(ev.movementY * mouseSensitivity);
    }
  }

  tick(gl);

}

function init_world(){
  wObj = new World(world, cubeSize);

  skybox = new Cube(new Matrix4(), [.5, .75, 1], [100, wallHeight, 100]);

  ground = new TexCube(new Matrix4(), null, [world[0].length * cubeSize, 0.001, world.length * cubeSize]);
  ground.matrix.translate(-cubeSize, -cubeSize, -cubeSize);
  
}


/**
 * Renders scene
 * @param {WebGLRenderingContext} gl 
 */
function renderScene(gl){
  let start_time = Date.now();
  clearCanvas(gl);
  gl.uniform1i(u_ColorSrc, 4);
  ground.render(gl, a_Position, a_UV, u_ModelMatrix);
  gl.uniform1i(u_ColorSrc, 3);

  // wObj.render(gl, a_Position, a_UV, u_ModelMatrix);
  wObj.renderFast(gl, ext, a_Position, a_UV, a_offset, u_doingInstances);

  gl.uniform1i(u_ColorSrc, 1);
  skybox.render(gl, a_Position, u_FragColor, u_ModelMatrix);

  let catMat = new Matrix4();
  catMat.translate(10, -.2, 0);
  catMat.rotate(0.1 * Date.now(), 0, 1, 0);
  catMat.translate(1, 0, 0);
  renderCat(gl, catMat, 0.1 * Date.now());

  catMat.setTranslate(10, -.2, 0);
  catMat.rotate(0.1 * Date.now() + 120, 0, 1, 0);
  catMat.translate(1, 0, 0);
  renderCat(gl, catMat, 0.1 * Date.now());

  catMat.setTranslate(10, -.2, 0);
  catMat.rotate(0.1 * Date.now() + 240, 0, 1, 0);
  catMat.translate(1, 0, 0);
  renderCat(gl, catMat, 0.1 * Date.now());

  let adjTime = Date.now() * 0.001;
  cone1.matrix.setTranslate(10, .1 * Math.sin(adjTime) + 1, 0);
  cone2.matrix.setTranslate(10, .1 * Math.sin(adjTime + 1.5) + 2, 0);
  cone3.matrix.setTranslate(10, .1 * Math.sin(adjTime + 3) + 3, 0);
  cone1.render(gl, a_Position, u_FragColor, u_ModelMatrix);
  cone2.render(gl, a_Position, u_FragColor, u_ModelMatrix);
  cone3.render(gl, a_Position, u_FragColor, u_ModelMatrix);

  let total_time = Date.now() - start_time;
  frameTimeText.innerText = total_time;
  fpsText.innerText = Math.round((1000 / total_time) * 100) / 100;
  blockCountText.innerText = wObj.block_count;
}

function renderCat(gl, fullModelM, time){
  // Clear <canvas>
  const furLight = [255/255, 153/255, 20/255]
  const furDark = [173/255, 104/255, 14/255];
  const white = furLight;
  const black = [0, 0, 0];
  const nose = [235/255, 89/255, 121/255];

  let proxTXSlider = -30;
  let midTXSlider = -10;
  let distTXSlider = -10;
  let proxTYSlider = 45 * Math.sin(time / 30);
  let midTYSlider = 20 * Math.sin(time / 30);
  let distTYSlider = 10 * Math.sin(time / 30);
  let leftLegsRot = 20 * Math.sin(time / 30);
  let rightLegsRot = 20 * Math.cos(time / 30 + .5)

  // Proximal Tail
  var proximalTail = new Cube(new Matrix4(fullModelM), furLight, [0.03, 0.03, 0.08]);
  proximalTail.matrix.translate(0.008, 0.025, 0.06);
  proximalTail.matrix.rotate(proxTYSlider, 0, 1, 0);
  proximalTail.matrix.rotate(proxTXSlider, 1, 0, 0);
  proximalTail.matrix.translate(0, 0, 0.08/2);
  
  // Mid Tail
  var midTail = new Cube(new Matrix4(proximalTail.matrix), furDark, [0.025, 0.025, 0.085]);
  midTail.matrix.translate(0, 0, .13 - 0.085/2);
  midTail.matrix.rotate(midTYSlider, 0, 1, 0);
  midTail.matrix.rotate(midTXSlider, 1, 0, 0);
  midTail.matrix.translate(0, 0, 0.085/2);

  // Distal Tail
  var distalTail = new Cube(new Matrix4(midTail.matrix), furLight, [0.02, 0.02, 0.09]);
  distalTail.matrix.translate(0, 0, .14 - 0.09/2);
  distalTail.matrix.rotate(distTYSlider, 0, 1, 0);
  distalTail.matrix.rotate(distTXSlider, 1, 0, 0);
  distalTail.matrix.translate(0, 0, 0.09/2);
  
  
  // Head
  var head = new Cube(new Matrix4(fullModelM), furLight, [0.13, 0.13, 0.13]);
  head.matrix.translate(0.0, 0.086, -0.627);
  head.matrix.rotate(0.0, 0.0, 0.0, -1.0);  
  

  // Left Ear
  var noseFacesColors = Array(8).fill(furDark);
  noseFacesColors[2] = nose;
  
  var leftEar = new Cube(new Matrix4(fullModelM), noseFacesColors, [0.05, 0.05, 0.005]);
  leftEar.matrix.translate(-0.06, 0.196, -0.707);
  leftEar.matrix.rotate(54.17, 0.22, -0.54, -0.81);  
  
  // Left Eye
  var leftEye = new Cube(new Matrix4(fullModelM), black, [0.01, 0.03, 0.0]);
  leftEye.matrix.translate(-0.064, 0.142, -0.763);
  leftEye.matrix.rotate(0.0, 0.0, 0.0, -1.0);

  // Left-Bottom Whisker
  var leftBottomWhisker = new Cube(new Matrix4(fullModelM), black, [0.01, 0.04, 0.0]);
  leftBottomWhisker.matrix.translate(-0.124, 0.037, -0.763);
  leftBottomWhisker.matrix.rotate(73.32, 0.0, 0.0, -1.0);  

  // Left-Top Whisker
  var leftTopWhisker = new Cube(new Matrix4(fullModelM), black, [0.01, 0.04, 0.0]);
  leftTopWhisker.matrix.translate(-0.124, 0.086, -0.763);
  leftTopWhisker.matrix.rotate(73.32, 0.0, 0.0, 1.0);
  
  // Nose Top
  var noseTop = new Cube(new Matrix4(fullModelM), nose, [0.03, 0.01, 0.0]);
  noseTop.matrix.translate(0.0, 0.072, -0.765);
  noseTop.matrix.rotate(0.0, 0.0, 0.0, -1.0);

  // NoseBottom
  var nosebottom = new Cube(new Matrix4(fullModelM), nose, [0.01, 0.01, 0.0]);
  nosebottom.matrix.translate(0.0, 0.049, -0.765);
  nosebottom.matrix.rotate(0.0, 0.0, 0.0, -1.0);  

  // Right Ear
  var rightEar = new Cube(new Matrix4(fullModelM), noseFacesColors, [0.05, 0.05, 0.005]);
  rightEar.matrix.translate(0.06, 0.196, -0.707);
  rightEar.matrix.rotate(54.17, -0.22, 0.54, -0.81);  

  // Right Eye
  var rightEye = new Cube(new Matrix4(fullModelM), black, [0.01, 0.03, 0.0]);
  rightEye.matrix.translate(0.064, 0.142, -0.763);
  rightEye.matrix.rotate(0.0, 0.0, 0.0, -1.0);
  
  // Right-Bottom Whisker
  var rightBottomWhisker = new Cube(new Matrix4(fullModelM), black, [0.01, 0.04, 0.0]);
  rightBottomWhisker.matrix.translate(0.124, 0.037, -0.763);
  rightBottomWhisker.matrix.rotate(106.68, 0.0, 0.0, -1.0);

  // Right-Top Whisker
  var rightTopWhisker = new Cube(new Matrix4(fullModelM), black, [0.01, 0.04, 0.0]);
  rightTopWhisker.matrix.translate(0.124, 0.086, -0.763);
  rightTopWhisker.matrix.rotate(106.69, 0.0, -0.0, 1.0);
  
  // Party Hat
  var partyHat = new Cone(new Matrix4(fullModelM), [1, .3, .3], .08, .16);
  partyHat.matrix.translate(0.0, 0.2 + 0, -0.6);


  // Body
  var body = new Cube(new Matrix4(fullModelM), furLight, [0.12, 0.07, 0.26]);
  body.matrix.translate(0.0, -0.014, -0.238);
  body.matrix.rotate(0.0, 0.0, 0.0, -1.0);
  
  

  // Left-Back Leg
  var leftBackLeg = new Cube(new Matrix4(fullModelM), furDark, [0.03, 0.1, 0.03]);
  leftBackLeg.matrix.translate(-0.086, -0.178, -0.015);
  leftBackLeg.matrix.translate(0, 0.07, 0.015);
  leftBackLeg.matrix.rotate(leftLegsRot, 1.0, 0.0, -0.0);
  leftBackLeg.matrix.translate(0, -0.07, -0.015);
  // Left-Back Toe
  var leftBackToe = new Cube(new Matrix4(leftBackLeg.matrix), white, [0.03, 0.02, 0.03]);
  leftBackToe.matrix.translate(0, -0.254 + .178, -0.040);
  

  // Left-Front Leg
  var leftFrontLeg = new Cube(new Matrix4(fullModelM), furDark, [0.03, 0.1, 0.03]);
  leftFrontLeg.matrix.translate(-0.086, -0.178, -0.455);
  leftFrontLeg.matrix.translate(0, 0.07, 0.015);
  leftFrontLeg.matrix.rotate(leftLegsRot, 1.0, 0.0, -0.0);
  leftFrontLeg.matrix.translate(0, -0.07, -0.015);
  // Left-Front Toe
  var leftFrontToe = new Cube(new Matrix4(leftFrontLeg.matrix), white, [0.03, 0.02, 0.03]);
  leftFrontToe.matrix.translate(0, -0.254 + .178, -0.494 + .455);
  

  // Right-Front Leg
  var rightFrontLeg = new Cube(new Matrix4(fullModelM), furDark, [0.03, 0.1, 0.03]);
  rightFrontLeg.matrix.translate(0.086, -0.178, -0.455);
  rightFrontLeg.matrix.translate(0, 0.07, 0.015);
  rightFrontLeg.matrix.rotate(rightLegsRot, 1.0, 0.0, -0.0);
  rightFrontLeg.matrix.translate(0, -0.07, -0.015);
  // Right-Front Toe
  var rightFrontToe = new Cube(new Matrix4(rightFrontLeg.matrix), white, [0.03, 0.02, 0.03]);
  rightFrontToe.matrix.translate(0, -0.254 + .178, -0.494 + .455);
  
  
  // Right-Back Leg
  var rightBackLeg = new Cube(new Matrix4(fullModelM), furDark, [0.03, 0.1, 0.03]);
  rightBackLeg.matrix.translate(0.086, -0.178, -0.015);
  rightBackLeg.matrix.translate(0, 0.07, 0.015);
  rightBackLeg.matrix.rotate(rightLegsRot, 1.0, 0.0, -0.0);
  rightBackLeg.matrix.translate(0, -0.07, -0.015);
  // Right-Back Toe
  var rightBackToe = new Cube(new Matrix4(rightBackLeg.matrix), white, [0.03, 0.02, 0.03]);
  rightBackToe.matrix.translate(0, -0.254 + .178, -.040);
  
  
  proximalTail.render(gl, a_Position, u_FragColor, u_ModelMatrix);
  midTail.render(gl, a_Position, u_FragColor, u_ModelMatrix);
  distalTail.render(gl, a_Position, u_FragColor, u_ModelMatrix);
  head.render(gl, a_Position, u_FragColor, u_ModelMatrix);
  leftEar.render(gl, a_Position, u_FragColor, u_ModelMatrix);
  leftEye.render(gl, a_Position, u_FragColor, u_ModelMatrix);
  leftBottomWhisker.render(gl, a_Position, u_FragColor, u_ModelMatrix);
  leftTopWhisker.render(gl, a_Position, u_FragColor, u_ModelMatrix);
  noseTop.render(gl, a_Position, u_FragColor, u_ModelMatrix);
  nosebottom.render(gl, a_Position, u_FragColor, u_ModelMatrix);
  rightEar.render(gl, a_Position, u_FragColor, u_ModelMatrix);
  rightEye.render(gl, a_Position, u_FragColor, u_ModelMatrix);
  rightBottomWhisker.render(gl, a_Position, u_FragColor, u_ModelMatrix);
  rightTopWhisker.render(gl, a_Position, u_FragColor, u_ModelMatrix);
  body.render(gl, a_Position, u_FragColor, u_ModelMatrix);
  leftBackLeg.render(gl, a_Position, u_FragColor, u_ModelMatrix);
  leftFrontLeg.render(gl, a_Position, u_FragColor, u_ModelMatrix);
  rightFrontToe.render(gl, a_Position, u_FragColor, u_ModelMatrix);
  rightBackLeg.render(gl, a_Position, u_FragColor, u_ModelMatrix);
  rightFrontLeg.render(gl, a_Position, u_FragColor, u_ModelMatrix);
  leftFrontToe.render(gl, a_Position, u_FragColor, u_ModelMatrix);
  leftBackToe.render(gl, a_Position, u_FragColor, u_ModelMatrix);
  rightBackToe.render(gl, a_Position, u_FragColor, u_ModelMatrix);
  partyHat.render(gl, a_Position, u_FragColor, u_ModelMatrix);
  
}

function tick(gl) {
  gl.uniformMatrix4fv(u_ViewMatrix, false, camera.viewMatrix.elements);
  renderScene(gl);

  requestAnimationFrame(() => tick(gl));
}