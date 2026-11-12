import { useMemo, useRef, type ElementRef } from 'react'
import { useFrame, useThree, type ThreeEvent } from '@react-three/fiber'
import { useTexture } from '@react-three/drei'
import { MeshReflectorMaterial } from '@react-three/drei'
import * as THREE from 'three'
import { DEM, WORLD } from '../../lib/terrain'
import { PALETTE, visualState } from '../../lib/visualState'
import { useExperience } from '../../store/useExperience'
import { waterDetailFragment, waterDetailVertex } from '../../shaders/waterSurface'

const asset = (p: string) => `${import.meta.env.BASE_URL}${p.replace(/^\//, '')}`

function WaterSurfaceDetails() {
  const mat = useRef<THREE.ShaderMaterial>(null)
  const enterSunset = useExperience((s) => s.enterSunset)
  const sunsetMode = useExperience((s) => s.sunsetMode)
  const locked = useExperience((s) => s.interactionLocked)
  const [mask, foam, height, flow] = useTexture([
    asset('assets/dem/xingping_crop_river_mask.png'),
    asset('assets/dem/xingping_crop_river_foam.png'),
    asset('assets/dem/xingping_crop_height8.png'),
    asset('assets/dem/xingping_crop_flow.png'),
  ])

  const uniforms = useMemo(() => {
    for (const t of [mask, foam, height, flow]) {
      t.wrapS = t.wrapT = THREE.ClampToEdgeWrapping
      t.colorSpace = THREE.NoColorSpace
      t.flipY = false
      t.needsUpdate = true
    }
    return {
      uMask: { value: mask },
      uFoam: { value: foam },
      uHeight: { value: height },
      uFlow: { value: flow },
      uWorldMin: { value: new THREE.Vector3(WORLD.xMin, 0, WORLD.zMin) },
      uWorldSize: { value: new THREE.Vector2(WORLD.xMax - WORLD.xMin, WORLD.zMax - WORLD.zMin) },
      uWaterElev: { value: DEM.waterElev },
      uTime: { value: 0 },
      uSunset: { value: 0 },
    }
  }, [mask, foam, height, flow])

  useFrame((_, dt) => {
    if (!mat.current) return
    mat.current.uniforms.uTime.value += dt
    mat.current.uniforms.uSunset.value = visualState.sunset
  })

  const onClick = (e: ThreeEvent<MouseEvent>) => {
    e.stopPropagation()
    if (sunsetMode || locked) return
    enterSunset()
  }

  return (
    <mesh
      rotation={[-Math.PI / 2, 0, 0]}
      position={[0, WORLD.waterY + 0.012, -41]}
      onClick={onClick}
      renderOrder={9}
    >
      <planeGeometry args={[220, 230, 1, 1]} />
      <shaderMaterial
        ref={mat}
        uniforms={uniforms}
        vertexShader={waterDetailVertex}
        fragmentShader={waterDetailFragment}
        transparent
        depthWrite={false}
        side={THREE.DoubleSide}
        blending={THREE.NormalBlending}
      />
    </mesh>
  )
}

export function River() {
  const normalSource = useTexture(asset('assets/textures/water_normal.png'))
  const { gl } = useThree()
  const mat = useRef<ElementRef<typeof MeshReflectorMaterial>>(null)
  const enterSunset = useExperience((s) => s.enterSunset)
  const sunsetMode = useExperience((s) => s.sunsetMode)
  const locked = useExperience((s) => s.interactionLocked)

  const normalMap = useMemo(() => {
    const t = normalSource.clone()
    t.wrapS = t.wrapT = THREE.RepeatWrapping
    t.repeat.set(18, 34)
    t.anisotropy = Math.min(8, gl.capabilities.getMaxAnisotropy())
    t.colorSpace = THREE.NoColorSpace
    t.needsUpdate = true
    return t
  }, [normalSource, gl])

  useFrame((_, dt) => {
    normalMap.offset.x += dt * 0.008
    normalMap.offset.y -= dt * 0.018
    if (mat.current) {
      const t = visualState.sunset
      mat.current.color.copy(PALETTE.waterDay).lerp(PALETTE.waterSunset, t)
      mat.current.roughness = 0.08 + t * 0.05
      mat.current.envMapIntensity = 0.8 - t * 0.2
    }
  })

  const onClick = (e: ThreeEvent<MouseEvent>) => {
    e.stopPropagation()
    if (sunsetMode || locked) return
    enterSunset()
  }

  return (
    <group>
      <mesh
        rotation={[-Math.PI / 2, 0, 0]}
        position={[0, WORLD.waterY, -41]}
        onClick={onClick}
        receiveShadow
        renderOrder={5}
      >
        <planeGeometry args={[220, 230, 1, 1]} />
        <MeshReflectorMaterial
          ref={mat}
          resolution={384}
          mirror={0.72}
          mixBlur={1.2}
          mixStrength={2.2}
          blur={[150, 55]}
          depthScale={0.9}
          minDepthThreshold={0.6}
          maxDepthThreshold={1.6}
          depthToBlurRatioBias={0.24}
          distortion={0.03}
          distortionMap={normalMap}
          normalMap={normalMap}
          normalScale={new THREE.Vector2(0.52, 0.52)}
          color="#3a6b64"
          metalness={0.28}
          roughness={0.055}
          envMapIntensity={1.15}
        />
      </mesh>
      <WaterSurfaceDetails />
    </group>
  )
}




