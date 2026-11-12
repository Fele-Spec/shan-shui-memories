import { useEffect, useMemo, useRef } from 'react'
import { useGLTF } from '@react-three/drei'
import * as THREE from 'three'
import { groundAt, isWaterAt, WORLD } from '../../lib/terrain'
import { useExperience } from '../../store/useExperience'

const ROCK_SET_URL = `${import.meta.env.BASE_URL}assets/models/rock_moss_set_01/rock_moss_set_01_1k.gltf`

/**
 * CC0 photogrammetry from Poly Haven (Rock Moss Set 01, Kless Gyzen).
 * Two small clusters are used as hero riverbank detail so the foreground
 * contains real scanned stone rather than only procedural boulders.
 */
export function ScannedRockClusters() {
  const { scene } = useGLTF(ROCK_SET_URL)
  const quality = useExperience((s) => s.quality)
  const clones = useMemo(
    () => (quality === 'high' ? [scene.clone(true)] : []),
    [scene, quality]
  )

  useEffect(() => {
    for (const c of clones) {
      c.traverse((o) => {
        if (o instanceof THREE.Mesh) {
          o.castShadow = quality === 'high'
          o.receiveShadow = true
          const mat = o.material as THREE.MeshStandardMaterial
          if (mat?.map) mat.map.colorSpace = THREE.SRGBColorSpace
          if (mat?.normalMap) mat.normalMap.colorSpace = THREE.NoColorSpace
        }
      })
    }
  }, [clones, quality])

  const placements = [
    { x: -14.0, z: 48.0, s: 0.55, r: 0.35 },
    { x: 24.0, z: 44.0, s: 0.48, r: -0.6 },
  ]

  return (
    <group>
      {clones.map((c, i) => {
        const p = placements[i]
        return (
          <primitive
            key={i}
            object={c}
            position={[p.x, groundAt(p.x, p.z) - 0.08, p.z]}
            rotation={[0, p.r, 0]}
            scale={[p.s, p.s, p.s]}
          />
        )
      })}
    </group>
  )
}


function rng(seed: number) {
  return function () {
    seed |= 0
    seed = (seed + 0x6d2b79f5) | 0
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

export function BankRocks() {
  const ref = useRef<THREE.InstancedMesh>(null)
  const geo = useMemo(() => new THREE.DodecahedronGeometry(1, 1), [])
  const mat = useMemo(
    () =>
      new THREE.MeshStandardMaterial({
        color: '#777362',
        roughness: 0.96,
        metalness: 0.01,
        flatShading: true,
      }),
    []
  )

  const placements = useMemo(() => {
    const r = rng(81233)
    const out: { p: THREE.Vector3; s: THREE.Vector3; q: THREE.Quaternion; c: THREE.Color }[] = []
    for (let i = 0; i < 160 && out.length < 72; i++) {
      const x = WORLD.xMin + 4 + r() * (WORLD.xMax - WORLD.xMin - 8)
      const z = WORLD.zMin + 4 + r() * (WORLD.zMax - WORLD.zMin - 8)
      if (isWaterAt(x, z, 0.35)) continue
      const y = groundAt(x, z)
      if (y > WORLD.waterY + 4.5) continue
      const size = 0.32 + Math.pow(r(), 2.6) * 2.1
      const p = new THREE.Vector3(x, Math.max(y, 0.35) + size * 0.2, z)
      const s = new THREE.Vector3(size * (0.7 + r() * 0.8), size * (0.42 + r() * 0.6), size * (0.8 + r() * 0.6))
      const q = new THREE.Quaternion().setFromEuler(
        new THREE.Euler(r() * 0.6, r() * Math.PI * 2, r() * 0.6)
      )
      const c = new THREE.Color().setHSL(0.17 + r() * 0.05, 0.11 + r() * 0.1, 0.27 + r() * 0.12)
      out.push({ p, s, q, c })
    }
    return out
  }, [])

  useEffect(() => {
    if (!ref.current) return
    const m = new THREE.Matrix4()
    placements.forEach((it, i) => {
      m.compose(it.p, it.q, it.s)
      ref.current!.setMatrixAt(i, m)
      ref.current!.setColorAt(i, it.c)
    })
    ref.current.instanceMatrix.needsUpdate = true
    if (ref.current.instanceColor) ref.current.instanceColor.needsUpdate = true
    ref.current.count = placements.length
  }, [placements])

  return (
    <instancedMesh
      ref={ref}
      args={[geo, mat, placements.length]}
      castShadow
      receiveShadow
      frustumCulled={false}
    />
  )
}


