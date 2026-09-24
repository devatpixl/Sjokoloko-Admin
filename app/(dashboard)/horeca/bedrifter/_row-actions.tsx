'use client'

/** K-59 — approve, or reject with a reason the customer will actually read.
 *  K-29's spirit applies here too: a refusal without a reason tells them
 *  nothing and produces a phone call. */
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useToast } from '@/components/Toast'

export default function CompanyRowActions({
  id, name, status,
}: { id: string; name: string; status: string }) {
  const router = useRouter()
  const toast = useToast()
  const [pending, setPending] = useState(false)
  const [rejecting, setRejecting] = useState(false)
  const [reason, setReason] = useState('')

  async function patch(body: Record<string, unknown>, ok: string) {
    setPending(true)
    try {
      const res = await fetch(`/api/admin-proxy/horeca/companies/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })
      if (!res.ok) {
        const d = await res.json().catch(() => ({}))
        throw new Error(d.detail ?? Object.values(d).flat().join(' '))
      }
      toast.success(ok)
      setRejecting(false)
      setReason('')
      router.refresh()
    } catch (e) {
      toast.error(e instanceof Error && e.message ? e.message : 'Noe gikk galt')
    } finally {
      setPending(false)
    }
  }

  if (rejecting) {
    return (
      <div style={{ display: 'flex', gap: 6, alignItems: 'center', justifyContent: 'flex-end' }}>
        <input
          className="admin-input"
          style={{ width: 240 }}
          autoFocus
          placeholder="Hvorfor avvises den?"
          value={reason}
          onChange={(e) => setReason(e.target.value)}
        />
        <button
          type="button"
          className="admin-btn admin-btn-danger-solid admin-btn-sm"
          disabled={pending || !reason.trim()}
          onClick={() => patch({ status: 'rejected', rejection_reason: reason.trim() },
                               `${name} avvist`)}
        >
          Avvis
        </button>
        <button type="button" className="admin-btn admin-btn-ghost admin-btn-sm"
                onClick={() => { setRejecting(false); setReason('') }}>
          Avbryt
        </button>
      </div>
    )
  }

  return (
    <div style={{ display: 'flex', gap: 6, justifyContent: 'flex-end' }}>
      {status !== 'active' && (
        <button type="button" className="admin-btn admin-btn-primary admin-btn-sm"
                disabled={pending}
                onClick={() => patch({ status: 'active' }, `${name} godkjent — kunden har fått e-post`)}>
          Godkjenn
        </button>
      )}
      {status === 'pending' && (
        <button type="button" className="admin-btn admin-btn-danger admin-btn-sm"
                disabled={pending} onClick={() => setRejecting(true)}>
          Avvis
        </button>
      )}
      {status === 'active' && (
        <button type="button" className="admin-btn admin-btn-ghost admin-btn-sm"
                disabled={pending}
                onClick={() => patch({ status: 'suspended' }, `${name} sperret`)}>
          Sperr
        </button>
      )}
    </div>
  )
}
