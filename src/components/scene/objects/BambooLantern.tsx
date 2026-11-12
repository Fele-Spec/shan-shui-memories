import { useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { visualState } from '../../../lib/visualState'

export function BambooLantern() {
  const light = useRef<THREE.PointLight>(null)
  const core = useRef<THREE.MeshStandardMaterial>(null)

  useFrame((state) => {
    const flicker = 0.82 + Math.sin(state.clock.elapsedTime * 2.1) * 0.05 + Math.sin(state.clock.elapsedTime * 5.7) * 0.03
    if (light.current) light.current.intensity = (0.9 + visualState.sunset * 0.5) * flicker
    if (core.current) core.current.emissiveIntensity = (1.6 + visualState.sunset * 1.2) * flicker
  })

  return (
    <group position={[0, 0.03, 0]}>
      {/* rock outcrop anchoring the lantern to the ridge */}
      <mesh position={[0.15, -2.1, 0.35]} scale={[1.5, 3.0, 1.1]} castShadow receiveShadow>
        <dodecahedronGeometry args={[1, 0]} />
        <meshStandardMaterial color="#444a3f" roughness={1} flatShading />
      </mesh>
      {/* stepping stones */}
      {[
        [0.9, 0.12, 0.5, 0.34],
        [1.55, 0.1, 0.05, 0.28],
        [-0.9, 0.1, 0.42, 0.24],
      ].map(([x, y, z, r], i) => (
        <mesh key={i} position={[x, y, z]} scale={[1.2, 0.28, 0.9]} receiveShadow>
          <cylinderGeometry args={[r, r * 1.08, 0.18, 9]} />
          <meshStandardMaterial color="#666455" roughness={0.98} flatShading />
        </mesh>
      ))}

      {/* lantern base */}
      <mesh position={[0, 0.16, 0]} scale={[0.72, 0.3, 0.72]} castShadow receiveShadow>
        <cylinderGeometry args={[1, 1.08, 0.5, 8]} />
        <meshStandardMaterial color="#716d5c" roughness={0.96} />
      </mesh>
      <mesh position={[0, 0.52, 0]} castShadow>
        <cylinderGeometry args={[0.22, 0.28, 0.58, 8]} />
        <meshStandardMaterial color="#7d7865" roughness={0.95} />
      </mesh>
      <mesh position={[0, 0.82, 0]} castShadow>
        <cylinderGeometry args={[0.46, 0.32, 0.14, 8]} />
        <meshStandardMaterial color="#8a846f" roughness={0.94} />
      </mesh>

      {/* light chamber */}
      <group position={[0, 1.3, 0]}>
        {[-0.26, 0.26].map((x) =>
          [-0.26, 0.26].map((z) => (
            <mesh key={`${x}-${z}`} position={[x, 0, z]} castShadow>
              <boxGeometry args={[0.07, 0.78, 0.07]} />
              <meshStandardMaterial color="#6f6a59" roughness={0.95} />
            </mesh>
          ))
        )}
        <mesh position={[0, -0.45, 0]}>
          <boxGeometry args={[0.78, 0.1, 0.78]} />
          <meshStandardMaterial color="#7d7663" roughness={0.95} />
        </mesh>
        <mesh position={[0, 0, 0]}>
          <boxGeometry args={[0.48, 0.55, 0.48]} />
          <meshStandardMaterial
            ref={core}
            color="#ffdfad"
            emissive="#ffb05c"
            emissiveIntensity={1.6}
            transparent
            opacity={0.86}
            roughness={0.4}
          />
        </mesh>
        <pointLight ref={light} position={[0, 0, 0]} color="#ffb86b" intensity={0.9} distance={8} decay={2} />
      </group>

      {/* roof */}
      <mesh position={[0, 1.86, 0]} rotation={[0, Math.PI / 4, 0]} castShadow>
        <coneGeometry args={[0.7, 0.4, 4]} />
        <meshStandardMaterial color="#5d5a4d" roughness={0.95} flatShading />
      </mesh>
      <mesh position={[0, 2.1, 0]}>
        <sphereGeometry args={[0.08, 10, 8]} />
        <meshStandardMaterial color="#8b836d" roughness={0.9} />
      </mesh>

      {/* wind chime */}
      <group position={[0.38, 1.55, 0]}>
        <mesh>
          <cylinderGeometry args={[0.005, 0.005, 0.38, 4]} />
          <meshStandardMaterial color="#b7a37c" metalness={0.7} roughness={0.4} />
        </mesh>
        {[-0.06, 0.02, 0.09].map((x, i) => (
          <mesh key={i} position={[x, -0.3 - i * 0.06, 0]}>
            <cylinderGeometry args={[0.012, 0.012, 0.2 + i * 0.08, 6]} />
            <meshStandardMaterial color="#c0a979" metalness={0.75} roughness={0.35} />
          </mesh>
        ))}
      </group>

      {/* moss */}
      <mesh position={[0.2, 0.33, 0.25]} rotation={[-Math.PI / 2, 0, 0]} scale={[0.6, 0.4, 1]}>
        <circleGeometry args={[0.4, 12]} />
        <meshStandardMaterial color="#42563a" roughness={1} />
      </mesh>
    </group>
  )
}
