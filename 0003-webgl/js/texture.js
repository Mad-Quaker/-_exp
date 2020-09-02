function Texture (gl, image) {
  let texture = gl.createTexture();
  gl.bindTexture(gl.TEXTURE_2D, texture);
  gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, image);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
  this.data = texture;
  this.gl = gl;
}

Texture.prototype.use = function (uniform, binding) {
  binding = Number(binding) || 0;
  let gl = this.gl;
  gl.activeTexture(gl['TEXTURE'+binding]);
  gl.bindTexture(gl.TEXTURE_2D, this.data);
  gl.uniform1i(uniform, binding);
}

Texture.prototype.destroy = function () {
  gl.deleteTexture(this.data);
}

Texture.load = function (gl, url) {
  return new Promise(resolve => {
    let image = new Image();
    image.onload = () => {
      resolve(new Texture(gl, image));
    }
    image.src = url;
  })
}