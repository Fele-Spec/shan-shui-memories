import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react'
import type { MemoryId } from '../data/memories'
import {
  checkQuota,
  createPhotoRecord,
  downloadBlob,
  exportPhotos,
  getAllPhotos,
  importPhotos,
  putPhoto,
  putPhotos,
  removePhotoRecord,
  replacePhotoRecord,
  storageEstimate,
  type ImportMode,
  type PhotoRecord,
} from '../lib/photoDb'

type UploadResult = { added: number; errors: string[] }

type PhotoLibraryValue = {
  records: PhotoRecord[]
  urls: Record<string, { thumb: string; full: string }>
  ready: boolean
  error: string | null
  storage: { usage: number; quota: number } | null
  addFiles: (memoryId: MemoryId, files: FileList | File[]) => Promise<UploadResult>
  remove: (id: string) => Promise<void>
  replace: (id: string, file: File) => Promise<void>
  updateCaption: (id: string, caption: string) => Promise<void>
  setCover: (id: string) => Promise<void>
  move: (id: string, direction: -1 | 1) => Promise<void>
  setSort: (memoryId: MemoryId, orderedIds: string[]) => Promise<void>
  exportLibrary: (memoryId?: MemoryId) => Promise<void>
  importLibrary: (file: File, mode: ImportMode) => Promise<{ imported: number; skipped: number; replaced: number; errors: string[] }>
  refreshStorage: () => Promise<void>
}

const PhotoLibraryContext = createContext<PhotoLibraryValue | null>(null)

export function PhotoLibraryProvider({ children }: { children: ReactNode }) {
  const [records, setRecords] = useState<PhotoRecord[]>([])
  const [urls, setUrls] = useState<Record<string, { thumb: string; full: string }>>({})
  const [ready, setReady] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [storage, setStorage] = useState<{ usage: number; quota: number } | null>(null)
  const urlsRef = useRef<Record<string, { thumb: string; full: string }>>({})

  const syncUrls = useCallback((next: PhotoRecord[]) => {
    const previous = urlsRef.current
    const made: Record<string, { thumb: string; full: string }> = {}
    for (const record of next) {
      const old = previous[record.id]
      made[record.id] = old ?? {
        thumb: URL.createObjectURL(record.thumbnailBlob),
        full: URL.createObjectURL(record.originalBlob),
      }
    }
    for (const [id, value] of Object.entries(previous)) {
      if (!made[id]) {
        URL.revokeObjectURL(value.thumb)
        URL.revokeObjectURL(value.full)
      }
    }
    urlsRef.current = made
    setUrls(made)
  }, [])

  const refresh = useCallback(async () => {
    try {
      const next = await getAllPhotos()
      setRecords(next)
      syncUrls(next)
      setError(null)
    } catch (e) {
      setError(e instanceof Error ? e.message : '照片库读取失败')
    } finally {
      setReady(true)
    }
  }, [syncUrls])

  const refreshStorage = useCallback(async () => {
    try {
      setStorage(await storageEstimate())
    } catch {
      setStorage(null)
    }
  }, [])

  useEffect(() => {
    void navigator.storage?.persist?.().catch(() => false)
    void refresh()
    void refreshStorage()
    return () => {
      for (const value of Object.values(urlsRef.current)) {
        URL.revokeObjectURL(value.thumb)
        URL.revokeObjectURL(value.full)
      }
      urlsRef.current = {}
    }
  }, [refresh, refreshStorage])

  const addFiles = useCallback(
    async (memoryId: MemoryId, files: FileList | File[]) => {
      const list = Array.from(files)
      const errors: string[] = []
      if (!list.length) return { added: 0, errors }
      const existingForMemory = records.filter((r) => r.memoryId === memoryId)
      let order = Math.max(0, ...existingForMemory.map((r) => r.sortOrder)) + 1
      const added: PhotoRecord[] = []
      const totalBytes = list.reduce((sum, file) => sum + file.size, 0)
      try {
        await checkQuota(totalBytes)
      } catch (e) {
        return { added: 0, errors: [e instanceof Error ? e.message : '存储空间检查失败'] }
      }
      for (const file of list) {
        try {
          const record = await createPhotoRecord(file, memoryId, order++)
          if (!existingForMemory.some((r) => r.isCover) && added.length === 0 && existingForMemory.length === 0) {
            record.isCover = true
          }
          await putPhoto(record)
          added.push(record)
        } catch (e) {
          errors.push(`${file.name}: ${e instanceof Error ? e.message : '无法读取图片'}`)
        }
      }
      if (added.length) {
        const next = [...records.filter((r) => !added.some((a) => a.id === r.id)), ...added]
        next.sort((a, b) => a.sortOrder - b.sortOrder)
        setRecords(next)
        syncUrls(next)
      }
      await refreshStorage()
      return { added: added.length, errors }
    },
    [records, syncUrls, refreshStorage]
  )

  const remove = useCallback(
    async (id: string) => {
      await removePhotoRecord(id)
      const next = records.filter((r) => r.id !== id)
      setRecords(next)
      syncUrls(next)
      await refreshStorage()
    },
    [records, syncUrls, refreshStorage]
  )

  const replace = useCallback(
    async (id: string, file: File) => {
      const record = records.find((r) => r.id === id)
      if (!record) throw new Error('照片不存在')
      const nextRecord = await replacePhotoRecord(record, file)
      await putPhoto(nextRecord)
      const next = records.map((r) => (r.id === id ? nextRecord : r))
      setRecords(next)
      syncUrls(next)
      await refreshStorage()
    },
    [records, syncUrls, refreshStorage]
  )

  const updateCaption = useCallback(
    async (id: string, caption: string) => {
      const record = records.find((r) => r.id === id)
      if (!record) return
      const nextRecord = { ...record, caption: caption.slice(0, 160) }
      await putPhoto(nextRecord)
      setRecords(records.map((r) => (r.id === id ? nextRecord : r)))
    },
    [records]
  )

  const setCover = useCallback(
    async (id: string) => {
      const target = records.find((r) => r.id === id)
      if (!target) return
      const next = records.map((r) => ({
        ...r,
        isCover: r.id === id ? true : r.memoryId === target.memoryId ? false : r.isCover,
      }))
      await putPhotos(next.filter((r) => r.memoryId === target.memoryId))
      setRecords(next)
    },
    [records]
  )

  const move = useCallback(
    async (id: string, direction: -1 | 1) => {
      const target = records.find((r) => r.id === id)
      if (!target) return
      const group = records
        .filter((r) => r.memoryId === target.memoryId)
        .sort((a, b) => a.sortOrder - b.sortOrder)
      const index = group.findIndex((r) => r.id === id)
      const other = group[index + direction]
      if (!other) return
      const a = { ...target, sortOrder: other.sortOrder }
      const b = { ...other, sortOrder: target.sortOrder }
      await putPhotos([a, b])
      setRecords(records.map((r) => (r.id === a.id ? a : r.id === b.id ? b : r)).sort((x, y) => x.sortOrder - y.sortOrder))
    },
    [records]
  )

  const setSort = useCallback(
    async (memoryId: MemoryId, orderedIds: string[]) => {
      const next = records.map((r) => {
        if (r.memoryId !== memoryId) return r
        const index = orderedIds.indexOf(r.id)
        return index >= 0 ? { ...r, sortOrder: index + 1 } : r
      })
      await putPhotos(next.filter((r) => memoryId === r.memoryId))
      setRecords(next.sort((a, b) => a.sortOrder - b.sortOrder))
    },
    [records]
  )

  const exportLibrary = useCallback(
    async (memoryId?: MemoryId) => {
      const selected = memoryId ? records.filter((r) => r.memoryId === memoryId) : records
      const backup = await exportPhotos(selected)
      const blob = new Blob([JSON.stringify(backup)], { type: 'application/json' })
      const stamp = new Date().toISOString().slice(0, 10)
      downloadBlob(blob, `landscape-memories-backup-${stamp}.json`)
    },
    [records]
  )

  const importLibrary = useCallback(
    async (file: File, mode: ImportMode) => {
      const result = await importPhotos(file, records, mode)
      if (result.records.length) {
        const merged = [...records.filter((r) => !result.records.some((x) => x.id === r.id)), ...result.records]
        merged.sort((a, b) => a.sortOrder - b.sortOrder)
        setRecords(merged)
        syncUrls(merged)
      }
      await refreshStorage()
      return { imported: result.imported, skipped: result.skipped, replaced: result.replaced, errors: result.errors }
    },
    [records, syncUrls, refreshStorage]
  )

  const value = useMemo<PhotoLibraryValue>(
    () => ({
      records,
      urls,
      ready,
      error,
      storage,
      addFiles,
      remove,
      replace,
      updateCaption,
      setCover,
      move,
      setSort,
      exportLibrary,
      importLibrary,
      refreshStorage,
    }),
    [
      records,
      urls,
      ready,
      error,
      storage,
      addFiles,
      remove,
      replace,
      updateCaption,
      setCover,
      move,
      setSort,
      exportLibrary,
      importLibrary,
      refreshStorage,
    ]
  )

  return <PhotoLibraryContext.Provider value={value}>{children}</PhotoLibraryContext.Provider>
}

export function usePhotoLibrary() {
  const context = useContext(PhotoLibraryContext)
  if (!context) throw new Error('usePhotoLibrary must be used inside PhotoLibraryProvider')
  return context
}




