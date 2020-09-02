function Light () {
  this.lightDirections = [];
  this.lightColors = [];
  this.lightCount = 0;
  this.addLight([-1., -1., -1.],[230, 77, 26]); // adding default base light;
  this.addLight([1., -1., 0],[0, 30, 226]); // adding second blue light;
  this.setAmbient([25, 80, 10, 0.3]); // little swampy ambient light
}

Light.prototype.addLight = function(dir, col) {
  if (dir instanceof Array) dir = new Vector3(...dir);
  if (col instanceof Array) col = new Vector3(...col.map(v=>v/255)); // if array incoming, assume it's  RGB[255] values
  let lightDirection = dir || new Vector3( -1., -1., -1.);
  let lightColor = col || new Vector3(.9, .3, .1);
  this.lightDirections[this.lightCount] = lightDirection;
  this.lightColors[this.lightCount] = lightColor;
  this.lightCount++;
  if (this.lightCount > 3) {
    this.removeLight(); // remove oldest light (FIFO);
  }
}

Light.prototype.removeLight = function () {
  if (this.lightCount == 0) {
    return;
  }
  this.lightDirections.shift();
  this.lightColors.shift();
  this.lightCount--;
} 

Light.prototype.setAmbient = function(rgba) {
  if (rgba instanceof Array) {
    rgba = rgba.map((x,i)=>i<3?x/255:x); // rgba(255,127,127,0.3) >> [1.0, 0.5, 0.5, 0.3]
    rgba = new Float32Array(rgba);
  }
  this.lightAmbient = rgba || new Float32Array([1,1,1,0.3])
}

Light.prototype.use = function (shaderProgram) {
  let dirs = [];
  this.lightDirections.forEach(dir=>{dirs.push(dir.x, dir.y, dir.z)}); // push all directions in flat array
  let cols = [];
  this.lightColors.forEach(col=>{cols.push(col.x, col.y, col.z)}); // push all colors in flat array
  let gl = shaderProgram.gl;
  // uniform3f -- just send 3 (three) floats
  // uniform3fv -- send variable amount of 3 floats
  // gl.uniform3f(shaderProgram.lightDirections, dir.x, dir.y, dir.z);
  gl.uniform3fv(shaderProgram.lightDirections, new Float32Array(dirs));
  gl.uniform3fv(shaderProgram.lightColors, new Float32Array(cols));
  gl.uniform1i(shaderProgram.lightCount, this.lightCount);
  gl.uniform4f(shaderProgram.lightAmbient, ...this.lightAmbient); // ...like this?
}