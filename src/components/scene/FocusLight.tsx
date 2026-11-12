import { useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { getMemory } from '../../data/memories'
import { groundAt } from '../../lib/terrain'
import { useExperience } from '../../store/useExperience'

/**
 * A small local fill light that only exists while an object is focused.
 * It lifts the object off the landscape without changing global exposure.
 */
export function FocusLight() {
  const activeId = useExperience((s) => s.activeMemoryId)
  const focusMode = useExperience((s) => s.focusMode)
  const light = useRef<THREE.PointLight>(null)
  const target = useRef(new THREE.Vector3())
  const color = useRef(new THREE.Color('#f0d7a5'))

  useFrame((_, dt) => {
    if (!light.current) return
    const memory = focusMode ? getMemory(activeId) : null
    if (!memory) {
      light.current.intensity += (0 - light.current.intensity) * Math.min(1, dt * 5)
      return
    }
    const y = groundAt(memory.position[0], memory.position[2])
    target.current.set(memory.position[0], y + memory.focusHeight + 1.6, memory.position[2])
    light.current.position.lerp(target.current, Math.min(1, dt * 4))
    color.current.set(memory.accent)
    light.current.color.lerp(color.current, Math.min(1, dt * 4))
    light.current.intensity += (6.5 - light.current.intensity) * Math.min(1, dt * 4)
  })

  return (
    <pointLight
      ref={light}
      position={[0, 12, 20]}
      intensity={0}
      distance={13}
      decay={2}
      color="#f0d7a5"
      castShadow={false}
    />
  )
}

