import { useEffect, useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import { useTexture } from '@react-three/drei'
import * as THREE from 'three'
import { mergeGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js'
import { DEM, WORLD, distanceToWater, groundAt, isWaterAt, slopeAt } from '../../lib/terrain'
import { visualState } from '../../lib/visualState'

const asset = (p: string) => `${import.meta.env.BASE_URL}${p.replace(/^\//, '')}`

function mulberry32(a: number) {
  return function () {
    a |= 0
    a = (a + 0x6d2b79f5) | 0
    let t = Math.imul(a ^ (a >>> 15), 1 | a)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

function mergeParts(parts: THREE.BufferGeometry[]) {
  const flat = parts.map((p) => (p.index ? p.toNonIndexed() : p))
  const merged = mergeGeometries(flat, false)
  parts.forEach((p) => p.dispose())
  flat.forEach((p) => {
    if (!parts.includes(p)) p.dispose()
  })
  return merged
}

type WindMaterial = THREE.MeshStandardMaterial & {
  userData: { shader?: { uniforms: Record<string, THREE.IUniform> } }
}

function addWind(
  mat: WindMaterial,
  mode: 'stalk' | 'leaf' | 'grass',
  amount: number
) {
  mat.onBeforeCompile = (shader) => {
    shader.uniforms.uTime = { value: 0 }
    shader.uniforms.uWind = { value: amount }
    shader.vertexShader = shader.vertexShader
      .replace(
        '#include <common>',
        `#include <common>
        uniform float uTime;
        uniform float uWind;`
      )
      .replace(
        '#include <begin_vertex>',
        `#include <begin_vertex>
        #ifdef USE_INSTANCING
          vec3 iOrigin = vec3(instanceMatrix[3][0], instanceMatrix[3][1], instanceMatrix[3][2]);
        #else
          vec3 iOrigin = vec3(0.0);
        #endif
        float phase = uTime * ${mode === 'grass' ? '1.35' : '0.72'} + iOrigin.x * 0.22 + iOrigin.z * 0.19;
        float gust = sin(phase) * 0.65 + sin(phase * 2.17 + 1.3) * 0.25 + sin(phase * 0.41) * 0.35;
        ${
          mode === 'leaf'
            ? `float weight = clamp(uv.y, 0.0, 1.0);`
            : mode === 'grass'
              ? `float weight = clamp(transformed.y / 0.75, 0.0, 1.0);`
              : `float weight = pow(clamp(transformed.y / 6.0, 0.0, 1.0), 1.7);`
        }
        transformed.x += gust * weight * uWind;
        transformed.z += cos(phase * 0.83 + 0.7) * weight * uWind * 0.42;`
      )
    mat.userData.shader = shader
  }
  mat.customProgramCacheKey = () => `wind-${mode}-${amount}`
}

function useWindClock(materials: WindMaterial[]) {
  useFrame((_, dt) => {
    visualState.time += dt
    for (const mat of materials) {
      const shader = mat.userData.shader
      if (shader) shader.uniforms.uTime.value = visualState.time
    }
  })
}

type Grove = { cx: number; cz: number; rx: number; rz: number; count: number; hMin: number; hMax: number }

const GROVES: Grove[] = [
  { cx: -33, cz: 14, rx: 6.5, rz: 9, count: 80, hMin: 6.0, hMax: 11.0 },
  { cx: -29, cz: 35, rx: 4.5, rz: 4.5, count: 32, hMin: 4.8, hMax: 8.2 },
  { cx: 34, cz: 10, rx: 5.5, rz: 7, count: 38, hMin: 4.6, hMax: 8.6 },
  { cx: 27, cz: -24, rx: 5, rz: 6, count: 22, hMin: 4.2, hMax: 7.5 },
]

type Stalk = {
  x: number
  z: number
  y: number
  height: number
  width: number
  leanX: number
  leanZ: number
  phase: number
}

export function Bamboo() {
  const leafTex = useTexture(asset('assets/textures/bamboo_leaf.png'))
  const stalkRef = useRef<THREE.InstancedMesh>(null)
  const leafRef = useRef<THREE.InstancedMesh>(null)

  const stalks = useMemo(() => {
    const rnd = mulberry32(77231)
    const list: Stalk[] = []
    for (const g of GROVES) {
      for (let i = 0; i < g.count; i++) {
        const a = rnd() * Math.PI * 2
        const r = Math.sqrt(rnd())
        const x = g.cx + Math.cos(a) * g.rx * r
        const z = g.cz + Math.sin(a) * g.rz * r
        if (isWaterAt(x, z, 0.35) || Math.abs(x) > 112 || z < -144 || z > 62) continue
        const y = groundAt(x, z) - 0.12
        list.push({
          x,
          z,
          y,
          height: THREE.MathUtils.lerp(g.hMin, g.hMax, rnd()),
          width: 0.78 + rnd() * 0.5,
          leanX: (rnd() - 0.5) * 0.09,
          leanZ: (rnd() - 0.5) * 0.09,
          phase: rnd() * Math.PI * 2,
        })
      }
    }
    return list
  }, [])

  const stalkGeo = useMemo(() => {
    const parts: THREE.BufferGeometry[] = []
    const culm = new THREE.CylinderGeometry(0.055, 0.082, 6, 7, 1, false)
    culm.translate(0, 3, 0)
    parts.push(culm)
    for (let y = 0.65; y < 5.9; y += 0.72) {
      const ring = new THREE.TorusGeometry(0.079, 0.014, 5, 10)
      ring.rotateX(Math.PI / 2)
      ring.translate(0, y, 0)
      parts.push(ring)
    }
    const merged = mergeGeometries(parts, false)
    parts.forEach((p) => p.dispose())
    return merged ?? culm
  }, [])

  const leafGeo = useMemo(() => {
    const g = new THREE.PlaneGeometry(0.34, 1.15, 1, 1)
    g.translate(0, 0.55, 0)
    return g
  }, [])

  const leafCount = useMemo(
    () => stalks.reduce((sum, s) => sum + (s.height > 6 ? 18 : 14), 0),
    [stalks]
  )

  useEffect(() => {
    // Instances are uploaded once; wind is entirely on the GPU.
    const sm = stalkRef.current
    if (!sm) return
    const m = new THREE.Matrix4()
    const q = new THREE.Quaternion()
    const e = new THREE.Euler()
    const pos = new THREE.Vector3()
    const scl = new THREE.Vector3()
    stalks.forEach((s, i) => {
      e.set(s.leanX, s.phase, s.leanZ)
      q.setFromEuler(e)
      pos.set(s.x, s.y, s.z)
      scl.set(s.width, s.height / 6, s.width)
      m.compose(pos, q, scl)
      sm.setMatrixAt(i, m)
    })
    sm.instanceMatrix.needsUpdate = true
    sm.count = stalks.length
  }, [stalks])

  useEffect(() => {
    const lm = leafRef.current
    if (!lm) return
    const rnd = mulberry32(4432)
    const m = new THREE.Matrix4()
    const q = new THREE.Quaternion()
    const e = new THREE.Euler()
    const pos = new THREE.Vector3()
    const scl = new THREE.Vector3()
    let idx = 0
    for (const s of stalks) {
      const n = s.height > 6 ? 18 : 14
      for (let j = 0; j < n; j++) {
        const a = rnd() * Math.PI * 2
        const radius = 0.2 + rnd() * 0.85
        const h = s.height * (0.6 + rnd() * 0.38)
        pos.set(s.x + Math.cos(a) * radius, s.y + h, s.z + Math.sin(a) * radius)
        e.set((rnd() - 0.5) * 1.2, a + Math.PI * 0.5, (rnd() - 0.5) * 0.9)
        q.setFromEuler(e)
        const sc = 0.72 + rnd() * 0.86
        scl.set(sc, sc, sc)
        m.compose(pos, q, scl)
        lm.setMatrixAt(idx++, m)
      }
    }
    lm.instanceMatrix.needsUpdate = true
    lm.count = idx
  }, [stalks])

  const stalkMaterial = useMemo(() => {
    const m = new THREE.MeshStandardMaterial({
      color: '#718b59',
      roughness: 0.72,
      metalness: 0.02,
    }) as WindMaterial
    addWind(m, 'stalk', 0.22)
    return m
  }, [])

  const leafMaterial = useMemo(() => {
    const m = new THREE.MeshStandardMaterial({
      color: '#c2d3a8',
      map: leafTex,
      alphaTest: 0.3,
      side: THREE.DoubleSide,
      roughness: 0.82,
      metalness: 0.0,
    }) as WindMaterial
    addWind(m, 'leaf', 0.16)
    return m
  }, [leafTex])

  useWindClock([stalkMaterial, leafMaterial])

  return (
    <group>
      <instancedMesh
        ref={stalkRef}
        args={[stalkGeo, stalkMaterial, stalks.length]}
        castShadow
        receiveShadow
        frustumCulled={false}
      />
      <instancedMesh
        ref={leafRef}
        args={[leafGeo, leafMaterial, leafCount]}
        frustumCulled={false}
      />
    </group>
  )
}

export function Pines() {
  const ref = useRef<THREE.InstancedMesh>(null)
  const mat = useRef<WindMaterial>(null)

  const geometry = useMemo(() => {
    const parts: THREE.BufferGeometry[] = []
    const trunk = new THREE.CylinderGeometry(0.11, 0.2, 2.7, 6)
    trunk.translate(0, 1.35, 0)
    parts.push(trunk)
    // Broadleaf karst forest: irregular clustered crowns, not Christmas cones.
    const crowns = [
      { r: 1.55, sx: 1.0, sy: 0.85, sz: 1.0, x: 0, y: 3.2, z: 0 },
      { r: 1.05, sx: 0.9, sy: 0.8, sz: 0.9, x: 0.85, y: 3.8, z: 0.3 },
      { r: 0.92, sx: 0.85, sy: 0.75, sz: 0.85, x: -0.7, y: 4.0, z: -0.35 },
    ]
    for (const c of crowns) {
      const blob = new THREE.IcosahedronGeometry(c.r, 0)
      blob.scale(c.sx, c.sy, c.sz)
      blob.translate(c.x, c.y, c.z)
      parts.push(blob)
    }
    return mergeParts(parts)
  }, [])

  const placements = useMemo(() => {
    const rnd = mulberry32(99117)
    const list: { x: number; y: number; z: number; s: number }[] = []
    for (let i = 0; i < 90 && list.length < 38; i++) {
      const x = WORLD.xMin + 5 + rnd() * (WORLD.xMax - WORLD.xMin - 10)
      const z = WORLD.zMin + 8 + rnd() * 140
      if (isWaterAt(x, z, 1.2)) continue
      const y = groundAt(x, z)
      if (y < WORLD.waterY + 1.4 || y > 48) continue
      if (slopeAt(x, z) > 0.78) continue
      const s = 0.32 + rnd() * 0.62
      list.push({ x, y: y - s * 0.15, z, s })
    }
    return list
  }, [])

  useEffect(() => {
    if (!ref.current) return
    const m = new THREE.Matrix4()
    const q = new THREE.Quaternion()
    const pos = new THREE.Vector3()
    const scl = new THREE.Vector3()
    placements.forEach((p, i) => {
      q.setFromAxisAngle(new THREE.Vector3(0, 1, 0), (i * 2.399) % 6.28)
      pos.set(p.x, p.y, p.z)
      scl.set(p.s, p.s, p.s)
      m.compose(pos, q, scl)
      ref.current!.setMatrixAt(i, m)
    })
    ref.current.instanceMatrix.needsUpdate = true
    ref.current.count = placements.length
  }, [placements])

  const material = useMemo(() => {
    const m = new THREE.MeshLambertMaterial({
      color: '#3f5a3d',
      emissive: '#1d2c1b',
      emissiveIntensity: 0.55,
    }) as unknown as WindMaterial
    addWind(m, 'stalk', 0.06)
    return m
  }, [])

  useWindClock([material])

  return <instancedMesh ref={ref} args={[geometry, material, placements.length]} castShadow receiveShadow frustumCulled={false} />
}

export function SlopeShrubs() {
  const ref = useRef<THREE.InstancedMesh>(null)
  const geo = useMemo(() => new THREE.IcosahedronGeometry(1, 1), [])
  const mat = useMemo(
    () =>
      new THREE.MeshStandardMaterial({
        color: '#ffffff',
        roughness: 0.94,
        metalness: 0,
        flatShading: true,
      }),
    []
  )
  const placements = useMemo(() => {
    const rnd = mulberry32(70733)
    const list: { x: number; y: number; z: number; s: number; c: THREE.Color }[] = []
    for (let i = 0; i < 700 && list.length < 380; i++) {
      const x = WORLD.xMin + 4 + rnd() * (WORLD.xMax - WORLD.xMin - 8)
      const z = WORLD.zMin + 4 + rnd() * 150
      if (isWaterAt(x, z, 0.8)) continue
      const y = groundAt(x, z)
      if (y < WORLD.waterY + 0.9 || y > 46) continue
      if (slopeAt(x, z) > 0.82) continue
      const s = 0.55 + Math.pow(rnd(), 1.6) * 2.7
      const c = new THREE.Color().setHSL(0.31 + rnd() * 0.04, 0.18 + rnd() * 0.12, 0.2 + rnd() * 0.13)
      list.push({ x, y: y + s * 0.32, z, s, c })
    }
    return list
  }, [])

  useEffect(() => {
    if (!ref.current) return
    const m = new THREE.Matrix4()
    const q = new THREE.Quaternion()
    const pos = new THREE.Vector3()
    const scl = new THREE.Vector3()
    placements.forEach((p, i) => {
      q.setFromAxisAngle(new THREE.Vector3(0, 1, 0), (i * 2.17) % 6.28)
      pos.set(p.x, p.y, p.z)
      scl.set(p.s, p.s * (0.55 + (i % 5) * 0.08), p.s * 0.9)
      m.compose(pos, q, scl)
      ref.current!.setMatrixAt(i, m)
      ref.current!.setColorAt(i, p.c)
    })
    ref.current.instanceMatrix.needsUpdate = true
    if (ref.current.instanceColor) ref.current.instanceColor.needsUpdate = true
    ref.current.count = placements.length
  }, [placements])

  return (
    <instancedMesh
      ref={ref}
      args={[geo, mat, placements.length]}
      receiveShadow
      frustumCulled={false}
    />
  )
}

export function DistantForest() {
  const ref = useRef<THREE.InstancedMesh>(null)
  const geometry = useMemo(() => {
    const parts: THREE.BufferGeometry[] = []
    const trunk = new THREE.CylinderGeometry(0.09, 0.14, 1.8, 4)
    trunk.translate(0, 0.9, 0)
    parts.push(trunk)
    const crowns = [
      { r: 1.25, x: 0, y: 2.0, z: 0 },
      { r: 0.8, x: 0.55, y: 2.65, z: 0.2 },
    ]
    for (const c of crowns) {
      const blob = new THREE.IcosahedronGeometry(c.r, 0)
      blob.scale(0.95, 0.8, 0.95)
      blob.translate(c.x, c.y, c.z)
      parts.push(blob)
    }
    return mergeParts(parts)
  }, [])
  const material = useMemo(
    () => new THREE.MeshStandardMaterial({ color: '#ffffff', roughness: 0.98, metalness: 0 }),
    []
  )
  const placements = useMemo(() => {
    const rnd = mulberry32(31717)
    const list: { x: number; y: number; z: number; s: number; c: THREE.Color }[] = []
    for (let i = 0; i < 1000 && list.length < 520; i++) {
      const x = WORLD.xMin + 4 + rnd() * (WORLD.xMax - WORLD.xMin - 8)
      const z = WORLD.zMin + 4 + rnd() * 150
      if (isWaterAt(x, z, 1.0)) continue
      const y = groundAt(x, z)
      if (y < WORLD.waterY + 0.8 || y > 54) continue
      const s = 0.14 + Math.pow(rnd(), 2.0) * 0.46
      const c = new THREE.Color().setHSL(0.3 + rnd() * 0.05, 0.18 + rnd() * 0.12, 0.2 + rnd() * 0.09)
      list.push({ x, y: y - s * 0.38, z, s, c })
    }
    return list
  }, [])

  useEffect(() => {
    if (!ref.current) return
    const m = new THREE.Matrix4()
    const q = new THREE.Quaternion()
    const pos = new THREE.Vector3()
    const scl = new THREE.Vector3()
    placements.forEach((p, i) => {
      q.setFromAxisAngle(new THREE.Vector3(0, 1, 0), (i * 1.93) % 6.28)
      pos.set(p.x, p.y, p.z)
      scl.set(p.s * (0.9 + (i % 3) * 0.12), p.s * (1.0 + (i % 4) * 0.12), p.s)
      m.compose(pos, q, scl)
      ref.current!.setMatrixAt(i, m)
      ref.current!.setColorAt(i, p.c)
    })
    ref.current.instanceMatrix.needsUpdate = true
    if (ref.current.instanceColor) ref.current.instanceColor.needsUpdate = true
    ref.current.count = placements.length
  }, [placements])

  return (
    <instancedMesh
      ref={ref}
      args={[geometry, material, placements.length]}
      frustumCulled={false}
    />
  )
}

export function Meadow() {
  const ref = useRef<THREE.InstancedMesh>(null)
  const tex = useTexture(asset('assets/textures/bamboo_leaf.png'))
  const geometry = useMemo(() => {
    const g = new THREE.PlaneGeometry(0.11, 0.75, 1, 2)
    g.translate(0, 0.375, 0)
    return g
  }, [])
  const placements = useMemo(() => {
    const rnd = mulberry32(60013)
    const list: { x: number; y: number; z: number; s: number; r: number }[] = []
    for (let i = 0; i < 1800 && list.length < 900; i++) {
      const x = WORLD.xMin + 3 + rnd() * (WORLD.xMax - WORLD.xMin - 6)
      const z = WORLD.zMin + 3 + rnd() * (WORLD.zMax - WORLD.zMin - 6)
      if (isWaterAt(x, z, 0.4)) continue
      const y = groundAt(x, z)
      if (y < WORLD.waterY + 0.1 || y > WORLD.waterY + 4.0) continue
      if (distanceToWater(x, z, 9) > 7) continue
      list.push({ x, y, z, s: 0.6 + rnd() * 1.1, r: rnd() * 6.28 })
    }
    return list
  }, [])
  const material = useMemo(() => {
    const m = new THREE.MeshStandardMaterial({
      color: '#8da66e',
      map: tex,
      alphaTest: 0.4,
      side: THREE.DoubleSide,
      roughness: 0.94,
    }) as WindMaterial
    addWind(m, 'grass', 0.07)
    return m
  }, [tex])
  useEffect(() => {
    if (!ref.current) return
    const m = new THREE.Matrix4()
    const q = new THREE.Quaternion()
    const pos = new THREE.Vector3()
    const scl = new THREE.Vector3()
    placements.forEach((p, i) => {
      q.setFromAxisAngle(new THREE.Vector3(0, 1, 0), p.r)
      pos.set(p.x, p.y, p.z)
      scl.set(p.s, p.s * 1.1, p.s)
      m.compose(pos, q, scl)
      ref.current!.setMatrixAt(i, m)
    })
    ref.current.instanceMatrix.needsUpdate = true
    ref.current.count = placements.length
  }, [placements])
  useWindClock([material])
  return <instancedMesh ref={ref} args={[geometry, material, placements.length]} frustumCulled={false} />
}

const WORLD_WATER = 0.32

export function RiverGrass() {
  const ref = useRef<THREE.InstancedMesh>(null)
  const tex = useTexture(asset('assets/textures/bamboo_leaf.png'))

  const geometry = useMemo(() => {
    const g = new THREE.PlaneGeometry(0.16, 1.0, 1, 2)
    g.translate(0, 0.5, 0)
    return g
  }, [])

  const placements = useMemo(() => {
    const rnd = mulberry32(43009)
    const list: { x: number; y: number; z: number; s: number; r: number }[] = []
    for (let i = 0; i < 2400 && list.length < 420; i++) {
      const x = WORLD.xMin + 3 + rnd() * (WORLD.xMax - WORLD.xMin - 6)
      const z = WORLD.zMin + 3 + rnd() * (WORLD.zMax - WORLD.zMin - 6)
      if (isWaterAt(x, z, 0.2)) continue
      if (distanceToWater(x, z, 6) > 3.2) continue
      const y = groundAt(x, z)
      if (y > WORLD.waterY + 2.2) continue
      list.push({ x, y, z, s: 0.5 + rnd() * 0.9, r: rnd() * 6.28 })
    }
    return list
  }, [])

  useEffect(() => {
    if (!ref.current) return
    const m = new THREE.Matrix4()
    const q = new THREE.Quaternion()
    const pos = new THREE.Vector3()
    const scl = new THREE.Vector3()
    placements.forEach((p, i) => {
      q.setFromAxisAngle(new THREE.Vector3(0, 1, 0), p.r)
      pos.set(p.x, p.y, p.z)
      scl.set(p.s, p.s, p.s)
      m.compose(pos, q, scl)
      ref.current!.setMatrixAt(i, m)
    })
    ref.current.instanceMatrix.needsUpdate = true
    ref.current.count = placements.length
  }, [placements])

  const material = useMemo(() => {
    const m = new THREE.MeshStandardMaterial({
      color: '#68764a',
      map: tex,
      alphaTest: 0.4,
      side: THREE.DoubleSide,
      roughness: 0.9,
    }) as WindMaterial
    addWind(m, 'grass', 0.12)
    return m
  }, [tex])

  useWindClock([material])

  return <instancedMesh ref={ref} args={[geometry, material, placements.length]} frustumCulled={false} />
}









