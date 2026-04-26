'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import ConfirmDialog from '@/components/ConfirmDialog'
import { useToast } from '@/components/Toast'

export default function OrderRowActions({ orderNumber }: { orderNumber: string }) {
  const router = useRouter()
  const toast = useToast()
  const [open, setOpen] = useState(false)
  const [pending, setPending] = useState(false)

  async function handleDelete() {
    setPending(true)
    try {
      const res = await fetch(`/api/admin-proxy/orders/${orderNumber}`, { method: 'DELETE' })
      if (!res.ok) throw new Error()
      toast.success(`Bestilling ${orderNumber} slettet`)
      setOpen(false)
      router.refresh()
    } catch {
      toast.error('Kunne ikke slette bestilling')
    } finally {
      setPending(false)
    }
  }

  return (
    <>
      <div style={{ display: 'flex', gap: 6, justifyContent: 'flex-end' }}>
        <Link
          href={`/orders/${orderNumber}`}
          className="admin-btn admin-btn-secondary"
          style={{ height: 28, padding: '0 10px', fontSize: 12 }}
        >
          Detaljer
        </Link>
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="admin-row-delete"
          title="Slett bestilling"
          aria-label="Slett bestilling"
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
            <path d="M3 6h18M8 6V4a2 2 0 012-2h4a2 2 0 012 2v2M19 6l-1 14a2 2 0 01-2 2H8a2 2 0 01-2-2L5 6M10 11v6M14 11v6" />
          </svg>
        </button>
      </div>

      <ConfirmDialog
        open={open}
        title={`Slette bestilling ${orderNumber}?`}
        message="Bestillingen og alle tilhørende varer fjernes permanent. Dette kan ikke angres."
        confirmLabel="Slett bestilling"
        danger
        pending={pending}
        onConfirm={handleDelete}
        onCancel={() => setOpen(false)}
      />
    </>
  )
}
