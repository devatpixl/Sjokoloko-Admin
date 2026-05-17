'use client'

import { useRouter } from 'next/navigation'
import { useState } from 'react'
import Link from 'next/link'
import ImageDropzone from '@/components/ImageDropzone'
import { useToast } from '@/components/Toast'

const CATEGORIES = [
  { value: 'liten-sjokoladeboks', label: 'Liten sjokoladeboks' },
  { value: 'stor-sjokoladeboks', label: 'Stor sjokoladeboks' },
  { value: 'sjokoladebarer', label: 'Sjokoladebarer' },
]

export default function AdminNewProductPage() {
  const router = useRouter()
  const toast = useToast()
  const [isPending, setIsPending] = useState(false)
  const [error, setError] = useState('')

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const form = e.currentTarget
    const data = new FormData(form)
    if (!data.get('image') || (data.get('image') as File).size === 0) {
      data.delete('image')
    }
    data.set('in_stock', data.has('in_stock') ? 'true' : 'false')

    setIsPending(true)
    setError('')
    const session = await fetch('/api/auth/session').then(r => r.json())
    const token = session?.accessToken
    const res = await fetch(
      `${process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:8000'}/api/admin/products/`,
      {
        method: 'POST',
        headers: token ? { Authorization: `Bearer ${token}` } : {},
        body: data,
      }
    )
    if (res.ok) {
      toast.success('Produkt opprettet')
      router.push('/products')
      router.refresh()
    } else {
      const err = await res.json().catch(() => ({}))
      setError(typeof err === 'string' ? err : Object.entries(err).map(([k, v]) => `${k}: ${v}`).join(' • '))
      setIsPending(false)
    }
  }

  return (
    <>
      <Link href="/products" className="admin-back">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M19 12H5M12 5l-7 7 7 7" />
        </svg>
        Produkter
      </Link>

      <div className="admin-page-header">
        <div className="admin-page-title">Nytt produkt</div>
      </div>

      <div className="admin-card" style={{ maxWidth: 720 }}>
        <div className="admin-card-header">
          <div className="admin-card-title">Produktdetaljer</div>
        </div>
        <div style={{ padding: 24 }}>
          <form onSubmit={handleSubmit} className="admin-form" style={{ maxWidth: '100%' }}>
            <div className="admin-field-row">
              <div className="admin-form-group">
                <label className="admin-label">Navn *</label>
                <input name="name" required className="admin-form-input" placeholder="Liten sjokoladeboks — Klassisk" />
              </div>
              <div className="admin-form-group">
                <label className="admin-label">Slug *</label>
                <input name="slug" required className="admin-form-input" placeholder="liten-sjokoladeboks-klassisk" />
              </div>
            </div>

            <div className="admin-field-row">
              <div className="admin-form-group">
                <label className="admin-label">Kategori *</label>
                <select name="category" required className="admin-form-select">
                  {CATEGORIES.map(c => (
                    <option key={c.value} value={c.value}>{c.label}</option>
                  ))}
                </select>
              </div>
              <div className="admin-form-group">
                <label className="admin-label">Størrelse</label>
                <input name="size" className="admin-form-input" placeholder="8 biter" />
              </div>
            </div>

            <div className="admin-field-row">
              <div className="admin-form-group">
                <label className="admin-label">Pris (NOK) *</label>
                <input name="price" type="number" step="0.01" required className="admin-form-input" placeholder="249.00" />
              </div>
              <div className="admin-form-group">
                <label className="admin-label">Min pris (valgfritt)</label>
                <input name="price_min" type="number" step="0.01" className="admin-form-input" placeholder="261.00" />
              </div>
              <div className="admin-form-group">
                <label className="admin-label">Maks pris (valgfritt)</label>
                <input name="price_max" type="number" step="0.01" className="admin-form-input" placeholder="471.00" />
              </div>
            </div>

            <div className="admin-field-row">
              <div className="admin-form-group">
                <label className="admin-label">Variant-gruppe (valgfritt)</label>
                <input name="variant_group" className="admin-form-input" placeholder="vanlig-16" />
                <div style={{ fontSize: 11, color: 'var(--admin-text-dim)', marginTop: 4 }}>
                  Produkter med samme gruppe vises som én familie-kort på butikken.
                </div>
              </div>
              <div className="admin-form-group">
                <label className="admin-label">Variant-etikett (valgfritt)</label>
                <input name="variant_label" className="admin-form-input" placeholder="Klassisk" />
                <div style={{ fontSize: 11, color: 'var(--admin-text-dim)', marginTop: 4 }}>
                  Kort navn for denne varianten innen gruppen.
                </div>
              </div>
            </div>

            <div className="admin-form-group">
              <label className="admin-label">Beskrivelse</label>
              <textarea name="blurb" className="admin-form-textarea" placeholder="En kort beskrivelse av produktet…" />
            </div>

            <div className="admin-field-row">
              <div className="admin-form-group">
                <label className="admin-label">Batchnummer</label>
                <input name="batch_number" className="admin-form-input" placeholder="05" defaultValue="05" />
              </div>
              <div className="admin-form-group">
                <label className="admin-label">Batch total</label>
                <input name="batch_total" type="number" className="admin-form-input" placeholder="220" defaultValue="220" />
              </div>
            </div>

            <div className="admin-form-group">
              <label className="admin-label">Produktbilde</label>
              <ImageDropzone name="image" />
            </div>

            <div className="admin-checkbox-row">
              <input name="in_stock" type="checkbox" id="in_stock" defaultChecked className="admin-checkbox" />
              <label htmlFor="in_stock" className="admin-label" style={{ marginBottom: 0 }}>På lager</label>
            </div>

            {error && <div className="admin-alert admin-alert-error">{error}</div>}

            <div style={{ display: 'flex', gap: 10 }}>
              <button
                type="submit"
                disabled={isPending}
                className="admin-btn admin-btn-primary"
              >
                {isPending ? 'Lagrer…' : 'Opprett produkt'}
              </button>
              <Link href="/products" className="admin-btn admin-btn-secondary">Avbryt</Link>
            </div>
          </form>
        </div>
      </div>
    </>
  )
}
