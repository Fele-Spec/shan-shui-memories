import { useMemo, useRef } from 'react'
import { useFrame, type ThreeEvent } from '@react-three/fiber'
import * as THREE from 'three'
import { fbm2, ridgedFbm } from '../../lib/terrain'
import { PALETTE, visualState } from '../../lib/visualState'
import { useExperience } from '../../store/useExperience'

const ridgeVertex = /* glsl */ `
  varying vec2 vUv;
  varying vec3 vWorld;
  void main() {
    vUv = uv;
    vec4 world = modelMatrix * vec4(position, 1.0);
    vWorld = world.xyz;
    gl_Position = projectionMatrix * viewMatrix * world;
  }
`

const ridgeFragment = /* glsl */ `
  precision highp float;
  varying vec2 vUv;
  varying vec3 vWorld;
  uniform vec3 uDeep;
  uniform vec3 uMist;
  uniform vec3 uHaze;
  uniform vec3 uSunColor;
  uniform float uSunset;
  uniform float uOpacity;

  float hash(vec2 p) {
    return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453);
  }
  float noise(vec2 p) {
    vec2 i = floor(p), f = fract(p);
    f = f * f * (3.0 - 2.0 * f);
    return mix(mix(hash(i), hash(i + vec2(1, 0)), f.x),
               mix(hash(i + vec2(0, 1)), hash(i + vec2(1, 1)), f.x), f.y);
  }
  void main() {
    float h = vUv.y;
    vec3 col = mix(uMist, uDeep, smoothstep(0.0, 0.94, h));
    // soften the base into valley mist
    col = mix(col, uHaze, smoothstep(0.3, 0.0, h) * 0.62);
    // fine atmospheric mottling
    float grain = noise(vec2(vUv.x * 42.0, h * 8.0)) - 0.5;
    col += grain * 0.035;
    // warm rim where the sun grazes the ridge
    float rim = smoothstep(0.88, 1.0, h);
    col += uSunColor * rim * uSunset * 0.18;
    gl_FragColor = vec4(col, 1.0);
  }
`

type Props = {
  z: number
  base: number
  amp: number
  seed: number
  deep: string
  mist: string
  haze: string
  deepDusk: string
  mistDusk: string
  hazeDusk: string
  opacity: number
  order: number
}

function Ridge({ z, base, amp, seed, deep, mist, haze, deepDusk, mistDusk, hazeDusk, opacity, order }: Props) {
  const mat = useRef<THREE.ShaderMaterial>(null)
  const enterSunset = useExperience((s) => s.enterSunset)
  const sunsetMode = useExperience((s) => s.sunsetMode)
  const locked = useExperience((s) => s.interactionLocked)
  const dayDeep = useMemo(() => new THREE.Color(deep), [deep])
  const dayMist = useMemo(() => new THREE.Color(mist), [mist])
  const dayHaze = useMemo(() => new THREE.Color(haze), [haze])
  const duskDeep = useMemo(() => new THREE.Color(deepDusk), [deepDusk])
  const duskMist = useMemo(() => new THREE.Color(mistDusk), [mistDusk])
  const duskHaze = useMemo(() => new THREE.Color(hazeDusk), [hazeDusk])

  const geometry = useMemo(() => {
    const width = 940
    const segments = 240
    const positions: number[] = []
    const uvs: number[] = []
    const indices: number[] = []
    for (let i = 0; i <= segments; i++) {
      const f = i / segments
      const x = (f - 0.5) * width
      const n1 = fbm2(x * 0.009 + seed * 3.1, seed * 13.7, 5)
      const n2 = ridgedFbm(x * 0.026 + seed, seed * 7.3, 5)
      const n3 = fbm2(x * 0.085 - seed, seed * 2.4, 3)
      const spire = Math.pow(Math.max(0, Math.sin(x * 0.047 + seed * 1.9)), 22)
      const top = base + amp * (0.32 * n1 + 0.55 * n2 + 0.13 * n3) + spire * amp * 1.45
      positions.push(x, top, 0, x, -38, 0)
      uvs.push(f, 1, f, 0)
      if (i < segments) {
        const a = i * 2
        indices.push(a, a + 1, a + 2, a + 1, a + 3, a + 2)
      }
    }
    const g = new THREE.BufferGeometry()
    g.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3))
    g.setAttribute('uv', new THREE.Float32BufferAttribute(uvs, 2))
    g.setIndex(indices)
    g.computeBoundingSphere()
    return g
  }, [base, amp, seed])

  const uniforms = useMemo(
    () => ({
      uDeep: { value: dayDeep.clone() },
      uMist: { value: dayMist.clone() },
      uHaze: { value: dayHaze.clone() },
      uSunColor: { value: PALETTE.sunsetSun.clone() },
      uSunset: { value: 0 },
      uOpacity: { value: opacity },
    }),
    [dayDeep, dayMist, dayHaze, opacity]
  )

  useFrame(() => {
    if (!mat.current) return
    const t = visualState.sunset
    const u = mat.current.uniforms
    u.uDeep.value.copy(dayDeep).lerp(duskDeep, t)
    u.uMist.value.copy(dayMist).lerp(duskMist, t)
    u.uHaze.value.copy(dayHaze).lerp(duskHaze, t)
    u.uSunset.value = t
    u.uSunColor.value.copy(PALETTE.sunsetSun)
  })

  const onClick = (e: ThreeEvent<MouseEvent>) => {
    e.stopPropagation()
    if (sunsetMode || locked) return
    enterSunset()
  }

  return (
    <mesh geometry={geometry} position={[0, 0, z]} renderOrder={order} frustumCulled={false} onClick={onClick}>
      <shaderMaterial
        ref={mat}
        uniforms={uniforms}
        vertexShader={ridgeVertex}
        fragmentShader={ridgeFragment}
        side={THREE.DoubleSide}
      />
    </mesh>
  )
}

export function DistantRidges() {
  return (
    <group>
      <Ridge
        z={-168}
        base={6}
        amp={16}
        seed={4.7}
        deep="#223b38"
        mist="#728a83"
        haze="#aec2b9"
        deepDusk="#342c39"
        mistDusk="#9b776b"
        hazeDusk="#caa08a"
        opacity={0.95}
        order={-60}
      />
      <Ridge
        z={-238}
        base={14}
        amp={22}
        seed={8.1}
        deep="#35524d"
        mist="#8da39b"
        haze="#c4d3ca"
        deepDusk="#443741"
        mistDusk="#af8476"
        hazeDusk="#d5ab94"
        opacity={0.86}
        order={-61}
      />
      <Ridge
        z={-308}
        base={22}
        amp={30}
        seed={12.9}
        deep="#52706a"
        mist="#aebfb6"
        haze="#d5e0d7"
        deepDusk="#5a4750"
        mistDusk="#c19785"
        hazeDusk="#dfbaa1"
        opacity={0.72}
        order={-62}
      />
      <Ridge
        z={-378}
        base={32}
        amp={38}
        seed={17.3}
        deep="#768c85"
        mist="#cbd8cf"
        haze="#e4ebe3"
        deepDusk="#72595e"
        mistDusk="#d2ae99"
        hazeDusk="#ead0b6"
        opacity={0.55}
        order={-63}
      />
    </group>
  )
}
