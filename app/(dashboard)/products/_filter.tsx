'use client'

import { useRouter, useSearchParams } from 'next/navigation'
import { useTransition } from 'react'

const CATEGORY_OPTIONS = [
  { value: '', label: 'Alle kategorier' },
  { value: 'liten-sjokoladeboks', label: 'Liten sjokoladeboks' },
  { value: 'stor-sjokoladeboks', label: 'Stor sjokoladeboks' },
  { value: 'sjokoladebarer', label: 'Sjokoladebarer' },
]

const STATUS_OPTIONS = [
  { value: '', label: 'Alle statuser' },
  { value: 'true', label: 'Kun på lager' },
  { value: 'false', label: 'Kun utsolgt' },
]

export default function ProductsFilter() {
  const router = useRouter()
  const params = useSearchParams()
  const [isPending, startTransition] = useTransition()
  const current = params.get('category') ?? ''
  const currentStock = params.get('in_stock') ?? ''

  function setParam(key: string, value: string) {
    const sp = new URLSearchParams(params)
    if (value) sp.set(key, value)
    else sp.delete(key)
    startTransition(() => {
      router.push(`/products${sp.toString() ? `?${sp}` : ''}`)
    })
  }
  const setFilter = (value: string) => setParam('category', value)

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
      <select
        value={currentStock}
        onChange={e => setParam('in_stock', e.target.value)}
        className="admin-select"
        disabled={isPending}
      >
        {STATUS_OPTIONS.map(o => (
          <option key={o.value} value={o.value}>{o.label}</option>
        ))}
      </select>
      {(current || currentStock) && (
        <button
          type="button"
          onClick={() => startTransition(() => router.push('/products'))}
          className="admin-btn admin-btn-secondary"
        >
          Nullstill
        </button>
      )}
    </div>
  )
}
