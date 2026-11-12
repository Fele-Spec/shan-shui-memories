import { useEffect, useState } from 'react'
import { sunsetPhotos } from '../data/sunset'
import { useExperience } from '../store/useExperience'

export function SunsetGallery() {
  const sunset = useExperience((s) => s.sunsetMode)
  const open = useExperience((s) => s.sunsetGalleryOpen)
  const index = useExperience((s) => s.sunsetIndex)
  const setIndex = useExperience((s) => s.setSunsetIndex)
  const exit = useExperience((s) => s.exitSunset)
  const openLightbox = useExperience((s) => s.openLightbox)
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    if (!open) {
      setVisible(false)
      return
    }
    const id = requestAnimationFrame(() => setVisible(true))
    return () => cancelAnimationFrame(id)
  }, [open])

  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'ArrowRight') setIndex((index + 1) % sunsetPhotos.length)
      if (e.key === 'ArrowLeft') setIndex((index - 1 + sunsetPhotos.length) % sunsetPhotos.length)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open, index, setIndex])

  if (!sunset) return null
  const photo = sunsetPhotos[index] ?? sunsetPhotos[0]

  return (
    <aside
      className={`sunset-gallery ${open && visible ? 'is-open' : ''}`}
      aria-label="晚霞摄影画廊"
      aria-hidden={!open}
    >
      <div className="sunset-gallery__head">
        <div>
          <p>FIVE VIEWS OF DUSK</p>
          <h2>暮色山水</h2>
        </div>
        <button type="button" className="sunset-gallery__exit" onClick={exit}>
          归山
          <i aria-hidden="true">↗</i>
        </button>
      </div>

      <button
        type="button"
        className="sunset-gallery__photo"
        onClick={() => openLightbox('sunset')}
        aria-label="放大查看晚霞照片"
      >
        <img key={photo.src} src={photo.src} alt={`${photo.title}，${photo.place}`} decoding="async" />
        <span className="sunset-gallery__photo-shade" />
        <span className="sunset-gallery__place">{photo.place}</span>
        <span className="sunset-gallery__title">{photo.title}</span>
        <span className="sunset-gallery__zoom">轻触放大</span>
      </button>

      <p className="sunset-gallery__caption">{photo.caption}</p>

      <div className="sunset-gallery__controls">
        <button
          type="button"
          onClick={() => setIndex((index - 1 + sunsetPhotos.length) % sunsetPhotos.length)}
          aria-label="上一张晚霞照片"
        >
          ←
        </button>
        <span>
          {String(index + 1).padStart(2, '0')} <i>/</i> {String(sunsetPhotos.length).padStart(2, '0')}
        </span>
        <button
          type="button"
          onClick={() => setIndex((index + 1) % sunsetPhotos.length)}
          aria-label="下一张晚霞照片"
        >
          →
        </button>
      </div>

      <div className="sunset-gallery__thumbs">
        {sunsetPhotos.map((p, i) => (
          <button
            key={p.src}
            type="button"
            className={i === index ? 'is-active' : ''}
            onClick={() => setIndex(i)}
            aria-label={`查看 ${p.title}`}
          >
            <img src={p.src} alt="" />
          </button>
        ))}
      </div>

      <p className="sunset-gallery__credit">
        摄影 · Willian Justen de Vasconcellos
        <span> / Pexels License</span>
      </p>
    </aside>
  )
}
