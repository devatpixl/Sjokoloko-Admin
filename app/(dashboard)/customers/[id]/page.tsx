'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import ConfirmDialog from '@/components/ConfirmDialog'
import { useToast } from '@/components/Toast'

function statusBadge(status: string) {
  const map: Record<string, string> = {
    Bekreftet: 'admin-badge-blue',
    Pakkes: 'admin-badge-orange',
    Sendt: 'admin-badge-purple',
    Levert: 'admin-badge-green',
  }
  return map[status] ?? 'admin-badge-gray'
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('nb-NO', {
    day: '2-digit', month: 'short', year: 'numeric',
  })
}

function formatNOK(val: string | number) {
  return `kr ${Number(val).toLocaleString('nb-NO', { minimumFractionDigits: 0 })}`
}

export default function AdminCustomerDetailPage() {
  const { id } = useParams<{ id: string }>()
  const router = useRouter()
  const toast = useToast()
  const [data, setData] = useState<any>(null)
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [isAdmin, setIsAdmin] = useState(false)
  const [isPending, setIsPending] = useState(false)
  const [confirmDelete, setConfirmDelete] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)

  useEffect(() => {
    fetch(`/api/admin-proxy/users/${id}`)
      .then(r => r.ok ? r.json() : null)
      .then(d => {
        if (!d) return
        setData(d)
        setName(d.user.name)
        setEmail(d.user.email)
        setIsAdmin(!!d.user.is_admin)
      })
  }, [id])

  async function handleSave() {
    setIsPending(true)
    try {
      const res = await fetch(`/api/admin-proxy/users/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, is_admin: isAdmin }),
      })
      if (!res.ok) {
        const err = await res.json().catch(() => ({}))
        throw new Error(typeof err === 'object' ? JSON.stringify(err) : String(err))
      }
      const updated = await res.json()
      setData((prev: any) => ({ ...prev, user: updated }))
      toast.success('Kunde lagret')
    } catch (e: any) {
      toast.error(`Kunne ikke lagre: ${e.message}`)
    }
    setIsPending(false)
  }

  async function handleDelete() {
    setIsDeleting(true)
    const res = await fetch(`/api/admin-proxy/users/${id}`, { method: 'DELETE' })
    if (res.ok) {
      toast.success('Kunde slettet')
      router.push('/customers')
      router.refresh()
    } else {
      const err = await res.json().catch(() => ({}))
      toast.error(err.detail || 'Kunne ikke slette')
      setIsDeleting(false)
      setConfirmDelete(false)
    }
  }

  if (!data) {
    return (
      <div>
        <div className="admin-skeleton" style={{ height: 24, width: 200, marginBottom: 24 }} />
        <div className="admin-split">
          <div className="admin-card" style={{ padding: 24 }}>
            <div className="admin-skeleton" style={{ height: 40, marginBottom: 12 }} />
            <div className="admin-skeleton" style={{ height: 40, marginBottom: 12 }} />
            <div className="admin-skeleton" style={{ height: 40 }} />
          </div>
          <div className="admin-card" style={{ padding: 20 }}>
            <div className="admin-skeleton" style={{ height: 200 }} />
          </div>
        </div>
      </div>
    )
  }

  const { user, orders } = data
  const dirty = name !== user.name || email !== user.email || isAdmin !== user.is_admin

  return (
    <>
      <Link href="/customers" className="admin-back">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M19 12H5M12 5l-7 7 7 7" />
        </svg>
        Kunder
      </Link>

      <div className="admin-page-header">
        <div>
          <div className="admin-page-title">{user.name}</div>
          <div className="admin-page-subtitle">{user.email}</div>
        </div>
        <button
          onClick={() => setConfirmDelete(true)}
          disabled={isDeleting}
          className="admin-btn admin-btn-danger"
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M3 6h18M8 6V4a2 2 0 012-2h4a2 2 0 012 2v2M19 6l-1 14a2 2 0 01-2 2H8a2 2 0 01-2-2L5 6" />
          </svg>
          Slett kunde
        </button>
      </div>

      <div className="admin-split">
        {/* Orders */}
        <div className="admin-card">
          <div className="admin-card-header">
            <div className="admin-card-title">Bestillinger ({orders.length})</div>
          </div>
          {orders.length === 0 ? (
            <div className="admin-empty-state" style={{ padding: '40px 24px' }}>
              <div className="admin-empty-state-icon">
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                  <path d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
                </svg>
              </div>
              <div className="admin-empty-state-title">Ingen bestillinger enda</div>
            </div>
          ) : (
            <div className="admin-table-wrap">
              <table className="admin-table">
                <thead>
                  <tr>
                    <th>Ordrenr.</th>
                    <th>Dato</th>
                    <th>Varer</th>
                    <th>Total</th>
                    <th>Status</th>
                    <th></th>
                  </tr>
                </thead>
                <tbody>
                  {orders.map((order: any) => (
                    <tr key={order.order_number}>
                      <td data-label="Ordrenr." className="mono">{order.order_number}</td>
                      <td data-label="Dato" style={{ fontSize: 13, color: 'var(--admin-text-dim)' }}>{formatDate(order.created_at)}</td>
                      <td data-label="Varer" style={{ fontSize: 13, color: 'var(--admin-text-dim)' }}>{order.items?.length ?? 0}</td>
                      <td data-label="Total" style={{ fontWeight: 600 }}>{formatNOK(order.total)}</td>
                      <td data-label="Status">
                        <span className={`admin-badge ${statusBadge(order.status)}`}>{order.status}</span>
                      </td>
                      <td data-label="">
                        <Link
                          href={`/orders/${order.order_number}`}
                          className="admin-btn admin-btn-secondary"
                          style={{ height: 28, padding: '0 10px', fontSize: 12 }}
                        >
                          Se ordre
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Profile editor */}
        <div style={{ display: 'grid', gap: 20 }}>
          <div className="admin-card">
            <div className="admin-card-header">
              <div className="admin-card-title">Rediger profil</div>
            </div>
            <div style={{ padding: 20, display: 'grid', gap: 14 }}>
              <div className="admin-form-group">
                <label className="admin-label">Navn</label>
                <input value={name} onChange={e => setName(e.target.value)} className="admin-form-input" />
              </div>
              <div className="admin-form-group">
                <label className="admin-label">E-post</label>
                <input type="email" value={email} onChange={e => setEmail(e.target.value)} className="admin-form-input" />
              </div>
              <div className="admin-checkbox-row">
                <input
                  type="checkbox"
                  id="is_admin"
                  checked={isAdmin}
                  onChange={e => setIsAdmin(e.target.checked)}
                  className="admin-checkbox"
                />
                <label htmlFor="is_admin" className="admin-label" style={{ marginBottom: 0 }}>
                  Admin-tilgang
                </label>
              </div>
              <button
                onClick={handleSave}
                disabled={!dirty || isPending}
                className="admin-btn admin-btn-primary"
                style={{ justifyContent: 'center' }}
              >
                {isPending ? 'Lagrer…' : 'Lagre endringer'}
              </button>
            </div>
          </div>

          <div className="admin-card">
            <div className="admin-card-header">
              <div className="admin-card-title">Konto</div>
            </div>
            <div style={{ padding: 20, display: 'grid', gap: 12 }}>
              <Field label="Registrert" value={formatDate(user.created_at)} />
              <Field label="Bestillinger" value={String(orders.length)} />
              <Field label="Egendefinerte bokser" value={String(user.custom_box_count ?? 0)} />
            </div>
          </div>

          {user.waitlist_batches?.length > 0 && (
            <div className="admin-card">
              <div className="admin-card-header">
                <div className="admin-card-title">Venteliste</div>
              </div>
              <div style={{ padding: 20, display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                {user.waitlist_batches.map((b: string) => (
                  <span key={b} className="admin-badge admin-badge-gold">Batch {b}</span>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      <ConfirmDialog
        open={confirmDelete}
        title={`Slette ${user.name}?`}
        message={
          orders.length > 0
            ? `Denne kunden har ${orders.length} bestilling${orders.length === 1 ? '' : 'er'}. Hvis du sletter kunden vil bestillingene forbli, men uten kundekobling.`
            : 'Kundekontoen og all tilhørende informasjon fjernes permanent.'
        }
        confirmLabel="Slett kunde"
        danger
        pending={isDeleting}
        onConfirm={handleDelete}
        onCancel={() => setConfirmDelete(false)}
      />
    </>
  )
}

function Field({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <div className="admin-field-label">{label}</div>
      <div className="admin-field-value">{value || '—'}</div>
    </div>
  )
}
