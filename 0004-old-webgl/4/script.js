var canvas;
var gl;

var texOffset = [0,0];
var objectOffset = [0,0,7];

var cubeVerticesBuffer;
var cubeVerticesColorBuffer;
var cubeVerticesIndexBuffer;
var cubeVerticesTextureCoordBuffer;
var lastSquareUpdateTime = 0;
var squareRotation = 0.0;

var squareXOffset = 0.0;
var squareYOffset = 0.0;
var squareZOffset = 0.0;
var xIncValue = 0.2;
var yIncValue = -0.4;
var zIncValue = 0.3;

var cubeImage;
var cubeTexture;

var mvMatrix;
var shaderProgram;
var vertexPositionAttribute;
var vertexColorAttribute;
var perspectiveMatrix;

var paused = false;
var depth = 9;
var depthPosition = 0.0;
var depthVariation = 6;
var depthVariationSpeed = 1 / 800.0;

function initControls() {
  var pauser = document.getElementById("pauser");
  pauser.onmouseup = function(e) { if (e.button !== 0) return; pauser.value = (paused = !paused) ? 'Unpause' : 'Pause' ; }

  var l = ['X','Y','Z'];
  l.forEach(function(letter, offsetIndex) {
    var window = document.getElementById('position'+letter+'window');
    var slider = document.getElementById('position'+letter);
    slider.min = -20;
    slider.max = 20;
    slider.step = 0.1;

    slider.oninput = function(e) {
      // console.log(this.id[8]+' = '+this.value);
      window.value = this.value;
      objectOffset[offsetIndex] = this.value;
    };
    slider.onwheel = function(e) {
      var newValue = this.value;
      if (e.wheelDelta > 0) {
        newValue = Number(this.value) + Number(this.step);
      } else {
        newValue = Number(this.value) - Number(this.step);
      }
      this.value = newValue;
      window.value = this.value;
      objectOffset[offsetIndex] = this.value;
    };

    slider.value = (letter == 'Z') ? -10 : 0 ;
  });
  // and default position
  objectOffset = [0,0,-10];

}


function initTextures() {
  cubeTexture = gl.createTexture();
  cubeImage = new Image();
  cubeImage.onload = function() { handleTextureLoaded(cubeImage, cubeTexture); }
  cubeImage.src = "cubetexture.png";
}

function handleTextureLoaded(image, texture) {
  gl.bindTexture(gl.TEXTURE_2D, texture);
  gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, image);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST_MIPMAP_NEAREST);
  gl.generateMipmap(gl.TEXTURE_2D);
  gl.bindTexture(gl.TEXTURE_2D, null);
}

function initBuffers() {

  // vertices 3d coords
  var vertices = [
    // Front face
      -1.0,  1.0,  1.5,
      -1.0, -1.0,  1.5,
       1.0, -1.0,  1.5,
       1.0,  1.0,  1.5,
    // Back face
       1.0, -1.0, -1.5,
      -1.0, -1.0, -1.5,
      -1.0,  1.0, -1.5,
       1.0,  1.0, -1.5,
    // Top face
      -1.0,  1.5,  1.0,
       1.0,  1.5,  1.0,
       1.0,  1.5, -1.0,
      -1.0,  1.5, -1.0,
    // Bottom face
       1.0, -1.5, -1.0,
       1.0, -1.5,  1.0,
      -1.0, -1.5,  1.0,
      -1.0, -1.5, -1.0,
    // Left face
      -1.5,  1.0,  1.0,
      -1.5,  1.0, -1.0,
      -1.5, -1.0, -1.0,
      -1.5, -1.0,  1.0,
    // Right face
       1.5, -1.0, -1.0,
       1.5,  1.0, -1.0,
       1.5,  1.0,  1.0,
       1.5, -1.0,  1.0,
  ];
  cubeVerticesBuffer = gl.createBuffer(); // binding
  gl.bindBuffer(gl.ARRAY_BUFFER, cubeVerticesBuffer);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(vertices), gl.STATIC_DRAW);

  // colors for vertices
  var colors = [
    [0.8,  1.0,  1.0,  1.0],    // 0 Front face: cyan
    [1.0,  0.8,  0.8,  1.0],    // 1 Back face: red
    [0.8,  1.0,  0.8,  1.0],    // 2 Top face: green
    [0.8,  0.8,  1.0,  1.0],    // 3 Bottom face: blue
    [1.0,  0.8,  1.0,  1.0],    // 4 Left face: purple
    [1.0,  1.0,  0.8,  1.0],    // 5 Right face: yellow
    [1.0,  1.0,  1.0,  1.0],    // 6 White
    [0.0,  0.0,  0.0,  1.0]     // 7 black
  ];
  var generatedColors = []; // resulted array
  // generating array 
  for (j=0; j<6; j++) { var c = colors[j]; for (var i=0; i<4; i++) { generatedColors = generatedColors.concat(c); }; }
  // binding array
  cubeVerticesColorBuffer = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, cubeVerticesColorBuffer);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(generatedColors), gl.STATIC_DRAW);

  // texCoords for vertices
  var textureCoordinates = [
    // Front
    0.0, 0.0,    0.0, 1.0,
    1.0, 1.0,    1.0, 0.0,
    // Back
    0.0, 0.0,    0.0, 1.0,
    1.0, 1.0,    1.0, 0.0,
    // Top
    0.0, 0.0,    0.0, 1.0,
    1.0, 1.0,    1.0, 0.0,
    // Bottom
    0.0, 0.0,    0.0, 1.0,
    1.0, 1.0,    1.0, 0.0,
    // Right
    0.0, 0.0,    0.0, 1.0,
    1.0, 1.0,    1.0, 0.0,
    // Left
    0.0, 0.0,    0.0, 1.0,
    1.0, 1.0,    1.0, 0.0,
  ];
  // binding
  cubeVerticesTextureCoordBuffer = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, cubeVerticesTextureCoordBuffer);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(textureCoordinates), gl.STATIC_DRAW);
  
  //cube triangle faces vertices index table
  var cubeVertexIndices = [
    0,  1,  2,      0,  2,  3,    // front
    4,  5,  6,      4,  6,  7,    // back
    8,  9,  10,     8,  10, 11,   // top
    12, 13, 14,     12, 14, 15,   // bottom
    16, 17, 18,     16, 18, 19,   // right
    20, 21, 22,     20, 22, 23    // left
  ];
  // binding
  cubeVerticesIndexBuffer = gl.createBuffer();
  gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, cubeVerticesIndexBuffer);
  gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(cubeVertexIndices), gl.STATIC_DRAW);
 
}

function getShader(gl, id) {
  var shaderScript, theSource, currentChild, shader;
  
  shaderScript = document.getElementById(id);
  
  if (!shaderScript) {
    return null;
  }
  
  theSource = "";
  currentChild = shaderScript.firstChild;
  
  while(currentChild) {
    if (currentChild.nodeType == currentChild.TEXT_NODE) {
      theSource += currentChild.textContent;
    }
    
    currentChild = currentChild.nextSibling;
  }

  if (shaderScript.type == "x-shader/x-fragment") {
    shader = gl.createShader(gl.FRAGMENT_SHADER);
  } else if (shaderScript.type == "x-shader/x-vertex") {
    shader = gl.createShader(gl.VERTEX_SHADER);
  } else {
     // Unknown shader type
     return null;
  }

  gl.shaderSource(shader, theSource);
    
  // Compile the shader program
  gl.compileShader(shader);  
    
  // See if it compiled successfully
  if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {  
      alert("An error occurred compiling the shaders: " + gl.getShaderInfoLog(shader));  
      return null;  
  }
    
  return shader;
}

function initShaders() {
  var fragmentShader = getShader(gl, "shader-fs");
  var vertexShader = getShader(gl, "shader-vs");
  
  // Create the shader program
  
  shaderProgram = gl.createProgram();
  gl.attachShader(shaderProgram, vertexShader);
  gl.attachShader(shaderProgram, fragmentShader);
  gl.linkProgram(shaderProgram);
  
  // If creating the shader program failed, alert
  
  if (!gl.getProgramParameter(shaderProgram, gl.LINK_STATUS)) {
    alert("Unable to initialize the shader program.");
  }
  
  gl.useProgram(shaderProgram);
  
  // vertices coords (xyz)
  vertexPositionAttribute = gl.getAttribLocation(shaderProgram, "aVertexPosition");
  gl.enableVertexAttribArray(vertexPositionAttribute);
  // colors for vertices (rgba)
  vertexColorAttribute = gl.getAttribLocation(shaderProgram, "aVertexColor");
  gl.enableVertexAttribArray(vertexColorAttribute);
  // texture coords for vertices (st/uv)
  textureCoordAttribute = gl.getAttribLocation(shaderProgram, "aTextureCoord");
  gl.enableVertexAttribArray(textureCoordAttribute);
}



function initWebGL(canvas) {
  gl = null;
  
  try {
    // Try to grab the standard context. If it fails, fallback to experimental.
    var pars = {premultipliedAlpha: true, alpha: true};
    gl = canvas.getContext("webgl", pars) || canvas.getContext("experimental-webgl", pars);
  }
  catch(e) {}
  
  // If we don't have a GL context, give up now
  if (!gl) {
    alert("Unable to initialize WebGL. Your browser may not support it.");
    gl = null;
  }
  
  return gl;
}

function start() {
  canvas = document.getElementById("glcanvas");

  initControls();


  gl = initWebGL(canvas);      // Initialize the GL context
 
  horizAspect = canvas.height/canvas.width;
  
  // Only continue if WebGL is available and working
  
  if (gl) {
    gl.clearColor(0.0, 0.0, 0.0, 1.0); // Set clear color to black, fully opaque
    gl.enable(
      gl.DEPTH_TEST |
      // gl.BLEND |
    null); // Enable depth testing
    // gl.enable(gl.CULL_FACE); // Enable face culling
    // gl.depthFunc(gl.LESS); // Near things obscure far things
    // gl.blendFunc(gl.ONE_MINUS_DST_ALPHA, gl.DST_ALPHA);
    gl.viewport(0, 0, canvas.width, canvas.height);
    // gl.cullFace(gl.BACK);
    // gl.cullFace(gl.FRONT);
    // gl.cullFace(gl.FRONT_AND_BACK);

    initShaders();
    initBuffers();
    initTextures();
    

    setInterval(drawScene, 15)
  }
}

function drawScene() {
  var currentTime = (new Date).getTime();
  if (lastSquareUpdateTime && !paused) {
    var delta = currentTime - lastSquareUpdateTime;

    squareRotation += (30 * delta) / 1000.0;

    // squareXOffset += xIncValue * ((3 * delta) / 1000.0);
    // squareYOffset += yIncValue * ((3 * delta) / 1000.0);
    // squareZOffset += zIncValue * ((3 * delta) / 1000.0);

    // if (Math.abs(squareYOffset) > 2.5) {
    //   xIncValue = -xIncValue;
    //   yIncValue = -yIncValue;
    //   zIncValue = -zIncValue;
    // }
    depthPosition += delta * depthVariationSpeed;


  }
  var ddepth = Math.sin(depthPosition) * depthVariation / 2;

  lastSquareUpdateTime = currentTime;

  // squareRotation = (new Date()).getTime() / 1000.0;


  gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
  
  perspectiveMatrix = makePerspective(45, 1/horizAspect, 0.1, 256.0);
  
  loadIdentity();
  // smooth motion of cube (or camera???)
  // mvTranslate([-0.0, 0.0, (0.0- depth + ddepth)]);
  mvTranslate(objectOffset);
  mvRotate(squareRotation, [0, 3, 2]);

  // mvTranslate([squareXOffset, squareYOffset, squareZOffset]);
    
  // ==================================
  // vertices 3d-coords
  gl.bindBuffer(gl.ARRAY_BUFFER, cubeVerticesBuffer);
  gl.vertexAttribPointer(vertexPositionAttribute, 3, gl.FLOAT, false, 0, 0);
  // colors for vertices
  gl.bindBuffer(gl.ARRAY_BUFFER, cubeVerticesColorBuffer);
  gl.vertexAttribPointer(vertexColorAttribute, 4, gl.FLOAT, false, 0, 0);
  // texture coords for vertices
  gl.bindBuffer(gl.ARRAY_BUFFER, cubeVerticesTextureCoordBuffer);
  gl.vertexAttribPointer(textureCoordAttribute, 2, gl.FLOAT, false, 0, 0);
  // texture binding for
  gl.activeTexture(gl.TEXTURE0);
  gl.bindTexture(gl.TEXTURE_2D, cubeTexture);
  gl.uniform1i(gl.getUniformLocation(shaderProgram, "uSampler"), 0);
  // vertices indexes for faces
  gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, cubeVerticesIndexBuffer);

  // texOffset = [0,0];
  gl.uniform2f(gl.getUniformLocation(shaderProgram, "uTexOffset"), texOffset[0], texOffset[1]);
  gl.uniform1f(gl.getUniformLocation(shaderProgram, 'uScale'), 1.0);
  gl.uniform1f(gl.getUniformLocation(shaderProgram, 'uTrans'), 1.0);

  setMatrixUniforms();
  gl.drawElements(gl.TRIANGLES, 36, gl.UNSIGNED_SHORT, 0);
  
  // loadIdentity();
  mvPushMatrix();
  mvTranslate([-3,0,0]);
  mvRotate(squareRotation*2, [1, 0, 0]);
  gl.uniform1f(gl.getUniformLocation(shaderProgram, 'uScale'), 0.8);
  gl.uniform1f(gl.getUniformLocation(shaderProgram, 'uTrans'), 0.8);
  setMatrixUniforms();
  gl.drawElements(gl.TRIANGLES, 36, gl.UNSIGNED_SHORT, 0);


  mvPushMatrix();
  mvTranslate([0,-2.5,0]);
  mvRotate(squareRotation*3, [0, 1, 0]);
  gl.uniform1f(gl.getUniformLocation(shaderProgram, 'uScale'), 0.6);
  gl.uniform1f(gl.getUniformLocation(shaderProgram, 'uTrans'), 0.6);
  setMatrixUniforms();
  gl.drawElements(gl.TRIANGLES, 36, gl.UNSIGNED_SHORT, 0);

  mvPopMatrix();
  mvPopMatrix();

  // loadIdentity();
  // mvPushMatrix();
  mvTranslate([3,0,0]);
  mvRotate(squareRotation*2, [-1, 0, 0]);
  gl.uniform1f(gl.getUniformLocation(shaderProgram, 'uScale'), 0.8);
  gl.uniform1f(gl.getUniformLocation(shaderProgram, 'uTrans'), 0.8);
  setMatrixUniforms();
  gl.drawElements(gl.TRIANGLES, 36, gl.UNSIGNED_SHORT, 0);

  mvPushMatrix();
  mvTranslate([0,2.5,0]);
  mvRotate(squareRotation*3, [0, -1, 0]);
  gl.uniform1f(gl.getUniformLocation(shaderProgram, 'uScale'), 0.6);
  gl.uniform1f(gl.getUniformLocation(shaderProgram, 'uTrans'), 0.6);
  setMatrixUniforms();
  gl.drawElements(gl.TRIANGLES, 36, gl.UNSIGNED_SHORT, 0);

  // mvPopMatrix();
}

function loadIdentity() {
  mvMatrix = Matrix.I(4);
  // единичная матрица
}

function multMatrix(m) {
  mvMatrix = mvMatrix.x(m);
}

function mvTranslate(v) {
  multMatrix(Matrix.Translation($V([v[0], v[1], v[2]])).ensure4x4());
}

function setMatrixUniforms() {
  var pUniform = gl.getUniformLocation(shaderProgram, "uPMatrix");
  gl.uniformMatrix4fv(pUniform, false, new Float32Array(perspectiveMatrix.flatten()));
  // create perspective matrix and save it into GL context
  // think of it as a global

  var mvUniform = gl.getUniformLocation(shaderProgram, "uMVMatrix");
  gl.uniformMatrix4fv(mvUniform, false, new Float32Array(mvMatrix.flatten()));
  // create position matrix and save it into GL context
  // global
}

var mvMatrixStack = [];

function mvPushMatrix(m) {
  if (m) {
    mvMatrixStack.push(m.dup());
    mvMatrix = m.dup();
  } else {
    mvMatrixStack.push(mvMatrix.dup());
  }
}

function mvPopMatrix() {
  if (!mvMatrixStack.length) {
    throw("Can't pop from an empty matrix stack.");
  }
  
  mvMatrix = mvMatrixStack.pop();
  return mvMatrix;
}

function mvRotate(angle, v) {
  var inRadians = angle * Math.PI / 180.0;
  
  var m = Matrix.Rotation(inRadians, $V([v[0], v[1], v[2]])).ensure4x4();
  multMatrix(m);
}