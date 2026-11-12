import { useMemo } from 'react'
import { useTexture } from '@react-three/drei'
import * as THREE from 'three'
import { WORLD } from '../../lib/terrain'

const asset = (p: string) => `${import.meta.env.BASE_URL}${p.replace(/^\//, '')}`

function hash(x: number, y: number) {
  const n = Math.sin(x * 127.1 + y * 311.7) * 43758.5453
  return n - Math.floor(n)
}

function makePillar(height: number, radius: number, sides: number, seed: number, taper: number, lean: number) {
  const geo = new THREE.CylinderGeometry(radius * taper, radius, height, sides, 7, false)
  const pos = geo.attributes.position
  for (let i = 0; i < pos.count; i++) {
    const y = pos.getY(i)
    const f = (y + height / 2) / height
    const ring = Math.sin(f * Math.PI * 2.4 + seed) * 0.12 + hash(seed, Math.floor(f * 8)) * 0.16
    const radial = 1 + ring
    let x = pos.getX(i) * radial
    let z = pos.getZ(i) * radial
    x += lean * (f - 0.4) * height
    z += Math.sin(seed + f * 4) * 0.18
    pos.setXYZ(i, x, y, z)
  }
  geo.computeVertexNormals()
  return geo
}

type Pillar = {
  x: number
  z: number
  h: number
  r: number
  sides: number
  seed: number
  taper: number
  lean: number
  color: string
}

const PILLARS: Pillar[] = [
  { x: -66, z: -38, h: 36, r: 3.6, sides: 7, seed: 1.2, taper: 0.03, lean: 0.08, color: '#7e8278' },
  { x: 56, z: -32, h: 40, r: 3.4, sides: 6, seed: 4.7, taper: 0.03, lean: -0.12, color: '#767c72' },
]

/**
 * Extra 3D landform groups at the outer edges: Zhangjiajie-like pillars,
 * Huangshan-like spires and a low far ridge. They sit on the real DEM and are
 * deliberately kept out of the main composition so the valley stays open.
 */
export function Landforms() {
  const [cliff] = useTexture([asset('assets/textures/cliff/cliff_side_diff_1k.jpg')])
  const material = useMemo(() => {
    const tex = cliff.clone()
    tex.wrapS = tex.wrapT = THREE.RepeatWrapping
    tex.repeat.set(1.4, 3.2)
    tex.colorSpace = THREE.SRGBColorSpace
    tex.needsUpdate = true
    return new THREE.MeshStandardMaterial({
      map: tex,
      color: '#8a8a7e',
      roughness: 0.98,
      metalness: 0,
      flatShading: true,
    })
  }, [cliff])

  const geometries = useMemo(
    () => PILLARS.map((p) => makePillar(p.h, p.r, p.sides, p.seed, p.taper, p.lean)),
    []
  )

  const farRidge = useMemo(() => {
    const x0 = -150
    const x1 = 150
    const seg = 34
    const positions: number[] = []
    const indices: number[] = []
    for (let layer = 0; layer < 2; layer++) {
      const z = -164 - layer * 24
      const base = -4
      const start = positions.length / 3
      for (let i = 0; i <= seg; i++) {
        const x = THREE.MathUtils.lerp(x0, x1, i / seg)
        const ridge = 17 + Math.sin(i * 0.72 + layer * 2.3) * 7 + hash(i, layer) * 8
        positions.push(x, base, z)
        positions.push(x, ridge, z)
      }
      for (let i = 0; i < seg; i++) {
        const a = start + i * 2
        indices.push(a, a + 2, a + 1, a + 1, a + 2, a + 3)
      }
    }
    const g = new THREE.BufferGeometry()
    g.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3))
    g.setIndex(indices)
    g.computeVertexNormals()
    return g
  }, [])

  return (
    <group>
      {PILLARS.map((p, i) => {
        const base = -8
        const geo = geometries[i]
        return (
          <group key={i} position={[p.x, base + p.h / 2 - 1, p.z]} rotation={[0, p.seed, 0]}>
            <mesh geometry={geo} material={material} />
            <mesh position={[0, p.h / 2 - 0.4, 0]} scale={[p.r * 0.8, 0.5, p.r * 0.8]}>
              <icosahedronGeometry args={[1, 0]} />
              <meshStandardMaterial color={i % 2 ? '#3d5340' : '#4e6046'} roughness={1} flatShading />
            </mesh>
          </group>
        )
      })}
      <mesh geometry={farRidge} position={[0, 0, 0]}>
        <meshBasicMaterial color="#718b84" transparent opacity={0.58} side={THREE.DoubleSide} fog />
      </mesh>
    </group>
  )
}

export function ridgeBase() {
  return WORLD.waterY
}






