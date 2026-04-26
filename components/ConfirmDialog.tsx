'use client'

import { useEffect } from 'react'

interface Props {
  open: boolean
  title: string
  message?: string
  confirmLabel?: string
  cancelLabel?: string
  danger?: boolean
  onConfirm: () => void
  onCancel: () => void
  pending?: boolean
}

export default function ConfirmDialog({
  open, title, message, confirmLabel = 'Bekreft', cancelLabel = 'Avbryt',
  danger, onConfirm, onCancel, pending,
}: Props) {
  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onCancel()
    }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [open, onCancel])

  if (!open) return null

  return (
    <div
      className="confirm-backdrop"
      onClick={onCancel}
      role="dialog"
      aria-modal="true"
    >
      <div
        className="confirm-dialog"
        onClick={e => e.stopPropagation()}
      >
        <div className="confirm-title">{title}</div>
        {message && <div className="confirm-message">{message}</div>}
        <div className="confirm-actions">
          <button
            type="button"
            onClick={onCancel}
            disabled={pending}
            className="admin-btn admin-btn-secondary"
          >
            {cancelLabel}
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={pending}
            className={`admin-btn ${danger ? 'admin-btn-danger' : 'admin-btn-primary'}`}
            autoFocus
          >
            {pending ? 'Vent…' : confirmLabel}
          </button>
        </div>
      </div>
    </div>
  )
}
