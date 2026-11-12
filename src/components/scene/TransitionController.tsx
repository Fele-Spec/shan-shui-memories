import { useEffect, useRef } from 'react'
import { useFrame, useThree } from '@react-three/fiber'
import gsap from 'gsap'
import * as THREE from 'three'
import { visualState, prefersReducedMotion } from '../../lib/visualState'
import { useExperience } from '../../store/useExperience'
import { memories } from '../../data/memories'
import { groundAt } from '../../lib/terrain'

export function TransitionController() {
  const sunsetMode = useExperience((s) => s.sunsetMode)
  const showSunsetGallery = useExperience((s) => s.showSunsetGallery)
  const timer = useRef<number | null>(null)

  useEffect(() => {
    const duration = visualState.reducedMotion ? 0.8 : 3.0
    gsap.to(visualState, {
      sunset: sunsetMode ? 1 : 0,
      duration,
      ease: 'power2.inOut',
      overwrite: true,
    })
    if (timer.current) window.clearTimeout(timer.current)
    if (sunsetMode) {
      timer.current = window.setTimeout(() => {
        if (useExperience.getState().sunsetMode) showSunsetGallery()
      }, visualState.reducedMotion ? 900 : 3000)
    }
    return () => {
      if (timer.current) window.clearTimeout(timer.current)
    }
  }, [sunsetMode, showSunsetGallery])

  useEffect(() => {
    visualState.reducedMotion = prefersReducedMotion()
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)')
    const onChange = () => (visualState.reducedMotion = mq.matches)
    mq.addEventListener?.('change', onChange)
    return () => mq.removeEventListener?.('change', onChange)
  }, [])

  return null
}

export function PointerTracker() {
  useEffect(() => {
    let raf = 0
    const target = { x: 0, y: 0 }
    const onMove = (e: PointerEvent) => {
      target.x = (e.clientX / window.innerWidth) * 2 - 1
      target.y = (e.clientY / window.innerHeight) * 2 - 1
    }
    const onLeave = () => {
      target.x = 0
      target.y = 0
    }
    const tick = () => {
      visualState.smoothPointer.x += (target.x - visualState.smoothPointer.x) * 0.045
      visualState.smoothPointer.y += (target.y - visualState.smoothPointer.y) * 0.045
      raf = requestAnimationFrame(tick)
    }
    window.addEventListener('pointermove', onMove, { passive: true })
    window.addEventListener('pointerleave', onLeave)
    raf = requestAnimationFrame(tick)
    return () => {
      window.removeEventListener('pointermove', onMove)
      window.removeEventListener('pointerleave', onLeave)
      cancelAnimationFrame(raf)
    }
  }, [])
  return null
}

type DebugMemory = { id: string; x: number; y: number; visible: boolean }

declare global {
  interface Window {
    __SHANSHUI_DEBUG__?: {
      ready: boolean
      fps: number
      calls: number
      triangles: number
      dpr: number
      quality: string
      sunset: number
      activeMemory: string | null
      memories: DebugMemory[]
      camera: { x: number; y: number; z: number }
      frame: number
    }
  }
}

/**
 * Exposes a tiny, read-only debug surface for automated QA. Updated at most
 * four times per second and never through React state.
 */
export function SceneProbe() {
  const { gl, camera, size } = useThree()
  const frames = useRef(0)
  const fpsAcc = useRef(0)
  const fpsFrames = useRef(0)
  const last = useRef(performance.now())
  const projected = useRef<DebugMemory[]>([])

  useFrame(() => {
    frames.current++
    const now = performance.now()
    const dt = (now - last.current) / 1000
    last.current = now
    fpsAcc.current += dt
    fpsFrames.current++
    if (fpsAcc.current >= 0.5) {
      const fps = fpsFrames.current / fpsAcc.current
      fpsAcc.current = 0
      fpsFrames.current = 0
      visualState.debug.fps = Math.round(fps)
      visualState.debug.calls = gl.info.render.calls
      visualState.debug.triangles = gl.info.render.triangles
      visualState.debug.dpr = gl.getPixelRatio()
      visualState.debug.quality = useExperience.getState().quality

      const list: DebugMemory[] = []
      for (const m of memories) {
        const v = new THREE.Vector3(
          m.position[0],
          groundAt(m.position[0], m.position[2]) + m.focusHeight,
          m.position[2]
        )
        v.project(camera)
        list.push({
          id: m.id,
          x: ((v.x + 1) / 2) * size.width,
          y: ((1 - v.y) / 2) * size.height,
          visible: v.z < 1 && Math.abs(v.x) < 1.1 && Math.abs(v.y) < 1.1,
        })
      }
      projected.current = list

      window.__SHANSHUI_DEBUG__ = {
        ready: visualState.cameraReady,
        fps: visualState.debug.fps,
        calls: visualState.debug.calls,
        triangles: visualState.debug.triangles,
        dpr: visualState.debug.dpr,
        quality: visualState.debug.quality,
        sunset: visualState.sunset,
        activeMemory: useExperience.getState().activeMemoryId,
        memories: list,
        camera: { x: camera.position.x, y: camera.position.y, z: camera.position.z },
        frame: frames.current,
      }
    }
  })
  return null
}
