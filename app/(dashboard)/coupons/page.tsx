'use client'

import Link from 'next/link'
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
  created_at: string
}

function kindLabel(k: Coupon['kind']) {
  if (k === 'percent') return 'Prosent'
  if (k === 'fixed') return 'Fast beløp'
  return 'Fri frakt'
}

function formatValue(c: Coupon) {
  if (c.kind === 'percent') return `${parseFloat(c.value).toFixed(0)} %`
  if (c.kind === 'fixed') return `kr ${parseFloat(c.value).toFixed(0)}`
  return '—'
}

export default function AdminCouponsPage() {
  const toast = useToast()
  const [coupons, setCoupons] = useState<Coupon[] | null>(null)
  const [pending, setPending] = useState<number | null>(null)

  async function load() {
    const res = await fetch('/api/admin-proxy/coupons', { cache: 'no-store' })
    if (res.ok) setCoupons(await res.json())
    else setCoupons([])
  }

  useEffect(() => { load() }, [])

  async function toggleActive(c: Coupon) {
    setPending(c.id)
    const res = await fetch(`/api/admin-proxy/coupons/${c.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ is_active: !c.is_active }),
    })
    if (res.ok) {
      toast.success(c.is_active ? `${c.code} deaktivert` : `${c.code} aktivert`)
      await load()
    } else {
      toast.error('Kunne ikke oppdatere')
    }
    setPending(null)
  }

  async function remove(c: Coupon) {
    if (!confirm(`Slett rabattkoden "${c.code}" permanent? Deaktiver i stedet hvis du vil ta vare på historikken.`)) return
    setPending(c.id)
    const res = await fetch(`/api/admin-proxy/coupons/${c.id}`, { method: 'DELETE' })
    if (res.ok) {
      toast.success('Slettet')
      await load()
    } else {
      toast.error('Kunne ikke slette')
    }
    setPending(null)
  }

  const active = coupons?.filter(c => c.is_active) ?? []
  const inactive = coupons?.filter(c => !c.is_active) ?? []

  return (
    <>
      <div className="admin-page-header">
        <div>
          <div className="admin-page-title">Rabattkoder</div>
          <div className="admin-page-subtitle">
            {coupons ? `${active.length} aktive · ${inactive.length} inaktive` : 'Laster…'}
          </div>
        </div>
        <Link href="/coupons/new" className="admin-btn admin-btn-primary">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <path d="M12 5v14M5 12h14" />
          </svg>
          Ny rabattkode
        </Link>
      </div>

      <div className="admin-card">
        <div className="admin-card-header">
          <div className="admin-card-title">Alle rabattkoder</div>
        </div>
        <div className="admin-table-wrap">
          <table className="admin-table">
            <thead>
              <tr>
                <th>Kode</th>
                <th>Type</th>
                <th>Verdi</th>
                <th>Min. delsum</th>
                <th>Brukt</th>
                <th>Gyldig</th>
                <th>Status</th>
                <th style={{ textAlign: 'right' }}></th>
              </tr>
            </thead>
            <tbody>
              {coupons === null && (
                <tr><td colSpan={8} style={{ padding: 16 }}>Laster…</td></tr>
              )}
              {coupons && coupons.length === 0 && (
                <tr><td colSpan={8} style={{ padding: 16, color: 'var(--admin-text-dim)' }}>Ingen rabattkoder ennå.</td></tr>
              )}
              {coupons?.map(c => (
                <tr key={c.id} style={{ opacity: c.is_active ? 1 : 0.55 }}>
                  <td data-label="Kode" style={{ fontFamily: 'var(--admin-mono)', fontWeight: 600 }}>{c.code}</td>
                  <td data-label="Type">{kindLabel(c.kind)}</td>
                  <td data-label="Verdi" style={{ fontFamily: 'var(--admin-mono)', fontSize: 13 }}>{formatValue(c)}</td>
                  <td data-label="Min. delsum" style={{ fontFamily: 'var(--admin-mono)', fontSize: 13 }}>
                    {parseFloat(c.min_subtotal) > 0 ? `kr ${parseFloat(c.min_subtotal).toFixed(0)}` : '—'}
                  </td>
                  <td data-label="Brukt" style={{ fontFamily: 'var(--admin-mono)', fontSize: 13 }}>
                    {c.times_used}{c.max_uses ? ` / ${c.max_uses}` : ''}
                  </td>
                  <td data-label="Gyldig" style={{ fontSize: 12, color: 'var(--admin-text-dim)' }}>
                    {c.valid_from || c.valid_to
                      ? `${c.valid_from ? new Date(c.valid_from).toLocaleDateString('nb-NO') : '–'} → ${c.valid_to ? new Date(c.valid_to).toLocaleDateString('nb-NO') : '∞'}`
                      : 'Alltid'}
                  </td>
                  <td data-label="Status">
                    <span className={`admin-badge ${c.is_active ? 'admin-badge-green' : 'admin-badge-gray'}`}>
                      {c.is_active ? 'Aktiv' : 'Inaktiv'}
                    </span>
                  </td>
                  <td data-label="" style={{ textAlign: 'right' }}>
                    <div style={{ display: 'inline-flex', gap: 6 }}>
                      <button
                        onClick={() => toggleActive(c)}
                        disabled={pending === c.id}
                        className="admin-btn admin-btn-secondary"
                        style={{ padding: '4px 10px', fontSize: 12 }}
                      >
                        {c.is_active ? 'Deaktiver' : 'Aktivér'}
                      </button>
                      <Link
                        href={`/coupons/${c.id}`}
                        className="admin-btn admin-btn-secondary"
                        style={{ padding: '4px 10px', fontSize: 12 }}
                      >
                        Rediger
                      </Link>
                      <button
                        onClick={() => remove(c)}
                        disabled={pending === c.id}
                        className="admin-btn admin-btn-danger"
                        style={{ padding: '4px 10px', fontSize: 12 }}
                      >
                        Slett
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </>
  )
}
