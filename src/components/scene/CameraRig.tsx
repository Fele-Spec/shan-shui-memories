import { useEffect, useMemo, useRef } from 'react'
import { useFrame, useThree } from '@react-three/fiber'
import * as THREE from 'three'
import { INITIAL_CAMERA, INITIAL_TARGET, visualState } from '../../lib/visualState'
import { groundAt } from '../../lib/terrain'
import { getMemory } from '../../data/memories'
import { useExperience } from '../../store/useExperience'

export function CameraRig() {
  const { camera, size } = useThree()
  const activeId = useExperience((s) => s.activeMemoryId)
  const sunsetMode = useExperience((s) => s.sunsetMode)
  const cameraRef = useRef(camera as THREE.PerspectiveCamera)
  const position = useRef(INITIAL_CAMERA.clone())
  const target = useRef(INITIAL_TARGET.clone())
  const desiredPos = useMemo(() => new THREE.Vector3(), [])
  const desiredTarget = useMemo(() => new THREE.Vector3(), [])
  const memoryVec = useMemo(() => new THREE.Vector3(), [])
  const debugCam = useMemo(() => {
    if (typeof window === 'undefined') return null
    const q = new URLSearchParams(window.location.search)
    const cam = q.get('cam')?.split(',').map(Number)
    const target = q.get('target')?.split(',').map(Number)
    return cam && target && cam.length === 3 && target.length === 3 ? { cam, target } : null
  }, [])

  useEffect(() => {
    cameraRef.current = camera as THREE.PerspectiveCamera
  }, [camera])

  useEffect(() => {
    const cam = cameraRef.current
    const mobile = size.width < 760 || size.height > size.width * 1.2
    cam.fov = mobile ? 100 : 55
    cam.updateProjectionMatrix()
  }, [size.width, size.height])

  const fovRef = useRef(55)

  useFrame((state, dt) => {
    const cam = cameraRef.current
    const mobile = size.width < 760 || size.height > size.width * 1.2
    const base = mobile ? new THREE.Vector3(0, 20, 65) : INITIAL_CAMERA
    const baseTarget = mobile ? new THREE.Vector3(0, 5, 8) : INITIAL_TARGET

    desiredPos.copy(base)
    desiredTarget.copy(baseTarget)
    if (debugCam) {
      desiredPos.set(debugCam.cam[0], debugCam.cam[1], debugCam.cam[2])
      desiredTarget.set(debugCam.target[0], debugCam.target[1], debugCam.target[2])
    }

    if (activeId && !debugCam) {
      const m = getMemory(activeId)
      if (m) {
        memoryVec.set(m.position[0], groundAt(m.position[0], m.position[2]) + m.focusHeight, m.position[2])
        if (m.cameraView) {
          desiredPos.set(...m.cameraView.position)
          desiredTarget.set(...m.cameraView.target)
          if (mobile) {
            // Composed close-ups need a little more breathing room on portrait.
            desiredPos.sub(desiredTarget).multiplyScalar(1.2).add(desiredTarget)
          }
        } else {
          const dirX = memoryVec.x - base.x
          const dirZ = memoryVec.z - base.z
          const len = Math.hypot(dirX, dirZ) || 1
          const dist = m.focusDistance * (mobile ? 1.18 : 1)
          desiredPos.set(
            memoryVec.x - (dirX / len) * dist,
            memoryVec.y + (mobile ? 2.2 : 2.8),
            memoryVec.z - (dirZ / len) * dist
          )
          desiredTarget.copy(memoryVec)
          desiredTarget.y -= m.focusHeight * 0.1
        }
      }
    } else if (sunsetMode) {
      desiredPos.set(mobile ? 0 : -2.2, mobile ? 12 : 6, mobile ? 86 : 66)
      desiredTarget.set(0, mobile ? 5 : 4, -8)
    }

    // Smooth, damped pointer parallax: strongest nearby, almost invisible far away.
    const px = visualState.smoothPointer.x
    const py = visualState.smoothPointer.y
    const parallaxScale = activeId ? 0.22 : sunsetMode ? 0.4 : 1
    desiredPos.x += px * 2.2 * parallaxScale
    desiredPos.y -= py * 0.75 * parallaxScale
    desiredTarget.x += px * 3.3 * parallaxScale
    desiredTarget.y -= py * 0.9 * parallaxScale

    // A very slow ambient breathing keeps the frame alive without drift.
    if (!visualState.reducedMotion) {
      desiredPos.x += Math.sin(state.clock.elapsedTime * 0.075) * 0.18
      desiredPos.y += Math.cos(state.clock.elapsedTime * 0.06) * 0.08
    }

    const memory = activeId ? getMemory(activeId) : null
    const speed = memory?.focusSpeed ?? 2.2
    const damp = 1 - Math.exp(-dt * (activeId ? speed : 1.55))
    position.current.lerp(desiredPos, damp)
    target.current.lerp(desiredTarget, damp)

    // Each exhibit can use its own lens: macro for pearls/beads, wider for bamboo.
    const baseFov = mobile ? 100 : 55
    const wantedFov =
      activeId && memory && !debugCam
        ? (memory.focusFov ?? 44) * (mobile ? 1.18 : 1)
        : baseFov
    const fovK = 1 - Math.exp(-dt * (activeId ? 3.2 : 2.4))
    fovRef.current += (wantedFov - fovRef.current) * fovK
    if (Math.abs(cam.fov - fovRef.current) > 0.01) {
      cam.fov = fovRef.current
      cam.updateProjectionMatrix()
    }

    cam.position.copy(position.current)
    cam.lookAt(target.current)
    visualState.cameraReady = true
  })

  return null
}




