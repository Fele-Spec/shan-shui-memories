import { useEffect, useRef } from 'react'
import { useFrame, useThree } from '@react-three/fiber'
import { Environment } from '@react-three/drei'
import * as THREE from 'three'
import { PALETTE, updateSunDirection, visualState } from '../../lib/visualState'
import { useExperience } from '../../store/useExperience'

const asset = (p: string) => `${import.meta.env.BASE_URL}${p.replace(/^\//, '')}`

export function Atmosphere() {
  const { scene, gl } = useThree()
  const quality = useExperience((s) => s.quality)
  const shadowSize = quality === 'high' ? 1536 : quality === 'medium' ? 1024 : 512
  const exposureScale =
    typeof window !== 'undefined'
      ? Number(new URLSearchParams(window.location.search).get('exposure') ?? 1) || 1
      : 1
  const sun = useRef<THREE.DirectionalLight>(null)
  const fill = useRef<THREE.DirectionalLight>(null)
  const hemi = useRef<THREE.HemisphereLight>(null)
  const target = useRef<THREE.Object3D>(null)

  const tmpSun = useRef(new THREE.Color('#fff1d3'))
  const tmpHemiSky = useRef(new THREE.Color('#c5ded8'))
  const tmpHemiGround = useRef(new THREE.Color('#26301f'))
  const tmpFog = useRef(new THREE.Color('#aec5c4'))
  const dayPos = useRef(new THREE.Vector3(62, 94, 38))
  const duskPos = useRef(new THREE.Vector3(-96, 24, -72))

  useEffect(() => {
    if (sun.current && target.current) sun.current.target = target.current
  }, [])

  useFrame(() => {
    const t = visualState.sunset
    if (sun.current) {
      sun.current.position.lerpVectors(dayPos.current, duskPos.current, t)
      tmpSun.current.set('#ffe4b8').lerp(new THREE.Color('#ffad63'), t)
      sun.current.color.copy(tmpSun.current)
      sun.current.intensity = THREE.MathUtils.lerp(4.6, 4.4, t)
    }
    if (fill.current) {
      fill.current.color.copy(new THREE.Color('#cfe3df').lerp(new THREE.Color('#d9916b'), t))
      fill.current.intensity = THREE.MathUtils.lerp(0.8, 0.7, t)
    }
    if (hemi.current) {
      tmpHemiSky.current.set('#b8d2cc').lerp(new THREE.Color('#e7a986'), t)
      tmpHemiGround.current.set('#202a1a').lerp(new THREE.Color('#34232b'), t)
      hemi.current.color.copy(tmpHemiSky.current)
      hemi.current.groundColor.copy(tmpHemiGround.current)
      hemi.current.intensity = THREE.MathUtils.lerp(1.9, 0.95, t)
    }
    const fog = scene.fog as THREE.Fog | null
    if (fog) {
      tmpFog.current.copy(PALETTE.fogDay).lerp(PALETTE.fogSunset, t)
      fog.color.copy(tmpFog.current)
      fog.near = THREE.MathUtils.lerp(82, 64, t)
      fog.far = THREE.MathUtils.lerp(305, 245, t)
    }
    gl.toneMappingExposure = THREE.MathUtils.lerp(1.72, 1.25, t) * exposureScale
  })

  // Keep the key light direction consistent with the sky's sun.
  useFrame(() => {
    if (!sun.current) return
    const dir = updateSunDirection()
    // Position is the visual sun; target sits in the valley. This gives long,
    // directional shadows rather than a fixed overhead shadow map.
    const targetPos = target.current?.position ?? new THREE.Vector3(0, 8, -20)
    sun.current.position.set(
      targetPos.x + dir.x * 120,
      Math.max(8, targetPos.y + dir.y * 120),
      targetPos.z + dir.z * 120
    )
  })

  return (
    <>
      <fog attach="fog" args={['#93afa8', 82, 305]} />
      <hemisphereLight ref={hemi} args={['#b8d2cc', '#202a1a', 0.85]} />
      <directionalLight
        ref={sun}
        position={[62, 94, 38]}
        intensity={3.4}
        color="#ffe4b8"
        castShadow
        shadow-mapSize-width={shadowSize}
        shadow-mapSize-height={shadowSize}
        shadow-camera-near={1}
        shadow-camera-far={340}
        shadow-camera-left={-110}
        shadow-camera-right={110}
        shadow-camera-top={120}
        shadow-camera-bottom={-110}
        shadow-bias={-0.00035}
        shadow-normalBias={0.55}
      />
      <object3D ref={target} position={[0, 8, -24]} />
      <directionalLight ref={fill} position={[-48, 22, 44]} intensity={0.95} color="#cfe3df" />
      <directionalLight position={[-74, 52, -92]} intensity={0.9} color="#bfd9d2" />
      <ambientLight intensity={0.24} color="#a9bbb2" />
      {!new URLSearchParams(window.location.search).has('noenv') && (
        <Environment
          files={asset('assets/hdri/partly_cloudy_1k.hdr')}
          background={false}
          environmentIntensity={0.08}
          environmentRotation={[0, 2.4, 0]}
        />
      )}
    </>
  )
}







