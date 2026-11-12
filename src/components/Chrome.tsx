import { useEffect, useState } from 'react'
import { useProgress } from '@react-three/drei'
import { useExperience } from '../store/useExperience'
import { useAmbientAudio } from '../hooks/useAmbientAudio'

export function Brand() {
  return (
    <header className="brand">
      <div className="brand__seal" aria-hidden="true">
        山
      </div>
      <div className="brand__text">
        <h1>山水拾忆</h1>
        <p>LANDSCAPE MEMORIES</p>
      </div>
    </header>
  )
}

export function Intro() {
  const visible = useExperience((s) => s.introVisible)
  const setVisible = useExperience((s) => s.setIntroVisible)
  const galleryOpen = useExperience((s) => s.galleryOpen)
  const sunset = useExperience((s) => s.sunsetMode)

  useEffect(() => {
    const t = window.setTimeout(() => setVisible(false), 6800)
    return () => window.clearTimeout(t)
  }, [setVisible])

  useEffect(() => {
    if (galleryOpen || sunset) setVisible(false)
  }, [galleryOpen, sunset, setVisible])

  return (
    <section className={`intro ${visible ? 'is-visible' : 'is-hidden'}`} aria-hidden={!visible}>
      <div className="intro__hairline" />
      <p className="intro__eyebrow">A QUIET PLACE FOR MEMORY</p>
      <h2 className="intro__title">
        <span>山</span>
        <span>水</span>
        <span>拾</span>
        <span>忆</span>
      </h2>
      <p className="intro__en">LANDSCAPE MEMORIES</p>
      <div className="intro__rule" />
      <p className="intro__prompt">轻触山水，寻一段记忆。</p>
      <p className="intro__hint">MOVE SLOWLY · LOOK CLOSER</p>
    </section>
  )
}

function SoundIcon({ on }: { on: boolean }) {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path
        d="M4 9.5v5h3.6L13 18.5v-13L7.6 9.5H4Z"
        stroke="currentColor"
        strokeWidth="1.4"
        strokeLinejoin="round"
      />
      {on ? (
        <>
          <path d="M16.2 9.2a4 4 0 0 1 0 5.6" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
          <path d="M18.8 6.8a7.4 7.4 0 0 1 0 10.4" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
        </>
      ) : (
        <path d="m16.5 9.5 4 5m0-5-4 5" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
      )}
    </svg>
  )
}

export function BottomHud() {
  const { enabled, toggle } = useAmbientAudio()
  const sunsetMode = useExperience((s) => s.sunsetMode)
  const enterSunset = useExperience((s) => s.enterSunset)
  const exitSunset = useExperience((s) => s.exitSunset)
  const galleryOpen = useExperience((s) => s.galleryOpen)
  const active = useExperience((s) => s.activeMemoryId)
  const sunsetGalleryOpen = useExperience((s) => s.sunsetGalleryOpen)

  return (
    <div className={`hud ${sunsetGalleryOpen ? 'is-sunset-open' : ''}`} aria-hidden={galleryOpen}>
      <button
        type="button"
        className={`hud__sound ${enabled ? 'is-on' : ''}`}
        onClick={(e) => {
          e.stopPropagation()
          void toggle()
        }}
        aria-pressed={enabled}
        aria-label={enabled ? '关闭环境声音' : '开启环境声音'}
      >
        <SoundIcon on={enabled} />
        <span>{enabled ? '声' : '静'}</span>
      </button>

      <div className={`hud__hint ${active ? 'is-dim' : ''}`}>
        {sunsetMode ? (
          <>
            <span className="hud__dot" />
            暮色正浓 · 点击「归山」回到青绿
          </>
        ) : (
          <>
            <span className="hud__dot" />
            轻点微光，拾起记忆 · 点击山水，等一场暮色
          </>
        )}
      </div>

      <button
        type="button"
        className={`hud__sunset ${sunsetMode ? 'is-active' : ''} ${sunsetGalleryOpen ? 'is-hidden' : ''}`}
        onClick={(e) => {
          e.stopPropagation()
          if (sunsetMode) exitSunset()
          else enterSunset()
        }}
      >
        <span className="hud__sun-icon" />
        <span>{sunsetMode ? '归山' : '入暮'}</span>
      </button>
    </div>
  )
}

export function SunsetCaption() {
  const sunset = useExperience((s) => s.sunsetMode)
  const gallery = useExperience((s) => s.sunsetGalleryOpen)
  return (
    <div className={`sunset-caption ${sunset ? 'is-visible' : ''} ${gallery ? 'is-settled' : ''}`} aria-hidden={!sunset}>
      <p>THE MOUNTAINS AT DUSK</p>
      <h2>山色入暮</h2>
      <span>落日熔金，暮云合璧</span>
    </div>
  )
}

export function LoadingScreen() {
  const { progress, active } = useProgress()
  const [gone, setGone] = useState(false)
  const [fade, setFade] = useState(false)
  const [force, setForce] = useState(false)

  useEffect(() => {
    const t = window.setTimeout(() => setForce(true), 12000)
    return () => window.clearTimeout(t)
  }, [])

  useEffect(() => {
    if ((!active && progress >= 100) || force) {
      const t = window.setTimeout(() => setFade(true), 650)
      const t2 = window.setTimeout(() => setGone(true), 2100)
      return () => {
        window.clearTimeout(t)
        window.clearTimeout(t2)
      }
    }
  }, [active, progress, force])

  if (gone) return null
  const value = Math.max(4, Math.min(100, Math.round(progress)))

  return (
    <div className={`loader ${fade ? 'is-fading' : ''}`}>
      <div className="loader__ink" aria-hidden="true">
        <span>山</span>
      </div>
      <div className="loader__ring" aria-hidden="true" />
      <p className="loader__title">山色正在醒来</p>
      <p className="loader__sub">LANDSCAPE MEMORIES</p>
      <div className="loader__bar">
        <span style={{ width: `${value}%` }} />
      </div>
      <p className="loader__pct">{String(value).padStart(2, '0')}</p>
    </div>
  )
}

export function WebGLFallback() {
  return (
    <div className="fallback">
      <div className="fallback__mountains" aria-hidden="true">
        <span />
        <span />
        <span />
      </div>
      <div className="fallback__content">
        <p className="fallback__eyebrow">LANDSCAPE MEMORIES</p>
        <h1>山水拾忆</h1>
        <p>
          这扇山水需要浏览器的 WebGL 支持。
          <br />
          请换用最新版 Chrome 或 Edge，并确认硬件加速已开启。
        </p>
        <small>This quiet landscape needs WebGL to come alive.</small>
      </div>
    </div>
  )
}

