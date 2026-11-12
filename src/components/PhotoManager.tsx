import { useEffect, useMemo, useRef, useState } from 'react'
import { getMemory } from '../data/memories'
import { useExperience } from '../store/useExperience'
import { usePhotoLibrary } from '../photos/PhotoLibrary'
import { MAX_FILE_BYTES, type ImportMode } from '../lib/photoDb'

function formatSize(bytes: number) {
  if (bytes < 1024 * 1024) return `${Math.max(1, Math.round(bytes / 1024))} KB`
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`
}

export function PhotoManager() {
  const open = useExperience((s) => s.photoManagerOpen)
  const memoryId = useExperience((s) => s.photoManagerMemoryId)
  const close = useExperience((s) => s.closePhotoManager)
  const memory = getMemory(memoryId)
  const lib = usePhotoLibrary()
  const [busy, setBusy] = useState(false)
  const [status, setStatus] = useState<{ tone: 'info' | 'error'; text: string } | null>(null)
  const [drag, setDrag] = useState(false)
  const [confirmId, setConfirmId] = useState<string | null>(null)
  const [importMode, setImportMode] = useState<ImportMode>('skip')
  const uploadRef = useRef<HTMLInputElement>(null)
  const importRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (open) {
      setStatus(null)
      setConfirmId(null)
      void lib.refreshStorage()
    }
  }, [open]) // eslint-disable-line react-hooks/exhaustive-deps

  const photos = useMemo(
    () =>
      lib.records
        .filter((r) => r.memoryId === memoryId)
        .slice()
        .sort((a, b) => a.sortOrder - b.sortOrder),
    [lib.records, memoryId]
  )

  if (!open || !memory || !memoryId) return null

  const upload = async (files: FileList | File[]) => {
    if (!files.length || busy) return
    setBusy(true)
    setStatus({ tone: 'info', text: `正在读取 ${files.length} 张照片…` })
    try {
      const result = await lib.addFiles(memoryId, files)
      if (result.added) {
        setStatus({
          tone: result.errors.length ? 'error' : 'info',
          text: `已保存 ${result.added} 张${result.errors.length ? `；${result.errors.join('；')}` : ''}`,
        })
      } else {
        setStatus({ tone: 'error', text: result.errors.join('；') || '没有可用的照片' })
      }
    } catch (error) {
      setStatus({ tone: 'error', text: error instanceof Error ? error.message : '上传失败' })
    } finally {
      setBusy(false)
      if (uploadRef.current) uploadRef.current.value = ''
    }
  }

  const remove = async (id: string) => {
    setBusy(true)
    try {
      await lib.remove(id)
      setConfirmId(null)
      setStatus({ tone: 'info', text: '照片已从本机照片库删除' })
    } catch (error) {
      setStatus({ tone: 'error', text: error instanceof Error ? error.message : '删除失败' })
    } finally {
      setBusy(false)
    }
  }

  const replace = async (id: string, file: File) => {
    setBusy(true)
    try {
      await lib.replace(id, file)
      setStatus({ tone: 'info', text: '照片已替换，原图已更新' })
    } catch (error) {
      setStatus({ tone: 'error', text: error instanceof Error ? error.message : '替换失败' })
    } finally {
      setBusy(false)
    }
  }

  const exportLibrary = async () => {
    setBusy(true)
    setStatus({ tone: 'info', text: '正在打包照片与照片说明…' })
    try {
      await lib.exportLibrary()
      setStatus({ tone: 'info', text: '照片库备份已下载（JSON + 原图）' })
    } catch (error) {
      setStatus({ tone: 'error', text: error instanceof Error ? error.message : '导出失败' })
    } finally {
      setBusy(false)
    }
  }

  const importLibrary = async (file: File) => {
    setBusy(true)
    setStatus({ tone: 'info', text: '正在校验并导入备份…' })
    try {
      const result = await lib.importLibrary(file, importMode)
      setStatus({
        tone: result.errors.length ? 'error' : 'info',
        text: `导入 ${result.imported} 张，替换 ${result.replaced} 张，跳过 ${result.skipped} 张${result.errors.length ? `；${result.errors.slice(0, 2).join('；')}` : ''}`,
      })
    } catch (error) {
      setStatus({ tone: 'error', text: error instanceof Error ? error.message : '导入失败' })
    } finally {
      setBusy(false)
      if (importRef.current) importRef.current.value = ''
    }
  }

  const usagePct = lib.storage && lib.storage.quota ? Math.min(100, (lib.storage.usage / lib.storage.quota) * 100) : 0

  return (
    <div
      className="photo-manager-backdrop"
      role="dialog"
      aria-modal="true"
      aria-label={`${memory.name}照片管理`}
      onPointerDown={(e) => {
        if (e.target === e.currentTarget && !busy) close()
      }}
    >
      <section className="photo-manager" onPointerDown={(e) => e.stopPropagation()}>
        <header className="photo-manager__head">
          <div>
            <p className="photo-manager__eyebrow">PHOTO ARCHIVE · 照片库</p>
            <h2>
              {memory.name} <span>· {String(photos.length).padStart(2, '0')}</span>
            </h2>
          </div>
          <button type="button" className="photo-manager__close" onClick={close} aria-label="关闭照片管理">
            ×
          </button>
        </header>

        <div className="photo-manager__storage">
          <span>浏览器本地存储</span>
          <div className="photo-manager__bar">
            <i style={{ width: `${usagePct}%` }} />
          </div>
          <span>
            {lib.storage
              ? `${formatSize(lib.storage.usage)} / ${formatSize(lib.storage.quota)}`
              : 'IndexedDB · 仅存于此设备'}
          </span>
        </div>

        <div
          className={`photo-drop ${drag ? 'is-drag' : ''}`}
          onDragOver={(e) => {
            e.preventDefault()
            setDrag(true)
          }}
          onDragLeave={() => setDrag(false)}
          onDrop={(e) => {
            e.preventDefault()
            setDrag(false)
            void upload(e.dataTransfer.files)
          }}
        >
          <div className="photo-drop__mark" aria-hidden="true">＋</div>
          <div>
            <p>拖入照片，或从本机选择</p>
            <span>JPEG / PNG / WebP / AVIF · 单张不超过 {Math.round(MAX_FILE_BYTES / 1024 / 1024)}MB · 支持多选</span>
          </div>
          <button type="button" className="focus-btn focus-btn--primary" disabled={busy} onClick={() => uploadRef.current?.click()}>
            {busy ? '处理中…' : '选择照片'}
          </button>
          <input
            ref={uploadRef}
            type="file"
            accept="image/jpeg,image/png,image/webp,image/avif"
            multiple
            hidden
            onChange={(e) => e.target.files && upload(e.target.files)}
          />
        </div>

        {status && (
          <p className={`photo-manager__status ${status.tone === 'error' ? 'is-error' : ''}`} role="status" aria-live="polite">
            {status.text}
          </p>
        )}
        {lib.error && <p className="photo-manager__status is-error">照片库：{lib.error}</p>}

        <div className="photo-manager__list-head">
          <span>我的照片</span>
          <span>{photos.length} 张 · 原图保存在 IndexedDB</span>
        </div>

        {photos.length === 0 ? (
          <div className="photo-manager__empty">
            <span>此卷尚未添加照片</span>
            <p>选择或拖入照片后，刷新网页、关闭浏览器再打开，照片仍会保留在本机。</p>
          </div>
        ) : (
          <div className="photo-grid">
            {photos.map((photo, index) => {
              const url = lib.urls[photo.id]?.thumb
              return (
                <article className="photo-card" key={photo.id}>
                  <div className="photo-card__visual">
                    {url ? <img src={url} alt={photo.caption || photo.name} /> : <div className="photo-card__placeholder" />}
                    {photo.isCover && <span className="photo-card__cover">封面</span>}
                  </div>
                  <input
                    className="photo-card__caption"
                    defaultValue={photo.caption}
                    aria-label="照片说明"
                    maxLength={160}
                    onBlur={(e) => void lib.updateCaption(photo.id, e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') (e.target as HTMLInputElement).blur()
                    }}
                  />
                  <div className="photo-card__meta">
                    {photo.width}×{photo.height} · {formatSize(photo.fileSize)}
                  </div>
                  <div className="photo-card__actions">
                    <button type="button" onClick={() => void lib.setCover(photo.id)} disabled={photo.isCover || busy} title="设为封面">
                      封面
                    </button>
                    <button type="button" onClick={() => void lib.move(photo.id, -1)} disabled={index === 0 || busy} title="前移">
                      ←
                    </button>
                    <button type="button" onClick={() => void lib.move(photo.id, 1)} disabled={index === photos.length - 1 || busy} title="后移">
                      →
                    </button>
                    <label className={`photo-card__replace ${busy ? 'is-disabled' : ''}`}>
                      替换
                      <input
                        type="file"
                        accept="image/jpeg,image/png,image/webp,image/avif"
                        hidden
                        disabled={busy}
                        onChange={(e) => {
                          const file = e.target.files?.[0]
                          if (file) void replace(photo.id, file)
                          e.target.value = ''
                        }}
                      />
                    </label>
                    <a
                      className="photo-card__link"
                      href={lib.urls[photo.id]?.full}
                      target="_blank"
                      rel="noopener noreferrer"
                      title="查看原始清晰度"
                    >
                      原图
                    </a>
                    <button type="button" className="is-danger" onClick={() => setConfirmId(photo.id)} disabled={busy}>
                      删除
                    </button>
                  </div>
                  {confirmId === photo.id && (
                    <div className="photo-card__confirm">
                      <p>确定删除这张原图？</p>
                      <div>
                        <button type="button" onClick={() => setConfirmId(null)}>取消</button>
                        <button type="button" className="is-danger" onClick={() => void remove(photo.id)}>
                          确认删除
                        </button>
                      </div>
                    </div>
                  )}
                </article>
              )
            })}
          </div>
        )}

        <div className="photo-manager__presets">
          <span>预设照片 · {memory.images.length} 张（项目原始素材，只读）</span>
          <div>
            {memory.images.map((photo, index) => (
              <img key={photo.src} src={photo.src} alt={`预设照片 ${index + 1}`} />
            ))}
          </div>
        </div>

        <footer className="photo-manager__footer">
          <div className="photo-manager__io">
            <button type="button" className="focus-btn" onClick={() => void exportLibrary()} disabled={busy || photos.length === 0}>
              导出照片库
            </button>
            <div className="photo-manager__import">
              <select value={importMode} onChange={(e) => setImportMode(e.target.value as ImportMode)} aria-label="导入时重复照片处理方式">
                <option value="skip">重复项：跳过</option>
                <option value="replace">重复项：替换</option>
              </select>
              <button type="button" className="focus-btn" onClick={() => importRef.current?.click()} disabled={busy}>
                导入照片库
              </button>
            </div>
            <input
              ref={importRef}
              type="file"
              accept="application/json,.json"
              hidden
              onChange={(e) => e.target.files?.[0] && void importLibrary(e.target.files[0])}
            />
          </div>
          <button type="button" className="photo-manager__done" onClick={close}>
            完成
          </button>
        </footer>

      </section>
    </div>
  )
}

