import { create } from 'zustand'
import type { MemoryId } from '../data/memories'

type LightboxSource = 'memory' | 'sunset' | null
type PasswordAction = 'gallery' | 'manager' | null

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
  passwordGateOpen: boolean
  passwordGateMemoryId: MemoryId | null
  passwordAction: PasswordAction
  quality: 'high' | 'medium' | 'low'
  setIntroVisible: (v: boolean) => void
  setHoveredMemory: (id: MemoryId | null) => void
  focusMemory: (id: MemoryId) => void
  /** Opens the access-code gate, not the gallery directly. */
  openGallery: () => void
  /** Called by the gate after a correct code. */
  unlockGallery: () => void
  requestPhotoManager: (id: MemoryId) => void
  closePasswordGate: () => void
  closeGallery: () => void
  exitFocus: () => void
  /** Backwards-compatible name: first click focuses, second asks for the code. */
  openMemory: (id: MemoryId) => void
  /** Backwards-compatible close: closes gate/gallery first, then exits focus. */
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

const locked = { interactionLocked: true }

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
  passwordGateOpen: false,
  passwordGateMemoryId: null,
  passwordAction: null,
  quality: 'high',

  setIntroVisible: (v) => set({ introVisible: v }),
  setHoveredMemory: (id) => set({ hoveredMemoryId: id }),

  focusMemory: (id) => {
    const s = get()
    if (s.sunsetMode) return
    // Second click on the already-focused object asks for the code first.
    if (s.activeMemoryId === id && s.focusMode && !s.galleryOpen && !s.photoManagerOpen) {
      if (s.passwordGateOpen) return
      set({
        passwordGateOpen: true,
        passwordGateMemoryId: id,
        passwordAction: 'gallery',
        galleryOpen: false,
        lightboxOpen: false,
        ...locked,
      })
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
      passwordGateOpen: false,
      passwordGateMemoryId: null,
      passwordAction: null,
      ...locked,
    })
  },

  openGallery: () => {
    const s = get()
    if (!s.activeMemoryId || s.passwordGateOpen) return
    set({
      passwordGateOpen: true,
      passwordGateMemoryId: s.activeMemoryId,
      passwordAction: 'gallery',
      galleryOpen: false,
      lightboxOpen: false,
      ...locked,
    })
  },

  unlockGallery: () => {
    const s = get()
    if (!s.passwordGateOpen) return
    if (s.passwordAction === 'manager') {
      set({
        passwordGateOpen: false,
        passwordGateMemoryId: null,
        passwordAction: null,
        photoManagerOpen: true,
        photoManagerMemoryId: s.passwordGateMemoryId,
        activeMemoryId: s.passwordGateMemoryId,
        focusMode: true,
        ...locked,
      })
      return
    }
    set({
      passwordGateOpen: false,
      passwordGateMemoryId: null,
      passwordAction: null,
      galleryOpen: true,
      galleryIndex: 0,
      lightboxOpen: false,
      ...locked,
    })
  },

  requestPhotoManager: (id) =>
    set({
      activeMemoryId: id,
      focusMode: true,
      passwordGateOpen: true,
      passwordGateMemoryId: id,
      passwordAction: 'manager',
      galleryOpen: false,
      lightboxOpen: false,
      photoManagerOpen: false,
      ...locked,
    }),

  closePasswordGate: () =>
    set({
      passwordGateOpen: false,
      passwordGateMemoryId: null,
      passwordAction: null,
      interactionLocked: Boolean(get().focusMode || get().galleryOpen || get().sunsetMode),
    }),

  closeGallery: () => {
    set({
      galleryOpen: false,
      galleryIndex: 0,
      lightboxOpen: false,
      lightboxSource: null,
      passwordGateOpen: false,
      passwordGateMemoryId: null,
      passwordAction: null,
      ...locked,
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
      passwordGateOpen: false,
      passwordGateMemoryId: null,
      passwordAction: null,
      hoveredMemoryId: null,
      interactionLocked: false,
    }),

  openMemory: (id) => get().focusMemory(id),

  closeMemory: () => {
    const s = get()
    if (s.passwordGateOpen) s.closePasswordGate()
    else if (s.galleryOpen) s.closeGallery()
    else if (s.focusMode) s.exitFocus()
  },

  setGalleryIndex: (i) => set({ galleryIndex: i }),

  openPhotoManager: (id) =>
    set({
      photoManagerOpen: true,
      photoManagerMemoryId: id,
      activeMemoryId: get().activeMemoryId ?? id,
      focusMode: true,
      passwordGateOpen: false,
      passwordGateMemoryId: null,
      passwordAction: null,
      ...locked,
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
    if (s.sunsetMode || s.galleryOpen || s.focusMode || s.activeMemoryId || s.photoManagerOpen || s.passwordGateOpen) return
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
