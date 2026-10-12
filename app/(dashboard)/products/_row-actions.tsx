'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import ConfirmDialog from '@/components/ConfirmDialog'
import { useToast } from '@/components/Toast'

export default function ProductRowActions({
  id,
  name,
  isActive = true,
}: { id: number; name: string; isActive?: boolean }) {
  const router = useRouter()
  const toast = useToast()
  const [open, setOpen] = useState(false)
  const [pending, setPending] = useState(false)
  // Set when the API refuses the delete because the product is on an order.
  // The dialog then switches from "delete" to "hide", which is the thing the
  // operator actually wants and the only thing that is safe to do.
  const [blocked, setBlocked] = useState('')

  async function handleDelete() {
    setPending(true)
    try {
      const res = await fetch(`/api/admin-proxy/products/${id}`, { method: 'DELETE' })
      if (res.status === 409) {
        const body = await res.json().catch(() => null)
        setBlocked(body?.detail ?? 'Produktet er i bruk og kan ikke slettes.')
        return
      }
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

  // Hiding is the fallback for a product that cannot be deleted: is_active
  // false removes it from every storefront query while the order history that
  // blocks the delete stays intact.
  async function setActive(next: boolean) {
    setPending(true)
    try {
      const fd = new FormData()
      fd.set('is_active', next ? 'true' : 'false')
      const res = await fetch(`/api/admin-proxy/products/${id}`, { method: 'PATCH', body: fd })
      if (!res.ok) throw new Error()
      toast.success(next ? `"${name}" vises igjen` : `"${name}" er skjult fra nettbutikken`)
      setOpen(false)
      setBlocked('')
      router.refresh()
    } catch {
      toast.error(next ? 'Kunne ikke vise produkt' : 'Kunne ikke skjule produkt')
    } finally {
      setPending(false)
    }
  }

  return (
    <>
      <div className="row-end">
        <Link
          href={`/products/${id}`}
          className="admin-btn admin-btn-secondary admin-btn-xs"
        >
          Rediger
        </Link>
        <button
          type="button"
          onClick={() => setActive(!isActive)}
          disabled={pending}
          className="admin-btn admin-btn-secondary admin-btn-xs"
          title={isActive ? 'Skjul fra nettbutikken' : 'Vis i nettbutikken'}
        >
          {isActive ? 'Skjul' : 'Vis'}
        </button>
        <button
          type="button"
          onClick={() => { setBlocked(''); setOpen(true) }}
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
        title={blocked ? `Kan ikke slette "${name}"` : `Slette "${name}"?`}
        message={
          blocked ||
          'Dette kan ikke angres. Produktet fjernes fra katalogen og er ikke lenger tilgjengelig på nettstedet.'
        }
        confirmLabel={blocked ? 'Skjul produktet' : 'Slett produkt'}
        danger={!blocked}
        pending={pending}
        onConfirm={blocked ? () => setActive(false) : handleDelete}
        onCancel={() => { setOpen(false); setBlocked('') }}
      />
    </>
  )
}
