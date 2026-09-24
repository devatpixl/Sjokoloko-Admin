'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useToast } from '@/components/Toast'
import type { HorecaProduct } from './page'

const nok = (v: string | number) =>
  `kr ${Math.round(Number(v)).toLocaleString('nb-NO')}`

type Draft = {
  name: string; slug: string; wholesale_price: string
  pieces_per_tray_plain: string; pieces_per_tray_logo: string
  lead_time_days: string; description: string
  supports_logo: boolean; is_active: boolean
}

const blank = (d: { plain: number; logo: number }): Draft => ({
  name: '', slug: '', wholesale_price: '',
  pieces_per_tray_plain: String(d.plain), pieces_per_tray_logo: String(d.logo),
  lead_time_days: '', description: '', supports_logo: true, is_active: true,
})

export default function ProductEditor({
  products, defaults,
}: {
  products: HorecaProduct[]
  defaults: { plain: number; logo: number; leadPlain: number; leadLogo: number }
}) {
  const router = useRouter()
  const toast = useToast()
  const [editing, setEditing] = useState<number | 'new' | null>(null)
  const [draft, setDraft] = useState<Draft>(blank(defaults))
  const [pending, setPending] = useState(false)

  const set = (k: keyof Draft) =>
    (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
      setDraft((d) => ({
        ...d,
        [k]: e.target.type === 'checkbox'
          ? (e.target as HTMLInputElement).checked
          : e.target.value,
      }))

  function openNew() { setDraft(blank(defaults)); setEditing('new') }
  function openEdit(p: HorecaProduct) {
    setDraft({
      name: p.name, slug: p.slug, wholesale_price: String(p.wholesale_price),
      pieces_per_tray_plain: String(p.pieces_per_tray_plain),
      pieces_per_tray_logo: String(p.pieces_per_tray_logo),
      lead_time_days: p.lead_time_days == null ? '' : String(p.lead_time_days),
      description: p.description ?? '', supports_logo: p.supports_logo,
      is_active: p.is_active,
    })
    setEditing(p.id)
  }

  async function save(e: React.FormEvent) {
    e.preventDefault()
    setPending(true)
    const body: Record<string, unknown> = {
      name: draft.name.trim(),
      slug: draft.slug.trim() || undefined,
      wholesale_price: draft.wholesale_price,
      pieces_per_tray_plain: Number(draft.pieces_per_tray_plain),
      pieces_per_tray_logo: Number(draft.pieces_per_tray_logo),
      description: draft.description,
      supports_logo: draft.supports_logo,
      is_active: draft.is_active,
    }
    // Blank means "use the portal-wide lead time", which is not the same as 0.
    if (draft.lead_time_days.trim()) body.lead_time_days = Number(draft.lead_time_days)
    else body.lead_time_days = null

    const isNew = editing === 'new'
    try {
      const res = await fetch(
        isNew ? '/api/admin-proxy/horeca/products'
              : `/api/admin-proxy/horeca/products/${editing}`,
        { method: isNew ? 'POST' : 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(body) },
      )
      if (!res.ok) {
        const d = await res.json().catch(() => ({}))
        throw new Error(
          typeof d === 'object'
            ? Object.entries(d).map(([k, v]) => `${k}: ${[v].flat().join(' ')}`).join(' • ')
            : 'Kunne ikke lagre',
        )
      }
      toast.success(isNew ? `${draft.name} lagt til` : `${draft.name} oppdatert`)
      setEditing(null)
      router.refresh()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Kunne ikke lagre')
    } finally {
      setPending(false)
    }
  }

  const form = (
    <form className="admin-form" onSubmit={save} style={{ padding: 16 }}>
      <div className="admin-form-group">
        <label className="admin-label" htmlFor="p-name">Navn *</label>
        <input id="p-name" className="admin-input" required
               placeholder="F.eks. Signature brett 88 biter"
               value={draft.name} onChange={set('name')} />
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12 }}>
        <div className="admin-form-group">
          <label className="admin-label" htmlFor="p-price">Pris per brett, eks. mva *</label>
          <input id="p-price" className="admin-input" required inputMode="decimal"
                 value={draft.wholesale_price} onChange={set('wholesale_price')} />
        </div>
        <div className="admin-form-group">
          <label className="admin-label" htmlFor="p-plain">Biter uten logo</label>
          <input id="p-plain" className="admin-input" inputMode="numeric"
                 value={draft.pieces_per_tray_plain} onChange={set('pieces_per_tray_plain')} />
        </div>
        <div className="admin-form-group">
          <label className="admin-label" htmlFor="p-logo">Biter med logo</label>
          <input id="p-logo" className="admin-input" inputMode="numeric"
                 value={draft.pieces_per_tray_logo} onChange={set('pieces_per_tray_logo')} />
        </div>
      </div>
      <div className="admin-form-group">
        <label className="admin-label" htmlFor="p-lead">Egen frist, virkedager</label>
        <input id="p-lead" className="admin-input" inputMode="numeric"
               placeholder={`Tomt = portalens frist (${defaults.leadPlain} / ${defaults.leadLogo} dager)`}
               value={draft.lead_time_days} onChange={set('lead_time_days')} />
        <div className="admin-muted" style={{ fontSize: 12, marginTop: 4 }}>
          K-43 — et brett som krever håndlaging kan ha lengre frist enn et standardbrett.
        </div>
      </div>
      <div className="admin-form-group">
        <label className="admin-label" htmlFor="p-desc">Beskrivelse</label>
        <textarea id="p-desc" className="admin-form-textarea" rows={2}
                  value={draft.description} onChange={set('description')} />
      </div>
      <div style={{ display: 'flex', gap: 20, marginTop: 4 }}>
        <label className="admin-label" style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          <input type="checkbox" checked={draft.supports_logo} onChange={set('supports_logo')} />
          Kan trykkes med logo
        </label>
        <label className="admin-label" style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          <input type="checkbox" checked={draft.is_active} onChange={set('is_active')} />
          Aktiv — kan bestilles nå
        </label>
      </div>
      <div className="admin-form-actions">
        <button type="button" className="admin-btn admin-btn-ghost"
                onClick={() => setEditing(null)}>Avbryt</button>
        <button type="submit" className="admin-btn admin-btn-primary" disabled={pending}>
          {pending ? 'Lagrer…' : 'Lagre'}
        </button>
      </div>
    </form>
  )

  return (
    <div className="admin-card">
      <div className="admin-card-header">
        <div className="admin-card-title">Produkter</div>
        {editing === null && (
          <button type="button" className="admin-btn admin-btn-primary admin-btn-sm"
                  onClick={openNew}>Nytt produkt</button>
        )}
      </div>

      {editing === 'new' && form}

      <div className="admin-table-wrap">
        <table className="admin-table">
          <thead>
            <tr>
              <th>Navn</th>
              <th>Pris eks. mva</th>
              <th>Biter</th>
              <th>Frist</th>
              <th>Logo</th>
              <th>Status</th>
              <th className="t-actions"></th>
            </tr>
          </thead>
          <tbody>
            {products.map((p) => (
              editing === p.id ? (
                <tr key={p.id}><td colSpan={7} style={{ padding: 0 }}>{form}</td></tr>
              ) : (
                <tr key={p.id}>
                  <td><strong>{p.name}</strong>
                    <div className="admin-muted t-mono" style={{ fontSize: 11 }}>{p.slug}</div>
                  </td>
                  <td className="t-mono">{nok(p.wholesale_price)}</td>
                  <td className="t-mono">
                    {p.pieces_per_tray_plain} / {p.pieces_per_tray_logo}
                  </td>
                  <td className="t-mono">
                    {p.lead_time_days == null
                      ? <span className="admin-muted">standard</span>
                      : `${p.lead_time_days} d`}
                  </td>
                  <td>{p.supports_logo ? 'Ja' : '—'}</td>
                  <td>
                    <span className={`admin-badge ${p.is_active ? 'admin-badge-green' : 'admin-badge-gray'}`}>
                      {p.is_active ? 'Aktiv' : 'Inaktiv'}
                    </span>
                  </td>
                  <td className="t-actions">
                    <button type="button" className="admin-btn admin-btn-ghost admin-btn-sm"
                            onClick={() => openEdit(p)}>Rediger</button>
                  </td>
                </tr>
              )
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
