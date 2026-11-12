import { useEffect, useMemo, useRef } from 'react'
import * as THREE from 'three'
import { WORLD, isWaterAt } from '../../lib/terrain'

const SPOTS: Array<[number, number, number]> = [
  [-6, 40, 1.25],
  [2, 40, 0.9],
  [10, 38, 1.35],
  [18, 36, 0.8],
  [26, 34, 1.1],
  [34, 38, 0.75],
  [42, 32, 1.0],
  [6, 32, 0.7],
  [14, 34, 0.95],
  [30, 30, 0.65],
]

export function RiverRocks() {
  const ref = useRef<THREE.InstancedMesh>(null)
  const rings = useRef<THREE.InstancedMesh>(null)
  const rockGeo = useMemo(() => new THREE.DodecahedronGeometry(1, 0), [])
  const ringGeo = useMemo(() => new THREE.RingGeometry(1.15, 1.55, 24), [])
  const rockMat = useMemo(
    () => new THREE.MeshStandardMaterial({ color: '#4b5046', roughness: 0.98, metalness: 0, flatShading: true }),
    []
  )
  const ringMat = useMemo(
    () =>
      new THREE.MeshBasicMaterial({
        color: '#d7e8dd',
        transparent: true,
        opacity: 0.07,
        depthWrite: false,
        side: THREE.DoubleSide,
      }),
    []
  )
  const placement = useMemo(
    () => SPOTS.filter(([x, z]) => isWaterAt(x, z, 0.6)),
    []
  )

  useEffect(() => {
    if (!ref.current || !rings.current) return
    const m = new THREE.Matrix4()
    const q = new THREE.Quaternion()
    const p = new THREE.Vector3()
    const s = new THREE.Vector3()
    placement.forEach(([x, z, scale], i) => {
      const size = scale * 1.25
      q.setFromEuler(new THREE.Euler(0, i * 1.31, 0))
      p.set(x, WORLD.waterY + size * 0.22, z)
      s.set(size * 1.15, size * 0.64, size)
      m.compose(p, q, s)
      ref.current!.setMatrixAt(i, m)
      p.set(x, WORLD.waterY + 0.035, z)
      q.setFromEuler(new THREE.Euler(-Math.PI / 2, 0, 0))
      s.set(size * 0.78, size * 0.5, 1)
      m.compose(p, q, s)
      rings.current!.setMatrixAt(i, m)
    })
    ref.current.instanceMatrix.needsUpdate = true
    rings.current.instanceMatrix.needsUpdate = true
    ref.current.count = placement.length
    rings.current.count = placement.length
  }, [placement])

  return (
    <group>
      <instancedMesh ref={ref} args={[rockGeo, rockMat, placement.length]} castShadow receiveShadow frustumCulled={false} />
      <instancedMesh ref={rings} args={[ringGeo, ringMat, placement.length]} frustumCulled={false} renderOrder={10} />
    </group>
  )
}


