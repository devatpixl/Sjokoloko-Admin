'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import ConfirmDialog from '@/components/ConfirmDialog'
import { useToast } from '@/components/Toast'

export default function WaitlistRowActions({ id, email }: { id: number; email: string }) {
  const router = useRouter()
  const toast = useToast()
  const [open, setOpen] = useState(false)
  const [pending, setPending] = useState(false)

  async function handleDelete() {
    setPending(true)
    try {
      const res = await fetch(`/api/admin-proxy/waitlist/${id}`, { method: 'DELETE' })
      if (!res.ok) throw new Error()
      toast.success(`${email} fjernet fra ventelisten`)
      setOpen(false)
      router.refresh()
    } catch {
      toast.error('Kunne ikke fjerne fra venteliste')
    } finally {
      setPending(false)
    }
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="admin-row-delete"
        title="Fjern fra venteliste"
        aria-label="Fjern"
      >
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
          <path d="M3 6h18M8 6V4a2 2 0 012-2h4a2 2 0 012 2v2M19 6l-1 14a2 2 0 01-2 2H8a2 2 0 01-2-2L5 6M10 11v6M14 11v6" />
        </svg>
      </button>

      <ConfirmDialog
        open={open}
        title={`Fjerne ${email}?`}
        message="Personen fjernes fra ventelisten og må melde seg på igjen for å delta."
        confirmLabel="Fjern"
        danger
        pending={pending}
        onConfirm={handleDelete}
        onCancel={() => setOpen(false)}
      />
    </>
  )
}
