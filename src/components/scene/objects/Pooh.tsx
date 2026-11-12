import { useRef } from 'react'
import { Billboard, useTexture } from '@react-three/drei'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { visualState } from '../../../lib/visualState'

const asset = (p: string) => `${import.meta.env.BASE_URL}${p.replace(/^\//, '')}`

/**
 * The user explicitly asked that Winnie-the-Pooh use their supplied
 * illustration exactly. Instead of approximating the character with
 * primitives, the cleaned illustration is mounted as a camera-facing
 * standee inside the 3D scene. Its contact shadow, stone seat and warm
 * sunset tint keep it grounded in the environment.
 */
export function PoohModel() {
  const tex = useTexture(asset('assets/objects/pooh-cutout.png'))
  const shadowTex = useTexture(asset('assets/textures/glow.png'))
  const silhouetteShadow = useTexture(asset('assets/objects/pooh-shadow.png'))
  const mat = useRef<THREE.MeshBasicMaterial>(null)
  const shadow = useRef<THREE.Mesh>(null)
  const height = 2.55
  const width = height * (338 / 594)

  useFrame(() => {
    const t = visualState.sunset
    if (mat.current) {
      mat.current.color.setRGB(
        THREE.MathUtils.lerp(0.82, 0.96, t),
        THREE.MathUtils.lerp(0.84, 0.74, t),
        THREE.MathUtils.lerp(0.78, 0.58, t)
      )
    }
    if (shadow.current) {
      ;(shadow.current.material as THREE.MeshBasicMaterial).opacity = 0.38 + t * 0.1
    }
  })

  return (
    <group position={[0, 0.02, 0]}>
      {/* river stone seat */}
      <mesh position={[0, 0.13, 0]} scale={[1.28, 0.36, 1.0]} castShadow receiveShadow>
        <dodecahedronGeometry args={[1, 1]} />
        <meshStandardMaterial color="#5b5a4b" roughness={0.98} flatShading />
      </mesh>
      <mesh position={[0, 0.31, 0]} rotation={[0, 0.3, 0]} scale={[0.97, 0.09, 0.82]} receiveShadow>
        <cylinderGeometry args={[1, 1.06, 0.16, 16]} />
        <meshStandardMaterial color="#6c6655" roughness={0.96} />
      </mesh>

      {/* soft contact shadow on the stone */}
      <mesh ref={shadow} position={[0, 0.325, 0.04]} rotation={[-Math.PI / 2, 0, 0]} scale={[1.05, 0.55, 1]} renderOrder={2}>
        <planeGeometry args={[1, 1]} />
        <meshBasicMaterial
          map={shadowTex}
          color="#000000"
          transparent
          opacity={0.42}
          depthWrite={false}
        />
      </mesh>

      {/* stretched silhouette of the standee, grounding it on the stone */}
      <mesh position={[0.35, 0.335, -0.25]} rotation={[-Math.PI / 2, 0, 0.18]} scale={[1.25, 0.58, 1]} renderOrder={2}>
        <planeGeometry args={[1, 1]} />
        <meshBasicMaterial map={silhouetteShadow} color="#000000" transparent opacity={0.5} depthWrite={false} />
      </mesh>

      {/* exact user-supplied Pooh illustration, cleaned of logos/watermark */}
      <Billboard position={[0, 0.34 + height / 2, 0.06]}>
        <mesh position={[0, 0, -0.06]}>
          <planeGeometry args={[width * 1.008, height * 1.004]} />
          <meshBasicMaterial
            map={tex}
            color="#3d2a11"
            transparent
            alphaTest={0.08}
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
            alphaTest={0.08}
            side={THREE.DoubleSide}
            toneMapped
            fog
          />
        </mesh>
      </Billboard>

      {/* small real 3D stones grounding the standee */}
      <mesh position={[-0.62, 0.17, 0.35]} rotation={[0.2, 0.4, 0.1]} scale={[0.34, 0.18, 0.27]} castShadow>
        <dodecahedronGeometry args={[1, 1]} />
        <meshStandardMaterial color="#4d5044" roughness={0.97} flatShading />
      </mesh>
      <mesh position={[0.58, 0.15, 0.28]} rotation={[0.1, -0.3, 0.2]} scale={[0.26, 0.14, 0.22]} castShadow>
        <dodecahedronGeometry args={[1, 1]} />
        <meshStandardMaterial color="#555343" roughness={0.97} flatShading />
      </mesh>

      {/* a few tiny wildflowers, built as geometry */}
      {[
        [-0.78, 0.33, 0.15],
        [0.74, 0.3, 0.05],
      ].map(([x, y, z], i) => (
        <group key={i} position={[x, y, z]}>
          <mesh position={[0, 0.12, 0]}>
            <cylinderGeometry args={[0.008, 0.012, 0.24, 4]} />
            <meshStandardMaterial color="#4d6240" roughness={0.9} />
          </mesh>
          <mesh position={[0, 0.25, 0]}>
            <sphereGeometry args={[0.035, 8, 6]} />
            <meshStandardMaterial color="#e6d7a8" roughness={0.8} />
          </mesh>
        </group>
      ))}
    </group>
  )
}
