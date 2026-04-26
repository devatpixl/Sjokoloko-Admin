'use client'

import { createContext, useContext, useState, useCallback, useEffect } from 'react'

type ToastKind = 'success' | 'error' | 'info'
interface ToastItem { id: number; kind: ToastKind; message: string }

interface ToastApi {
  success: (msg: string) => void
  error: (msg: string) => void
  info: (msg: string) => void
}

const ToastCtx = createContext<ToastApi | null>(null)

export function useToast() {
  const ctx = useContext(ToastCtx)
  if (!ctx) throw new Error('useToast must be used inside <ToastProvider>')
  return ctx
}

let nextId = 0

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = useState<ToastItem[]>([])

  const push = useCallback((kind: ToastKind, message: string) => {
    const id = ++nextId
    setItems(prev => [...prev, { id, kind, message }])
    setTimeout(() => {
      setItems(prev => prev.filter(t => t.id !== id))
    }, 3500)
  }, [])

  const api: ToastApi = {
    success: (m) => push('success', m),
    error: (m) => push('error', m),
    info: (m) => push('info', m),
  }

  return (
    <ToastCtx.Provider value={api}>
      {children}
      <div className="toast-stack">
        {items.map(t => (
          <div key={t.id} className={`toast toast-${t.kind}`} role="status">
            <span className="toast-icon">
              {t.kind === 'success' ? '✓' : t.kind === 'error' ? '✕' : 'ℹ'}
            </span>
            <span>{t.message}</span>
          </div>
        ))}
      </div>
    </ToastCtx.Provider>
  )
}
