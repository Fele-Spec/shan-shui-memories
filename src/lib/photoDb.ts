import type { MemoryId } from '../data/memories'

export const DB_NAME = 'landscape-memories-db'
export const DB_VERSION = 1
export const STORE_NAME = 'photos'
export const MAX_FILE_BYTES = 20 * 1024 * 1024
export const ALLOWED_MIME = new Set(['image/jpeg', 'image/png', 'image/webp', 'image/avif'])
export const ALLOWED_EXT = /\.(jpe?g|png|webp|avif)$/i
export const MEMORY_IDS: MemoryId[] = ['pooh', 'bamboo', 'pearl', 'beads', 'microphone', 'leopard']

export type PhotoRecord = {
  id: string
  memoryId: MemoryId
  name: string
  originalBlob: Blob
  thumbnailBlob: Blob
  mimeType: string
  width: number
  height: number
  fileSize: number
  createdAt: number
  sortOrder: number
  isCover: boolean
  caption: string
}

export type PhotoBackup = {
  app: 'landscape-memories'
  version: 1
  exportedAt: string
  records: Array<Omit<PhotoRecord, 'originalBlob' | 'thumbnailBlob'> & {
    originalData: string
    thumbnailData: string
  }>
}

let dbPromise: Promise<IDBDatabase> | null = null

function openDB() {
  if (dbPromise) return dbPromise
  dbPromise = new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION)
    request.onupgradeneeded = () => {
      const db = request.result
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        const store = db.createObjectStore(STORE_NAME, { keyPath: 'id' })
        store.createIndex('memoryId', 'memoryId')
        store.createIndex('sortOrder', 'sortOrder')
      }
    }
    request.onsuccess = () => resolve(request.result)
    request.onerror = () => reject(request.error ?? new Error('IndexedDB open failed'))
    request.onblocked = () => reject(new Error('IndexedDB blocked by another tab'))
  })
  return dbPromise
}

function txDone(tx: IDBTransaction) {
  return new Promise<void>((resolve, reject) => {
    tx.oncomplete = () => resolve()
    tx.onerror = () => reject(tx.error ?? new Error('IndexedDB transaction failed'))
    tx.onabort = () => reject(tx.error ?? new Error('IndexedDB transaction aborted'))
  })
}

export async function getAllPhotos(): Promise<PhotoRecord[]> {
  const db = await openDB()
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readonly')
    const req = tx.objectStore(STORE_NAME).getAll()
    req.onsuccess = () => resolve((req.result as PhotoRecord[]).sort((a, b) => a.sortOrder - b.sortOrder))
    req.onerror = () => reject(req.error)
  })
}

export async function putPhoto(record: PhotoRecord) {
  const db = await openDB()
  const tx = db.transaction(STORE_NAME, 'readwrite')
  tx.objectStore(STORE_NAME).put(record)
  await txDone(tx)
}

export async function putPhotos(records: PhotoRecord[]) {
  const db = await openDB()
  const tx = db.transaction(STORE_NAME, 'readwrite')
  const store = tx.objectStore(STORE_NAME)
  for (const record of records) store.put(record)
  await txDone(tx)
}

export async function removePhotoRecord(id: string) {
  const db = await openDB()
  const tx = db.transaction(STORE_NAME, 'readwrite')
  tx.objectStore(STORE_NAME).delete(id)
  await txDone(tx)
}

export async function clearAllPhotos() {
  const db = await openDB()
  const tx = db.transaction(STORE_NAME, 'readwrite')
  tx.objectStore(STORE_NAME).clear()
  await txDone(tx)
}

export function validateFile(file: File) {
  if (file.size <= 0) return '文件为空'
  if (file.size > MAX_FILE_BYTES) return `文件超过 20MB（${(file.size / 1024 / 1024).toFixed(1)}MB）`
  const byMime = file.type && ALLOWED_MIME.has(file.type)
  const byExt = ALLOWED_EXT.test(file.name)
  if (!byMime && !byExt) return '仅支持 JPEG / PNG / WebP / AVIF，不接受 SVG'
  if (/svg/i.test(file.type) || /\.svg$/i.test(file.name)) return '出于安全原因不接受 SVG'
  return null
}

async function decodeImage(file: File) {
  const bitmap = await createImageBitmap(file)
  return bitmap
}

async function makeThumbnail(bitmap: ImageBitmap) {
  const max = 640
  const scale = Math.min(1, max / Math.max(bitmap.width, bitmap.height))
  const w = Math.max(1, Math.round(bitmap.width * scale))
  const h = Math.max(1, Math.round(bitmap.height * scale))
  const canvas = document.createElement('canvas')
  canvas.width = w
  canvas.height = h
  const ctx = canvas.getContext('2d')
  if (!ctx) throw new Error('无法创建缩略图')
  ctx.imageSmoothingQuality = 'high'
  ctx.drawImage(bitmap, 0, 0, w, h)
  const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, 'image/jpeg', 0.84))
  if (!blob) throw new Error('缩略图生成失败')
  return blob
}

export function makeId() {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) return crypto.randomUUID()
  return `photo-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`
}

export async function createPhotoRecord(
  file: File,
  memoryId: MemoryId,
  sortOrder: number,
  caption?: string
): Promise<PhotoRecord> {
  const invalid = validateFile(file)
  if (invalid) throw new Error(invalid)
  const bitmap = await decodeImage(file)
  try {
    if (bitmap.width < 8 || bitmap.height < 8) throw new Error('图片尺寸过小')
    const thumbnailBlob = await makeThumbnail(bitmap)
    return {
      id: makeId(),
      memoryId,
      name: file.name,
      originalBlob: file,
      thumbnailBlob,
      mimeType: file.type || 'image/jpeg',
      width: bitmap.width,
      height: bitmap.height,
      fileSize: file.size,
      createdAt: Date.now(),
      sortOrder,
      isCover: false,
      caption: caption ?? file.name.replace(ALLOWED_EXT, '').slice(0, 80),
    }
  } finally {
    bitmap.close?.()
  }
}

export async function checkQuota(extraBytes: number) {
  if (!navigator.storage?.estimate) return
  const { usage = 0, quota = 0 } = await navigator.storage.estimate()
  if (quota > 0 && usage + extraBytes > quota * 0.92) {
    throw new Error(`浏览器存储空间不足：已用 ${(usage / 1024 / 1024).toFixed(0)}MB / ${(quota / 1024 / 1024).toFixed(0)}MB`)
  }
}

export async function storageEstimate() {
  if (!navigator.storage?.estimate) return null
  const { usage = 0, quota = 0 } = await navigator.storage.estimate()
  return { usage, quota }
}

export async function replacePhotoRecord(record: PhotoRecord, file: File) {
  const invalid = validateFile(file)
  if (invalid) throw new Error(invalid)
  const bitmap = await decodeImage(file)
  try {
    const thumbnailBlob = await makeThumbnail(bitmap)
    return {
      ...record,
      name: file.name,
      originalBlob: file,
      thumbnailBlob,
      mimeType: file.type || 'image/jpeg',
      width: bitmap.width,
      height: bitmap.height,
      fileSize: file.size,
    }
  } finally {
    bitmap.close?.()
  }
}

function blobToBase64(blob: Blob) {
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(String(reader.result))
    reader.onerror = () => reject(reader.error)
    reader.readAsDataURL(blob)
  })
}

export async function exportPhotos(records: PhotoRecord[]): Promise<PhotoBackup> {
  const out: PhotoBackup['records'] = []
  for (const r of records) {
    out.push({
      id: r.id,
      memoryId: r.memoryId,
      name: r.name,
      mimeType: r.mimeType,
      width: r.width,
      height: r.height,
      fileSize: r.fileSize,
      createdAt: r.createdAt,
      sortOrder: r.sortOrder,
      isCover: r.isCover,
      caption: r.caption,
      originalData: await blobToBase64(r.originalBlob),
      thumbnailData: await blobToBase64(r.thumbnailBlob),
    })
  }
  return { app: 'landscape-memories', version: 1, exportedAt: new Date().toISOString(), records: out }
}

function dataUrlToBlob(data: string) {
  const match = /^data:([^;,]+);base64,(.+)$/s.exec(data)
  if (!match) throw new Error('备份中的图片数据格式错误')
  const mime = match[1].toLowerCase()
  if (!ALLOWED_MIME.has(mime)) throw new Error(`不支持的备份图片类型：${mime}`)
  const binary = atob(match[2])
  const bytes = new Uint8Array(binary.length)
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i)
  return new Blob([bytes], { type: mime })
}

export type ImportMode = 'skip' | 'replace'

export async function importPhotos(
  file: File,
  existing: PhotoRecord[],
  mode: ImportMode = 'skip'
) {
  if (file.size > 300 * 1024 * 1024) throw new Error('备份文件过大（上限 300MB）')
  const text = await file.text()
  let parsed: PhotoBackup
  try {
    parsed = JSON.parse(text) as PhotoBackup
  } catch {
    throw new Error('不是有效的 JSON 备份文件')
  }
  if (parsed.app !== 'landscape-memories' || parsed.version !== 1 || !Array.isArray(parsed.records)) {
    throw new Error('备份结构不匹配（需要 landscape-memories v1）')
  }
  const byFingerprint = new Map(existing.map((r) => [`${r.name}|${r.fileSize}|${r.createdAt}`, r]))
  const byId = new Map(existing.map((r) => [r.id, r]))
  const toPut: PhotoRecord[] = []
  let imported = 0
  let skipped = 0
  let replaced = 0
  const errors: string[] = []
  for (const entry of parsed.records) {
    try {
      if (!MEMORY_IDS.includes(entry.memoryId)) throw new Error('未知物件')
      if (!ALLOWED_MIME.has(entry.mimeType)) throw new Error('不支持的图片类型')
      if (!entry.originalData || !entry.thumbnailData) throw new Error('缺少图片数据')
      const originalBlob = dataUrlToBlob(entry.originalData)
      const thumbnailBlob = dataUrlToBlob(entry.thumbnailData)
      if (originalBlob.size > MAX_FILE_BYTES) throw new Error('图片超过 20MB')
      const fingerprint = `${entry.name}|${entry.fileSize}|${entry.createdAt}`
      const duplicate = byId.get(entry.id) ?? byFingerprint.get(fingerprint)
      if (duplicate && mode === 'skip') {
        skipped++
        continue
      }
      const record: PhotoRecord = {
        id: duplicate && mode === 'replace' ? duplicate.id : entry.id || makeId(),
        memoryId: entry.memoryId,
        name: entry.name,
        originalBlob,
        thumbnailBlob,
        mimeType: entry.mimeType,
        width: entry.width,
        height: entry.height,
        fileSize: entry.fileSize || originalBlob.size,
        createdAt: entry.createdAt || Date.now(),
        sortOrder: entry.sortOrder || 0,
        isCover: Boolean(entry.isCover),
        caption: entry.caption || entry.name,
      }
      if (duplicate && mode === 'replace') replaced++
      else imported++
      toPut.push(record)
      byId.set(record.id, record)
      byFingerprint.set(fingerprint, record)
    } catch (error) {
      errors.push(`${entry.name || '未命名'}: ${error instanceof Error ? error.message : '导入失败'}`)
    }
  }
  if (toPut.length) await putPhotos(toPut)
  return { imported, skipped, replaced, errors, records: toPut }
}

export function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  a.click()
  window.setTimeout(() => URL.revokeObjectURL(url), 1500)
}

