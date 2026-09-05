'use client'

import { useParams, useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import Link from 'next/link'
import ConfirmDialog from '@/components/ConfirmDialog'
import { useToast } from '@/components/Toast'

const STATUS_OPTIONS = ['Mottatt', 'Bekreftet', 'Pakkes', 'Sendt', 'Levert']

const SHIPPING_METHOD_LABELS: Record<string, string> = {
  'self-pickup': 'Hent i butikk',
  'bring-pickup-point': 'Bring hentested',
  'postnord-locker': 'PostNord pakkeboks',
}

function statusBadge(status: string) {
  const map: Record<string, string> = {
    Mottatt: 'admin-badge-orange',
    Bekreftet: 'admin-badge-blue',
    Pakkes: 'admin-badge-orange',
    Sendt: 'admin-badge-purple',
    Levert: 'admin-badge-green',
  }
  return map[status] ?? 'admin-badge-gray'
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('nb-NO', {
    day: '2-digit', month: 'long', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  })
}

function formatNOK(val: string | number) {
  return `kr ${Number(val).toLocaleString('nb-NO', { minimumFractionDigits: 0 })}`
}

// Aggregate a Bygg-din-eske custom_slots array (e.g. [{name:'Mango'}, {name:'Mango'}, null])
// into a counted list: [{ name:'Mango', qty:2 }]. Nulls (empty slots) are ignored.
function countCustomSlots(slots: any): { name: string; qty: number }[] {
  if (!Array.isArray(slots) || slots.length === 0) return []
  const counts = new Map<string, number>()
  for (const slot of slots) {
    if (!slot) continue
    const name = typeof slot === 'string' ? slot : (slot.name ?? slot.id ?? '')
    if (!name) continue
    counts.set(name, (counts.get(name) ?? 0) + 1)
  }
  return Array.from(counts.entries()).map(([name, qty]) => ({ name, qty }))
}

export default function AdminOrderDetailPage() {
  const { orderNumber } = useParams<{ orderNumber: string }>()
  const router = useRouter()
  const toast = useToast()
  const [order, setOrder] = useState<any>(null)
  const [status, setStatus] = useState('')
  const [isPending, setIsPending] = useState(false)
  const [confirmDelete, setConfirmDelete] = useState(false)
  const [confirmLabel, setConfirmLabel] = useState(false)
  const [isLabeling, setIsLabeling] = useState(false)
  const [labelError, setLabelError] = useState('')
  const [isDeleting, setIsDeleting] = useState(false)

  useEffect(() => {
    fetch(`/api/admin-proxy/orders/${orderNumber}`)
      .then(r => r.ok ? r.json() : null)
      .then(data => { if (data) { setOrder(data); setStatus(data.status) } })
  }, [orderNumber])

  async function handleStatusSave() {
    setIsPending(true)
    try {
      const res = await fetch(`/api/admin-proxy/orders/${orderNumber}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }),
      })
      if (!res.ok) throw new Error()
      const updated = await res.json()
      setOrder(updated)
      setStatus(updated.status)
      toast.success(`Status oppdatert til ${updated.status}`)
    } catch {
      toast.error('Kunne ikke oppdatere status')
    }
    setIsPending(false)
  }

  async function handleCreateLabel() {
    setIsLabeling(true)
    setLabelError('')
    try {
      const res = await fetch(`/api/admin-proxy/orders/${orderNumber}/label`, { method: 'POST' })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) {
        setLabelError(data?.detail || 'Kunne ikke lage fraktetikett.')
      } else {
        setOrder(data)
        setStatus(data.status)
        toast.success(`Fraktetikett laget · ${data.consignment_number ?? ''}`)
        setConfirmLabel(false)
      }
    } catch {
      setLabelError('Kunne ikke kontakte serveren.')
    }
    setIsLabeling(false)
  }

  async function handleDelete() {
    setIsDeleting(true)
    const res = await fetch(`/api/admin-proxy/orders/${orderNumber}`, { method: 'DELETE' })
    if (res.ok) {
      toast.success(`Bestilling ${orderNumber} slettet`)
      router.push('/orders')
      router.refresh()
    } else {
      toast.error('Kunne ikke slette bestilling')
      setIsDeleting(false)
      setConfirmDelete(false)
    }
  }

  if (!order) {
    return <OrderDetailSkeleton />
  }

  return (
    <>
      <Link href="/orders" className="admin-back">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M19 12H5M12 5l-7 7 7 7" />
        </svg>
        Bestillinger
      </Link>

      <div className="admin-page-header">
        <div>
          <div className="admin-page-title" style={{ fontFamily: 'var(--admin-mono)', letterSpacing: '0' }}>
            {order.order_number}
          </div>
          <div className="admin-page-subtitle">{formatDate(order.created_at)}</div>
        </div>
        <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
          <span className={`admin-badge ${statusBadge(order.status)}`} style={{ fontSize: 13 }}>
            {order.status}
          </span>
          <button
            onClick={() => setConfirmDelete(true)}
            className="admin-btn admin-btn-danger"
            disabled={isDeleting}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M3 6h18M8 6V4a2 2 0 012-2h4a2 2 0 012 2v2M19 6l-1 14a2 2 0 01-2 2H8a2 2 0 01-2-2L5 6" />
            </svg>
            Slett bestilling
          </button>
        </div>
      </div>

      <div className="admin-detail-grid">
        <div style={{ display: 'grid', gap: 20 }}>
          <div className="admin-card">
            <div className="admin-card-header">
              <div className="admin-card-title">Varer ({order.items?.length})</div>
              <div style={{ fontWeight: 700, fontSize: 15 }}>{formatNOK(order.total)}</div>
            </div>
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Produkt</th>
                  <th>Variant</th>
                  <th style={{ textAlign: 'right' }}>Antall</th>
                  <th style={{ textAlign: 'right' }}>Pris</th>
                </tr>
              </thead>
              <tbody>
                {order.items?.map((item: any, i: number) => {
                  const slots = countCustomSlots(item.custom_slots)
                  const meta = [item.product?.size, item.product?.variant_label].filter(Boolean).join(' · ')
                  const productFlavors: string[] = Array.isArray(item.product?.flavors) ? item.product.flavors : []
                  return (
                    <tr key={i}>
                      <td style={{ fontWeight: 500 }}>
                        <div>{item.product?.name ?? item.product_name ?? '—'}</div>
                        {meta && (
                          <div style={{ fontSize: 12, color: 'var(--admin-text-dim)', fontWeight: 400, marginTop: 2 }}>
                            {meta}
                          </div>
                        )}
                        {slots.length > 0 && (
                          <ul style={{
                            margin: '6px 0 0 0',
                            padding: '0 0 0 16px',
                            color: 'var(--admin-text-dim)',
                            fontSize: 12,
                            fontWeight: 400,
                            listStyle: 'disc',
                          }}>
                            {slots.map(s => (
                              <li key={s.name}>{s.qty}× {s.name}</li>
                            ))}
                          </ul>
                        )}
                        {slots.length === 0 && productFlavors.length > 0 && (
                          <ul style={{
                            margin: '6px 0 0 0',
                            padding: '0 0 0 16px',
                            color: 'var(--admin-text-dim)',
                            fontSize: 12,
                            fontWeight: 400,
                            listStyle: 'disc',
                          }}>
                            {productFlavors.map((f, j) => (
                              <li key={j}>{f}</li>
                            ))}
                          </ul>
                        )}
                      </td>
                      <td style={{ color: 'var(--admin-text-dim)', fontSize: 13 }}>
                        {item.variant || '—'}
                        {item.initials && <span style={{ marginLeft: 6, fontFamily: 'var(--admin-mono)' }}>({item.initials})</span>}
                      </td>
                      <td style={{ textAlign: 'right' }}>{item.quantity}</td>
                      <td style={{ textAlign: 'right', fontWeight: 500 }}>{formatNOK(item.unit_price)}</td>
                    </tr>
                  )
                })}
                {Array.isArray(order.bundles_applied) && order.bundles_applied.map((b: any, i: number) => (
                  <tr key={`b-${i}`}>
                    <td colSpan={3} style={{ color: 'var(--admin-text-dim)', fontSize: 13 }}>
                      Tilbud: {b.name}
                    </td>
                    <td style={{ textAlign: 'right', color: 'var(--admin-text-dim)' }}>
                      − {formatNOK(b.discount)}
                    </td>
                  </tr>
                ))}
                {order.coupon_code && (
                  <tr>
                    <td colSpan={3} style={{ color: 'var(--admin-text-dim)', fontSize: 13 }}>
                      Rabattkode ({order.coupon_code})
                      {order.coupon_free_shipping && ' · fri frakt'}
                    </td>
                    <td style={{ textAlign: 'right', color: 'var(--admin-text-dim)' }}>
                      {parseFloat(order.discount_amount) > 0 ? `− ${formatNOK(order.discount_amount)}` : '—'}
                    </td>
                  </tr>
                )}
                <tr>
                  <td colSpan={3} style={{ color: 'var(--admin-text-dim)', fontSize: 13 }}>Frakt</td>
                  <td style={{ textAlign: 'right' }}>{formatNOK(order.shipping)}</td>
                </tr>
                <tr>
                  <td colSpan={3} style={{ fontWeight: 700 }}>Totalt</td>
                  <td style={{ textAlign: 'right', fontWeight: 700, fontSize: 15 }}>{formatNOK(order.total)}</td>
                </tr>
              </tbody>
            </table>
          </div>

          <div className="admin-card">
            <div className="admin-card-header">
              <div className="admin-card-title">Leveringsadresse</div>
            </div>
            <div style={{ padding: '20px', display: 'grid', gap: 16 }}>
              <div className="admin-field-row">
                <Field label="Navn" value={`${order.shipping_address?.firstName ?? ''} ${order.shipping_address?.lastName ?? ''}`.trim()} />
                <Field label="E-post" value={order.shipping_address?.email ?? ''} />
              </div>
              <div className="admin-field-row">
                <Field label="Telefon" value={order.shipping_address?.phone ?? ''} mono />
                <Field label="Adresse" value={order.shipping_address?.address ?? ''} />
              </div>
              <div className="admin-field-row">
                <Field label="Postnr / By" value={`${order.shipping_address?.postalCode ?? ''} ${order.shipping_address?.city ?? ''}`} />
                <Field label="Land" value={order.shipping_address?.country ?? ''} />
              </div>
            </div>
          </div>

          <div className="admin-card">
            <div className="admin-card-header">
              <div className="admin-card-title">Frakt og sporing</div>
            </div>
            <div style={{ padding: '20px', display: 'grid', gap: 16 }}>
              <div className="admin-field-row">
                <Field
                  label="Fraktmetode"
                  value={order.shipping_method ? (SHIPPING_METHOD_LABELS[order.shipping_method] ?? order.shipping_method) : ''}
                />
                <Field label="Sporingsnummer" value={order.consignment_number ?? ''} mono />
              </div>
              {order.shipping_method && order.shipping_method !== 'self-pickup' && (
                <>
                  <div className="admin-field-row">
                    <Field label="Hentested" value={order.pickup_point_name ?? ''} />
                    <Field label="Adresse" value={order.pickup_point_address1 ?? ''} />
                  </div>
                  <div className="admin-field-row">
                    <Field
                      label="Postnr / By"
                      value={`${order.pickup_point_postcode ?? ''} ${order.pickup_point_city ?? ''}`.trim()}
                    />
                    <Field
                      label="Forventet levering"
                      value={
                        order.shipping_expected_delivery
                          ? `${order.shipping_expected_delivery}${order.shipping_working_days ? ` (${order.shipping_working_days} virkedager)` : ''}`
                          : ''
                      }
                    />
                  </div>
                </>
              )}
              {/* No label exists until ops presses this: the carrier is told
                  about the parcel when it is actually being shipped, not when
                  the customer checks out. */}
              {!order.consignment_number
                && order.shipping_method
                && !(order.shipping_method === 'self-pickup' && order.status === 'Sendt') && (
                <div style={{ paddingTop: 4, display: 'grid', gap: 8 }}>
                  <button
                    className="admin-btn admin-btn-primary"
                    onClick={() => { setLabelError(''); setConfirmLabel(true) }}
                    disabled={isLabeling || order.payment_status !== 'CAPTURED'}
                    style={{ justifySelf: 'start' }}
                  >
                    {isLabeling
                      ? 'Sender…'
                      : order.shipping_method === 'self-pickup'
                        ? 'Marker som klar til henting →'
                        : 'Lag fraktetikett og send →'}
                  </button>
                  {order.payment_status !== 'CAPTURED' && (
                    <div className="admin-page-subtitle">
                      Ordren er ikke betalt ennå, så det lages ingen fraktetikett.
                    </div>
                  )}
                  {labelError && <div className="admin-alert admin-alert-error">{labelError}</div>}
                </div>
              )}
              {(order.tracking_url || order.consignment_pdf_url) && (
                <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', paddingTop: 4 }}>
                  {order.tracking_url && (
                    <a
                      href={order.tracking_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="admin-btn admin-btn-secondary"
                      style={{ fontSize: 12, height: 30, padding: '0 12px' }}
                    >
                      Spor pakken →
                    </a>
                  )}
                  {order.consignment_pdf_url && (
                    <a
                      href={order.consignment_pdf_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="admin-btn admin-btn-secondary"
                      style={{ fontSize: 12, height: 30, padding: '0 12px' }}
                    >
                      Åpne fraktetikett (PDF) →
                    </a>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>

        <div style={{ display: 'grid', gap: 20 }}>
          <div className="admin-card">
            <div className="admin-card-header">
              <div className="admin-card-title">Oppdater status</div>
            </div>
            <div style={{ padding: 20, display: 'grid', gap: 12 }}>
              <select
                value={status}
                onChange={e => setStatus(e.target.value)}
                className="admin-form-select"
              >
                {STATUS_OPTIONS.map(s => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>
              <button
                onClick={handleStatusSave}
                disabled={isPending || status === order.status}
                className="admin-btn admin-btn-primary"
                style={{ width: '100%', justifyContent: 'center' }}
              >
                {isPending ? 'Lagrer…' : 'Lagre status'}
              </button>
            </div>
          </div>

          <div className="admin-card">
            <div className="admin-card-header">
              <div className="admin-card-title">Betaling</div>
            </div>
            <div style={{ padding: 20, display: 'grid', gap: 12 }}>
              <Field label="Betalingsmetode" value={order.payment_method} />
              <Field label="Delsum" value={formatNOK(order.subtotal)} />
              {parseFloat(order.discount_amount ?? '0') > 0 && (
                <Field label="Rabatt" value={`− ${formatNOK(order.discount_amount)}${order.coupon_code ? ` (${order.coupon_code})` : ''}`} />
              )}
              <Field label="Frakt" value={formatNOK(order.shipping)} />
              <div style={{ borderTop: '1px solid var(--admin-border)', paddingTop: 12 }}>
                <Field label="Totalt" value={formatNOK(order.total)} />
              </div>
            </div>
          </div>

          {order.user && (
            <div className="admin-card">
              <div className="admin-card-header">
                <div className="admin-card-title">Kunde</div>
              </div>
              <div style={{ padding: 20 }}>
                <div style={{ fontWeight: 500 }}>{order.customer_name}</div>
                <div style={{ fontSize: 13, color: 'var(--admin-text-dim)', marginTop: 4 }}>{order.shipping_address?.email ?? ''}</div>
                <Link
                  href={`/customers/${order.user?.id ?? ''}`}
                  className="admin-btn admin-btn-secondary"
                  style={{ marginTop: 12, fontSize: 12, height: 30, padding: '0 10px' }}
                >
                  Se kundeprofil →
                </Link>
              </div>
            </div>
          )}
        </div>
      </div>

      <ConfirmDialog
        open={confirmLabel}
        title={order?.shipping_method === 'self-pickup'
          ? `Melde fra at ${orderNumber} er klar til henting?`
          : `Lage fraktetikett for ${orderNumber}?`}
        message={order?.shipping_method === 'self-pickup'
          ? 'Kunden får e-post om at bestillingen kan hentes i butikken, og ordren settes til Sendt.'
          : 'Etiketten opprettes hos Bring/PostNord, ordren settes til Sendt og kunden får sporingslenken på e-post. Dette kan ikke angres.'}
        confirmLabel={order?.shipping_method === 'self-pickup' ? 'Send beskjed' : 'Lag fraktetikett'}
        pending={isLabeling}
        onConfirm={handleCreateLabel}
        onCancel={() => setConfirmLabel(false)}
      />

      <ConfirmDialog
        open={confirmDelete}
        title={`Slette ${orderNumber}?`}
        message="Bestillingen og alle tilhørende varer fjernes permanent."
        confirmLabel="Slett bestilling"
        danger
        pending={isDeleting}
        onConfirm={handleDelete}
        onCancel={() => setConfirmDelete(false)}
      />
    </>
  )
}

function Field({ label, value, mono }: { label: string; value: string; mono?: boolean }) {
  return (
    <div>
      <div className="admin-field-label">{label}</div>
      <div className={`admin-field-value${mono ? ' mono' : ''}`}>{value || '—'}</div>
    </div>
  )
}

function OrderDetailSkeleton() {
  return (
    <div>
      <div className="admin-skeleton" style={{ height: 24, width: 200, marginBottom: 24 }} />
      <div className="admin-detail-grid">
        <div style={{ display: 'grid', gap: 20 }}>
          <div className="admin-card" style={{ padding: 24 }}>
            <div className="admin-skeleton" style={{ height: 18, width: '40%', marginBottom: 16 }} />
            {[...Array(3)].map((_, i) => (
              <div key={i} className="admin-skeleton" style={{ height: 28, marginBottom: 8 }} />
            ))}
          </div>
        </div>
        <div className="admin-card" style={{ padding: 20 }}>
          <div className="admin-skeleton" style={{ height: 18, width: '60%', marginBottom: 16 }} />
          {[...Array(3)].map((_, i) => (
            <div key={i} className="admin-skeleton" style={{ height: 28, marginBottom: 8 }} />
          ))}
        </div>
      </div>
    </div>
  )
}
