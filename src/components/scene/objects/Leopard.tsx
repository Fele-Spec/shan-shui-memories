import { useRef } from 'react'
import { Billboard, useTexture } from '@react-three/drei'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { visualState } from '../../../lib/visualState'

const asset = (p: string) => `${import.meta.env.BASE_URL}${p.replace(/^\//, '')}`

/**
 * The supplied leopard photograph is cleaned and mounted as a camera-facing
 * photographic standee over a real 3D rock shelf. At our fixed cinematic
 * camera this preserves the true anatomy and coat detail of the reference,
 * rather than approximating it with a low-fidelity procedural animal.
 */
export function LeopardModel() {
  const tex = useTexture(asset('assets/objects/leopard-cutout.png'))
  const shadowTex = useTexture(asset('assets/textures/glow.png'))
  const silhouetteShadow = useTexture(asset('assets/objects/leopard-shadow.png'))
  const mat = useRef<THREE.MeshBasicMaterial>(null)
  const shadow = useRef<THREE.Mesh>(null)
  const height = 1.18
  const width = height * (973 / 491)

  useFrame(() => {
    const t = visualState.sunset
    if (mat.current) {
      mat.current.color.setRGB(
        THREE.MathUtils.lerp(0.56, 0.9, t),
        THREE.MathUtils.lerp(0.6, 0.68, t),
        THREE.MathUtils.lerp(0.56, 0.52, t)
      )
    }
    if (shadow.current) {
      ;(shadow.current.material as THREE.MeshBasicMaterial).opacity = 0.42 + t * 0.12
    }
  })

  return (
    <group position={[0, 0.02, 0]}>
      {/* rock shelf with a real 3D silhouette and mossy top */}
      <mesh position={[0, 0.12, 0]} scale={[2.55, 0.46, 1.72]} castShadow receiveShadow>
        <dodecahedronGeometry args={[1, 1]} />
        <meshStandardMaterial color="#494b41" roughness={0.98} flatShading />
      </mesh>
      {/* outcrop column anchoring the shelf into the hillside */}
      <mesh position={[0, -1.5, -0.15]} scale={[1.9, 2.2, 1.35]} castShadow receiveShadow>
        <dodecahedronGeometry args={[1, 0]} />
        <meshStandardMaterial color="#41443b" roughness={1} flatShading />
      </mesh>
      <mesh position={[0, 0.32, 0]} scale={[2.15, 0.07, 1.55]} receiveShadow>
        <cylinderGeometry args={[1, 1.04, 0.14, 16]} />
        <meshStandardMaterial color="#5d5a49" roughness={0.96} flatShading />
      </mesh>
      <mesh position={[0.1, 0.37, 0.2]} rotation={[-Math.PI / 2, 0, 0.3]} scale={[0.85, 0.55, 1]}>
        <circleGeometry args={[0.9, 12]} />
        <meshStandardMaterial color="#46573a" roughness={1} />
      </mesh>

      {/* soft shadow under the animal */}
      <mesh ref={shadow} position={[0.1, 0.385, 0.15]} rotation={[-Math.PI / 2, 0, 0]} scale={[1.9, 0.7, 1]} renderOrder={2}>
        <planeGeometry args={[1, 1]} />
        <meshBasicMaterial map={shadowTex} color="#000000" transparent opacity={0.48} depthWrite={false} />
      </mesh>

      {/* stretched silhouette shadow, anchored under the animal */}
      <mesh position={[0.55, 0.39, -0.1]} rotation={[-Math.PI / 2, 0, -0.08]} scale={[2.25, 0.55, 1]} renderOrder={2}>
        <planeGeometry args={[1, 1]} />
        <meshBasicMaterial map={silhouetteShadow} color="#000000" transparent opacity={0.55} depthWrite={false} />
      </mesh>

      {/* exact photographic leopard, cleaned of the stock watermark */}
      <Billboard position={[0.05, 0.44 + height / 2, 0.18]}>
        <mesh position={[0, 0, -0.09]}>
          <planeGeometry args={[width * 1.006, height * 1.004]} />
          <meshBasicMaterial
            map={tex}
            color="#2a2015"
            transparent
            alphaTest={0.06}
            side={THREE.DoubleSide}
            toneMapped={false}
          />
        </mesh>
        <mesh>
          <planeGeometry args={[width, height]} />
          <meshBasicMaterial
            ref={mat}
            map={tex}
            transparent
            alphaTest={0.06}
            side={THREE.DoubleSide}
            toneMapped
            fog
          />
        </mesh>
      </Billboard>

      {/* fragmented 3D stones around the shelf */}
      {[
        [-1.3, 0.22, 0.45, 0.3],
        [1.2, 0.2, 0.4, 0.24],
        [0.8, 0.17, -0.65, 0.2],
      ].map(([x, y, z, s], i) => (
        <mesh key={i} position={[x, y, z]} rotation={[0.2, i, 0.15]} scale={[s, s * 0.6, s * 0.85]} castShadow>
          <dodecahedronGeometry args={[1, 0]} />
          <meshStandardMaterial color="#4d4d41" roughness={0.98} flatShading />
        </mesh>
      ))}
    </group>
  )
}


