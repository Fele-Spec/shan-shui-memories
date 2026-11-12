import { useMemo } from 'react'
import { getMemory, type MemoryId } from '../data/memories'
import { usePhotoLibrary } from '../photos/PhotoLibrary'

export type GalleryPhoto = {
  id: string
  src: string
  fullSrc: string
  alt: string
  caption: string
  isUser: boolean
  width?: number
  height?: number
}

/**
 * Built-in photos stay as committed project assets; uploaded photos live in
 * IndexedDB. The gallery always shows both, uploaded cover photos first.
 */
export function useMemoryGallery(memoryId: MemoryId | null) {
  const { records, urls } = usePhotoLibrary()
  return useMemo<GalleryPhoto[]>(() => {
    const memory = getMemory(memoryId)
    if (!memory) return []
    const user = records
      .filter((r) => r.memoryId === memoryId)
      .slice()
      .sort((a, b) => {
        if (a.isCover !== b.isCover) return a.isCover ? -1 : 1
        return a.sortOrder - b.sortOrder
      })
      .map((r) => ({
        id: r.id,
        src: urls[r.id]?.full ?? '',
        fullSrc: urls[r.id]?.full ?? '',
        alt: r.caption || r.name,
        caption: r.caption || r.name,
        isUser: true,
        width: r.width,
        height: r.height,
      }))
    const builtIn = memory.images.map((photo, index) => ({
      id: `builtin-${memory.id}-${index}`,
      src: photo.src,
      fullSrc: photo.src,
      alt: photo.alt,
      caption: photo.caption,
      isUser: false,
    }))
    return [...user, ...builtIn]
  }, [memoryId, records, urls])
}
