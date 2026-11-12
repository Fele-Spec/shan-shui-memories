import { MemoryObject } from './MemoryObject'
import { PoohModel } from './Pooh'
import { PearlModel } from './Pearl'
import { PerlerModel } from './Perler'
import { MicrophoneModel } from './Microphone'
import { LeopardModel } from './Leopard'
import { BambooLantern } from './BambooLantern'

export function MemoryObjects() {
  return (
    <group>
      <MemoryObject id="pooh" hitCenterY={1.2}>
        <PoohModel />
      </MemoryObject>
      <MemoryObject id="bamboo" hitCenterY={2.2} hitRadius={4.2}>
        <BambooLantern />
      </MemoryObject>
      <MemoryObject id="pearl" hitCenterY={0.9}>
        <PearlModel />
      </MemoryObject>
      <MemoryObject id="beads" hitCenterY={1.1}>
        <PerlerModel />
      </MemoryObject>
      <MemoryObject id="microphone" hitCenterY={1.2} hitRadius={1.25}>
        <MicrophoneModel />
      </MemoryObject>
      <MemoryObject id="leopard" hitCenterY={1.3} hitRadius={2.25}>
        <LeopardModel />
      </MemoryObject>
    </group>
  )
}
