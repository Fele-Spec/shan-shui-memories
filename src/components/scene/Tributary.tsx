import { useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { WORLD, groundAt, terrainHeight } from '../../lib/terrain'

const PATH: Array<[number, number]> = [
  [-24, 10],
  [-21, 14],
  [-18, 19],
  [-14, 24],
  [-10, 29],
  [-6, 33],
  [-4, 37],
]

const vertex = /* glsl */ `
  varying vec2 vUv;
  varying vec3 vWorld;
  void main() {
    vUv = uv;
    vec4 world = modelMatrix * vec4(position, 1.0);
    vWorld = world.xyz;
    gl_Position = projectionMatrix * viewMatrix * world;
  }
`

const fragment = /* glsl */ `
  precision highp float;
  varying vec2 vUv;
  varying vec3 vWorld;
  uniform float uTime;
  uniform vec3 uSun;

  float hash(vec2 p) { return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
  float noise(vec2 p) {
    vec2 i = floor(p), f = fract(p);
    f = f * f * (3.0 - 2.0 * f);
    return mix(mix(hash(i), hash(i + vec2(1, 0)), f.x), mix(hash(i + vec2(0, 1)), hash(i + vec2(1, 1)), f.x), f.y);
  }
  float fbm(vec2 p) {
    float v = 0.0, a = 0.5;
    for (int i = 0; i < 3; i++) { v += a * noise(p); p = p * 2.1 + 1.7; a *= 0.5; }
    return v;
  }

  void main() {
    float edge = smoothstep(0.0, 0.22, vUv.x) * smoothstep(0.0, 0.22, 1.0 - vUv.x);
    float n = fbm(vec2(vUv.x * 5.0, vUv.y * 9.0 - uTime * 0.9));
    float streak = smoothstep(0.48, 0.75, n);
    vec3 water = mix(vec3(0.08, 0.24, 0.23), vec3(0.43, 0.66, 0.57), streak);
    water += uSun * streak * 0.08;
    float foam = smoothstep(0.62, 0.82, n) * smoothstep(0.42, 0.68, vUv.y);
    water = mix(water, vec3(0.82, 0.9, 0.82), foam * 0.45);
    gl_FragColor = vec4(water, edge * (0.55 + streak * 0.2));
  }
`

export function Tributary() {
  const mat = useRef<THREE.ShaderMaterial>(null)
  const uniforms = useMemo(
    () => ({ uTime: { value: 0 }, uSun: { value: new THREE.Color('#e8c58f') } }),
    []
  )

  const geometry = useMemo(() => {
    const curve = new THREE.CatmullRomCurve3(
      PATH.map(([x, z]) => new THREE.Vector3(x, Math.max(WORLD.waterY + 0.05, terrainHeight(x, z) + 0.08), z))
    )
    const segments = 80
    const positions: number[] = []
    const uvs: number[] = []
    const indices: number[] = []
    const up = new THREE.Vector3(0, 1, 0)
    const tangent = new THREE.Vector3()
    const side = new THREE.Vector3()
    for (let i = 0; i <= segments; i++) {
      const t = i / segments
      const p = curve.getPoint(t)
      curve.getTangent(t, tangent)
      side.crossVectors(tangent, up).normalize()
      const width = THREE.MathUtils.lerp(0.45, 1.25, t) * 0.5
      positions.push(p.x - side.x * width, p.y, p.z - side.z * width)
      positions.push(p.x + side.x * width, p.y, p.z + side.z * width)
      uvs.push(0, t, 1, t)
      if (i < segments) {
        const a = i * 2
        indices.push(a, a + 1, a + 2, a + 1, a + 3, a + 2)
      }
    }
    const g = new THREE.BufferGeometry()
    g.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3))
    g.setAttribute('uv', new THREE.Float32BufferAttribute(uvs, 2))
    g.setIndex(indices)
    g.computeVertexNormals()
    return g
  }, [])

  const rocks = useMemo(() => {
    const curve = new THREE.CatmullRomCurve3(
      PATH.map(([x, z]) => new THREE.Vector3(x, Math.max(WORLD.waterY, terrainHeight(x, z)), z))
    )
    return Array.from({ length: 9 }, (_, i) => {
      const t = 0.1 + (i / 8) * 0.82
      const p = curve.getPoint(t)
      const side = i % 2 ? 1 : -1
      return {
        p: [p.x + side * 0.9, Math.max(groundAt(p.x, p.z), WORLD.waterY + 0.12) + 0.15, p.z] as [number, number, number],
        s: 0.22 + (i % 3) * 0.1,
      }
    })
  }, [])

  useFrame((_, dt) => {
    if (mat.current) mat.current.uniforms.uTime.value += dt
  })

  return (
    <group>
      <mesh geometry={geometry} renderOrder={11}>
        <shaderMaterial
          ref={mat}
          uniforms={uniforms}
          vertexShader={vertex}
          fragmentShader={fragment}
          transparent
          depthWrite={false}
          side={THREE.DoubleSide}
        />
      </mesh>
      {rocks.map((r, i) => (
        <mesh key={i} position={r.p} scale={[r.s, r.s * 0.65, r.s * 1.25]} castShadow receiveShadow>
          <dodecahedronGeometry args={[1, 0]} />
          <meshStandardMaterial color="#545b4e" roughness={1} flatShading />
        </mesh>
      ))}
    </group>
  )
}
