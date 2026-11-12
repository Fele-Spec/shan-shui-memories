import { useEffect, useMemo, useRef } from 'react'
import { useTexture } from '@react-three/drei'
import * as THREE from 'three'

const asset = (p: string) => `${import.meta.env.BASE_URL}${p.replace(/^\//, '')}`

function PearlRing() {
  const ref = useRef<THREE.InstancedMesh>(null)
  const count = 22
  const geo = useMemo(() => new THREE.SphereGeometry(0.088, 30, 22), [])
  const mat = useMemo(
    () =>
      new THREE.MeshPhysicalMaterial({
        color: '#f7ecdc',
        roughness: 0.1,
        metalness: 0.06,
        clearcoat: 1,
        clearcoatRoughness: 0.06,
        sheen: 1,
        sheenColor: new THREE.Color('#fff6e7'),
        envMapIntensity: 1.6,
      }),
    []
  )

  useEffect(() => {
    if (!ref.current) return
    const m = new THREE.Matrix4()
    for (let i = 0; i < count; i++) {
      const a = (i / count) * Math.PI * 2
      const r = 0.56 + Math.sin(a * 3) * 0.008
      m.makeTranslation(Math.cos(a) * r, Math.sin(a) * r, 0)
      ref.current.setMatrixAt(i, m)
    }
    ref.current.instanceMatrix.needsUpdate = true
    ref.current.count = count
  }, [])

  return <instancedMesh ref={ref} args={[geo, mat, count]} castShadow />
}

export function PearlModel() {
  const wood = useTexture(asset('assets/textures/wood.jpg'))
  const woodMat = useMemo(() => {
    const t = wood.clone()
    t.wrapS = t.wrapT = THREE.RepeatWrapping
    t.repeat.set(1.2, 1.2)
    t.colorSpace = THREE.SRGBColorSpace
    t.needsUpdate = true
    return new THREE.MeshStandardMaterial({ map: t, color: '#b28a60', roughness: 0.68 })
  }, [wood])

  return (
    <group position={[0, 0.05, 0]}>
      {/* low river stone the table rests on */}
      <mesh position={[0, 0.01, 0]} scale={[1.15, 0.16, 0.85]} receiveShadow castShadow>
        <dodecahedronGeometry args={[1, 1]} />
        <meshStandardMaterial color="#4b5148" roughness={0.97} flatShading />
      </mesh>
      {/* display table */}
      <mesh position={[0, 0.08, 0]} receiveShadow castShadow material={woodMat}>
        <boxGeometry args={[1.7, 0.16, 1.1]} />
      </mesh>
      <mesh position={[0, 0.18, 0]} receiveShadow>
        <boxGeometry args={[1.38, 0.06, 0.86]} />
        <meshStandardMaterial color="#d9c7ac" roughness={1} />
      </mesh>
      {/* soft velvet cloth */}
      <mesh position={[0, 0.215, 0]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <circleGeometry args={[0.63, 40]} />
        <meshPhysicalMaterial color="#c9b59a" roughness={0.95} sheen={1} sheenColor="#f3e7d1" />
      </mesh>

      {/* bracelet, gently leaning against its stand */}
      <group position={[0, 0.78, 0.03]} rotation={[-0.13, -0.18, 0.07]}>
        <mesh castShadow>
          <torusGeometry args={[0.57, 0.018, 8, 64]} />
          <meshStandardMaterial color="#caa863" metalness={1} roughness={0.24} envMapIntensity={1.4} />
        </mesh>
        <PearlRing />
        {/* clasp and small charm */}
        <mesh position={[0.03, 0.62, 0]} castShadow>
          <sphereGeometry args={[0.055, 14, 10]} />
          <meshStandardMaterial color="#d6b36e" metalness={1} roughness={0.2} />
        </mesh>
        <mesh position={[0, -0.65, 0]} castShadow>
          <sphereGeometry args={[0.06, 14, 10]} />
          <meshStandardMaterial color="#d6b36e" metalness={1} roughness={0.2} />
        </mesh>
        <mesh position={[0, -0.75, 0.01]} rotation={[0, 0, 0.25]}>
          <torusGeometry args={[0.07, 0.012, 6, 20]} />
          <meshStandardMaterial color="#caa863" metalness={1} roughness={0.25} />
        </mesh>
      </group>

      {/* driftwood display arch */}
      <mesh position={[0, 0.58, -0.34]} rotation={[0.08, 0, 0.1]} castShadow material={woodMat}>
        <capsuleGeometry args={[0.045, 0.9, 5, 8]} />
      </mesh>
      <mesh position={[0, 1.05, -0.32]} rotation={[0.1, 0, Math.PI / 2]} castShadow material={woodMat}>
        <capsuleGeometry args={[0.04, 0.62, 5, 8]} />
      </mesh>

      {/* small brass pin light */}
      <mesh position={[0.63, 0.3, 0.26]}>
        <sphereGeometry args={[0.028, 10, 8]} />
        <meshBasicMaterial color="#ffdca1" />
      </mesh>
    </group>
  )
}
