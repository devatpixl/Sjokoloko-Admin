'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useState } from 'react'
import { useToast } from '@/components/Toast'

export default function AdminNewCouponPage() {
  const router = useRouter()
  const toast = useToast()
  const [kind, setKind] = useState<'percent' | 'fixed' | 'free_shipping'>('percent')
  const [pending, setPending] = useState(false)
  const [error, setError] = useState('')

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const fd = new FormData(e.currentTarget)
    const body: Record<string, any> = {
      code: String(fd.get('code') ?? '').trim().toUpperCase(),
      kind,
      value: kind === 'free_shipping' ? '0' : String(fd.get('value') ?? '0'),
      min_subtotal: String(fd.get('min_subtotal') ?? '0') || '0',
      max_uses: fd.get('max_uses') ? Number(fd.get('max_uses')) : null,
      valid_from: fd.get('valid_from') ? new Date(String(fd.get('valid_from'))).toISOString() : null,
      valid_to: fd.get('valid_to') ? new Date(String(fd.get('valid_to'))).toISOString() : null,
      is_active: fd.has('is_active'),
    }

    setPending(true)
    setError('')
    const res = await fetch('/api/admin-proxy/coupons', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    })
    if (res.ok) {
      toast.success('Rabattkode opprettet')
      router.push('/coupons')
      router.refresh()
    } else {
      const err = await res.json().catch(() => ({}))
      setError(typeof err === 'string' ? err : Object.entries(err).map(([k, v]) => `${k}: ${Array.isArray(v) ? v.join(', ') : v}`).join(' • '))
      setPending(false)
    }
  }

  return (
    <>
      <Link href="/coupons" className="admin-back">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M19 12H5M12 5l-7 7 7 7" />
        </svg>
        Rabattkoder
      </Link>

      <div className="admin-page-header">
        <div className="admin-page-title">Ny rabattkode</div>
      </div>

      <div className="admin-card" style={{ maxWidth: 720 }}>
        <div className="admin-card-header">
          <div className="admin-card-title">Detaljer</div>
        </div>
        <div style={{ padding: 24 }}>
          <form onSubmit={handleSubmit} className="admin-form">
            <div className="admin-field-row">
              <div className="admin-form-group">
                <label className="admin-label">Kode *</label>
                <input name="code" required maxLength={40} className="admin-form-input" placeholder="VELKOMMEN10" style={{ textTransform: 'uppercase' }} />
                <div style={{ fontSize: 11, color: 'var(--admin-text-dim)', marginTop: 4 }}>
                  Det kunden skriver i kassen. Lagres alltid i versaler.
                </div>
              </div>
              <div className="admin-form-group">
                <label className="admin-label">Type *</label>
                <select name="kind" value={kind} onChange={e => setKind(e.target.value as any)} className="admin-form-input">
                  <option value="percent">Prosent (%)</option>
                  <option value="fixed">Fast beløp (NOK)</option>
                  <option value="free_shipping">Fri frakt</option>
                </select>
              </div>
            </div>

            {kind !== 'free_shipping' && (
              <div className="admin-form-group">
                <label className="admin-label">{kind === 'percent' ? 'Prosent (0–100)' : 'NOK av delsum'} *</label>
                <input
                  name="value"
                  type="number"
                  step="0.01"
                  min="0"
                  max={kind === 'percent' ? '100' : undefined}
                  required
                  className="admin-form-input"
                  placeholder={kind === 'percent' ? '10' : '100'}
                />
              </div>
            )}

            <div className="admin-form-group">
              <label className="admin-label">Minimum delsum (NOK)</label>
              <input name="min_subtotal" type="number" step="0.01" min="0" defaultValue="0" className="admin-form-input" />
              <div style={{ fontSize: 11, color: 'var(--admin-text-dim)', marginTop: 4 }}>
                Sett til 0 for ingen minimum.
              </div>
            </div>

            <div className="admin-field-row">
              <div className="admin-form-group">
                <label className="admin-label">Gyldig fra</label>
                <input name="valid_from" type="datetime-local" className="admin-form-input" />
              </div>
              <div className="admin-form-group">
                <label className="admin-label">Gyldig til</label>
                <input name="valid_to" type="datetime-local" className="admin-form-input" />
              </div>
            </div>

            <div className="admin-form-group">
              <label className="admin-label">Maks bruk</label>
              <input name="max_uses" type="number" min="1" className="admin-form-input" placeholder="Ubegrenset" />
              <div style={{ fontSize: 11, color: 'var(--admin-text-dim)', marginTop: 4 }}>
                Antall ganger koden kan brukes totalt. La stå tom for ubegrenset.
              </div>
            </div>

            <div className="admin-checkbox-row">
              <input name="is_active" type="checkbox" id="is_active_new" defaultChecked className="admin-checkbox" />
              <label htmlFor="is_active_new" className="admin-label" style={{ marginBottom: 0 }}>Aktiv</label>
            </div>

            {error && <div className="admin-alert admin-alert-error">{error}</div>}

            <div style={{ display: 'flex', gap: 10 }}>
              <button type="submit" disabled={pending} className="admin-btn admin-btn-primary">
                {pending ? 'Lagrer…' : 'Opprett'}
              </button>
              <Link href="/coupons" className="admin-btn admin-btn-secondary">Avbryt</Link>
            </div>
          </form>
        </div>
      </div>
    </>
  )
}
