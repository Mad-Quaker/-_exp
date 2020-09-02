function Mesh (gl, geometry, texture) {
  let vxCount = geometry.vertexCount();
  this.positions = new VBO(gl, geometry.positions(), vxCount);
  this.normals = new VBO(gl, geometry.normals(), vxCount);
  this.uvs = new VBO(gl, geometry.uvs(), vxCount);
  this.vertexCount = vxCount;
  this.position = new Transformation();
  this.texture = texture;
  this.gl = gl;
}

Mesh.prototype.destroy = function () {
  this.positions.destroy();
  this.normals.destroy();
  this.uvs.destroy();
  this.texture.destroy();
}

Mesh.prototype.draw = function (shaderProgram) {
  this.positions.bindToAtt(shaderProgram.position);
  this.normals.bindToAtt(shaderProgram.normal);
  this.uvs.bindToAtt(shaderProgram.uv);
  this.position.sendToGPU(this.gl, shaderProgram.model);
  this.texture.use(shaderProgram.diffuse, 0);
  this.gl.drawArrays(this.gl.TRIANGLES, 0, this.vertexCount);
}

Mesh.load = function (gl, modelUrl, textureUrl) {
  let geometry = Geometry.loadOBJ(modelUrl);
  let texture = Texture.load(gl, textureUrl);
  return Promise.all([geometry,texture]).then(data => {
    return new Mesh(gl, ...data);
  })
}