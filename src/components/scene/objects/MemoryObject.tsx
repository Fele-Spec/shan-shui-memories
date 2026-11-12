import { useEffect, useMemo, useRef, type ReactNode } from 'react'
import { Html } from '@react-three/drei'
import { useFrame, type ThreeEvent } from '@react-three/fiber'
import { useTexture } from '@react-three/drei'
import * as THREE from 'three'
import { groundAt } from '../../../lib/terrain'
import { getMemory, type MemoryId } from '../../../data/memories'
import { useExperience } from '../../../store/useExperience'

const asset = (p: string) => `${import.meta.env.BASE_URL}${p.replace(/^\//, '')}`

type Props = {
  id: MemoryId
  children: ReactNode
  hitRadius?: number
  hitCenterY?: number
  showBeacon?: boolean
}

/**
 * Shared hit target, hover feedback and label for all six memory objects.
 * The visible geometry lives in the child, so each object can keep its own
 * silhouette and material treatment.
 */
export function MemoryObject({ id, children, hitRadius, hitCenterY = 1.0, showBeacon = true }: Props) {
  const memory = getMemory(id)
  const group = useRef<THREE.Group>(null)
  const glow = useRef<THREE.Sprite>(null)
  const [glowTex] = useTexture([asset('assets/textures/glow.png')])
  const hovered = useExperience((s) => s.hoveredMemoryId === id)
  const active = useExperience((s) => s.activeMemoryId === id)
  const sunset = useExperience((s) => s.sunsetMode)
  const galleryOpen = useExperience((s) => s.galleryOpen)
  const setHover = useExperience((s) => s.setHoveredMemory)
  const focusMemory = useExperience((s) => s.focusMemory)
  const managerOpen = useExperience((s) => s.photoManagerOpen)

  const base = useMemo(() => {
    if (!memory) return new THREE.Vector3()
    return new THREE.Vector3(
      memory.position[0],
      groundAt(memory.position[0], memory.position[2]) + 0.04,
      memory.position[2]
    )
  }, [memory])

  const baseScale = memory?.scale ?? 1
  const hitR = hitRadius ?? memory?.hitRadius ?? 1.5

  useFrame((state, dt) => {
    if (!group.current) return
    const target = (hovered ? 1.035 : 1) * baseScale
    const k = 1 - Math.exp(-dt * 8)
    group.current.scale.x += (target - group.current.scale.x) * k
    group.current.scale.y += (target - group.current.scale.y) * k
    group.current.scale.z += (target - group.current.scale.z) * k
    if (glow.current) {
      const pulse = 0.68 + Math.sin(state.clock.elapsedTime * 1.5 + base.x) * 0.18
      ;(glow.current.material as THREE.SpriteMaterial).opacity = hovered ? 0.9 : pulse * 0.5
      glow.current.position.y = (memory?.focusHeight ?? 1.6) + 1.35 + Math.sin(state.clock.elapsedTime * 0.9 + base.z) * 0.06
    }
  })

  if (!memory) return null

  const onClick = (e: ThreeEvent<MouseEvent>) => {
    e.stopPropagation()
    if (sunset || galleryOpen || managerOpen) return
    focusMemory(id)
  }

  const onOver = (e: ThreeEvent<PointerEvent>) => {
    e.stopPropagation()
    if (sunset || galleryOpen || managerOpen) return
    setHover(id)
    document.body.style.cursor = 'pointer'
  }

  const onOut = (e: ThreeEvent<PointerEvent>) => {
    e.stopPropagation()
    setHover(null)
    document.body.style.cursor = ''
  }

  return (
    <group ref={group} position={base} rotation={[0, memory.rotationY, 0]} scale={baseScale}>
      <group onClick={onClick} onPointerOver={onOver} onPointerOut={onOut}>
        {children}
        {/* Invisible but raycastable hit volume. */}
        <mesh position={[0, hitCenterY, 0]}>
          <sphereGeometry args={[hitR, 12, 10]} />
          <meshBasicMaterial transparent opacity={0} depthWrite={false} colorWrite={false} />
        </mesh>
      </group>

      {showBeacon && (
        <sprite ref={glow} position={[0, (memory.focusHeight || 1.5) + 1.35, 0]} scale={[0.9, 0.9, 1]}>
          <spriteMaterial
            map={glowTex}
            color={memory.accent}
            transparent
            opacity={0.45}
            depthWrite={false}
            blending={THREE.AdditiveBlending}
          />
        </sprite>
      )}

      <Html
        position={[0, (memory.focusHeight || 1.5) + 2.2, 0]}
        center
        distanceFactor={22}
        zIndexRange={[30, 10]}
        style={{ pointerEvents: 'none' }}
      >
        <div className={`memory-label ${hovered ? 'is-visible' : ''} ${active ? 'is-active' : ''}`}>
          <span className="memory-label__glyph">{memory.glyph}</span>
          <span className="memory-label__name">{memory.name}</span>
          <span className="memory-label__en">{memory.en}</span>
        </div>
      </Html>
    </group>
  )
}

