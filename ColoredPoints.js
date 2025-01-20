//Xiaohua Huo
//xhuo3@ucsc.edu
//Thank you!

// ColoredPoint.js (c) 2012 matsuda
// Vertex shader program
var VSHADER_SOURCE =
  'attribute vec4 a_Position; uniform float u_Size; void main() { gl_Position = a_Position; gl_PointSize = u_Size; }';

// Fragment shader program
var FSHADER_SOURCE =
  'precision mediump float; uniform vec4 u_FragColor; void main() { gl_FragColor = u_FragColor; }';

let canvas;
let gl;
let a_Position;
let u_FragColor;
let u_Size;

function setupWebGL(){
  // Retrieve <canvas> element
  canvas = document.getElementById('webgl');

  // Get the rendering context for WebGL
  gl = canvas.getContext("webgl", {preserveDrawingBuffer: true}, {alpha: true} );
  if (!gl) {
    console.log('Failed to get the rendering context for WebGL');
    return;
  }
}

function connectVariablesToGLSL(){
  // Initialize shaders
  if (!initShaders(gl, VSHADER_SOURCE, FSHADER_SOURCE)) {
    console.log('Failed to intialize shaders.');
    return;
  }

  // Get the storage location of a_Position
  a_Position = gl.getAttribLocation(gl.program, 'a_Position');
  if (a_Position < 0) {
    console.log('Failed to get the storage location of a_Position');
    return;
  }

  // Get the storage location of u_FragColor
  u_FragColor = gl.getUniformLocation(gl.program, 'u_FragColor');
  if (!u_FragColor) {
    console.log('Failed to get the storage location of u_FragColor');
    return;
  }

  // Get the storage size of u_Size
  u_Size = gl.getUniformLocation(gl.program, 'u_Size');
  if (!u_Size) {
    console.log('Failed to get the storage location of u_FragColor');
    return;
  }
}

const POINT = 0;
const TRIANGLE = 1;
const CIRCLE = 2;

let g_selectedColor = [1.0, 1.0, 1.0, 1.0];
let g_selectedSize = 5;
let g_selectedType = POINT;
let g_selectedSegment = 10;
let g_selectedAlpha = 1.0;

function addActionForHtmlUI(){
  document.getElementById('clearButton').onclick = function(){g_shapesList = []; renderAllShapes();};

  document.getElementById('pointButton').onclick = function(){g_selectedType = POINT};
  document.getElementById('triangleButton').onclick = function(){g_selectedType = TRIANGLE};
  document.getElementById('circleButton').onclick = function(){g_selectedType = CIRCLE};

  document.getElementById('redSlide').addEventListener('mouseup', function(){g_selectedColor[0] = this.value/100;});
  document.getElementById('greenSlide').addEventListener('mouseup', function(){g_selectedColor[1] = this.value/100;});
  document.getElementById('blueSlide').addEventListener('mouseup', function(){g_selectedColor[2] = this.value/100;});

  document.getElementById('sizeSlide').addEventListener('mouseup', function(){g_selectedSize = this.value;});
  document.getElementById('segmentSlide').addEventListener('mouseup', function(){g_selectedSegment = this.value;});

  document.getElementById('showButton').onclick = showTheCat;
  document.getElementById('alphaSlide').addEventListener('mouseup', function(){g_selectedAlpha = this.value / 100; showTheCat();});
}

function main() {
  //set up
  setupWebGL();  
  connectVariablesToGLSL();

  gl.enable(gl.BLEND);
  gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);

  addActionForHtmlUI();

  // Register function (event handler) to be called on a mouse press
  canvas.onmousedown = click;
  canvas.onmousemove = function(ev){if(ev.buttons == 1){click(ev)}};

  // Specify the color for clearing <canvas>
  gl.clearColor(0.0, 0.0, 0.0, 1.0);

  // Clear <canvas>
  gl.clear(gl.COLOR_BUFFER_BIT);
}

var g_shapesList = [];

// var g_points = [];  // The array for the position of a mouse press
// var g_colors = [];  // The array to store the color of a point
// var g_sizes = [];

function click(ev) {
  //Extract the event click and return it in WebGL coordinates
  [x, y] = convertCoordinatesEventToGL(ev);

  let point;
  if (g_selectedType == POINT){
    point = new Point();
  } else if (g_selectedType == TRIANGLE){
    point = new Triangle();
  } else {
    point = new Circle();
  }
  point.position = [x, y];
  point.color = g_selectedColor.slice();
  point.size = g_selectedSize;
  point.segments = g_selectedSegment;
  g_shapesList.push(point);

  // Store the coordinates to g_points array
  // g_points.push([x, y]);

  // g_colors.push(g_selectedColor.slice());

  // g_sizes.push(g_selectedSize)
  // Store the coordinates to g_points array
  // if (x >= 0.0 && y >= 0.0) {      // First quadrant
  //   g_colors.push([1.0, 0.0, 0.0, 1.0]);  // Red
  // } else if (x < 0.0 && y < 0.0) { // Third quadrant
  //   g_colors.push([0.0, 1.0, 0.0, 1.0]);  // Green
  // } else {                         // Others
  //   g_colors.push([1.0, 1.0, 1.0, 1.0]);  // White
  // }

  //Draw every shape that is supposed to be in the canvas
  renderAllShapes();
}

function convertCoordinatesEventToGL(ev){
  var x = ev.clientX; // x coordinate of a mouse pointer
  var y = ev.clientY; // y coordinate of a mouse pointer
  var rect = ev.target.getBoundingClientRect();

  x = ((x - rect.left) - canvas.width/2)/(canvas.width/2);
  y = (canvas.height/2 - (y - rect.top))/(canvas.height/2);

  return ([x, y]);
}

function renderAllShapes(){
  var startTime = performance.now();

  // Clear <canvas>
  gl.clear(gl.COLOR_BUFFER_BIT);

  var len = g_shapesList.length;
  for(var i = 0; i < len; i++) {
    g_shapesList[i].render();
  }
  var duration = performance.now() - startTime;
  sendTextToHTML("numdot: " + len + " ms: " + Math.floor(duration) + " fps: " + Math.floor(10000/duration), "numdot");
}

function sendTextToHTML(text, htmlID){
  var htmlElm = document.getElementById(htmlID);
  if(!htmlElm){
    console.log("Failed to get " + htmlID + " from HTML");
    return;
  }
  htmlElm.innerHTML = text;
}

function showTheCat(){
  g_shapesList = [];
  // white part
  gl.uniform4f(u_FragColor, 1.0, 1.0, 1.0, g_selectedAlpha);
  drawTriangle([-0.1, 0.3,    -0.6, -0.8,   0.4, -0.8]);
  drawTriangle([-0.1, 0.1,    -0.4, 0.6,    0.2, 0.6]);
  drawTriangle([-0.1, 0.1,    0.2, 0.6,     0.2, 0.2]);
  drawTriangle([-0.1, 0.1,    -0.4, 0.6,    -0.4, 0.2]);
  drawTriangle([-0.4, 0.6,    -0.4, 0.2,    -0.5, 0.5]);
  drawTriangle([0.2, 0.6,     0.2, 0.2,     0.3, 0.5]);
  // 
  gl.uniform4f(u_FragColor, 0.737, 0.561, 0.561, g_selectedAlpha);
  drawTriangle([-0.1, 0.1,    -0.35, 0.5,   0.15, 0.5]);
  drawTriangle([-0.4, 0.6,    -0.5, 0.5,    -0.4, 0.9]);
  drawTriangle([0.2, 0.6,     0.3, 0.5,     0.2, 0.9]);
  drawTriangle([-0.4, 0.9,    -0.4, 0.6,    -0.2, 0.6]);
  drawTriangle([0.2, 0.9,     0.2, 0.6,     0.0, 0.6]);
  drawTriangle([-0.2, -0.8,   -0.3, -0.5,   -0.2, -0.5]);
  drawTriangle([0.0, -0.8,    0.0, -0.5,    0.1, -0.5]);
  drawTriangle([0.4, -0.2,    0.26, -0.5,   0.4, -0.8]);
  drawTriangle([0.4, -0.2,    0.4, -0.8,    0.5, -0.1]);
  drawTriangle([0.5, -0.1,    0.6, -0.1,    0.43, -0.5]);
  drawTriangle([0.5, -0.1,    0.6, -0.1,    0.6, 0.1]);
  drawTriangle([0.6, 0.1,     0.6, -0.1,    0.7, 0.1]);
  drawTriangle([0.7, 0.3,     0.6, 0.1,     0.7, 0.1]);

  gl.uniform4f(u_FragColor, 1.0, 0.753, 0.796, g_selectedAlpha);
  drawTriangle([-0.4, 0.6,    -0.4, 0.8,    -0.3, 0.6]);
  drawTriangle([0.2, 0.6,     0.1, 0.6,     0.2, 0.8]);

  gl.uniform4f(u_FragColor, 0.0, 0.0, 1.0, g_selectedAlpha);
  drawTriangle([-0.2, 0.35,   -0.25, 0.4,   -0.15, 0.4]);
  drawTriangle([0.0, 0.35,    -0.05, 0.4,   0.05, 0.4]);
  
  gl.uniform4f(u_FragColor, 0.0, 0.0, 0.0, g_selectedAlpha);
  drawTriangle([-0.1, 0.3,    -0.13, 0.35,  -0.07, 0.35]);
  drawTriangle([-0.1, 0.25,   -0.15, 0.2,   -0.05, 0.2]);
}