import { Suspense, useEffect, useRef } from 'react'
import { Canvas, useFrame, useThree } from '@react-three/fiber'
import * as THREE from 'three'
import { Atmosphere } from './Atmosphere'
import { SkyDome, SunGlow } from './SkyDome'
import { Terrain } from './Terrain'
import { Clouds } from './Clouds'
import { River } from './River'
import { Bamboo, DistantForest, Pines, RiverGrass } from './Vegetation'
import { BankRocks, ScannedRockClusters } from './Rocks'
import { MemoryObjects } from './objects/MemoryObjects'
import { CameraRig } from './CameraRig'
import { FocusLight } from './FocusLight'
import { Landforms } from './Landforms'
import { Waterfalls } from './Waterfalls'
import { RiverRocks } from './RiverRocks'
import { Tributary } from './Tributary'
import { PointerTracker, SceneProbe, TransitionController } from './TransitionController'
import { PostFX } from './PostFX'
import { useExperience } from '../../store/useExperience'
import { visualState } from '../../lib/visualState'

function AdaptiveQuality() {
  const quality = useExperience((s) => s.quality)
  const setQuality = useExperience((s) => s.setQuality)
  const setDpr = useThree((s) => s.setDpr)
  const bad = useRef(0)
  const elapsed = useRef(0)
  const forced = useRef(
    typeof window !== 'undefined' && new URLSearchParams(window.location.search).has('quality')
  )

  useEffect(() => {
    if (quality === 'high') setDpr(Math.min(window.devicePixelRatio || 1, 1.6))
    else if (quality === 'medium') setDpr(Math.min(window.devicePixelRatio || 1, 1.25))
    else setDpr(1)
  }, [quality, setDpr])

  useFrame((_, dt) => {
    if (forced.current || quality === 'low') return
    elapsed.current += dt
    if (elapsed.current < 4) return
    if (visualState.debug.fps > 0 && visualState.debug.fps < (quality === 'high' ? 34 : 26)) {
      bad.current += dt
    } else {
      bad.current = Math.max(0, bad.current - dt * 0.6)
    }
    if (bad.current > 3) {
      bad.current = 0
      setQuality(quality === 'high' ? 'medium' : 'low')
    }
  })
  return null
}

const ENABLE_POST =
  typeof window !== 'undefined' && new URLSearchParams(window.location.search).get('post') === '1'

function SceneContents() {
  const hide = new Set(
    (typeof window !== 'undefined'
      ? new URLSearchParams(window.location.search).get('hide') ?? ''
      : ''
    ).split(',')
  )
  return (
    <>
      <Atmosphere />
      <SkyDome />
      <SunGlow />
      <Terrain />
      {!hide.has('clouds') && <Clouds />}
      <River />
      <Landforms />
      <Waterfalls />
      <RiverRocks />
      <Tributary />
      <BankRocks />
      <ScannedRockClusters />
      {!hide.has('veg') && <Bamboo />}
      {!hide.has('veg') && <Pines />}
      {!hide.has('veg') && <RiverGrass />}
      {!hide.has('forest') && !hide.has('veg') && <DistantForest />}
      <MemoryObjects />
      <FocusLight />
      <CameraRig />
      <TransitionController />
      <SceneProbe />
      <AdaptiveQuality />
      {ENABLE_POST && <PostFX />}
    </>
  )
}

export function Scene() {
  return (
    <Canvas
      id="landscape-canvas"
      className="landscape-canvas"
      shadows
      dpr={[1, 1.6]}
      camera={{ position: [0, 8, 70], fov: 55, near: 0.12, far: 1600 }}
      gl={{
        antialias: false,
        alpha: false,
        powerPreference: 'high-performance',
        preserveDrawingBuffer: true,
        toneMapping:
          typeof window !== 'undefined' &&
          new URLSearchParams(window.location.search).get('tone') === 'agx'
            ? THREE.AgXToneMapping
            : typeof window !== 'undefined' &&
                new URLSearchParams(window.location.search).get('tone') === 'linear'
              ? THREE.LinearToneMapping
              : typeof window !== 'undefined' &&
                  new URLSearchParams(window.location.search).get('tone') === 'reinhard'
                ? THREE.ReinhardToneMapping
                : THREE.ACESFilmicToneMapping,
        outputColorSpace: THREE.SRGBColorSpace,
      }}
      onCreated={({ gl, scene }) => {
        gl.shadowMap.type = THREE.PCFSoftShadowMap
        gl.setClearColor('#0b1718')
        scene.matrixWorldAutoUpdate = true
        ;(window as unknown as Record<string, unknown>).__SHANSHUI_SCENE__ = scene
        ;(window as unknown as Record<string, unknown>).__SHANSHUI_GL__ = gl
      }}
    >
      <PointerTracker />
      <Suspense fallback={null}>
        <SceneContents />
      </Suspense>
    </Canvas>
  )
}














