'use client'

import Link from 'next/link'
import { useParams, useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import { useToast } from '@/components/Toast'

interface Truffle {
  id: string
  name: string
  color: string
  note: string
  is_active: boolean
}

export default function AdminEditFlavorPage() {
  const { id } = useParams<{ id: string }>()
  const router = useRouter()
  const toast = useToast()
  const [truffle, setTruffle] = useState<Truffle | null>(null)
  const [pending, setPending] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    fetch(`/api/admin-proxy/truffles/${id}`, { cache: 'no-store' })
      .then(r => r.ok ? r.json() : null)
      .then(setTruffle)
      .catch(() => setTruffle(null))
  }, [id])

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const fd = new FormData(e.currentTarget)
    const body = {
      name: String(fd.get('name') ?? '').trim(),
      color: String(fd.get('color') ?? '').trim(),
      note: String(fd.get('note') ?? '').trim(),
      is_active: fd.has('is_active'),
    }

    setPending(true)
    setError('')
    const res = await fetch(`/api/admin-proxy/truffles/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    })
    if (res.ok) {
      const updated = await res.json()
      setTruffle(updated)
      toast.success('Smak lagret')
    } else {
      const err = await res.json().catch(() => ({}))
      setError(typeof err === 'string' ? err : Object.entries(err).map(([k, v]) => `${k}: ${v}`).join(' • '))
      toast.error('Kunne ikke lagre')
    }
    setPending(false)
  }

  async function handleDelete() {
    if (!confirm(`Slette "${truffle?.name}" permanent?`)) return
    setDeleting(true)
    const res = await fetch(`/api/admin-proxy/truffles/${id}`, { method: 'DELETE' })
    if (res.ok) {
      toast.success('Smak slettet')
      router.push('/flavors')
      router.refresh()
    } else {
      toast.error('Kunne ikke slette')
      setDeleting(false)
    }
  }

  if (!truffle) {
    return <div style={{ padding: 24 }}>Laster…</div>
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
        <div className="admin-page-title">Rediger smak</div>
        <button onClick={handleDelete} disabled={deleting} className="admin-btn admin-btn-danger">
          Slett smak
        </button>
      </div>

      <div className="admin-card" style={{ maxWidth: 640 }}>
        <div className="admin-card-header">
          <div className="admin-card-title">Smaksdetaljer</div>
        </div>
        <div style={{ padding: 24 }}>
          <form onSubmit={handleSubmit} className="admin-form">
            <div className="admin-field-row">
              <div className="admin-form-group">
                <label className="admin-label">ID</label>
                <input value={truffle.id} disabled className="admin-form-input" style={{ opacity: 0.6 }} />
                <div style={{ fontSize: 11, color: 'var(--admin-text-dim)', marginTop: 4 }}>
                  ID kan ikke endres etter opprettelse.
                </div>
              </div>
              <div className="admin-form-group">
                <label className="admin-label">Navn *</label>
                <input name="name" required defaultValue={truffle.name} className="admin-form-input" />
              </div>
            </div>

            <div className="admin-form-group">
              <label className="admin-label">Farge (hex) *</label>
              <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                <input name="color" required pattern="#[0-9A-Fa-f]{6}" defaultValue={truffle.color} className="admin-form-input" style={{ flex: 1 }} />
                <span style={{ width: 32, height: 32, borderRadius: '50%', background: truffle.color, border: '1px solid var(--admin-border)' }} />
              </div>
            </div>

            <div className="admin-form-group">
              <label className="admin-label">Smaksnotater</label>
              <input name="note" maxLength={200} defaultValue={truffle.note} className="admin-form-input" />
            </div>

            <div className="admin-checkbox-row">
              <input name="is_active" type="checkbox" id="is_active_edit" defaultChecked={truffle.is_active} className="admin-checkbox" />
              <label htmlFor="is_active_edit" className="admin-label" style={{ marginBottom: 0 }}>Aktiv (vises i bygg-din-eske)</label>
            </div>

            {error && <div className="admin-alert admin-alert-error">{error}</div>}

            <div style={{ display: 'flex', gap: 10 }}>
              <button type="submit" disabled={pending} className="admin-btn admin-btn-primary">
                {pending ? 'Lagrer…' : 'Lagre endringer'}
              </button>
              <Link href="/flavors" className="admin-btn admin-btn-secondary">Avbryt</Link>
            </div>
          </form>
        </div>
      </div>
    </>
  )
}
