'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import { useToast } from '@/components/Toast'

interface ProductOption {
  id: number
  name: string
  variant_group: string
  category: string
}

export default function AdminNewBundlePage() {
  const router = useRouter()
  const toast = useToast()
  const [pending, setPending] = useState(false)
  const [error, setError] = useState('')
  const [products, setProducts] = useState<ProductOption[]>([])
  const [selectedProducts, setSelectedProducts] = useState<number[]>([])
  const [matchMode, setMatchMode] = useState<'group' | 'products'>('group')

  useEffect(() => {
    fetch('/api/admin-proxy/products', { cache: 'no-store' })
      .then(r => r.ok ? r.json() : [])
      .then((rows: any[]) => setProducts(rows.map(p => ({
        id: p.id,
        name: p.name,
        variant_group: p.variant_group || '',
        category: p.category,
      }))))
  }, [])

  function toggleProduct(id: number) {
    setSelectedProducts(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id])
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const fd = new FormData(e.currentTarget)
    const body: Record<string, any> = {
      name: String(fd.get('name') ?? '').trim(),
      description: String(fd.get('description') ?? '').trim(),
      variant_group: matchMode === 'group' ? String(fd.get('variant_group') ?? '').trim() : '',
      products: matchMode === 'products' ? selectedProducts : [],
      required_quantity: Number(fd.get('required_quantity') ?? 3),
      bundle_price: String(fd.get('bundle_price') ?? '0'),
      includes_free_shipping: fd.has('includes_free_shipping'),
      valid_from: fd.get('valid_from') ? new Date(String(fd.get('valid_from'))).toISOString() : null,
      valid_to: fd.get('valid_to') ? new Date(String(fd.get('valid_to'))).toISOString() : null,
      is_active: fd.has('is_active'),
    }

    setPending(true)
    setError('')
    const res = await fetch('/api/admin-proxy/bundles', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    })
    if (res.ok) {
      toast.success('Tilbud opprettet')
      router.push('/bundles')
      router.refresh()
    } else {
      const err = await res.json().catch(() => ({}))
      setError(typeof err === 'string' ? err : Object.entries(err).map(([k, v]) => `${k}: ${Array.isArray(v) ? v.join(', ') : v}`).join(' • '))
      setPending(false)
    }
  }

  const variantGroups = Array.from(new Set(products.map(p => p.variant_group).filter(Boolean))).sort()

  return (
    <>
      <Link href="/bundles" className="admin-back">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M19 12H5M12 5l-7 7 7 7" />
        </svg>
        Tilbud
      </Link>

      <div className="admin-page-header">
        <div className="admin-page-title">Nytt tilbud</div>
      </div>

      <div className="admin-card" style={{ maxWidth: 720 }}>
        <div className="admin-card-header">
          <div className="admin-card-title">Detaljer</div>
        </div>
        <div style={{ padding: 24 }}>
          <form onSubmit={handleSubmit} className="admin-form">
            <div className="admin-form-group">
              <label className="admin-label">Navn *</label>
              <input name="name" required className="admin-form-input" placeholder="3-pakning Vanlig (16 biter)" />
            </div>
            <div className="admin-form-group">
              <label className="admin-label">Beskrivelse</label>
              <input name="description" maxLength={240} className="admin-form-input" placeholder="Velg 3 store esker for kr 949 — fri frakt inkludert" />
            </div>

            <div className="admin-form-group">
              <label className="admin-label">Hvilke produkter matcher? *</label>
              <div style={{ display: 'flex', gap: 16, marginBottom: 12 }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13 }}>
                  <input type="radio" name="match_mode" checked={matchMode === 'group'} onChange={() => setMatchMode('group')} />
                  Variantgruppe
                </label>
                <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13 }}>
                  <input type="radio" name="match_mode" checked={matchMode === 'products'} onChange={() => setMatchMode('products')} />
                  Eksplisitte produkter
                </label>
              </div>
              {matchMode === 'group' ? (
                <>
                  <input name="variant_group" list="variant_group_list" className="admin-form-input" placeholder="vanlig-16" />
                  <datalist id="variant_group_list">
                    {variantGroups.map(g => <option key={g} value={g} />)}
                  </datalist>
                  <div style={{ fontSize: 11, color: 'var(--admin-text-dim)', marginTop: 4 }}>
                    Alle produkter som deler denne variant_group telles. F.eks. <code>vanlig-16</code>.
                  </div>
                </>
              ) : (
                <div style={{ border: '1px solid var(--admin-border)', padding: 12, maxHeight: 200, overflow: 'auto' }}>
                  {products.length === 0 && <div style={{ fontSize: 12, color: 'var(--admin-text-dim)' }}>Laster produkter…</div>}
                  {products.map(p => (
                    <label key={p.id} style={{ display: 'flex', gap: 8, padding: '4px 0', fontSize: 13 }}>
                      <input type="checkbox" checked={selectedProducts.includes(p.id)} onChange={() => toggleProduct(p.id)} />
                      <span>{p.name} <span style={{ color: 'var(--admin-text-dim)', fontSize: 11 }}>({p.category})</span></span>
                    </label>
                  ))}
                </div>
              )}
            </div>

            <div className="admin-field-row">
              <div className="admin-form-group">
                <label className="admin-label">Antall som kreves *</label>
                <input name="required_quantity" type="number" min="1" defaultValue="3" required className="admin-form-input" />
              </div>
              <div className="admin-form-group">
                <label className="admin-label">Pakkepris (NOK) *</label>
                <input name="bundle_price" type="number" step="0.01" min="0" required className="admin-form-input" placeholder="949" />
              </div>
            </div>

            <div className="admin-checkbox-row">
              <input name="includes_free_shipping" type="checkbox" id="ifs_new" defaultChecked className="admin-checkbox" />
              <label htmlFor="ifs_new" className="admin-label" style={{ marginBottom: 0 }}>Inkluder fri frakt</label>
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

            <div className="admin-checkbox-row">
              <input name="is_active" type="checkbox" id="is_active_b_new" defaultChecked className="admin-checkbox" />
              <label htmlFor="is_active_b_new" className="admin-label" style={{ marginBottom: 0 }}>Aktiv</label>
            </div>

            {error && <div className="admin-alert admin-alert-error">{error}</div>}

            <div style={{ display: 'flex', gap: 10 }}>
              <button type="submit" disabled={pending} className="admin-btn admin-btn-primary">
                {pending ? 'Lagrer…' : 'Opprett'}
              </button>
              <Link href="/bundles" className="admin-btn admin-btn-secondary">Avbryt</Link>
            </div>
          </form>
        </div>
      </div>
    </>
  )
}
