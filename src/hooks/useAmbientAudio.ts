import { useCallback, useEffect, useRef } from 'react'
import { useExperience } from '../store/useExperience'

type AudioGraph = {
  ctx: AudioContext
  master: GainNode
  noiseBuffer: AudioBuffer
  birdTimer: number
  lfo: OscillatorNode
  lfoGain: GainNode
}

function makeNoise(ctx: AudioContext) {
  const buffer = ctx.createBuffer(1, ctx.sampleRate * 3, ctx.sampleRate)
  const data = buffer.getChannelData(0)
  let last = 0
  for (let i = 0; i < data.length; i++) {
    const white = Math.random() * 2 - 1
    last = 0.985 * last + 0.015 * white
    data[i] = last * 3.2
  }
  return buffer
}

export function useAmbientAudio() {
  const enabled = useExperience((s) => s.audioEnabled)
  const setEnabled = useExperience((s) => s.setAudioEnabled)
  const graph = useRef<AudioGraph | null>(null)

  const start = useCallback(async () => {
    if (!graph.current) {
      const Ctor = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext
      if (!Ctor) return
      const ctx = new Ctor()
      const master = ctx.createGain()
      master.gain.value = 0
      master.connect(ctx.destination)
      const noiseBuffer = makeNoise(ctx)

      const river = ctx.createBufferSource()
      river.buffer = noiseBuffer
      river.loop = true
      const riverLP = ctx.createBiquadFilter()
      riverLP.type = 'lowpass'
      riverLP.frequency.value = 1200
      riverLP.Q.value = 0.4
      const riverHP = ctx.createBiquadFilter()
      riverHP.type = 'highpass'
      riverHP.frequency.value = 110
      const riverGain = ctx.createGain()
      riverGain.gain.value = 0.15
      river.connect(riverLP).connect(riverHP).connect(riverGain).connect(master)
      river.start()

      const wind = ctx.createBufferSource()
      wind.buffer = noiseBuffer
      wind.loop = true
      wind.playbackRate.value = 0.6
      const windBP = ctx.createBiquadFilter()
      windBP.type = 'bandpass'
      windBP.frequency.value = 520
      windBP.Q.value = 0.55
      const windGain = ctx.createGain()
      windGain.gain.value = 0.07
      wind.connect(windBP).connect(windGain).connect(master)
      wind.start()

      const lfo = ctx.createOscillator()
      lfo.frequency.value = 0.07
      const lfoGain = ctx.createGain()
      lfoGain.gain.value = 0.045
      lfo.connect(lfoGain).connect(windGain.gain)
      lfo.start()

      const birdTimer = window.setInterval(() => {
        if (!graph.current || ctx.state !== 'running') return
        if (Math.random() > 0.55) {
          const now = ctx.currentTime + Math.random() * 0.4
          const notes = 2 + Math.floor(Math.random() * 3)
          for (let i = 0; i < notes; i++) {
            const osc = ctx.createOscillator()
            const g = ctx.createGain()
            osc.type = 'sine'
            const base = 1700 + Math.random() * 1300
            osc.frequency.setValueAtTime(base, now + i * 0.11)
            osc.frequency.exponentialRampToValueAtTime(base * 1.35, now + i * 0.11 + 0.06)
            g.gain.setValueAtTime(0, now + i * 0.11)
            g.gain.linearRampToValueAtTime(0.025, now + i * 0.11 + 0.012)
            g.gain.exponentialRampToValueAtTime(0.0001, now + i * 0.11 + 0.16)
            osc.connect(g).connect(master)
            osc.start(now + i * 0.11)
            osc.stop(now + i * 0.11 + 0.18)
          }
        }
      }, 9000)

      graph.current = { ctx, master, noiseBuffer, birdTimer, lfo, lfoGain }
    }

    const g = graph.current
    if (!g) return
    await g.ctx.resume()
    g.master.gain.cancelScheduledValues(g.ctx.currentTime)
    g.master.gain.setTargetAtTime(0.32, g.ctx.currentTime, 0.9)
  }, [])

  const stop = useCallback(() => {
    const g = graph.current
    if (!g) return
    g.master.gain.cancelScheduledValues(g.ctx.currentTime)
    g.master.gain.setTargetAtTime(0, g.ctx.currentTime, 0.35)
  }, [])

  const toggle = useCallback(async () => {
    if (enabled) {
      stop()
      setEnabled(false)
    } else {
      await start()
      setEnabled(true)
    }
  }, [enabled, setEnabled, start, stop])

  useEffect(() => {
    const onVisibility = () => {
      const g = graph.current
      if (!g) return
      if (document.hidden) g.master.gain.setTargetAtTime(0.08, g.ctx.currentTime, 0.4)
      else if (useExperience.getState().audioEnabled) g.master.gain.setTargetAtTime(0.32, g.ctx.currentTime, 0.4)
    }
    document.addEventListener('visibilitychange', onVisibility)
    return () => document.removeEventListener('visibilitychange', onVisibility)
  }, [])

  useEffect(() => {
    return () => {
      const g = graph.current
      if (!g) return
      window.clearInterval(g.birdTimer)
      g.lfo.stop()
      g.ctx.close()
      graph.current = null
    }
  }, [])

  return { enabled, toggle }
}
