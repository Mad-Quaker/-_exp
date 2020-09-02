function Transformation () {
  this.matrix = [
    1, 0, 0, 0,
    0, 1, 0, 0,
    0, 0, 1, 0,
    0, 0, 0, 1,
  ];
}

// something wrong here...
// Transformation.prototype.mult = function (trans) {
//   let output = new Transformation();
//   for (let col = 0; col < 4; ++col) {
//     for (let row = 0; row < 4; ++row) {
//       let sum = 0;
//       for (let offset = 0; offset < 4; ++offset) {
//         sum += this.matrix[col * 4 + offset] * trans.matrix[offset * 4 + row];
//       }
//       output.matrix[row * 4 + col] = sum;
//     }
//   }
//   return output;
// }

// original
Transformation.prototype.mult = function (t) {
  var output = new Transformation()
  for (var row = 0; row < 4; ++row) {
    for (var col = 0; col < 4; ++col) {
      var sum = 0
      for (var k = 0; k < 4; ++k) {
        sum += this.matrix[k * 4 + row] * t.matrix[col * 4 + k]
      }
      output.matrix[col * 4 + row] = sum
    }
  }
  return output
} 

Transformation.prototype.translate = function (x, y, z) {
  let mx = new Transformation();
  mx.matrix[3]  = Number(x) || 0;
  mx.matrix[7]  = Number(y) || 0;
  mx.matrix[11] = Number(z) || 0;
  return this.mult(mx);
}

Transformation.prototype.scale = function (x, y, z) {
  let mx = new Transformation();
  mx.matrix[0]  = Number(x) || 0;
  mx.matrix[5]  = Number(y) || 0;
  mx.matrix[10] = Number(z) || 0;
  return this.mult(mx);
}

Transformation.prototype.rotateX = function (angle) {
  angle = Number(angle) || 0;
  // let cos = Math.cos(angle);
  // let sin = Math.sin(angle);
  let [cos,sin] = angle2d(angle);
  let mx = new Transformation();
  mx.matrix[5]  =  cos;
  mx.matrix[10] =  cos;
  mx.matrix[6]  = -sin;
  mx.matrix[9]  =  sin;
  return this.mult(mx);
}

Transformation.prototype.rotateY = function (angle) {
  angle = Number(angle) || 0;
  // let cos = Math.cos(angle);
  // let sin = Math.sin(angle);
  let [cos,sin] = angle2d(angle);
  let mx = new Transformation();
  mx.matrix[0]  =  cos;
  mx.matrix[10] =  cos;
  mx.matrix[8]  = -sin;
  mx.matrix[2]  =  sin;
  return this.mult(mx);
}

Transformation.prototype.rotateZ = function (angle) {
  angle = Number(angle) || 0;
  // let cos = Math.cos(angle);
  // let sin = Math.sin(angle);
  let [cos,sin] = angle2d(angle);
  let mx = new Transformation();
  mx.matrix[0] =  cos;
  mx.matrix[5] =  cos;
  mx.matrix[1] = -sin;
  mx.matrix[4] =  sin;
  return this.mult(mx);
}

Transformation.prototype.sendToGPU = function(gl, uniform, transpose) {
  gl.uniformMatrix4fv(uniform, transpose || false, new Float32Array(this.matrix));
}

// for example `new Vector2(...angle2d(180))`
function angle2d(degree) {
  if (!degree) return [1,0];
  return [Math.cos(degree * Math.PI / 360 ), Math.sin(degree * Math.PI / 360)];
}

