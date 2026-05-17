'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useState } from 'react'
import { useToast } from '@/components/Toast'

export default function AdminNewFlavorPage() {
  const router = useRouter()
  const toast = useToast()
  const [pending, setPending] = useState(false)
  const [error, setError] = useState('')

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const form = e.currentTarget
    const fd = new FormData(form)
    const body = {
      id: String(fd.get('id') ?? '').trim(),
      name: String(fd.get('name') ?? '').trim(),
      color: String(fd.get('color') ?? '').trim(),
      note: String(fd.get('note') ?? '').trim(),
      is_active: fd.has('is_active'),
    }

    setPending(true)
    setError('')
    const res = await fetch('/api/admin-proxy/truffles', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    })
    if (res.ok) {
      toast.success('Smak opprettet')
      router.push('/flavors')
      router.refresh()
    } else {
      const err = await res.json().catch(() => ({}))
      setError(typeof err === 'string' ? err : Object.entries(err).map(([k, v]) => `${k}: ${v}`).join(' • '))
      setPending(false)
    }
  }

  return (
    <>
      <Link href="/flavors" className="admin-back">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M19 12H5M12 5l-7 7 7 7" />
        </svg>
        Smaker
      </Link>

      <div className="admin-page-header">
        <div className="admin-page-title">Ny smak</div>
      </div>

      <div className="admin-card" style={{ maxWidth: 640 }}>
        <div className="admin-card-header">
          <div className="admin-card-title">Smaksdetaljer</div>
        </div>
        <div style={{ padding: 24 }}>
          <form onSubmit={handleSubmit} className="admin-form">
            <div className="admin-field-row">
              <div className="admin-form-group">
                <label className="admin-label">ID *</label>
                <input name="id" required maxLength={10} className="admin-form-input" placeholder="pis" />
                <div style={{ fontSize: 11, color: 'var(--admin-text-dim)', marginTop: 4 }}>
                  Kort kode (max 10 tegn). Brukes som referanse i bygge-din-egen.
                </div>
              </div>
              <div className="admin-form-group">
                <label className="admin-label">Navn *</label>
                <input name="name" required className="admin-form-input" placeholder="Pistasj" />
              </div>
            </div>

            <div className="admin-form-group">
              <label className="admin-label">Farge (hex) *</label>
              <input name="color" required pattern="#[0-9A-Fa-f]{6}" className="admin-form-input" placeholder="#8A9A5B" />
              <div style={{ fontSize: 11, color: 'var(--admin-text-dim)', marginTop: 4 }}>
                Hex-kode (#RRGGBB). Brukes til prikken i bygg-din-eske.
              </div>
            </div>

            <div className="admin-form-group">
              <label className="admin-label">Smaksnotater</label>
              <input name="note" maxLength={200} className="admin-form-input" placeholder="Myk og nøtteaktig med en lett sødme" />
            </div>

            <div className="admin-checkbox-row">
              <input name="is_active" type="checkbox" id="is_active_new" defaultChecked className="admin-checkbox" />
              <label htmlFor="is_active_new" className="admin-label" style={{ marginBottom: 0 }}>Aktiv (vises i bygg-din-eske)</label>
            </div>

            {error && <div className="admin-alert admin-alert-error">{error}</div>}

            <div style={{ display: 'flex', gap: 10 }}>
              <button type="submit" disabled={pending} className="admin-btn admin-btn-primary">
                {pending ? 'Lagrer…' : 'Opprett smak'}
              </button>
              <Link href="/flavors" className="admin-btn admin-btn-secondary">Avbryt</Link>
            </div>
          </form>
        </div>
      </div>
    </>
  )
}
