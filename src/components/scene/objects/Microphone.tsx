import { useMemo } from 'react'
import * as THREE from 'three'

export function MicrophoneModel() {
  const cable = useMemo(() => {
    const curve = new THREE.CatmullRomCurve3([
      new THREE.Vector3(0.2, 1.05, 0.15),
      new THREE.Vector3(0.52, 0.65, 0.3),
      new THREE.Vector3(0.4, 0.26, 0.42),
      new THREE.Vector3(-0.2, 0.25, 0.46),
      new THREE.Vector3(-0.55, 0.27, 0.2),
    ])
    return new THREE.TubeGeometry(curve, 36, 0.018, 6, false)
  }, [])

  return (
    <group position={[0, 0.02, 0]}>
      {/* stone plinth and warm timber stage */}
      <mesh position={[0, 0.1, 0]} scale={[1.05, 0.26, 0.86]} castShadow receiveShadow>
        <dodecahedronGeometry args={[1, 1]} />
        <meshStandardMaterial color="#666252" roughness={0.96} flatShading />
      </mesh>
      <mesh position={[0, 0.26, 0]} receiveShadow castShadow>
        <cylinderGeometry args={[0.82, 0.88, 0.14, 30]} />
        <meshStandardMaterial color="#9b7149" roughness={0.7} />
      </mesh>
      <mesh position={[0, 0.335, 0]}>
        <cylinderGeometry args={[0.76, 0.76, 0.02, 30]} />
        <meshStandardMaterial color="#c49a6c" roughness={0.75} />
      </mesh>

      {/* stand */}
      <mesh position={[0, 0.4, 0]} castShadow>
        <cylinderGeometry args={[0.24, 0.29, 0.06, 24]} />
        <meshStandardMaterial color="#403a31" metalness={0.65} roughness={0.38} />
      </mesh>
      <mesh position={[0, 0.95, 0]} castShadow>
        <cylinderGeometry args={[0.028, 0.035, 1.15, 12]} />
        <meshStandardMaterial color="#8f8b7d" metalness={0.85} roughness={0.26} />
      </mesh>
      <mesh position={[0.04, 1.51, 0.08]} rotation={[0.78, 0, -0.15]} castShadow>
        <cylinderGeometry args={[0.024, 0.028, 0.48, 10]} />
        <meshStandardMaterial color="#8f8b7d" metalness={0.85} roughness={0.26} />
      </mesh>

      {/* microphone head and handle */}
      <group position={[0.15, 1.63, 0.28]} rotation={[-0.65, 0, -0.06]}>
        <mesh castShadow>
          <cylinderGeometry args={[0.13, 0.13, 0.31, 28]} />
          <meshStandardMaterial color="#a9a291" metalness={0.95} roughness={0.3} envMapIntensity={1.1} />
        </mesh>
        <mesh position={[0, 0.19, 0]}>
          <sphereGeometry args={[0.13, 24, 16, 0, Math.PI * 2, 0, Math.PI / 2]} />
          <meshStandardMaterial color="#b3ab9a" metalness={0.95} roughness={0.3} />
        </mesh>
        {[0.04, 0.1, 0.16].map((y) => (
          <mesh key={y} position={[0, y, 0]} rotation={[Math.PI / 2, 0, 0]}>
            <torusGeometry args={[0.131, 0.008, 5, 28]} />
            <meshStandardMaterial color="#4a463e" metalness={0.8} roughness={0.4} />
          </mesh>
        ))}
        <mesh position={[0, -0.18, 0]}>
          <cylinderGeometry args={[0.09, 0.078, 0.16, 20]} />
          <meshStandardMaterial color="#403a34" metalness={0.5} roughness={0.4} />
        </mesh>
        <mesh position={[0, -0.28, 0]}>
          <cylinderGeometry args={[0.078, 0.092, 0.42, 20]} />
          <meshStandardMaterial color="#252321" metalness={0.45} roughness={0.4} />
        </mesh>
        <mesh position={[0, -0.1, 0]}>
          <torusGeometry args={[0.093, 0.012, 6, 24]} />
          <meshStandardMaterial color="#c89d54" metalness={1} roughness={0.25} />
        </mesh>
      </group>

      {/* cable */}
      <mesh geometry={cable} castShadow>
        <meshStandardMaterial color="#242322" roughness={0.65} metalness={0.15} />
      </mesh>

      {/* stylised sound arcs */}
      {[0.52, 0.72, 0.92].map((r, i) => (
        <mesh key={r} position={[0.05, 1.62, -0.15]} rotation={[0, 0, -0.15]}>
          <torusGeometry args={[r, 0.009, 5, 48, Math.PI * 0.7]} />
          <meshBasicMaterial
            color="#e9c98e"
            transparent
            opacity={0.28 - i * 0.06}
            blending={THREE.AdditiveBlending}
            depthWrite={false}
          />
        </mesh>
      ))}

      {/* little warm footlight */}
      <mesh position={[-0.55, 0.4, 0.3]}>
        <sphereGeometry args={[0.055, 12, 10]} />
        <meshBasicMaterial color="#ffd493" />
      </mesh>
    </group>
  )
}
