'use client'

import { useRouter, useSearchParams } from 'next/navigation'
import { useState, useEffect, useTransition } from 'react'

export default function WaitlistFilter() {
  const router = useRouter()
  const params = useSearchParams()
  const [isPending, startTransition] = useTransition()
  const [batch, setBatch] = useState(params.get('batch') ?? '')

  useEffect(() => {
    const id = window.setTimeout(() => {
      const sp = new URLSearchParams(params)
      if (batch) sp.set('batch', batch)
      else sp.delete('batch')
      const next = sp.toString()
      const current = params.toString()
      if (next !== current) {
        startTransition(() => router.push(`/waitlist${next ? `?${next}` : ''}`))
      }
    }, 300)
    return () => window.clearTimeout(id)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [batch])

  return (
    <div className="admin-filters" style={{ opacity: isPending ? 0.7 : 1 }}>
      <input
        value={batch}
        onChange={e => setBatch(e.target.value)}
        placeholder="Filtrer på batch (f.eks. 05)"
        className="admin-input"
        style={{ minWidth: 220 }}
      />
      {batch && (
        <button
          type="button"
          onClick={() => setBatch('')}
          className="admin-btn admin-btn-secondary"
        >
          Tøm
        </button>
      )}
    </div>
  )
}
