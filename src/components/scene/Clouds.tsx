import { useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import { useTexture } from '@react-three/drei'
import * as THREE from 'three'
import { PALETTE, visualState } from '../../lib/visualState'

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

type SpriteSeed = {
  sprite: THREE.Sprite
  baseOpacity: number
  speed: number
  tint: number
}

export function Clouds() {
  const textures = useTexture([
    asset('assets/textures/cloud_a.png'),
    asset('assets/textures/cloud_b.png'),
    asset('assets/textures/cloud_c.png'),
    asset('assets/textures/mist.png'),
  ])
  const sprites = useRef<SpriteSeed[]>([])

  const group = useMemo(() => {
    const g = new THREE.Group()
    g.name = 'cloud-field'
    const rnd = mulberry32(20261111)
    const entries: SpriteSeed[] = []

    // High, distant cumulus layers.
    const cloudLayers = [
      { count: 8, zMin: -310, zMax: -190, yMin: 52, yMax: 92, sMin: 75, sMax: 150, op: 0.48, tint: 0.72 },
      { count: 7, zMin: -180, zMax: -95, yMin: 27, yMax: 58, sMin: 38, sMax: 80, op: 0.4, tint: 0.95 },
      { count: 4, zMin: -90, zMax: -45, yMin: 16, yMax: 32, sMin: 22, sMax: 44, op: 0.24, tint: 1.12 },
    ]

    cloudLayers.forEach((layer, li) => {
      for (let i = 0; i < layer.count; i++) {
        const tex = textures[(li + i) % 3]
        const mat = new THREE.SpriteMaterial({
          map: tex,
          transparent: true,
          opacity: layer.op * (0.7 + rnd() * 0.5),
          depthWrite: false,
          color: new THREE.Color('#f2f6ee'),
          fog: false,
          toneMapped: true,
        })
        const sprite = new THREE.Sprite(mat)
        const z = THREE.MathUtils.lerp(layer.zMin, layer.zMax, rnd())
        const x = (rnd() * 2 - 1) * 190
        const y = THREE.MathUtils.lerp(layer.yMin, layer.yMax, rnd())
        const w = THREE.MathUtils.lerp(layer.sMin, layer.sMax, rnd())
        const aspect = tex.image ? tex.image.width / tex.image.height : 1.7
        sprite.position.set(x, y, z)
        sprite.scale.set(w, w / aspect, 1)
        sprite.renderOrder = 2
        entries.push({
          sprite,
          baseOpacity: mat.opacity,
          speed: 0.32 + rnd() * 0.65,
          tint: layer.tint,
        })
        g.add(sprite)
      }
    })

    // Low mist banks, hugging the valley and the far mountain bases.
    for (let i = 0; i < 10; i++) {
      const mat = new THREE.SpriteMaterial({
        map: textures[3],
        transparent: true,
        opacity: 0.11 + rnd() * 0.13,
        depthWrite: false,
        color: new THREE.Color('#e5efea'),
        fog: false,
      })
      const s = new THREE.Sprite(mat)
      s.position.set((rnd() * 2 - 1) * 100, 3 + rnd() * 10, -45 - rnd() * 130)
      s.scale.set(80 + rnd() * 80, 11 + rnd() * 10, 1)
      s.renderOrder = 3
      entries.push({ sprite: s, baseOpacity: mat.opacity, speed: 0.08 + rnd() * 0.2, tint: 1.3 })
      g.add(s)
    }

    sprites.current = entries
    return g
  }, [textures])

  const tmp = useMemo(() => new THREE.Color(), [])

  useFrame((_, dt) => {
    const t = visualState.sunset
    for (const c of sprites.current) {
      c.sprite.position.x += c.speed * dt
      if (c.sprite.position.x > 215) c.sprite.position.x = -215
      const mat = c.sprite.material as THREE.SpriteMaterial
      tmp.copy(PALETTE.cloudDay).lerp(PALETTE.cloudSunset, Math.min(1, t * c.tint))
      mat.color.copy(tmp)
      mat.opacity = c.baseOpacity * (1 + t * 0.25)
    }
  })

  return <primitive object={group} />
}

