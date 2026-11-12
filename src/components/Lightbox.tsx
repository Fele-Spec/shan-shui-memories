import { useEffect } from 'react'
import { getMemory } from '../data/memories'
import { sunsetPhotos } from '../data/sunset'
import { useExperience } from '../store/useExperience'
import { useMemoryGallery } from '../photos/useMemoryGallery'

export function Lightbox() {
  const open = useExperience((s) => s.lightboxOpen)
  const source = useExperience((s) => s.lightboxSource)
  const activeId = useExperience((s) => s.activeMemoryId)
  const galleryIndex = useExperience((s) => s.galleryIndex)
  const setGalleryIndex = useExperience((s) => s.setGalleryIndex)
  const sunsetIndex = useExperience((s) => s.sunsetIndex)
  const setSunsetIndex = useExperience((s) => s.setSunsetIndex)
  const close = useExperience((s) => s.closeLightbox)

  const memory = getMemory(activeId)
  const memoryPhotos = useMemoryGallery(activeId)
  const list = source === 'sunset' ? sunsetPhotos : memoryPhotos
  const index = source === 'sunset' ? sunsetIndex : galleryIndex
  const photo = list[Math.min(index, list.length - 1)]

  useEffect(() => {
    if (!open || !list.length) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== 'ArrowRight' && e.key !== 'ArrowLeft') return
      const dir = e.key === 'ArrowRight' ? 1 : -1
      if (source === 'sunset') setSunsetIndex((sunsetIndex + dir + sunsetPhotos.length) % sunsetPhotos.length)
      else setGalleryIndex((galleryIndex + dir + list.length) % list.length)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open, source, sunsetIndex, galleryIndex, list.length, setGalleryIndex, setSunsetIndex])

  if (!open || !photo) return null

  const isSunset = source === 'sunset'
  const title = isSunset ? (photo as (typeof sunsetPhotos)[number]).title : memory?.name
  const caption = isSunset
    ? `${(photo as (typeof sunsetPhotos)[number]).place} · ${(photo as (typeof sunsetPhotos)[number]).caption}`
    : (photo as { caption: string }).caption
  const alt = 'alt' in photo ? photo.alt : title ?? '照片'

  const go = (dir: 1 | -1) => {
    if (isSunset) setSunsetIndex((sunsetIndex + dir + sunsetPhotos.length) % sunsetPhotos.length)
    else setGalleryIndex((galleryIndex + dir + list.length) % list.length)
  }

  return (
    <div
      className="lightbox is-open"
      role="dialog"
      aria-modal="true"
      aria-label="照片放大查看"
      onClick={close}
    >
      <button type="button" className="lightbox__close" onClick={close} aria-label="关闭放大照片">
        ×
      </button>
      {list.length > 1 && (
        <>
          <button
            type="button"
            className="lightbox__arrow is-left"
            onClick={(e) => {
              e.stopPropagation()
              go(-1)
            }}
            aria-label="上一张"
          >
            ←
          </button>
          <button
            type="button"
            className="lightbox__arrow is-right"
            onClick={(e) => {
              e.stopPropagation()
              go(1)
            }}
            aria-label="下一张"
          >
            →
          </button>
        </>
      )}
      <figure className="lightbox__figure" onClick={(e) => e.stopPropagation()}>
        <img src={photo.src} alt={alt} draggable={false} />
        <figcaption>
          <strong>{title}</strong>
          <span>{caption}</span>
          {'width' in photo && photo.width ? (
            <small>
              {photo.width} × {photo.height}
            </small>
          ) : null}
        </figcaption>
      </figure>
      <p className="lightbox__hint">ESC 关闭 · ← → 切换</p>
    </div>
  )
}
