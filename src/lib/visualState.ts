import * as THREE from 'three'

export type Vec2 = { x: number; y: number }

/**
 * Per-frame visual values live outside React state. GSAP mutates the few
 * tweened numbers; materials/useFrame read them directly, so a 60fps visual
 * transition never triggers a React render.
 */
export const visualState = {
  time: 0,
  sunset: 0,
  pointer: { x: 0, y: 0 } as Vec2,
  smoothPointer: { x: 0, y: 0 } as Vec2,
  cameraReady: false,
  reducedMotion: false,
  sunDirection: new THREE.Vector3(-0.45, 0.62, -0.65).normalize(),
  debug: {
    fps: 0,
    calls: 0,
    triangles: 0,
    dpr: 1,
    quality: 'high',
  },
}

export const INITIAL_CAMERA = new THREE.Vector3(0, 8, 70)
export const INITIAL_TARGET = new THREE.Vector3(0, 3, -5)

export const PALETTE = {
  skyZenith: new THREE.Color('#32647a'),
  skyHorizon: new THREE.Color('#c8d9d1'),
  skyHaze: new THREE.Color('#e7eadb'),
  sun: new THREE.Color('#ffe6b2'),
  fogDay: new THREE.Color('#b6c9c1'),
  waterDay: new THREE.Color('#19494c'),
  cloudDay: new THREE.Color('#f4f6ee'),

  sunsetZenith: new THREE.Color('#303b63'),
  sunsetHorizon: new THREE.Color('#f0a768'),
  sunsetHaze: new THREE.Color('#e7b18d'),
  sunsetSun: new THREE.Color('#ffce83'),
  fogSunset: new THREE.Color('#8e716e'),
  waterSunset: new THREE.Color('#6c4b4a'),
  cloudSunset: new THREE.Color('#efb08b'),
}

export function lerpColor(a: THREE.Color, b: THREE.Color, t: number, out: THREE.Color) {
  out.copy(a).lerp(b, t)
  return out
}

export function updateSunDirection(out = visualState.sunDirection) {
  const t = visualState.sunset
  // high, cool afternoon sun -> low, warm sun behind the western ridge
  out.set(
    THREE.MathUtils.lerp(-0.2, -0.88, t),
    THREE.MathUtils.lerp(0.38, 0.1, t),
    THREE.MathUtils.lerp(-0.91, -0.52, t)
  )
  return out.normalize()
}

export function prefersReducedMotion() {
  return window.matchMedia?.('(prefers-reduced-motion: reduce)').matches ?? false
}

export function isMobileViewport() {
  return window.matchMedia?.('(max-width: 760px)').matches ?? false
}







