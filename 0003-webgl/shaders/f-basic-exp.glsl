#ifdef GL_ES
precision highp float;
#endif

varying vec3 vNormal;
varying vec2 vUv;

void main() {
  // vec2 clampedUv = clamp(vUv, 0., 1.);
  // vec3 brown = vec3(.54, .27, .07);
  vec3 white = vec3(.8, .8, .8);
  vec3 red = vec3(.9, .3, .1);
  vec3 blue = vec3(.1, .3, .9);
  vec3 sunlightDirection = vec3(-1., -1., -1.);
  vec3 backlightDirection = vec3(1., .5, 0.);
  float lightness1 = -clamp(dot(normalize(vNormal), normalize(sunlightDirection)), -1., 0.);
  float lightness2 = -clamp(dot(normalize(vNormal), normalize(backlightDirection)), -1., 0.);
  float ambientLight = 0.3;
  // gl_FragColor = vec4(white * (lightness1 + lightness2), 1.);
  gl_FragColor = vec4(white * (ambientLight + red * lightness1 + blue * lightness2), 1.);
}