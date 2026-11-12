import { useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import { useTexture } from '@react-three/drei'
import * as THREE from 'three'
import { WORLD, groundAt } from '../../lib/terrain'

const vertex = /* glsl */ `
  varying vec2 vUv;
  void main() {
    vUv = uv;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`

const fragment = /* glsl */ `
  precision highp float;
  varying vec2 vUv;
  uniform float uTime;
  uniform vec3 uTint;

  float hash(vec2 p) { return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
  float noise(vec2 p) {
    vec2 i = floor(p), f = fract(p);
    f = f * f * (3.0 - 2.0 * f);
    return mix(mix(hash(i), hash(i + vec2(1, 0)), f.x), mix(hash(i + vec2(0, 1)), hash(i + vec2(1, 1)), f.x), f.y);
  }
  float fbm(vec2 p) {
    float v = 0.0, a = 0.55;
    for (int i = 0; i < 4; i++) { v += a * noise(p); p = p * 2.05 + 3.7; a *= 0.5; }
    return v;
  }

  void main() {
    vec2 uv = vUv;
    float n = fbm(vec2(uv.x * 15.0 + uTime * 0.35, uv.y * 4.0 - uTime * 1.35));
    float n2 = fbm(vec2(uv.x * 8.0 - uTime * 0.28, uv.y * 9.0 - uTime * 1.9));
    float streak = smoothstep(0.48, 0.77, n * 0.7 + n2 * 0.3);
    float edge = smoothstep(0.0, 0.16, uv.x) * smoothstep(0.0, 0.16, 1.0 - uv.x);
    float top = smoothstep(0.0, 0.06, uv.y) * (1.0 - smoothstep(0.9, 1.0, uv.y));
    vec3 water = mix(vec3(0.23, 0.42, 0.39), vec3(0.84, 0.93, 0.86), streak);
    water = mix(water, uTint, 0.12);
    float alpha = edge * top * (0.18 + streak * 0.58);
    gl_FragColor = vec4(water, alpha);
  }
`

function Cascade({ x, z, width, rotation, topY }: { x: number; z: number; width: number; rotation: number; topY?: number }) {
  const uniforms = useMemo(
    () => ({
      uTime: { value: 0 },
      uTint: { value: new THREE.Color('#9dcfc0') },
    }),
    []
  )
  const mat = useRef<THREE.ShaderMaterial>(null)
  const top = Math.max(WORLD.waterY + 4.5, topY ?? groundAt(x, z) + 0.35)
  const height = Math.max(3.8, top - WORLD.waterY)

  useFrame((_, dt) => {
    if (mat.current) mat.current.uniforms.uTime.value += dt
  })

  return (
    <group position={[x, 0, z]} rotation={[0, rotation, 0]}>
      {/* the sheet emerges from the actual hillside; no floating cap */}
      <mesh position={[0, (top + WORLD.waterY) / 2, 0.06]}>
        <planeGeometry args={[width, height, 1, 8]} />
        <shaderMaterial
          ref={mat}
          uniforms={uniforms}
          vertexShader={vertex}
          fragmentShader={fragment}
          transparent
          depthWrite={false}
          side={THREE.DoubleSide}
          blending={THREE.NormalBlending}
        />
      </mesh>
      {/* splash shelf, kept at the water surface */}
      <mesh position={[0, WORLD.waterY + 0.04, 0.5]} rotation={[-Math.PI / 2, 0, 0]} scale={[width * 2.4, width * 1.4, 1]}>
        <ringGeometry args={[0.25, 1, 24]} />
        <meshBasicMaterial color="#d4e5da" transparent opacity={0.12} depthWrite={false} side={THREE.DoubleSide} />
      </mesh>
    </group>
  )
}

export function Waterfalls() {
  const tex = useTexture(`${import.meta.env.BASE_URL}assets/textures/cloud_a.png`)
  return (
    <group>
      <Cascade x={-16} z={46} width={0.8} rotation={0.2} topY={4.2} />
      <Cascade x={40} z={-28} width={0.95} rotation={-0.5} />
      {/* small foreground cascade: a rock ledge in the river */}
      <group position={[-16, 0, 45.35]}>
        <mesh position={[0, 1.2, 0]} scale={[1.35, 1.35, 0.85]} castShadow receiveShadow>
          <dodecahedronGeometry args={[1, 0]} />
          <meshStandardMaterial color="#62675a" roughness={1} flatShading />
        </mesh>
        <mesh position={[-0.9, 0.6, 0.15]} scale={[0.65, 0.8, 0.6]} castShadow>
          <dodecahedronGeometry args={[1, 0]} />
          <meshStandardMaterial color="#565c50" roughness={1} flatShading />
        </mesh>
        <mesh position={[0.95, 0.55, -0.08]} scale={[0.6, 0.7, 0.55]} castShadow>
          <dodecahedronGeometry args={[1, 0]} />
          <meshStandardMaterial color="#6a6e5f" roughness={1} flatShading />
        </mesh>
      </group>
      {/* soft spray at the bases */}
      {[
        [-16, 46.8, 3.2],
        [40, -27.2, 5.0],
      ].map(([x, z, s], i) => (
        <sprite key={i} position={[x, WORLD.waterY + 1.5, z]} scale={[s, s * 0.55, 1]}>
          <spriteMaterial map={tex} color="#dcebe2" transparent opacity={0.16} depthWrite={false} />
        </sprite>
      ))}
    </group>
  )
}








