'use client'

import Link from 'next/link'
import { useParams, useRouter } from 'next/navigation'
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

interface ProductOption {
  id: number
  name: string
  variant_group: string
  category: string
}

function toLocalInput(iso: string | null): string {
  if (!iso) return ''
  const d = new Date(iso)
  const tz = d.getTimezoneOffset() * 60000
  return new Date(d.getTime() - tz).toISOString().slice(0, 16)
}

export default function AdminEditBundlePage() {
  const params = useParams<{ id: string }>()
  const router = useRouter()
  const toast = useToast()
  const [bundle, setBundle] = useState<Bundle | null>(null)
  const [products, setProducts] = useState<ProductOption[]>([])
  const [selectedProducts, setSelectedProducts] = useState<number[]>([])
  const [matchMode, setMatchMode] = useState<'group' | 'products'>('group')
  const [pending, setPending] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    Promise.all([
      fetch(`/api/admin-proxy/bundles/${params.id}`, { cache: 'no-store' }).then(r => r.ok ? r.json() : null),
      fetch('/api/admin-proxy/products', { cache: 'no-store' }).then(r => r.ok ? r.json() : []),
    ]).then(([b, ps]: [Bundle | null, any[]]) => {
      if (b) {
        setBundle(b)
        setSelectedProducts(b.products || [])
        setMatchMode(b.variant_group ? 'group' : 'products')
      }
      setProducts(ps.map(p => ({
        id: p.id,
        name: p.name,
        variant_group: p.variant_group || '',
        category: p.category,
      })))
    })
  }, [params.id])

  if (!bundle) {
    return <div style={{ padding: 24 }}>Laster…</div>
  }

  function toggleProduct(id: number) {
    setSelectedProducts(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id])
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    if (!bundle) return
    const fd = new FormData(e.currentTarget)
    const body: Record<string, any> = {
      name: String(fd.get('name') ?? '').trim(),
      description: String(fd.get('description') ?? '').trim(),
      variant_group: matchMode === 'group' ? String(fd.get('variant_group') ?? '').trim() : '',
      products: matchMode === 'products' ? selectedProducts : [],
      required_quantity: Number(fd.get('required_quantity') ?? bundle.required_quantity),
      bundle_price: String(fd.get('bundle_price') ?? bundle.bundle_price),
      includes_free_shipping: fd.has('includes_free_shipping'),
      valid_from: fd.get('valid_from') ? new Date(String(fd.get('valid_from'))).toISOString() : null,
      valid_to: fd.get('valid_to') ? new Date(String(fd.get('valid_to'))).toISOString() : null,
      is_active: fd.has('is_active'),
    }
    setPending(true)
    setError('')
    const res = await fetch(`/api/admin-proxy/bundles/${bundle.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    })
    if (res.ok) {
      toast.success('Lagret')
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
        <div className="admin-page-title">{bundle.name}</div>
      </div>

      <div className="admin-card" style={{ maxWidth: 720 }}>
        <div style={{ padding: 24 }}>
          <form onSubmit={handleSubmit} className="admin-form">
            <div className="admin-form-group">
              <label className="admin-label">Navn</label>
              <input name="name" defaultValue={bundle.name} required className="admin-form-input" />
            </div>
            <div className="admin-form-group">
              <label className="admin-label">Beskrivelse</label>
              <input name="description" defaultValue={bundle.description} maxLength={240} className="admin-form-input" />
            </div>

            <div className="admin-form-group">
              <label className="admin-label">Hvilke produkter matcher?</label>
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
                  <input name="variant_group" defaultValue={bundle.variant_group} list="variant_group_list" className="admin-form-input" />
                  <datalist id="variant_group_list">
                    {variantGroups.map(g => <option key={g} value={g} />)}
                  </datalist>
                </>
              ) : (
                <div style={{ border: '1px solid var(--admin-border)', padding: 12, maxHeight: 200, overflow: 'auto' }}>
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
                <label className="admin-label">Antall som kreves</label>
                <input name="required_quantity" type="number" min="1" defaultValue={bundle.required_quantity} required className="admin-form-input" />
              </div>
              <div className="admin-form-group">
                <label className="admin-label">Pakkepris (NOK)</label>
                <input name="bundle_price" type="number" step="0.01" min="0" defaultValue={bundle.bundle_price} required className="admin-form-input" />
              </div>
            </div>

            <div className="admin-checkbox-row">
              <input name="includes_free_shipping" type="checkbox" id="ifs_edit" defaultChecked={bundle.includes_free_shipping} className="admin-checkbox" />
              <label htmlFor="ifs_edit" className="admin-label" style={{ marginBottom: 0 }}>Inkluder fri frakt</label>
            </div>

            <div className="admin-field-row">
              <div className="admin-form-group">
                <label className="admin-label">Gyldig fra</label>
                <input name="valid_from" type="datetime-local" defaultValue={toLocalInput(bundle.valid_from)} className="admin-form-input" />
              </div>
              <div className="admin-form-group">
                <label className="admin-label">Gyldig til</label>
                <input name="valid_to" type="datetime-local" defaultValue={toLocalInput(bundle.valid_to)} className="admin-form-input" />
              </div>
            </div>

            <div className="admin-checkbox-row">
              <input name="is_active" type="checkbox" id="is_active_b_edit" defaultChecked={bundle.is_active} className="admin-checkbox" />
              <label htmlFor="is_active_b_edit" className="admin-label" style={{ marginBottom: 0 }}>Aktiv</label>
            </div>

            {error && <div className="admin-alert admin-alert-error">{error}</div>}

            <div style={{ display: 'flex', gap: 10 }}>
              <button type="submit" disabled={pending} className="admin-btn admin-btn-primary">
                {pending ? 'Lagrer…' : 'Lagre'}
              </button>
              <Link href="/bundles" className="admin-btn admin-btn-secondary">Avbryt</Link>
            </div>
          </form>
        </div>
      </div>
    </>
  )
}
