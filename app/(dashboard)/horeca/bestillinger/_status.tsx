'use client'

/** K-47 / K-49 — moving an order along the flow. Every change mails the
 *  customer, so the button says what will happen, not just the new state. */
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useToast } from '@/components/Toast'

const NEXT: Record<string, { to: string; label: string }> = {
  sendt:      { to: 'bekreftet',  label: 'Bekreft' },
  bekreftet:  { to: 'produksjon', label: 'Start produksjon' },
  produksjon: { to: 'klar',       label: 'Klar til levering' },
  klar:       { to: 'levert',     label: 'Marker levert' },
}

export default function OrderStatus({
  orderNumber, status,
}: { orderNumber: string; status: string }) {
  const router = useRouter()
  const toast = useToast()
  const [pending, setPending] = useState(false)
  const step = NEXT[status]
  if (!step) return null

  async function advance() {
    setPending(true)
    try {
      const res = await fetch(`/api/admin-proxy/horeca/orders/${orderNumber}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: step.to }),
      })
      if (!res.ok) {
        const d = await res.json().catch(() => ({}))
        throw new Error(d.detail ?? 'Kunne ikke endre status')
      }
      toast.success(`${orderNumber}: ${step.label.toLowerCase()} — kunden er varslet`)
      router.refresh()
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Kunne ikke endre status')
    } finally {
      setPending(false)
    }
  }

  return (
    <button type="button" className="admin-btn admin-btn-primary admin-btn-sm"
            disabled={pending} onClick={advance}>
      {pending ? '…' : step.label}
    </button>
  )
}
