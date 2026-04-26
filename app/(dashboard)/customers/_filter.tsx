'use client'

import { useRouter, useSearchParams } from 'next/navigation'
import { useState, useEffect, useTransition } from 'react'

export default function CustomersFilter() {
  const router = useRouter()
  const params = useSearchParams()
  const [isPending, startTransition] = useTransition()
  const [search, setSearch] = useState(params.get('search') ?? '')

  useEffect(() => {
    const id = window.setTimeout(() => {
      const sp = new URLSearchParams(params)
      if (search) sp.set('search', search)
      else sp.delete('search')
      const next = sp.toString()
      const current = params.toString()
      if (next !== current) {
        startTransition(() => router.push(`/customers${next ? `?${next}` : ''}`))
      }
    }, 300)
    return () => window.clearTimeout(id)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search])

  return (
    <div className="admin-filters" style={{ opacity: isPending ? 0.7 : 1 }}>
      <input
        value={search}
        onChange={e => setSearch(e.target.value)}
        placeholder="Søk navn eller e-post…"
        className="admin-input"
        autoFocus
      />
      {search && (
        <button
          type="button"
          onClick={() => setSearch('')}
          className="admin-btn admin-btn-secondary"
        >
          Tøm
        </button>
      )}
    </div>
  )
}
