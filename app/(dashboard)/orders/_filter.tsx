'use client'

import { useRouter, useSearchParams } from 'next/navigation'
import { useState, useEffect, useTransition } from 'react'

const STATUS_OPTIONS = [
  { value: '', label: 'Alle statuser' },
  { value: 'Bekreftet', label: 'Bekreftet' },
  { value: 'Pakkes', label: 'Pakkes' },
  { value: 'Sendt', label: 'Sendt' },
  { value: 'Levert', label: 'Levert' },
]

export default function OrdersFilter() {
  const router = useRouter()
  const params = useSearchParams()
  const [isPending, startTransition] = useTransition()
  const [search, setSearch] = useState(params.get('search') ?? '')

  // Debounce search
  useEffect(() => {
    const id = window.setTimeout(() => {
      const sp = new URLSearchParams(params)
      if (search) sp.set('search', search)
      else sp.delete('search')
      const next = sp.toString()
      const current = params.toString()
      if (next !== current) {
        startTransition(() => router.push(`/orders${next ? `?${next}` : ''}`))
      }
    }, 300)
    return () => window.clearTimeout(id)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search])

  function setStatus(value: string) {
    const sp = new URLSearchParams(params)
    if (value) sp.set('status', value)
    else sp.delete('status')
    startTransition(() => router.push(`/orders${sp.toString() ? `?${sp}` : ''}`))
  }

  const hasFilters = !!params.get('status') || !!params.get('search')

  return (
    <div className="admin-filters" style={{ opacity: isPending ? 0.7 : 1 }}>
      <input
        value={search}
        onChange={e => setSearch(e.target.value)}
        placeholder="Søk ordrenr, e-post, navn…"
        className="admin-input"
      />
      <select
        value={params.get('status') ?? ''}
        onChange={e => setStatus(e.target.value)}
        className="admin-select"
      >
        {STATUS_OPTIONS.map(o => (
          <option key={o.value} value={o.value}>{o.label}</option>
        ))}
      </select>
      {hasFilters && (
        <button
          type="button"
          onClick={() => { setSearch(''); router.push('/orders') }}
          className="admin-btn admin-btn-secondary"
        >
          Nullstill
        </button>
      )}
    </div>
  )
}
