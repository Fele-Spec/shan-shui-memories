import { useEffect, useMemo } from 'react'
import { Scene } from './components/scene/Scene'
import { Brand, BottomHud, Intro, LoadingScreen, SunsetCaption, WebGLFallback } from './components/Chrome'
import { MemoryGallery } from './components/MemoryGallery'
import { SunsetGallery } from './components/SunsetGallery'
import { Lightbox } from './components/Lightbox'
import { FocusOverlay } from './components/FocusOverlay'
import { PhotoManager } from './components/PhotoManager'
import { PasswordGate } from './components/PasswordGate'
import { PhotoLibraryProvider } from './photos/PhotoLibrary'
import { SceneErrorBoundary, hasWebGL } from './components/SceneErrorBoundary'
import { useExperience } from './store/useExperience'

export default function App() {
  const webgl = useMemo(() => hasWebGL(), [])
  const sunsetMode = useExperience((s) => s.sunsetMode)
  const galleryOpen = useExperience((s) => s.galleryOpen)
  const focusMode = useExperience((s) => s.focusMode)
  const photoManagerOpen = useExperience((s) => s.photoManagerOpen)
  const passwordGateOpen = useExperience((s) => s.passwordGateOpen)
  const lightboxOpen = useExperience((s) => s.lightboxOpen)
  const closeLightbox = useExperience((s) => s.closeLightbox)
  const closeMemory = useExperience((s) => s.closeMemory)
  const closePhotoManager = useExperience((s) => s.closePhotoManager)
  const closePasswordGate = useExperience((s) => s.closePasswordGate)
  const exitFocus = useExperience((s) => s.exitFocus)
  const exitSunset = useExperience((s) => s.exitSunset)
  const setIntroVisible = useExperience((s) => s.setIntroVisible)
  const setQuality = useExperience((s) => s.setQuality)

  useEffect(() => {
    const forced = new URLSearchParams(window.location.search).get('quality')
    if (forced === 'high' || forced === 'medium' || forced === 'low') {
      setQuality(forced)
      return
    }
    if (window.matchMedia('(max-width: 760px)').matches) setQuality('medium')
  }, [setQuality])

  useEffect(() => {
    if (sunsetMode || galleryOpen || focusMode) document.body.style.cursor = ''
  }, [sunsetMode, galleryOpen, focusMode])

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== 'Escape') return
      const s = useExperience.getState()
      if (s.photoManagerOpen) closePhotoManager()
      else if (s.passwordGateOpen) closePasswordGate()
      else if (s.lightboxOpen) closeLightbox()
      else if (s.galleryOpen) closeMemory()
      else if (s.focusMode) exitFocus()
      else if (s.sunsetMode) exitSunset()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [closeLightbox, closeMemory, closePasswordGate, closePhotoManager, exitFocus, exitSunset])

  useEffect(() => {
    let done = false
    const intro = () => {
      if (done) return
      done = true
      window.setTimeout(() => setIntroVisible(false), 1200)
    }
    window.addEventListener('pointerdown', intro, { once: true })
    window.addEventListener('touchstart', intro, { once: true, passive: true })
    return () => {
      window.removeEventListener('pointerdown', intro)
      window.removeEventListener('touchstart', intro)
    }
  }, [setIntroVisible])

  if (!webgl) return <WebGLFallback />

  return (
    <PhotoLibraryProvider>
      <div
        className="experience"
        data-sunset={sunsetMode}
        data-focus={focusMode && !galleryOpen && !photoManagerOpen && !passwordGateOpen}
        data-gallery={galleryOpen || lightboxOpen || photoManagerOpen || passwordGateOpen}
      >
        <SceneErrorBoundary>
          <Scene />
        </SceneErrorBoundary>
        <div className="vignette-layer" aria-hidden="true" />
        <Brand />
        <Intro />
        <SunsetCaption />
        <BottomHud />
        <MemoryGallery />
        <SunsetGallery />
        <Lightbox />
        <FocusOverlay />
        <PasswordGate />
        <PhotoManager />
        <LoadingScreen />
      </div>
    </PhotoLibraryProvider>
  )
}

