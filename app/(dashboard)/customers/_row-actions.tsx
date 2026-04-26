'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import ConfirmDialog from '@/components/ConfirmDialog'
import { useToast } from '@/components/Toast'

interface Props {
  id: string
  name: string
  orderCount: number
}

export default function CustomerRowActions({ id, name, orderCount }: Props) {
  const router = useRouter()
  const toast = useToast()
  const [open, setOpen] = useState(false)
  const [pending, setPending] = useState(false)

  async function handleDelete() {
    setPending(true)
    try {
      const res = await fetch(`/api/admin-proxy/users/${id}`, { method: 'DELETE' })
      if (!res.ok) {
        const err = await res.json().catch(() => ({}))
        throw new Error(err.detail || '')
      }
      toast.success(`Kunde "${name}" slettet`)
      setOpen(false)
      router.refresh()
    } catch (e: any) {
      toast.error(e.message || 'Kunne ikke slette kunde')
    } finally {
      setPending(false)
    }
  }

  return (
    <>
      <div style={{ display: 'flex', gap: 6, justifyContent: 'flex-end' }}>
        <Link
          href={`/customers/${id}`}
          className="admin-btn admin-btn-secondary"
          style={{ height: 28, padding: '0 10px', fontSize: 12 }}
        >
          Profil
        </Link>
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="admin-row-delete"
          title="Slett kunde"
          aria-label="Slett kunde"
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
            <path d="M3 6h18M8 6V4a2 2 0 012-2h4a2 2 0 012 2v2M19 6l-1 14a2 2 0 01-2 2H8a2 2 0 01-2-2L5 6M10 11v6M14 11v6" />
          </svg>
        </button>
      </div>

      <ConfirmDialog
        open={open}
        title={`Slette ${name}?`}
        message={
          orderCount > 0
            ? `Denne kunden har ${orderCount} bestilling${orderCount === 1 ? '' : 'er'}. Hvis du sletter kunden vil bestillingene bli stående uten kundekobling.`
            : 'Kundekontoen og all tilhørende informasjon fjernes permanent.'
        }
        confirmLabel="Slett kunde"
        danger
        pending={pending}
        onConfirm={handleDelete}
        onCancel={() => setOpen(false)}
      />
    </>
  )
}
