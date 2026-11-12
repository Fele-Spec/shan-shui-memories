import { useMemo, useRef } from 'react'
import { useFrame, useThree, type ThreeEvent } from '@react-three/fiber'
import { useTexture } from '@react-three/drei'
import * as THREE from 'three'
import { PALETTE, lerpColor, updateSunDirection, visualState } from '../../lib/visualState'
import { useExperience } from '../../store/useExperience'
import { skyFragment, skyVertex } from '../../shaders/sky'

export function SunGlow() {
  const tex = useTexture(`${import.meta.env.BASE_URL}assets/textures/glow.png`)
  const { camera } = useThree()
  const inner = useRef<THREE.Sprite>(null)
  const outer = useRef<THREE.Sprite>(null)
  const dir = useMemo(() => new THREE.Vector3(), [])
  const pos = useMemo(() => new THREE.Vector3(), [])

  useFrame(() => {
    updateSunDirection(dir)
    pos.copy(camera.position).addScaledVector(dir, 470)
    const t = visualState.sunset
    if (inner.current) {
      inner.current.position.copy(pos)
      ;(inner.current.material as THREE.SpriteMaterial).color
        .copy(PALETTE.sun)
        .lerp(PALETTE.sunsetSun, t)
        .multiplyScalar(1.6)
      ;(inner.current.material as THREE.SpriteMaterial).opacity = 0.24 + t * 0.22
    }
    if (outer.current) {
      outer.current.position.copy(pos)
      ;(outer.current.material as THREE.SpriteMaterial).color
        .copy(PALETTE.sun)
        .lerp(PALETTE.sunsetHorizon, t)
      ;(outer.current.material as THREE.SpriteMaterial).opacity = 0.13 + t * 0.12
    }
  })

  return (
    <group>
      <sprite ref={outer} scale={[180, 180, 1]} renderOrder={-900}>
        <spriteMaterial
          map={tex}
          color="#ffe3ae"
          transparent
          opacity={0.14}
          depthWrite={false}
          depthTest
          blending={THREE.AdditiveBlending}
          fog={false}
        />
      </sprite>
      <sprite ref={inner} scale={[46, 46, 1]} renderOrder={-899}>
        <spriteMaterial
          map={tex}
          color="#ffe6b6"
          transparent
          opacity={0.34}
          depthWrite={false}
          depthTest
          blending={THREE.AdditiveBlending}
          fog={false}
        />
      </sprite>
    </group>
  )
}

export function SkyDome() {
  const mat = useRef<THREE.ShaderMaterial>(null)
  const enterSunset = useExperience((s) => s.enterSunset)
  const sunsetMode = useExperience((s) => s.sunsetMode)
  const locked = useExperience((s) => s.interactionLocked)

  const uniforms = useMemo(
    () => ({
      uZenith: { value: PALETTE.skyZenith.clone() },
      uHorizon: { value: PALETTE.skyHorizon.clone() },
      uHaze: { value: PALETTE.skyHaze.clone() },
      uSunColor: { value: PALETTE.sun.clone() },
      uSunDir: { value: new THREE.Vector3(-0.2, 0.38, -0.91).normalize() },
      uCloudColor: { value: PALETTE.cloudDay.clone() },
      uSunset: { value: 0 },
      uTime: { value: 0 },
    }),
    []
  )

  useFrame((state, dt) => {
    if (!mat.current) return
    const t = visualState.sunset
    const u = mat.current.uniforms
    lerpColor(PALETTE.skyZenith, PALETTE.sunsetZenith, t, u.uZenith.value)
    lerpColor(PALETTE.skyHorizon, PALETTE.sunsetHorizon, t, u.uHorizon.value)
    lerpColor(PALETTE.skyHaze, PALETTE.sunsetHaze, t, u.uHaze.value)
    lerpColor(PALETTE.sun, PALETTE.sunsetSun, t, u.uSunColor.value)
    lerpColor(PALETTE.cloudDay, PALETTE.cloudSunset, t, u.uCloudColor.value)
    updateSunDirection(u.uSunDir.value)
    u.uSunset.value = t
    u.uTime.value += dt
  })

  const onClick = (e: ThreeEvent<MouseEvent>) => {
    e.stopPropagation()
    if (sunsetMode || locked) return
    enterSunset()
  }

  return (
    <mesh
      onClick={onClick}
      renderOrder={-1000}
      frustumCulled={false}
      rotation={[0, 0, 0]}
    >
      <sphereGeometry args={[600, 48, 32]} />
      <shaderMaterial
        ref={mat}
        uniforms={uniforms}
        vertexShader={skyVertex}
        fragmentShader={skyFragment}
        side={THREE.BackSide}
        depthWrite={false}
        depthTest={false}
        toneMapped
      />
    </mesh>
  )
}
