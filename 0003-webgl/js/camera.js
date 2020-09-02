function Camera () {
  this.position = new Transformation();
  this.projection = new Transformation();
}

Camera.prototype.setOrtographic = function (width, height, depth) {
  this.projection = new Transformation();
  this.projection.matrix[0]  =  2/width;
  this.projection.matrix[5]  =  2/height;
  this.projection.matrix[10] = -2/depth;
}

Camera.prototype.setPerspective = function (vFov, aRatio, near, far) {
  let height_d2n = Math.tan(vFov * Math.PI / 360);
  let width_d2n = aRatio * height_d2n;
  this.projection = new Transformation();
  this.projection.matrix[0]  = 1 / height_d2n;
  this.projection.matrix[5]  = 1 / width_d2n;
  this.projection.matrix[10] = (far + near) / (near - far);
  this.projection.matrix[11] = 2 * far * near / (near - far);
  this.projection.matrix[14] = -1;
  this.projection.matrix[15] = 0;
}

Camera.prototype.getInversePosition = function () {
  let orig = this.position.matrix;
  let dest = new Transformation();
  let x = orig[3];
  let y = orig[7];
  let z = orig[11];
  for (let j = 0; j < 3; ++j) {
    for (let i = 0; i < 3; ++i) {
      dest.matrix[i + j * 4] = orig[i * 4 + j];
    }
  }
  return dest.translate( -x, -y, -z);
}

Camera.prototype.use = function (shaderProgram) {
  this.projection.sendToGPU(shaderProgram.gl, shaderProgram.projection);
  this.getInversePosition().sendToGPU(shaderProgram.gl, shaderProgram.view);
}