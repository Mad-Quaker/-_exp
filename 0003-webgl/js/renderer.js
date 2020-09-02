function Renderer (canvas) {
  let gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');
  gl.enable(gl.DEPTH_TEST);
  this.gl = gl;
}

Renderer.prototype.setClearColor = function (red, green, blue) {
  this.gl.clearColor(red/255, green/255, blue/255, 1);
}
Renderer.prototype.getContext = function () {
  return this.gl;
}
Renderer.prototype.render = function (camera, light, objects) {
  this.gl.clear(this.gl.COLOR_BUFFER_BIT | this.gl.DEPTH_BUFFER_BIT)
  let shader = this.shader;
  if (!shader) {
    return;
  }
  shader.use();
  light.use(shader);
  camera.use(shader);
  objects.forEach(mesh => {
    mesh.draw(shader);
  });
}
Renderer.prototype.setShader = function (shader) {
  this.shader = shader;
}


