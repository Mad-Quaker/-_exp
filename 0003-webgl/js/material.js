function ShaderProgram (gl, vertSrc, fragSrc) {
  let vert = gl.createShader(gl.VERTEX_SHADER);
  gl.shaderSource(vert, vertSrc);
  gl.compileShader(vert);
  if (!gl.getShaderParameter(vert, gl.COMPILE_STATUS)) {
    console.error(gl.getShaderInfoLog(vert));
    throw new Error('Failed to compile vertex shader');
  }

  let frag = gl.createShader(gl.FRAGMENT_SHADER);
  gl.shaderSource(frag, fragSrc);
  gl.compileShader(frag);
  if (!gl.getShaderParameter(frag, gl.COMPILE_STATUS)) {
    console.error(gl.getShaderInfoLog(frag));
    throw new Error('Failed to compile fragment shader');
  }
  
  let program = gl.createProgram();
  gl.attachShader(program, vert);
  gl.attachShader(program, frag);
  gl.linkProgram(program);
  if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
    console.error(gl.getProgramInfoLog(program));
    throw new Error('Failed to link program');
  }

  this.gl = gl;
  this.position = gl.getAttribLocation(program, 'position');
  this.normal = gl.getAttribLocation(program, 'normal');
  this.uv = gl.getAttribLocation(program, 'uv');
  this.model = gl.getUniformLocation(program, 'model');
  this.view = gl.getUniformLocation(program, 'view');
  this.projection = gl.getUniformLocation(program, 'projection');
  this.lightAmbient = gl.getUniformLocation(program, 'lightAmbient');
  this.lightDirections = gl.getUniformLocation(program, 'lightDirections');
  this.lightColors = gl.getUniformLocation(program, 'lightColors');
  this.lightCount = gl.getUniformLocation(program, 'lightCount');
  this.diffuse = gl.getUniformLocation(program, 'diffuse');
  this.vert = vert;
  this.frag = frag;
  this.program = program;
}

ShaderProgram.load = (gl, vertUrl, fragUrl) => {
  function loadFile(url) {
    return new Promise(resolve => {
      let xhr = new XMLHttpRequest();
      xhr.onreadystatechange = () => {
        if (xhr.readyState == XMLHttpRequest.DONE)
          resolve(xhr.responseText);
      };
      xhr.open('GET',url,true);
      xhr.send(null);
    })
  }
  
  return Promise.all([loadFile(vertUrl), loadFile(fragUrl)]).then(files => {
    return new ShaderProgram(gl, files[0], files[1]);
  })
}

ShaderProgram.prototype.use = function () {
  this.gl.useProgram(this.program);
}