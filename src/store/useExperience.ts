import { create } from 'zustand'
import type { MemoryId } from '../data/memories'

type LightboxSource = 'memory' | 'sunset' | null

type ExperienceState = {
  introVisible: boolean
  activeMemoryId: MemoryId | null
  focusMode: boolean
  galleryOpen: boolean
  galleryIndex: number
  sunsetMode: boolean
  sunsetGalleryOpen: boolean
  sunsetIndex: number
  lightboxOpen: boolean
  lightboxSource: LightboxSource
  audioEnabled: boolean
  hoveredMemoryId: MemoryId | null
  interactionLocked: boolean
  photoManagerOpen: boolean
  photoManagerMemoryId: MemoryId | null
  quality: 'high' | 'medium' | 'low'
  setIntroVisible: (v: boolean) => void
  setHoveredMemory: (id: MemoryId | null) => void
  focusMemory: (id: MemoryId) => void
  openGallery: () => void
  closeGallery: () => void
  exitFocus: () => void
  /** Backwards-compatible name: first click focuses, second opens gallery. */
  openMemory: (id: MemoryId) => void
  /** Backwards-compatible close: closes gallery first, then exits focus. */
  closeMemory: () => void
  setGalleryIndex: (i: number) => void
  openPhotoManager: (id: MemoryId) => void
  closePhotoManager: () => void
  enterSunset: () => void
  showSunsetGallery: () => void
  exitSunset: () => void
  setSunsetIndex: (i: number) => void
  openLightbox: (source: Exclude<LightboxSource, null>) => void
  closeLightbox: () => void
  setAudioEnabled: (v: boolean) => void
  setQuality: (q: 'high' | 'medium' | 'low') => void
}

export const useExperience = create<ExperienceState>((set, get) => ({
  introVisible: true,
  activeMemoryId: null,
  focusMode: false,
  galleryOpen: false,
  galleryIndex: 0,
  sunsetMode: false,
  sunsetGalleryOpen: false,
  sunsetIndex: 0,
  lightboxOpen: false,
  lightboxSource: null,
  audioEnabled: false,
  hoveredMemoryId: null,
  interactionLocked: false,
  photoManagerOpen: false,
  photoManagerMemoryId: null,
  quality: 'high',

  setIntroVisible: (v) => set({ introVisible: v }),
  setHoveredMemory: (id) => set({ hoveredMemoryId: id }),

  focusMemory: (id) => {
    const s = get()
    if (s.sunsetMode) return
    // Second click on the already-focused object opens the gallery.
    if (s.activeMemoryId === id && s.focusMode && !s.galleryOpen && !s.photoManagerOpen) {
      set({ galleryOpen: true, galleryIndex: 0, lightboxOpen: false, interactionLocked: true })
      return
    }
    set({
      activeMemoryId: id,
      focusMode: true,
      galleryOpen: false,
      galleryIndex: 0,
      lightboxOpen: false,
      hoveredMemoryId: null,
      photoManagerOpen: false,
      photoManagerMemoryId: null,
      interactionLocked: true,
    })
  },

  openGallery: () => {
    if (!get().activeMemoryId) return
    set({ galleryOpen: true, galleryIndex: 0, lightboxOpen: false, interactionLocked: true })
  },

  closeGallery: () => {
    set({
      galleryOpen: false,
      galleryIndex: 0,
      lightboxOpen: false,
      lightboxSource: null,
      interactionLocked: true,
    })
  },

  exitFocus: () =>
    set({
      activeMemoryId: null,
      focusMode: false,
      galleryOpen: false,
      galleryIndex: 0,
      lightboxOpen: false,
      lightboxSource: null,
      photoManagerOpen: false,
      photoManagerMemoryId: null,
      hoveredMemoryId: null,
      interactionLocked: false,
    }),

  openMemory: (id) => get().focusMemory(id),
  closeMemory: () => {
    const s = get()
    if (s.galleryOpen) s.closeGallery()
    else if (s.focusMode) s.exitFocus()
  },

  setGalleryIndex: (i) => set({ galleryIndex: i }),

  openPhotoManager: (id) =>
    set({
      photoManagerOpen: true,
      photoManagerMemoryId: id,
      activeMemoryId: get().activeMemoryId ?? id,
      focusMode: true,
      interactionLocked: true,
      hoveredMemoryId: null,
    }),

  closePhotoManager: () =>
    set({
      photoManagerOpen: false,
      photoManagerMemoryId: null,
      interactionLocked: Boolean(get().galleryOpen || get().sunsetMode || get().focusMode),
    }),

  enterSunset: () => {
    const s = get()
    if (s.sunsetMode || s.galleryOpen || s.focusMode || s.activeMemoryId || s.photoManagerOpen) return
    set({ sunsetMode: true, sunsetGalleryOpen: false, interactionLocked: true })
  },

  showSunsetGallery: () => set({ sunsetGalleryOpen: true }),

  exitSunset: () =>
    set({
      sunsetMode: false,
      sunsetGalleryOpen: false,
      sunsetIndex: 0,
      lightboxOpen: false,
      lightboxSource: null,
      interactionLocked: false,
    }),

  setSunsetIndex: (i) => set({ sunsetIndex: i }),

  openLightbox: (source) => set({ lightboxOpen: true, lightboxSource: source, interactionLocked: true }),

  closeLightbox: () =>
    set({
      lightboxOpen: false,
      lightboxSource: null,
      interactionLocked: Boolean(get().galleryOpen || get().sunsetMode || get().focusMode),
    }),

  setAudioEnabled: (v) => set({ audioEnabled: v }),
  setQuality: (q) => set({ quality: q }),
}))
