import { useMemo } from 'react'
import { getMemory } from '../data/memories'
import { useExperience } from '../store/useExperience'
import { usePhotoLibrary } from '../photos/PhotoLibrary'

export function FocusOverlay() {
  const activeId = useExperience((s) => s.activeMemoryId)
  const focusMode = useExperience((s) => s.focusMode)
  const galleryOpen = useExperience((s) => s.galleryOpen)
  const managerOpen = useExperience((s) => s.photoManagerOpen)
  const openGallery = useExperience((s) => s.openGallery)
  const openPhotoManager = useExperience((s) => s.openPhotoManager)
  const exitFocus = useExperience((s) => s.exitFocus)
  const { records } = usePhotoLibrary()
  const memory = getMemory(activeId)

  const userCount = useMemo(
    () => (activeId ? records.filter((r) => r.memoryId === activeId).length : 0),
    [records, activeId]
  )

  if (!memory || !focusMode || galleryOpen || managerOpen) return null
  const count = memory.images.length + userCount

  return (
    <div className="focus-layer">
      <div className="focus-veil" aria-hidden="true" />
      <aside className="focus-panel" role="region" aria-label={`${memory.name}聚焦`}>
        <p className="focus-panel__eyebrow">OBJECT FOCUS · 近观</p>
        <div className="focus-panel__title">
          <span className="focus-panel__seal">{memory.glyph}</span>
          <div>
            <h2>{memory.name}</h2>
            <p>{memory.en}</p>
          </div>
        </div>
        <p className="focus-panel__hint">再次点击物件，或按「查看照片」，展开这一卷记忆。</p>
        <div className="focus-panel__actions">
          <button type="button" className="focus-btn focus-btn--primary" onClick={openGallery}>
            查看照片 <span>{String(count).padStart(2, '0')}</span>
          </button>
          <button type="button" className="focus-btn" onClick={() => openPhotoManager(memory.id)}>
            添加照片
          </button>
          <button type="button" className="focus-btn" onClick={() => openPhotoManager(memory.id)}>
            照片管理
          </button>
        </div>
        <div className="focus-panel__footer">
          <span className="focus-panel__count">已收录 {count} 张</span>
          <button type="button" className="focus-panel__back" onClick={exitFocus}>
            返回山水
          </button>
        </div>
      </aside>
      <p className="focus-reclick">
        <span className="focus-reclick__dot" />
        再次点击「{memory.name}」查看照片
      </p>
    </div>
  )
}
