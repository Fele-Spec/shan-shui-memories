import { useEffect, useRef, useState } from 'react'
import { getMemory } from '../data/memories'
import { useExperience } from '../store/useExperience'

/**
 * UI gate only. The photos are publishable per product decision; this dialog
 * keeps them out of the normal click path, not out of the public asset URLs.
 * The code is stored as a SHA-256 digest, never as visible text.
 */
const CODE_SHA256 = 'c57a5df4f97ed6914116e5fd1348406064834f22503d890eb571af442ac4b4c3'

export function PasswordGate() {
  const open = useExperience((s) => s.passwordGateOpen)
  const memoryId = useExperience((s) => s.passwordGateMemoryId)
  const action = useExperience((s) => s.passwordAction)
  const unlockGallery = useExperience((s) => s.unlockGallery)
  const close = useExperience((s) => s.closePasswordGate)
  const memory = getMemory(memoryId)
  const [value, setValue] = useState('')
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (!open) return
    setValue('')
    setError('')
    setBusy(false)
    const id = window.setTimeout(() => inputRef.current?.focus(), 60)
    return () => window.clearTimeout(id)
  }, [open, memoryId])

  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.stopPropagation()
        close()
      }
    }
    window.addEventListener('keydown', onKey, true)
    return () => window.removeEventListener('keydown', onKey, true)
  }, [open, close])

  if (!open || !memory) return null

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (busy) return
    if (value.length !== 4) {
      setError('请输入 4 位数字密码。')
      return
    }
    setBusy(true)
    setError('')
    try {
      const data = new TextEncoder().encode(value)
      const digest = await crypto.subtle.digest('SHA-256', data)
      const hex = Array.from(new Uint8Array(digest))
        .map((b) => b.toString(16).padStart(2, '0'))
        .join('')
      if (hex === CODE_SHA256) {
        unlockGallery()
      } else {
        setError('密码不正确，请重试。')
        setValue('')
        inputRef.current?.focus()
      }
    } catch {
      setError('验证失败，请重试。')
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="password-gate" role="dialog" aria-modal="true" aria-label="输入访问密码">
      <button type="button" className="password-gate__veil" aria-label="返回聚焦" onClick={close} />
      <form className="password-gate__card" onSubmit={submit}>
        <p className="password-gate__eyebrow">PRIVATE VIEW · 私人影像</p>
        <div className="password-gate__glyph">{memory.glyph}</div>
        <h2>{memory.name}</h2>
        <p className="password-gate__hint">
          {action === 'manager' ? '输入访问密码，进入照片管理。' : '输入访问密码，展开这一卷记忆。'}
        </p>
        <label htmlFor="memory-code">访问密码 · 4 位数字</label>
        <input
          ref={inputRef}
          id="memory-code"
          type="password"
          inputMode="numeric"
          pattern="[0-9]*"
          maxLength={4}
          autoComplete="off"
          value={value}
          onChange={(e) => {
            setValue(e.target.value.replace(/\D/g, '').slice(0, 4))
            if (error) setError('')
          }}
          aria-label="访问密码"
        />
        <p className="password-gate__error" role="status">{error}</p>
        <div className="password-gate__actions">
          <button type="button" className="password-gate__cancel" onClick={close}>
            返回
          </button>
          <button type="submit" className="password-gate__submit" disabled={busy}>
            {busy ? '验证中…' : '查看照片'}
          </button>
        </div>
      </form>
    </div>
  )
}
