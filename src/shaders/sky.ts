export const skyVertex = /* glsl */ `
  varying vec3 vDirection;
  void main() {
    vec4 world = modelMatrix * vec4(position, 1.0);
    vDirection = normalize(world.xyz - cameraPosition);
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`

export const skyFragment = /* glsl */ `
  precision highp float;
  uniform vec3 uZenith;
  uniform vec3 uHorizon;
  uniform vec3 uHaze;
  uniform vec3 uSunColor;
  uniform vec3 uSunDir;
  uniform vec3 uCloudColor;
  uniform float uSunset;
  uniform float uTime;
  varying vec3 vDirection;

  float hash(vec2 p) {
    p = fract(p * vec2(123.34, 456.21));
    p += dot(p, p + 45.32);
    return fract(p.x * p.y);
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
      p = p * 2.03 + vec2(7.3, 2.1);
      a *= 0.5;
    }
    return v;
  }

  void main() {
    vec3 dir = normalize(vDirection);
    float h = clamp(dir.y, -1.0, 1.0);
    float up = clamp(h, 0.0, 1.0);

    vec3 col = mix(uHorizon, uZenith, pow(up, 0.3));
    float low = exp(-max(h, 0.0) * 12.0);
    col = mix(col, uHaze, low * (0.34 + 0.18 * uSunset));

    // Broad atmospheric glow around the sun.
    float cosA = max(dot(dir, normalize(uSunDir)), 0.0);
    float glow = pow(cosA, 7.0) * 0.18 + pow(cosA, 42.0) * 0.32;
    col += uSunColor * glow * (0.55 + 0.6 * uSunset);

    // Sun disk, partially softened by the horizon.
    float disk = smoothstep(0.99972, 0.99993, cosA);
    float horizonFade = smoothstep(-0.005, 0.035, h);
    col += uSunColor * disk * (1.35 + 0.9 * uSunset) * horizonFade;

    // Wispy high cloud sheets projected on the dome. Kept subtle so the
    // three-dimensional cloud sprites still read as the foreground layer.
    vec2 cuv = dir.xz / (max(dir.y, 0.02) + 0.38);
    float cloudA = fbm(cuv * 1.65 + vec2(uTime * 0.0025, 0.0));
    float cloudB = fbm(cuv * 3.4 - vec2(uTime * 0.004, 1.7));
    float cloud = smoothstep(0.5, 0.78, cloudA * 0.72 + cloudB * 0.28);
    float band = smoothstep(0.035, 0.14, dir.y) * (1.0 - smoothstep(0.62, 0.95, dir.y));
    cloud *= band * (0.24 + uSunset * 0.22);
    col = mix(col, uCloudColor, cloud);

    // A warm band hugging the western horizon.
    vec3 flatDir = normalize(vec3(dir.x, 0.0, dir.z));
    vec3 flatSun = normalize(vec3(uSunDir.x, 0.0, uSunDir.z));
    float side = pow(max(dot(flatDir, flatSun), 0.0), 3.0);
    col += uSunColor * side * low * (0.10 + 0.32 * uSunset);

    // Subtle high haze so the gradient never bands.
    float n = hash(gl_FragCoord.xy * 0.5) - 0.5;
    col += n * 0.006;
    col *= 1.42;
    gl_FragColor = vec4(col, 1.0);
  }
`
