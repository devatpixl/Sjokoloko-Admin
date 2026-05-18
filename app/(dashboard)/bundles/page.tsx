'use client'

import Link from 'next/link'
import { useEffect, useState } from 'react'
import { useToast } from '@/components/Toast'

interface Bundle {
  id: number
  name: string
  description: string
  variant_group: string
  products: number[]
  required_quantity: number
  bundle_price: string
  includes_free_shipping: boolean
  is_active: boolean
  valid_from: string | null
  valid_to: string | null
}

export default function AdminBundlesPage() {
  const toast = useToast()
  const [bundles, setBundles] = useState<Bundle[] | null>(null)
  const [pending, setPending] = useState<number | null>(null)

  async function load() {
    const res = await fetch('/api/admin-proxy/bundles', { cache: 'no-store' })
    if (res.ok) setBundles(await res.json())
    else setBundles([])
  }

  useEffect(() => { load() }, [])

  async function toggleActive(b: Bundle) {
    setPending(b.id)
    const res = await fetch(`/api/admin-proxy/bundles/${b.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ is_active: !b.is_active }),
    })
    if (res.ok) {
      toast.success(b.is_active ? `${b.name} deaktivert` : `${b.name} aktivert`)
      await load()
    } else {
      toast.error('Kunne ikke oppdatere')
    }
    setPending(null)
  }

  async function remove(b: Bundle) {
    if (!confirm(`Slett tilbudet "${b.name}" permanent? Deaktiver i stedet hvis du vil ta vare på historikken.`)) return
    setPending(b.id)
    const res = await fetch(`/api/admin-proxy/bundles/${b.id}`, { method: 'DELETE' })
    if (res.ok) {
      toast.success('Slettet')
      await load()
    } else {
      toast.error('Kunne ikke slette')
    }
    setPending(null)
  }

  const active = bundles?.filter(b => b.is_active) ?? []
  const inactive = bundles?.filter(b => !b.is_active) ?? []

  return (
    <>
      <div className="admin-page-header">
        <div>
          <div className="admin-page-title">Tilbud / pakker</div>
          <div className="admin-page-subtitle">
            {bundles ? `${active.length} aktive · ${inactive.length} inaktive` : 'Laster…'}
          </div>
        </div>
        <Link href="/bundles/new" className="admin-btn admin-btn-primary">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <path d="M12 5v14M5 12h14" />
          </svg>
          Nytt tilbud
        </Link>
      </div>

      <div className="admin-card">
        <div className="admin-card-header">
          <div className="admin-card-title">Alle tilbud</div>
        </div>
        <div className="admin-table-wrap">
          <table className="admin-table">
            <thead>
              <tr>
                <th>Navn</th>
                <th>Variantgruppe</th>
                <th>Antall</th>
                <th>Pakkepris</th>
                <th>Fri frakt</th>
                <th>Status</th>
                <th style={{ textAlign: 'right' }}></th>
              </tr>
            </thead>
            <tbody>
              {bundles === null && (
                <tr><td colSpan={7} style={{ padding: 16 }}>Laster…</td></tr>
              )}
              {bundles && bundles.length === 0 && (
                <tr><td colSpan={7} style={{ padding: 16, color: 'var(--admin-text-dim)' }}>Ingen tilbud ennå.</td></tr>
              )}
              {bundles?.map(b => (
                <tr key={b.id} style={{ opacity: b.is_active ? 1 : 0.55 }}>
                  <td>
                    <div style={{ fontWeight: 500, fontSize: 14 }}>{b.name}</div>
                    {b.description && (
                      <div style={{ fontSize: 12, color: 'var(--admin-text-dim)' }}>{b.description}</div>
                    )}
                  </td>
                  <td style={{ fontFamily: 'var(--admin-mono)', fontSize: 13 }}>
                    {b.variant_group || `${b.products.length} produkt(er)`}
                  </td>
                  <td>{b.required_quantity}</td>
                  <td style={{ fontFamily: 'var(--admin-mono)', fontSize: 13 }}>
                    kr {parseFloat(b.bundle_price).toFixed(0)}
                  </td>
                  <td>
                    {b.includes_free_shipping ? (
                      <span className="admin-badge admin-badge-green">Ja</span>
                    ) : (
                      <span style={{ color: 'var(--admin-text-dim)', fontSize: 12 }}>Nei</span>
                    )}
                  </td>
                  <td>
                    <span className={`admin-badge ${b.is_active ? 'admin-badge-green' : 'admin-badge-gray'}`}>
                      {b.is_active ? 'Aktiv' : 'Inaktiv'}
                    </span>
                  </td>
                  <td style={{ textAlign: 'right' }}>
                    <div style={{ display: 'inline-flex', gap: 6 }}>
                      <button
                        onClick={() => toggleActive(b)}
                        disabled={pending === b.id}
                        className="admin-btn admin-btn-secondary"
                        style={{ padding: '4px 10px', fontSize: 12 }}
                      >
                        {b.is_active ? 'Deaktiver' : 'Aktivér'}
                      </button>
                      <Link
                        href={`/bundles/${b.id}`}
                        className="admin-btn admin-btn-secondary"
                        style={{ padding: '4px 10px', fontSize: 12 }}
                      >
                        Rediger
                      </Link>
                      <button
                        onClick={() => remove(b)}
                        disabled={pending === b.id}
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
