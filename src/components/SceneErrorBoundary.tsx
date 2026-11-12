import { Component, type ErrorInfo, type ReactNode } from 'react'
import { WebGLFallback } from './Chrome'

type Props = { children: ReactNode }
type State = { failed: boolean; message: string }

export class SceneErrorBoundary extends Component<Props, State> {
  state: State = { failed: false, message: '' }

  static getDerivedStateFromError(error: Error): State {
    return { failed: true, message: error.message }
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error('[山水拾忆] scene error', error, info)
  }

  render() {
    if (this.state.failed) return <WebGLFallback />
    return this.props.children
  }
}

export function hasWebGL() {
  if (typeof document === 'undefined') return true
  try {
    const canvas = document.createElement('canvas')
    const gl = canvas.getContext('webgl2') || canvas.getContext('webgl')
    return Boolean(gl)
  } catch {
    return false
  }
}
