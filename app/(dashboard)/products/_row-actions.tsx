'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import ConfirmDialog from '@/components/ConfirmDialog'
import { useToast } from '@/components/Toast'

export default function ProductRowActions({ id, name }: { id: number; name: string }) {
  const router = useRouter()
  const toast = useToast()
  const [open, setOpen] = useState(false)
  const [pending, setPending] = useState(false)

  async function handleDelete() {
    setPending(true)
    try {
      const res = await fetch(`/api/admin-proxy/products/${id}`, { method: 'DELETE' })
      if (!res.ok) throw new Error()
      toast.success(`Slettet "${name}"`)
      setOpen(false)
      router.refresh()
    } catch {
      toast.error('Kunne ikke slette produkt')
    } finally {
      setPending(false)
    }
  }

  return (
    <>
      <div style={{ display: 'flex', gap: 6, justifyContent: 'flex-end' }}>
        <Link
          href={`/products/${id}`}
          className="admin-btn admin-btn-secondary"
          style={{ height: 28, padding: '0 10px', fontSize: 12 }}
        >
          Rediger
        </Link>
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="admin-row-delete"
          title="Slett produkt"
          aria-label="Slett produkt"
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
            <path d="M3 6h18M8 6V4a2 2 0 012-2h4a2 2 0 012 2v2M19 6l-1 14a2 2 0 01-2 2H8a2 2 0 01-2-2L5 6M10 11v6M14 11v6" />
          </svg>
        </button>
      </div>

      <ConfirmDialog
        open={open}
        title={`Slette "${name}"?`}
        message="Dette kan ikke angres. Produktet fjernes fra katalogen og er ikke lenger tilgjengelig på nettstedet."
        confirmLabel="Slett produkt"
        danger
        pending={pending}
        onConfirm={handleDelete}
        onCancel={() => setOpen(false)}
      />
    </>
  )
}
