function VBO (gl, data, count) {
  let bufferObject = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, bufferObject);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(data), gl.STATIC_DRAW);
  this.gl = gl;
  this.size = data.length / count;
  this.count = count;
  this.data = bufferObject;
}
VBO.prototype.destroy = function () {
  this.gl.deleteBuffer(this.data);
}
VBO.prototype.bindToAtt = function (att) {
  let gl = this.gl;
  gl.bindBuffer(gl.ARRAY_BUFFER, this.data);
  gl.enableVertexAttribArray(att);
  gl.vertexAttribPointer(att, this.size, gl.FLOAT, false, 0, 0);
}