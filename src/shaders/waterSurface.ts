export const waterDetailVertex = /* glsl */ `
  varying vec3 vWorld;
  void main() {
    vec4 world = modelMatrix * vec4(position, 1.0);
    vWorld = world.xyz;
    gl_Position = projectionMatrix * viewMatrix * world;
  }
`

export const waterDetailFragment = /* glsl */ `
  precision highp float;
  varying vec3 vWorld;
  uniform sampler2D uMask;
  uniform sampler2D uFoam;
  uniform sampler2D uHeight;
  uniform sampler2D uFlow;
  uniform vec3 uWorldMin;
  uniform vec2 uWorldSize;
  uniform float uWaterElev;
  uniform float uTime;
  uniform float uSunset;

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
      v += a * noise(p); p = p * 2.03 + 7.3; a *= 0.5;
    }
    return v;
  }

  void main() {
    vec2 uv = (vWorld.xz - uWorldMin.xz) / uWorldSize;
    float mask = texture2D(uMask, uv).r;

    float elevation = 80.0 + texture2D(uHeight, uv).r * 440.0;
    float depth = uWaterElev - elevation;
    if (depth < 0.02) discard;

    vec2 flow = texture2D(uFlow, uv).rg * 2.0 - 1.0;
    flow = normalize(flow + vec2(0.001));
    vec2 p = vWorld.xz * 0.11;

    // Two scales of advected water texture, following the DEM downhill flow.
    float n1 = fbm(p * 1.8 - flow * uTime * 0.14);
    float n2 = fbm(p * 4.6 - flow * uTime * 0.23 + 11.0);
    float glint = smoothstep(0.56, 0.78, n1 * 0.62 + n2 * 0.38);

    // Bank foam follows the blurred river mask.
    float foamField = texture2D(uFoam, uv).r;
    float edge = smoothstep(0.28, 0.62, foamField) * (1.0 - smoothstep(0.62, 0.94, mask));
    float foam = smoothstep(0.7, 0.84, n2 + edge * 0.22) * edge;

    // Depth tint: turquoise shallows, dark green-grey pools.
    vec3 shallow = vec3(0.18, 0.34, 0.29);
    vec3 deep = vec3(0.025, 0.10, 0.11);
    vec3 tint = mix(shallow, deep, smoothstep(0.2, 5.5, depth));
    tint = mix(tint, vec3(0.22, 0.16, 0.12), uSunset * 0.55);
    tint += glint * vec3(0.55, 0.66, 0.58) * (0.18 + uSunset * 0.2);
    tint += foam * vec3(0.82, 0.9, 0.82) * 0.5;

    float alpha = (0.28 + 0.18 * glint + 0.45 * foam) * smoothstep(0.02, 0.55, depth);
    alpha *= mix(0.72, 1.0, mask);
    gl_FragColor = vec4(tint, alpha);
  }
`





