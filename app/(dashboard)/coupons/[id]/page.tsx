'use client'

import Link from 'next/link'
import { useParams, useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import { useToast } from '@/components/Toast'

interface Coupon {
  id: number
  code: string
  kind: 'percent' | 'fixed' | 'free_shipping'
  value: string
  min_subtotal: string
  valid_from: string | null
  valid_to: string | null
  max_uses: number | null
  times_used: number
  is_active: boolean
}

function toLocalInput(iso: string | null): string {
  if (!iso) return ''
  const d = new Date(iso)
  const tz = d.getTimezoneOffset() * 60000
  return new Date(d.getTime() - tz).toISOString().slice(0, 16)
}

export default function AdminEditCouponPage() {
  const params = useParams<{ id: string }>()
  const router = useRouter()
  const toast = useToast()
  const [coupon, setCoupon] = useState<Coupon | null>(null)
  const [pending, setPending] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    fetch(`/api/admin-proxy/coupons/${params.id}`, { cache: 'no-store' })
      .then(r => r.ok ? r.json() : null)
      .then(setCoupon)
  }, [params.id])

  if (!coupon) {
    return <div style={{ padding: 24 }}>Laster…</div>
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    if (!coupon) return
    const fd = new FormData(e.currentTarget)
    const body: Record<string, any> = {
      code: String(fd.get('code') ?? '').trim().toUpperCase(),
      kind: String(fd.get('kind') ?? coupon.kind),
      value: coupon.kind === 'free_shipping' ? '0' : String(fd.get('value') ?? coupon.value),
      min_subtotal: String(fd.get('min_subtotal') ?? coupon.min_subtotal) || '0',
      max_uses: fd.get('max_uses') ? Number(fd.get('max_uses')) : null,
      valid_from: fd.get('valid_from') ? new Date(String(fd.get('valid_from'))).toISOString() : null,
      valid_to: fd.get('valid_to') ? new Date(String(fd.get('valid_to'))).toISOString() : null,
      is_active: fd.has('is_active'),
    }
    setPending(true)
    setError('')
    const res = await fetch(`/api/admin-proxy/coupons/${coupon.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    })
    if (res.ok) {
      toast.success('Lagret')
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
        <div className="admin-page-title">{coupon.code}</div>
        <div className="admin-page-subtitle">Brukt {coupon.times_used} {coupon.max_uses ? `/ ${coupon.max_uses}` : ''} ganger</div>
      </div>

      <div className="admin-card" style={{ maxWidth: 720 }}>
        <div style={{ padding: 24 }}>
          <form onSubmit={handleSubmit} className="admin-form">
            <div className="admin-field-row">
              <div className="admin-form-group">
                <label className="admin-label">Kode</label>
                <input name="code" defaultValue={coupon.code} required maxLength={40} className="admin-form-input" style={{ textTransform: 'uppercase' }} />
              </div>
              <div className="admin-form-group">
                <label className="admin-label">Type</label>
                <select name="kind" defaultValue={coupon.kind} className="admin-form-input">
                  <option value="percent">Prosent (%)</option>
                  <option value="fixed">Fast beløp (NOK)</option>
                  <option value="free_shipping">Fri frakt</option>
                </select>
              </div>
            </div>

            {coupon.kind !== 'free_shipping' && (
              <div className="admin-form-group">
                <label className="admin-label">{coupon.kind === 'percent' ? 'Prosent (0–100)' : 'NOK av delsum'}</label>
                <input name="value" type="number" step="0.01" min="0" max={coupon.kind === 'percent' ? '100' : undefined} defaultValue={coupon.value} required className="admin-form-input" />
              </div>
            )}

            <div className="admin-form-group">
              <label className="admin-label">Minimum delsum (NOK)</label>
              <input name="min_subtotal" type="number" step="0.01" min="0" defaultValue={coupon.min_subtotal} className="admin-form-input" />
            </div>

            <div className="admin-field-row">
              <div className="admin-form-group">
                <label className="admin-label">Gyldig fra</label>
                <input name="valid_from" type="datetime-local" defaultValue={toLocalInput(coupon.valid_from)} className="admin-form-input" />
              </div>
              <div className="admin-form-group">
                <label className="admin-label">Gyldig til</label>
                <input name="valid_to" type="datetime-local" defaultValue={toLocalInput(coupon.valid_to)} className="admin-form-input" />
              </div>
            </div>

            <div className="admin-form-group">
              <label className="admin-label">Maks bruk</label>
              <input name="max_uses" type="number" min="1" defaultValue={coupon.max_uses ?? ''} className="admin-form-input" placeholder="Ubegrenset" />
            </div>

            <div className="admin-checkbox-row">
              <input name="is_active" type="checkbox" id="is_active_edit" defaultChecked={coupon.is_active} className="admin-checkbox" />
              <label htmlFor="is_active_edit" className="admin-label" style={{ marginBottom: 0 }}>Aktiv</label>
            </div>

            {error && <div className="admin-alert admin-alert-error">{error}</div>}

            <div style={{ display: 'flex', gap: 10 }}>
              <button type="submit" disabled={pending} className="admin-btn admin-btn-primary">
                {pending ? 'Lagrer…' : 'Lagre'}
              </button>
              <Link href="/coupons" className="admin-btn admin-btn-secondary">Avbryt</Link>
            </div>
          </form>
        </div>
      </div>
    </>
  )
}
