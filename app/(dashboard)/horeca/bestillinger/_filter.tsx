'use client'

import { useRouter, useSearchParams } from 'next/navigation'

const STATUSES = [
  { value: '', label: 'Alle' },
  { value: 'sendt', label: 'Sendt' },
  { value: 'bekreftet', label: 'Bekreftet' },
  { value: 'produksjon', label: 'I produksjon' },
  { value: 'klar', label: 'Klar til levering' },
  { value: 'levert', label: 'Levert' },
  { value: 'avbestilt', label: 'Avbestilt' },
]

export default function OrderFilter() {
  const router = useRouter()
  const params = useSearchParams()
  const current = params.get('status') ?? ''
  return (
    <div className="admin-chips">
      {STATUSES.map((s) => (
        <button key={s.value} type="button"
                className={`admin-chip${current === s.value ? ' is-active' : ''}`}
                onClick={() => router.push(s.value ? `?status=${s.value}` : '?')}>
          {s.label}
        </button>
      ))}
    </div>
  )
}
