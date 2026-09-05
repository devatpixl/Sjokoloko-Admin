'use client'

import Link from 'next/link'
import { useEffect, useState } from 'react'
import { useToast } from '@/components/Toast'

interface Truffle {
  id: string
  name: string
  color: string
  note: string
  is_active: boolean
}

export default function AdminFlavorsPage() {
  const toast = useToast()
  const [truffles, setTruffles] = useState<Truffle[] | null>(null)
  const [pending, setPending] = useState<string | null>(null)

  async function load() {
    const res = await fetch('/api/admin-proxy/truffles', { cache: 'no-store' })
    if (res.ok) setTruffles(await res.json())
    else setTruffles([])
  }

  useEffect(() => { load() }, [])

  async function toggleActive(t: Truffle) {
    setPending(t.id)
    const res = await fetch(`/api/admin-proxy/truffles/${t.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ is_active: !t.is_active }),
    })
    if (res.ok) {
      toast.success(t.is_active ? `${t.name} satt som sikkerhetskopi` : `${t.name} aktivert`)
      await load()
    } else {
      toast.error('Kunne ikke oppdatere')
    }
    setPending(null)
  }

  async function remove(t: Truffle) {
    if (!confirm(`Slett "${t.name}" permanent? Sikkerhetskopier hellere ved å sette inaktiv.`)) return
    setPending(t.id)
    const res = await fetch(`/api/admin-proxy/truffles/${t.id}`, { method: 'DELETE' })
    if (res.ok) {
      toast.success('Smak slettet')
      await load()
    } else {
      toast.error('Kunne ikke slette')
    }
    setPending(null)
  }

  const active = truffles?.filter(t => t.is_active) ?? []
  const inactive = truffles?.filter(t => !t.is_active) ?? []

  return (
    <>
      <div className="admin-page-header">
        <div>
          <div className="admin-page-title">Smaker</div>
          <div className="admin-page-subtitle">
            {truffles ? `${active.length} aktive · ${inactive.length} sikkerhetskopi` : 'Laster…'}
          </div>
        </div>
        <Link href="/flavors/new" className="admin-btn admin-btn-primary">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <path d="M12 5v14M5 12h14" />
          </svg>
          Ny smak
        </Link>
      </div>

      <div className="admin-card">
        <div className="admin-card-header">
          <div className="admin-card-title">Alle smaker</div>
        </div>
        <div className="admin-table-wrap">
          <table className="admin-table">
            <thead>
              <tr>
                <th style={{ width: 60 }}></th>
                <th>Navn</th>
                <th>ID</th>
                <th>Tone</th>
                <th>Status</th>
                <th style={{ textAlign: 'right' }}></th>
              </tr>
            </thead>
            <tbody>
              {truffles === null && (
                <tr><td colSpan={6} style={{ padding: 16 }}>Laster…</td></tr>
              )}
              {truffles && truffles.length === 0 && (
                <tr><td colSpan={6} style={{ padding: 16, color: 'var(--admin-text-dim)' }}>Ingen smaker.</td></tr>
              )}
              {truffles?.map(t => (
                <tr key={t.id} style={{ opacity: t.is_active ? 1 : 0.55 }}>
                  <td data-label="">
                    <span style={{
                      display: 'inline-block', width: 28, height: 28, borderRadius: '50%',
                      background: t.color,
                      border: '1px solid var(--admin-border)',
                    }} />
                  </td>
                  <td data-label="Navn">
                    <div style={{ fontWeight: 500, fontSize: 14 }}>{t.name}</div>
                    <div style={{ fontSize: 12, color: 'var(--admin-text-dim)' }}>{t.note}</div>
                  </td>
                  <td data-label="ID" style={{ fontFamily: 'var(--admin-mono)', fontSize: 12 }}>{t.id}</td>
                  <td data-label="Tone" style={{ fontFamily: 'var(--admin-mono)', fontSize: 12 }}>{t.color}</td>
                  <td data-label="Status">
                    <span className={`admin-badge ${t.is_active ? 'admin-badge-green' : 'admin-badge-gray'}`}>
                      {t.is_active ? 'Aktiv' : 'Sikkerhetskopi'}
                    </span>
                  </td>
                  <td data-label="" style={{ textAlign: 'right' }}>
                    <div style={{ display: 'inline-flex', gap: 6 }}>
                      <button
                        onClick={() => toggleActive(t)}
                        disabled={pending === t.id}
                        className="admin-btn admin-btn-secondary"
                        style={{ padding: '4px 10px', fontSize: 12 }}
                      >
                        {t.is_active ? 'Sett inaktiv' : 'Aktivér'}
                      </button>
                      <Link
                        href={`/flavors/${t.id}`}
                        className="admin-btn admin-btn-secondary"
                        style={{ padding: '4px 10px', fontSize: 12 }}
                      >
                        Rediger
                      </Link>
                      <button
                        onClick={() => remove(t)}
                        disabled={pending === t.id}
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
