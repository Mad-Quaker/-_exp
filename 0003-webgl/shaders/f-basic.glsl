#ifdef GL_ES
precision highp float;
#endif

uniform vec3 lightDirections[3];
uniform vec3 lightColors[3];
uniform int lightCount;
uniform vec4 lightAmbient;
uniform sampler2D diffuse;
varying vec3 vNormal;
varying vec2 vUv;

void main() {
  // vec3 white = vec3(.8, .8, .8);
  vec3 resultLight = vec3(lightAmbient.xyz * lightAmbient.w);
  for (int i = 0; i < 3; i++) {
    resultLight += lightColors[i] * -clamp(dot(normalize(vNormal), normalize(lightDirections[i])), -1., 0.);
  }
  gl_FragColor = vec4(texture2D(diffuse, vUv).rgb * resultLight, 1.);
}