'use client'

import { useRouter, useSearchParams } from 'next/navigation'
import { useTransition } from 'react'

const CATEGORY_OPTIONS = [
  { value: '', label: 'Alle kategorier' },
  { value: 'liten-sjokoladeboks', label: 'Liten sjokoladeboks' },
  { value: 'stor-sjokoladeboks', label: 'Stor sjokoladeboks' },
  { value: 'sjokoladebarer', label: 'Sjokoladebarer' },
]

export default function ProductsFilter() {
  const router = useRouter()
  const params = useSearchParams()
  const [isPending, startTransition] = useTransition()
  const current = params.get('category') ?? ''

  function setFilter(value: string) {
    const sp = new URLSearchParams(params)
    if (value) sp.set('category', value)
    else sp.delete('category')
    startTransition(() => {
      router.push(`/products${sp.toString() ? `?${sp}` : ''}`)
    })
  }

  return (
    <div className="admin-filters" style={{ opacity: isPending ? 0.7 : 1 }}>
      <select
        value={current}
        onChange={e => setFilter(e.target.value)}
        className="admin-select"
        disabled={isPending}
      >
        {CATEGORY_OPTIONS.map(o => (
          <option key={o.value} value={o.value}>{o.label}</option>
        ))}
      </select>
      {current && (
        <button
          type="button"
          onClick={() => setFilter('')}
          className="admin-btn admin-btn-secondary"
        >
          Nullstill
        </button>
      )}
    </div>
  )
}
