'use client'

import { useRouter, useSearchParams } from 'next/navigation'

const OPTIONS = [
  { value: '', label: 'Alle' },
  { value: 'pending', label: 'Venter godkjenning' },
  { value: 'active', label: 'Godkjent' },
  { value: 'rejected', label: 'Avvist' },
  { value: 'suspended', label: 'Sperret' },
]

export default function StatusFilter() {
  const router = useRouter()
  const params = useSearchParams()
  const current = params.get('status') ?? ''

  return (
    <div className="admin-chips">
      {OPTIONS.map((o) => (
        <button
          key={o.value}
          type="button"
          className={`admin-chip${current === o.value ? ' is-active' : ''}`}
          onClick={() => router.push(o.value ? `?status=${o.value}` : '?')}
        >
          {o.label}
        </button>
      ))}
    </div>
  )
}
