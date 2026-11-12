import { useEffect, useRef, useState } from 'react'
import { getMemory } from '../data/memories'
import { useExperience } from '../store/useExperience'
import { useMemoryGallery } from '../photos/useMemoryGallery'

function Chevron({ dir }: { dir: 'left' | 'right' }) {
  return (
    <svg viewBox="0 0 24 24" width="20" height="20" fill="none" aria-hidden="true">
      <path
        d={dir === 'left' ? 'M15 5 8 12l7 7' : 'M9 5l7 7-7 7'}
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}

export function MemoryGallery() {
  const activeId = useExperience((s) => s.activeMemoryId)
  const open = useExperience((s) => s.galleryOpen)
  const index = useExperience((s) => s.galleryIndex)
  const setIndex = useExperience((s) => s.setGalleryIndex)
  const close = useExperience((s) => s.closeGallery)
  const openLightbox = useExperience((s) => s.openLightbox)
  const openPhotoManager = useExperience((s) => s.openPhotoManager)
  const memory = getMemory(activeId)
  const images = useMemoryGallery(activeId)
  const [render, setRender] = useState(false)
  const [visible, setVisible] = useState(false)
  const closeTimer = useRef<number | null>(null)

  useEffect(() => {
    if (open && memory) {
      if (closeTimer.current) window.clearTimeout(closeTimer.current)
      setRender(true)
      const id = requestAnimationFrame(() => setVisible(true))
      return () => cancelAnimationFrame(id)
    }
    setVisible(false)
    closeTimer.current = window.setTimeout(() => setRender(false), 420)
    return () => {
      if (closeTimer.current) window.clearTimeout(closeTimer.current)
    }
  }, [open, memory])

  const photo = images[Math.min(index, images.length - 1)]

  useEffect(() => {
    if (!open || images.length < 2) return
    const next = images[(index + 1) % images.length]
    if (!next) return
    const img = new Image()
    img.src = next.src
  }, [index, images, open])

  useEffect(() => {
    if (!open || !images.length) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'ArrowRight') setIndex((index + 1) % images.length)
      if (e.key === 'ArrowLeft') setIndex((index - 1 + images.length) % images.length)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open, index, images.length, setIndex])

  if (!render || !memory || !photo) return null
  const userCount = images.filter((i) => i.isUser).length

  return (
    <div
      className={`gallery-backdrop ${visible ? 'is-open' : ''}`}
      role="dialog"
      aria-modal="true"
      aria-label={`${memory.name}的照片`}
      onPointerDown={(e) => {
        if (e.target === e.currentTarget) close()
      }}
    >
      <article className="gallery" onPointerDown={(e) => e.stopPropagation()}>
        <div className="gallery__visual">
          <div className="gallery__image-wrap">
            <img
              key={photo.id}
              className="gallery__image"
              src={photo.src}
              alt={photo.alt}
              draggable={false}
              decoding="async"
            />
            <div className="gallery__image-shade" />
            <p className="gallery__caption">
              {photo.caption}
              {photo.isUser && <span className="gallery__user-badge">本机照片</span>}
            </p>
            <button
              type="button"
              className="gallery__zoom"
              onClick={() => openLightbox('memory')}
              aria-label="放大查看照片"
            >
              放大
            </button>
          </div>
          {images.length > 1 && (
            <>
              <button
                type="button"
                className="gallery__arrow is-left"
                onClick={() => setIndex((index - 1 + images.length) % images.length)}
                aria-label="上一张照片"
              >
                <Chevron dir="left" />
              </button>
              <button
                type="button"
                className="gallery__arrow is-right"
                onClick={() => setIndex((index + 1) % images.length)}
                aria-label="下一张照片"
              >
                <Chevron dir="right" />
              </button>
            </>
          )}
        </div>

        <div className="gallery__info">
          <button type="button" className="gallery__close" onClick={close} aria-label="关闭照片，回到物件">
            <span>回到物件</span>
            <i aria-hidden="true">×</i>
          </button>

          <div className="gallery__seal" aria-hidden="true">
            {memory.glyph}
          </div>
          <p className="gallery__en">{memory.en}</p>
          <h2 className="gallery__name">{memory.name}</h2>
          <p className="gallery__subtitle">{memory.subtitle}</p>
          <div className="gallery__rule" />
          <p className="gallery__description">{memory.description}</p>
          <blockquote className="gallery__quote">「{memory.quote}」</blockquote>

          <div className="gallery__manage">
            <button type="button" className="gallery__manage-btn" onClick={() => openPhotoManager(memory.id)}>
              添加照片
            </button>
            <button type="button" className="gallery__manage-btn" onClick={() => openPhotoManager(memory.id)}>
              照片管理
            </button>
            <span>{userCount ? `本机 ${userCount} 张` : '仅预设照片'}</span>
          </div>

          <div className="gallery__footer">
            <div className="gallery__dots" role="tablist" aria-label="照片切换">
              {images.map((im, i) => (
                <button
                  key={im.id}
                  type="button"
                  role="tab"
                  aria-selected={i === index}
                  aria-label={`第 ${i + 1} 张`}
                  className={i === index ? 'is-active' : ''}
                  onClick={() => setIndex(i)}
                />
              ))}
            </div>
            <span className="gallery__count">
              {String(index + 1).padStart(2, '0')} / {String(images.length).padStart(2, '0')}
            </span>
          </div>
          <p className="gallery__private">私人记忆 · 原图仅存于此设备</p>
        </div>
      </article>
    </div>
  )
}
