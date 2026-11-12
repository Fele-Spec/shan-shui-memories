export const waterFlowVertex = /* glsl */ `
  varying vec2 vUv;
  varying vec3 vWorld;
  void main() {
    vUv = uv;
    vec4 world = modelMatrix * vec4(position, 1.0);
    vWorld = world.xyz;
    gl_Position = projectionMatrix * viewMatrix * world;
  }
`

export const waterFlowFragment = /* glsl */ `
  precision highp float;
  varying vec2 vUv;
  varying vec3 vWorld;
  uniform float uTime;
  uniform float uSunset;
  uniform vec3 uWarm;
  uniform vec3 uCool;
  uniform vec3 uSunDir;

  float hash(vec2 p) {
    return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453);
  }
  float noise(vec2 p) {
    vec2 i = floor(p), f = fract(p);
    f = f * f * (3.0 - 2.0 * f);
    return mix(mix(hash(i), hash(i + vec2(1, 0)), f.x),
               mix(hash(i + vec2(0, 1)), hash(i + vec2(1, 1)), f.x), f.y);
  }
  float fbm(vec2 p) {
    float v = 0.0, a = 0.5;
    for (int i = 0; i < 4; i++) {
      v += a * noise(p); p = p * 2.03 + 11.3; a *= 0.5;
    }
    return v;
  }

  void main() {
    // Long, narrow streaks travelling with the current.
    float longNoise = fbm(vec2(vUv.x * 4.0 + 2.0, vUv.y * 38.0 - uTime * 0.24));
    float glint = smoothstep(0.60, 0.80, longNoise);
    glint *= 0.20 + 0.35 * smoothstep(0.35, 0.9, fbm(vec2(vUv.x * 11.0, vUv.y * 90.0 - uTime * 0.55)));

    // Bank-edge foam breathes in and out.
    float edge = smoothstep(0.72, 0.98, abs(vUv.x * 2.0 - 1.0));
    float foamNoise = fbm(vec2(vUv.x * 9.0, vUv.y * 26.0 - uTime * 0.30));
    float foam = edge * smoothstep(0.45, 0.80, foamNoise) * 0.55;

    float alpha = glint * 0.24 + foam * 0.32;
    vec3 tint = mix(uCool, uWarm, uSunset * 0.9);
    vec3 sun = normalize(uSunDir);
    tint += vec3(0.16, 0.12, 0.08) * pow(max(dot(vec3(0.0, 1.0, 0.0), sun), 0.0), 2.0);
    gl_FragColor = vec4(tint, alpha);
  }
`
