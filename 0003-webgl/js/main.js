let renderer = new Renderer(document.getElementById('webgl-canvas'));
renderer.setClearColor(100,149,237);
let gl = renderer.getContext();

let objects = [];

Mesh.load(gl, './assets/sphere.obj', './assets/diffuse2.png').then(mesh => objects.push(mesh))
ShaderProgram.load(gl, './shaders/v-basic.glsl', './shaders/f-basic.glsl').then(shader=>renderer.setShader(shader))


let light = new Light();
light.addLight([0, 0, -1],[0,255,0]); // adding second blue light;
console.log(light);
let camera = new Camera();
camera.setOrtographic(16,10,10);

function loop () {
    renderer.render(camera, light, objects);
    // camera.position = camera.position.rotateY(2);
    // camera.position = camera.position.rotateZ(1);
    requestAnimationFrame(loop);
}

loop();