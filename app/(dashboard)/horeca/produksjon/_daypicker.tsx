'use client'

import { useRouter } from 'next/navigation'

/** y-m-d arithmetic without Date arithmetic: for an Oslo evening,
 *  toISOString() returns tomorrow and every day silently shifts by one. */
function shift(iso: string, days: number) {
  const [y, m, d] = iso.split('-').map(Number)
  const dt = new Date(y, m - 1, d + days)
  const p = (n: number) => String(n).padStart(2, '0')
  return `${dt.getFullYear()}-${p(dt.getMonth() + 1)}-${p(dt.getDate())}`
}

export default function DayPicker({ date }: { date: string }) {
  const router = useRouter()
  const go = (d: string) => router.push(`?date=${d}`)
  return (
    <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
      <button type="button" className="admin-btn admin-btn-ghost admin-btn-sm"
              onClick={() => go(shift(date, -1))} aria-label="Forrige dag">←</button>
      <input type="date" className="admin-input" value={date}
             onChange={(e) => e.target.value && go(e.target.value)} />
      <button type="button" className="admin-btn admin-btn-ghost admin-btn-sm"
              onClick={() => go(shift(date, 1))} aria-label="Neste dag">→</button>
    </div>
  )
}
