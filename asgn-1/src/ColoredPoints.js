// ColoredPoint.js (c) 2012 matsuda
// Vertex shader program
var VSHADER_SOURCE = `
  attribute vec4 a_Position;
  uniform float u_Size;
  void main() {
    gl_Position = a_Position;
    //gl_PointSize = 20.0;
    gl_PointSize = u_Size;
  }`

// Fragment shader program
var FSHADER_SOURCE = `
  precision mediump float;
  uniform vec4 u_FragColor;
  void main() {
    gl_FragColor = u_FragColor;
  }`

  let canvas;
  let gl;
  let a_Position;
  let u_FragColor;
  let u_Size;

function setupWebGL() {
    // Retrieve <canvas> element
    canvas = document.getElementById('webgl');

    // Get the rendering context for WebGL
    // gl = getWebGLContext(canvas);
    gl = canvas.getContext("webgl", {preserveDrawingBuffer: true});
    if (!gl) {
      console.log('Failed to get the rendering context for WebGL');
      return;
    }
    
}

function connectVariables() {
  // Initialize shaders
  if (!initShaders(gl, VSHADER_SOURCE, FSHADER_SOURCE)) {
    console.log('Failed to intialize shaders.');
    return;
  }

  // // Get the storage location of a_Position
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

  u_Size = gl.getUniformLocation(gl.program, 'u_Size');
  if (!u_Size) {
    console.log('Failed to get the storage location of u_Size');
    return;
  }
}

const POINT = 0;
const TRIANGLE = 1;
const CIRCLE = 2;
const RANDOM = 3;

let g_selectedColor = [1.0, 1.0, 1.0, 1.0];
let g_size = 5;
let g_selectedType = POINT;
let g_segments = 10;

function HTML_UI_functions() {
  document.getElementById('green').onclick = function() {
    g_selectedColor = [0.0, 1.0, 0.0, 1.0];
  };
  document.getElementById('red').onclick = function() {
    g_selectedColor = [1.0, 0.0, 0.0, 1.0];
  };

  document.getElementById('clear').onclick = function() {
    g_shapesList = [];
    renderAllShapes();
  };

  document.getElementById('point').onclick = function() {
    g_selectedType = POINT;
  };
  document.getElementById('triangle').onclick = function() {
    g_selectedType = TRIANGLE;
  };
  document.getElementById('circle').onclick = function() {
    g_selectedType = CIRCLE;
  };

  // draw fox
  document.getElementById('fox').onclick = function() {
    let fox = new Fox();
    fox.render();
  };

  // game
  document.getElementById('game').onclick = function() {
    g_selectedType = RANDOM;
  };

  // sliders
  document.getElementById('redSlide').addEventListener("mouseup", function() {
    g_selectedColor[0] = this.value/100;
  });
  document.getElementById('greenSlide').addEventListener("mouseup", function() {
    g_selectedColor[1] = this.value/100;
  });
  document.getElementById('blueSlide').addEventListener("mouseup", function() {
    g_selectedColor[2] = this.value/100;
  });

  document.getElementById('sizeSlide').addEventListener("mouseup", function() {
    g_size = this.value;
  });

  // circle segments
  document.getElementById('circleSlide').addEventListener("mouseup", function() {
    g_segments = this.value;
  });

}

function main() {

  setupWebGL();

  connectVariables();

  HTML_UI_functions();

  // Register function (event handler) to be called on a mouse press
  canvas.onmousedown = click;
  canvas.onmousemove = function(ev) { if(ev.buttons == 1) click(ev); };

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

  let [x, y] = convertCoords(ev);

  let point;
  if(g_selectedType == POINT) {
    point = new Point();
  } else if(g_selectedType == TRIANGLE) {
    point = new Triangle();
  }
  else if(g_selectedType == CIRCLE) {
    point = new Circle();
  }
  else if(g_selectedType == RANDOM) {
    let rand = Math.random();
    if(rand < 0.33) {
      point = new Point();
    } else if(rand < 0.66) {
      point = new Triangle();
    } else {
      point = new Circle();
    }
  }
  point.position = [x, y];
  point.color = g_selectedColor.slice();
  point.size = g_size;
  if (g_selectedType == CIRCLE) {
    point.segments = g_segments;
  }
  if (g_selectedType == RANDOM) {
    point.position = [Math.random()*2-1, Math.random()*2-1];
    point.color = [Math.random(), Math.random(), Math.random(), 1.0];
    point.size = Math.random()*50+10;
    if (point.type == "circle") {
      point.segments = Math.floor(Math.random()*10);
    }
  }
  g_shapesList.push(point);

  // Store the coordinates to g_points array
  // g_points.push([x, y]);

  // g_colors.push(g_selectedColor.slice());

  // g_sizes.push(g_size);
  // Store the coordinates to g_points array
  // if (x >= 0.0 && y >= 0.0) {      // First quadrant
  //   g_colors.push([1.0, 0.0, 0.0, 1.0]);  // Red
  // } else if (x < 0.0 && y < 0.0) { // Third quadrant
  //   g_colors.push([0.0, 1.0, 0.0, 1.0]);  // Green
  // } else {                         // Others
  //   g_colors.push([1.0, 1.0, 1.0, 1.0]);  // White
  // }

  renderAllShapes();

}

function convertCoords(ev) {
  var x = ev.clientX; // x coordinate of a mouse pointer
  var y = ev.clientY; // y coordinate of a mouse pointer
  var rect = ev.target.getBoundingClientRect();

  x = ((x - rect.left) - canvas.width/2)/(canvas.width/2);
  y = (canvas.height/2 - (y - rect.top))/(canvas.height/2);

  return ([x, y]);

}



function renderAllShapes() {

  // var StartTime = performance.now();

  // Clear <canvas>
  gl.clear(gl.COLOR_BUFFER_BIT);

  // var len = g_points.length;

  var len = g_shapesList.length;

  for(var i = 0; i < len; i++) {
    var shape = g_shapesList[i];
    shape.render();
  }
}