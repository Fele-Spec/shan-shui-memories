import { useEffect, useMemo, useRef } from 'react'
import { useTexture } from '@react-three/drei'
import * as THREE from 'three'

const asset = (p: string) => `${import.meta.env.BASE_URL}${p.replace(/^\//, '')}`

const PALETTE: Record<string, string> = {
  O: '#d96b2f',
  o: '#e69344',
  W: '#f2ead8',
  K: '#332820',
  Y: '#e7c35b',
  G: '#3e8f4e',
  g: '#78b45d',
  D: '#285f3b',
}

const FOX = [
  '...........',
  '..OO...OO..',
  '.OOOO.OOOO.',
  'OOOOOOOOOOO',
  'OOOOOOOOOOO',
  'OOWWOOOWWOO',
  'OOWKOOOKWOO',
  'OOWWOOOWWOO',
  'OOOOWWWOOOO',
  'OOOOOWOOOOO',
  '..OOOOOOO..',
]

const BIRD = [
  '.....G.....',
  '....GGG....',
  '...GGGGG...',
  '..GGGGGGG..',
  '.GGGWGGGGG.',
  'GGGGWGGGGGG',
  'GGGGGGGGGGG',
  '.GGGGGGGGG.',
  '..GGGGGGG..',
  '...GGGGG...',
  '....GGG....',
]

type Bead = { x: number; y: number; color: string }

function buildBeads(grid: string[], offsetX: number) {
  const beads: Bead[] = []
  const n = grid.length
  const step = 0.083
  for (let r = 0; r < n; r++) {
    for (let c = 0; c < n; c++) {
      const ch = grid[r][c] ?? '.'
      if (ch === '.' || !PALETTE[ch]) continue
      beads.push({
        x: offsetX + (c - (n - 1) / 2) * step,
        y: ((n - 1) / 2 - r) * step,
        color: PALETTE[ch],
      })
    }
  }
  return beads
}

function BeadBoards() {
  const ref = useRef<THREE.InstancedMesh>(null)
  const beads = useMemo(() => [...buildBeads(FOX, -0.6), ...buildBeads(BIRD, 0.6)], [])
  const geo = useMemo(() => {
    const g = new THREE.CylinderGeometry(0.039, 0.039, 0.045, 10)
    g.rotateX(Math.PI / 2)
    return g
  }, [])
  const mat = useMemo(
    () =>
      new THREE.MeshStandardMaterial({
        color: '#ffffff',
        roughness: 0.42,
        metalness: 0.02,
        vertexColors: false,
      }),
    []
  )

  useEffect(() => {
    if (!ref.current) return
    const m = new THREE.Matrix4()
    const c = new THREE.Color()
    beads.forEach((b, i) => {
      m.makeTranslation(b.x, 1.03 + b.y, 0.035)
      ref.current!.setMatrixAt(i, m)
      ref.current!.setColorAt(i, c.set(b.color))
    })
    ref.current.instanceMatrix.needsUpdate = true
    if (ref.current.instanceColor) ref.current.instanceColor.needsUpdate = true
    ref.current.count = beads.length
  }, [beads])

  return (
    <group>
      {/* two pale pegboards */}
      <mesh position={[-0.6, 1.03, -0.05]} castShadow receiveShadow>
        <boxGeometry args={[1.02, 1.02, 0.05]} />
        <meshStandardMaterial color="#ded6c5" roughness={0.9} />
      </mesh>
      <mesh position={[0.6, 1.03, -0.05]} castShadow receiveShadow>
        <boxGeometry args={[1.02, 1.02, 0.05]} />
        <meshStandardMaterial color="#ded6c5" roughness={0.9} />
      </mesh>
      {/* wood frames */}
      {[-0.6, 0.6].map((x) => (
        <group key={x} position={[x, 1.03, -0.04]}>
          <mesh position={[0, 0.54, 0]} castShadow>
            <boxGeometry args={[1.14, 0.07, 0.09]} />
            <meshStandardMaterial color="#7a5736" roughness={0.7} />
          </mesh>
          <mesh position={[0, -0.54, 0]} castShadow>
            <boxGeometry args={[1.14, 0.07, 0.09]} />
            <meshStandardMaterial color="#7a5736" roughness={0.7} />
          </mesh>
          <mesh position={[-0.55, 0, 0]} castShadow>
            <boxGeometry args={[0.07, 1.14, 0.09]} />
            <meshStandardMaterial color="#7a5736" roughness={0.7} />
          </mesh>
          <mesh position={[0.55, 0, 0]} castShadow>
            <boxGeometry args={[0.07, 1.14, 0.09]} />
            <meshStandardMaterial color="#7a5736" roughness={0.7} />
          </mesh>
        </group>
      ))}
      <instancedMesh ref={ref} args={[geo, mat, beads.length]} castShadow frustumCulled={false} />
    </group>
  )
}

export function PerlerModel() {
  const wood = useTexture(asset('assets/textures/wood.jpg'))
  const woodMat = useMemo(() => {
    const t = wood.clone()
    t.wrapS = t.wrapT = THREE.RepeatWrapping
    t.repeat.set(1, 2)
    t.colorSpace = THREE.SRGBColorSpace
    t.needsUpdate = true
    return new THREE.MeshStandardMaterial({ map: t, color: '#a97b50', roughness: 0.72 })
  }, [wood])

  return (
    <group position={[0, 0.02, 0]}>
      {/* low display bench */}
      <mesh position={[0, 0.12, 0]} castShadow receiveShadow material={woodMat}>
        <boxGeometry args={[1.95, 0.12, 0.8]} />
      </mesh>
      {[-0.78, 0.78].map((x) => (
        <mesh key={x} position={[x, 0.34, -0.12]} rotation={[0.22, 0, 0]} castShadow material={woodMat}>
          <boxGeometry args={[0.09, 1.0, 0.12]} />
        </mesh>
      ))}
      <mesh position={[0, 1.05, -0.21]} rotation={[0.22, 0, 0]} castShadow material={woodMat}>
        <boxGeometry args={[1.8, 0.07, 0.1]} />
      </mesh>
      <BeadBoards />
      <mesh position={[0, 0.2, 0.3]} rotation={[-Math.PI / 2, 0, 0]}>
        <circleGeometry args={[0.22, 24]} />
        <meshStandardMaterial color="#f0d9ac" roughness={0.9} />
      </mesh>
    </group>
  )
}
