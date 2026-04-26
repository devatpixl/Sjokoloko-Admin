'use client'

import { useParams, useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import Link from 'next/link'
import ImageDropzone from '@/components/ImageDropzone'
import ConfirmDialog from '@/components/ConfirmDialog'
import { useToast } from '@/components/Toast'

const CATEGORIES = [
  { value: 'liten-sjokoladeboks', label: 'Liten sjokoladeboks' },
  { value: 'stor-sjokoladeboks', label: 'Stor sjokoladeboks' },
  { value: 'sjokoladebarer', label: 'Sjokoladebarer' },
]

export default function AdminEditProductPage() {
  const { id } = useParams<{ id: string }>()
  const router = useRouter()
  const toast = useToast()
  const [product, setProduct] = useState<any>(null)
  const [isPending, setIsPending] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const [confirmOpen, setConfirmOpen] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    fetch(`/api/admin-proxy/products/${id}`)
      .then(r => r.ok ? r.json() : null)
      .then(setProduct)
      .catch(() => setProduct(null))
  }, [id])

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const data = new FormData(e.currentTarget)
    if (!data.get('image') || (data.get('image') as File).size === 0) {
      data.delete('image')
    }
    data.set('in_stock', data.has('in_stock') ? 'true' : 'false')

    setIsPending(true)
    setError('')
    const res = await fetch(`/api/admin-proxy/products/${id}`, {
      method: 'PATCH',
      body: data,
    })
    if (res.ok) {
      const updated = await res.json()
      setProduct(updated)
      toast.success('Produkt lagret')
    } else {
      const err = await res.json().catch(() => ({}))
      setError(typeof err === 'string' ? err : Object.entries(err).map(([k, v]) => `${k}: ${v}`).join(' • '))
      toast.error('Kunne ikke lagre')
    }
    setIsPending(false)
  }

  async function handleDelete() {
    setIsDeleting(true)
    const res = await fetch(`/api/admin-proxy/products/${id}`, { method: 'DELETE' })
    if (res.ok) {
      toast.success('Produkt slettet')
      router.push('/products')
      router.refresh()
    } else {
      toast.error('Kunne ikke slette')
      setIsDeleting(false)
      setConfirmOpen(false)
    }
  }

  if (!product) {
    return <ProductDetailSkeleton />
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
        <div className="admin-page-title">Rediger produkt</div>
        <button
          onClick={() => setConfirmOpen(true)}
          disabled={isDeleting}
          className="admin-btn admin-btn-danger"
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M3 6h18M8 6V4a2 2 0 012-2h4a2 2 0 012 2v2M19 6l-1 14a2 2 0 01-2 2H8a2 2 0 01-2-2L5 6" />
          </svg>
          Slett produkt
        </button>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 280px', gap: 20, alignItems: 'start' }}>
        <div className="admin-card">
          <div className="admin-card-header">
            <div className="admin-card-title">Produktdetaljer</div>
          </div>
          <div style={{ padding: 24 }}>
            <form onSubmit={handleSubmit} className="admin-form" style={{ maxWidth: '100%' }}>
              <div className="admin-field-row">
                <div className="admin-form-group">
                  <label className="admin-label">Navn *</label>
                  <input name="name" required defaultValue={product.name} className="admin-form-input" />
                </div>
                <div className="admin-form-group">
                  <label className="admin-label">Slug</label>
                  <input name="slug" defaultValue={product.slug} className="admin-form-input" />
                </div>
              </div>

              <div className="admin-field-row">
                <div className="admin-form-group">
                  <label className="admin-label">Kategori</label>
                  <select name="category" defaultValue={product.category} className="admin-form-select">
                    {CATEGORIES.map(c => (
                      <option key={c.value} value={c.value}>{c.label}</option>
                    ))}
                  </select>
                </div>
                <div className="admin-form-group">
                  <label className="admin-label">Størrelse</label>
                  <input name="size" defaultValue={product.size} className="admin-form-input" />
                </div>
              </div>

              <div className="admin-field-row">
                <div className="admin-form-group">
                  <label className="admin-label">Pris (NOK)</label>
                  <input name="price" type="number" step="0.01" defaultValue={product.price} className="admin-form-input" />
                </div>
                <div className="admin-form-group">
                  <label className="admin-label">Maks pris</label>
                  <input name="price_max" type="number" step="0.01" defaultValue={product.price_max ?? ''} className="admin-form-input" />
                </div>
              </div>

              <div className="admin-form-group">
                <label className="admin-label">Beskrivelse</label>
                <textarea name="blurb" defaultValue={product.blurb} className="admin-form-textarea" />
              </div>

              <div className="admin-field-row">
                <div className="admin-form-group">
                  <label className="admin-label">Batchnummer</label>
                  <input name="batch_number" defaultValue={product.batch_number} className="admin-form-input" />
                </div>
                <div className="admin-field-row" style={{ gap: 8 }}>
                  <div className="admin-form-group">
                    <label className="admin-label">Solgt</label>
                    <input name="batch_count" type="number" defaultValue={product.batch_count} className="admin-form-input" />
                  </div>
                  <div className="admin-form-group">
                    <label className="admin-label">Total</label>
                    <input name="batch_total" type="number" defaultValue={product.batch_total} className="admin-form-input" />
                  </div>
                </div>
              </div>

              <div className="admin-form-group">
                <label className="admin-label">Produktbilde</label>
                <ImageDropzone name="image" initialUrl={product.image_url} />
              </div>

              <div className="admin-checkbox-row">
                <input name="in_stock" type="checkbox" id="in_stock" defaultChecked={product.in_stock} className="admin-checkbox" />
                <label htmlFor="in_stock" className="admin-label" style={{ marginBottom: 0 }}>På lager</label>
              </div>

              {error && <div className="admin-alert admin-alert-error">{error}</div>}

              <div style={{ display: 'flex', gap: 10 }}>
                <button type="submit" disabled={isPending} className="admin-btn admin-btn-primary">
                  {isPending ? 'Lagrer…' : 'Lagre endringer'}
                </button>
                <Link href="/products" className="admin-btn admin-btn-secondary">Avbryt</Link>
              </div>
            </form>
          </div>
        </div>

        <div className="admin-card">
          <div className="admin-card-header">
            <div className="admin-card-title">Forhåndsvisning</div>
          </div>
          <div style={{ padding: 16 }}>
            {product.image_url ? (
              <img
                src={product.image_url}
                alt={product.name}
                style={{ width: '100%', aspectRatio: '1', objectFit: 'cover', borderRadius: 6, marginBottom: 12 }}
              />
            ) : (
              <div style={{ width: '100%', aspectRatio: '1', background: '#F4F6F8', borderRadius: 6, marginBottom: 12 }} />
            )}
            <div style={{ fontWeight: 600, fontSize: 14 }}>{product.name}</div>
            <div style={{ color: 'var(--admin-text-dim)', fontSize: 13, marginTop: 4 }}>{product.size}</div>
            <div style={{ fontWeight: 700, marginTop: 8, color: 'var(--admin-accent)' }}>
              kr {Number(product.price).toLocaleString('nb-NO')}
            </div>
            <div style={{ marginTop: 8 }}>
              <span className={`admin-badge ${product.in_stock ? 'admin-badge-green' : 'admin-badge-red'}`}>
                {product.in_stock ? 'På lager' : 'Utsolgt'}
              </span>
            </div>
          </div>
        </div>
      </div>

      <ConfirmDialog
        open={confirmOpen}
        title={`Slette "${product.name}"?`}
        message="Dette kan ikke angres. Produktet fjernes fra katalogen og er ikke lenger tilgjengelig på nettstedet."
        confirmLabel="Slett produkt"
        danger
        pending={isDeleting}
        onConfirm={handleDelete}
        onCancel={() => setConfirmOpen(false)}
      />
    </>
  )
}

function ProductDetailSkeleton() {
  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 280px', gap: 20, alignItems: 'start' }}>
      <div className="admin-card" style={{ padding: 24 }}>
        <div className="admin-skeleton" style={{ height: 36, width: '40%', marginBottom: 24 }} />
        {[...Array(6)].map((_, i) => (
          <div key={i} style={{ marginBottom: 16 }}>
            <div className="admin-skeleton" style={{ height: 14, width: 80, marginBottom: 6 }} />
            <div className="admin-skeleton" style={{ height: 38 }} />
          </div>
        ))}
      </div>
      <div className="admin-card" style={{ padding: 16 }}>
        <div className="admin-skeleton" style={{ aspectRatio: '1', marginBottom: 12 }} />
        <div className="admin-skeleton" style={{ height: 16, marginBottom: 6 }} />
        <div className="admin-skeleton" style={{ height: 14, width: '60%' }} />
      </div>
    </div>
  )
}
