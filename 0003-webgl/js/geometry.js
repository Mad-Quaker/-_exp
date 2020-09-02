function Geometry (faces) {
  this.faces = faces || [];
}

Geometry.parseOBJ = (source) => {
  const POSITION = /^v\s+([\d\.\+\-eE]+)\s+([\d\.\+\-eE]+)\s+([\d\.\+\-eE]+)/
  const NORMAL = /^vn\s+([\d\.\+\-eE]+)\s+([\d\.\+\-eE]+)\s+([\d\.\+\-eE]+)/
  const UV = /^vt\s+([\d\.\+\-eE]+)\s+([\d\.\+\-eE]+)/
  const FACE = /^f\s+(-?\d+)\/(-?\d+)\/(-?\d+)\s+(-?\d+)\/(-?\d+)\/(-?\d+)\s+(-?\d+)\/(-?\d+)\/(-?\d+)(?:\s+(-?\d+)\/(-?\d+)\/(-?\d+))?/ 

  const lines = source.split('\n');
  let positions = [], uvs = [], normals = [], faces = [];
  lines.forEach(line => {
    let result;
    if ((result = POSITION.exec(line)) !== null) {
      positions.push(new Vector3(parseFloat(result[1]), parseFloat(result[2]), parseFloat(result[3])));
    } else if ((result = NORMAL.exec(line)) !== null) {
      normals.push(new Vector3(parseFloat(result[1]), parseFloat(result[2]), parseFloat(result[3])));
    } else if ((result = UV.exec(line)) !== null) {
      uvs.push(new Vector2(parseFloat(result[1]), 1 - parseFloat(result[2])));
    } else if ((result = FACE.exec(line)) !== null) {
      let vertices = [];
      for (let i = 1; i < 10; i += 3) {
        let part = result.slice(i,i+3);
        let position = positions[parseInt(part[0]) - 1];
        let uv = uvs[parseInt(part[1]) - 1];
        let normal = normals[parseInt(part[2]) - 1];
        vertices.push(new Vertex(position, normal, uv));
      }
      faces.push(new Face(vertices));
    }
  });

  return new Geometry(faces);
}

Geometry.loadOBJ = function (url) {
  return new Promise( resolve => {
    let xhr = new XMLHttpRequest();
    xhr.onreadystatechange = () => {
      if (xhr.readyState == XMLHttpRequest.DONE) {
        resolve(Geometry.parseOBJ(xhr.responseText));
      }
    }
    xhr.open('GET', url, true);
    xhr.send(null);
  });
}

Geometry.prototype.vertexCount = function () {
  return this.faces.length * 3;
}

Geometry.prototype.positions = function () { 
  let answer = [];
  this.faces.forEach(face => {
    face.vertices.forEach( vertex => {
      answer.push(vertex.position.x, vertex.position.y, vertex.position.z);
    })
  })
  return answer;
}
Geometry.prototype.normals = function () { 
  let answer = [];
  this.faces.forEach(face => {
    face.vertices.forEach( vertex => {
      answer.push(vertex.normal.x, vertex.normal.y, vertex.normal.z);
    })
  })
  return answer;
}
Geometry.prototype.uvs = function () { 
  let answer = [];
  this.faces.forEach(face => {
    face.vertices.forEach( vertex => {
      answer.push(vertex.uv.x, vertex.uv.y);
    })
  })
  return answer;
}

function Face (vertices) {
  this.vertices = vertices || [];
}
function Vertex (position, normal, uv) {
  this.position = position || new Vector3();
  this.normal = normal || new Vector3();
  this.uv = uv || new Vector2();
}
function Vector3 (x,y,z) {
  this.x = x || 0;
  this.y = y || 0;
  this.z = z || 0;
}
function Vector2 (x,y) {
  this.x = x || 0;
  this.y = y || 0;
}