export const ridgeVertex = /* glsl */ `
  varying vec2 vUv;
  void main() {
    vUv = uv;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`

export const ridgeFragment = /* glsl */ `
  precision highp float;
  varying vec2 vUv;
  uniform vec3 uDeep;
  uniform vec3 uMist;
  uniform vec3 uSunColor;
  uniform vec3 uSunDir;
  uniform float uSeed;
  uniform float uScale;
  uniform float uSunset;
  uniform float uOpacity;
  uniform float uRidgeBase;
  uniform float uRidgeAmp;

  float hash(vec2 p) {
    return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453);
  }
  float noise(vec2 p) {
    vec2 i = floor(p);
    vec2 f = fract(p);
    f = f * f * (3.0 - 2.0 * f);
    float a = hash(i);
    float b = hash(i + vec2(1.0, 0.0));
    float c = hash(i + vec2(0.0, 1.0));
    float d = hash(i + vec2(1.0, 1.0));
    return mix(mix(a, b, f.x), mix(c, d, f.x), f.y);
  }
  float fbm(vec2 p) {
    float v = 0.0;
    float a = 0.5;
    for (int i = 0; i < 5; i++) {
      v += a * noise(p);
      p = p * 2.02 + vec2(7.1, -3.4);
      a *= 0.52;
    }
    return v;
  }

  void main() {
    float x = vUv.x;
    float broad = fbm(vec2(x * uScale + uSeed, uSeed * 0.7));
    float detail = fbm(vec2(x * uScale * 3.2 - uSeed, uSeed + 12.0));
    float ridge = uRidgeBase + uRidgeAmp * broad + 0.09 * detail;

    float a = 1.0 - smoothstep(ridge - 0.0025, ridge + 0.006, vUv.y);
    a *= smoothstep(0.0, 0.08, x) * smoothstep(1.0, 0.92, x);
    if (a < 0.012) discard;

    float below = smoothstep(ridge, -0.05, vUv.y);
    // Dark peak line, dissolving downward into valley mist.
    vec3 col = mix(uDeep, uMist, smoothstep(0.0, 0.62, below));
    col = mix(col, uMist, smoothstep(0.72, 1.0, below) * 0.72);

    // warm rim where the dying sun grazes the ridge
    float rim = exp(-abs(vUv.y - ridge) * 34.0);
    float facing = pow(max(0.0, 1.0 - abs(x - 0.58)), 2.0);
    col += uSunColor * rim * facing * uSunset * 0.3;

    // aerial perspective: farther layers are lighter and softer
    col = mix(col, uMist, 0.08 + 0.08 * (1.0 - uSunset));

    gl_FragColor = vec4(col, a * uOpacity);
  }
`
