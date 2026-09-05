import Link from 'next/link'
import { adminGetProducts } from '@/lib/api/admin'
import ProductsFilter from './_filter'
import ProductRowActions from './_row-actions'

const CATEGORY_LABELS: Record<string, string> = {
  'liten-sjokoladeboks': 'Liten boks',
  'stor-sjokoladeboks': 'Stor boks',
  'sjokoladebarer': 'Sjokoladebar',
}

function formatNOK(val: string | number) {
  return `kr ${Number(val).toLocaleString('nb-NO', { minimumFractionDigits: 0 })}`
}

export default async function AdminProductsPage({
  searchParams,
}: {
  searchParams: Promise<{ category?: string; in_stock?: string }>
}) {
  const params = await searchParams
  const products = await adminGetProducts({ category: params.category, in_stock: params.in_stock })

  return (
    <>
      <div className="admin-page-header">
        <div>
          <div className="admin-page-title">Produkter</div>
          <div className="admin-page-subtitle">{products.length} produkter</div>
        </div>
        <Link href="/products/new" className="admin-btn admin-btn-primary">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <path d="M12 5v14M5 12h14" />
          </svg>
          Nytt produkt
        </Link>
      </div>

      <div className="admin-card">
        <div className="admin-card-header">
          <div className="admin-card-title">Produktkatalog</div>
        </div>

        <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--admin-border)' }}>
          <ProductsFilter />
        </div>

        <div className="admin-table-wrap">
          <table className="admin-table">
            <thead>
              <tr>
                <th>Produkt</th>
                <th>Kategori</th>
                <th>Størrelse</th>
                <th>Pris</th>
                <th>Batch</th>
                <th>Status</th>
                <th style={{ textAlign: 'right' }}></th>
              </tr>
            </thead>
            <tbody>
              {products.length === 0 && (
                <tr>
                  <td colSpan={7}>
                    <div className="admin-empty-state">
                      <div className="admin-empty-state-icon">
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                          <rect x="2" y="7" width="20" height="14" rx="2" />
                          <path d="M16 7V5a2 2 0 00-2-2h-4a2 2 0 00-2 2v2" />
                        </svg>
                      </div>
                      <div className="admin-empty-state-title">Ingen produkter funnet</div>
                      <div className="admin-empty-state-hint">
                        {params.category ? 'Prøv en annen kategori, eller nullstill filteret.' : 'Legg til ditt første produkt for å komme i gang.'}
                      </div>
                    </div>
                  </td>
                </tr>
              )}
              {products.map((product: any) => (
                <tr key={product.id}>
                  <td data-label="Produkt">
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                      {product.image_url ? (
                        <div style={{ width: 40, height: 40, borderRadius: 6, overflow: 'hidden', background: '#F4F6F8', flexShrink: 0 }}>
                          <img
                            src={product.image_url}
                            alt={product.name}
                            style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                          />
                        </div>
                      ) : (
                        <div style={{ width: 40, height: 40, borderRadius: 6, background: '#F4F6F8', flexShrink: 0 }} />
                      )}
                      <div>
                        <div style={{ fontWeight: 500, fontSize: 13.5 }}>{product.name}</div>
                        <div style={{ fontSize: 11.5, color: 'var(--admin-text-dim)', fontFamily: 'var(--admin-mono)' }}>{product.slug}</div>
                      </div>
                    </div>
                  </td>
                  <td data-label="Kategori">
                    <span className="admin-badge admin-badge-gray">
                      {CATEGORY_LABELS[product.category] ?? product.category}
                    </span>
                  </td>
                  <td data-label="Størrelse" style={{ color: 'var(--admin-text-dim)', fontSize: 13 }}>{product.size}</td>
                  <td data-label="Pris" style={{ fontWeight: 600 }}>{formatNOK(product.price)}</td>
                  <td data-label="Batch" style={{ fontFamily: 'var(--admin-mono)', fontSize: 12.5 }}>
                    {product.batch_number} · {product.batch_count}/{product.batch_total}
                  </td>
                  <td data-label="Status">
                    <span className={`admin-badge ${product.in_stock ? 'admin-badge-green' : 'admin-badge-red'}`}>
                      {product.in_stock ? 'På lager' : 'Utsolgt'}
                    </span>
                  </td>
                  <td data-label="" style={{ textAlign: 'right' }}>
                    <ProductRowActions id={product.id} name={product.name} />
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
