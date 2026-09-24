/**
 * K-53, K-54, K-55 — the one screen the SRS singles out:
 *
 *   "Det viktigste admin trenger er ikke en ordreliste, men svaret på ett
 *    spørsmål: hva skal lages denne uka?"
 *
 * So the page opens on a single day's production, not a list of orders: how
 * many trays of what, which of them carry a logo, and the files to print.
 */
import { adminGetHorecaProduction } from '@/lib/api/admin'
import DayPicker from './_daypicker'

type ProductRow = {
  slug: string; name: string
  trays_plain: number; trays_logo: number; trays: number
  pieces: number; orders: string[]
}
type LogoJob = {
  logo_id: string; logo_name: string; company: string
  status: string; trays: number; file_url: string
}
type Production = {
  date: string; capacity: number
  trays_booked: number; trays_remaining: number; order_count: number
  by_product: ProductRow[]; logo_jobs: LogoJob[]
  orders: { order_number: string; company_name: string; delivery_window_label: string;
            tray_count: number; delivery_label: string; delivery_city: string }[]
}

function pretty(iso: string) {
  const [y, m, d] = iso.split('-').map(Number)
  const s = new Date(y, m - 1, d).toLocaleDateString('nb-NO',
    { weekday: 'long', day: 'numeric', month: 'long' })
  // Sentence case, not title case. CSS `capitalize` would give
  // "Torsdag 24. September" — Norwegian month names are lower case.
  return s.charAt(0).toUpperCase() + s.slice(1)
}

export default async function HorecaProductionPage({
  searchParams,
}: {
  searchParams: Promise<{ date?: string }>
}) {
  const params = await searchParams
  const data: Production = await adminGetHorecaProduction(params.date)
  const full = data.capacity > 0 && data.trays_remaining === 0

  return (
    <>
      <div className="admin-page-header">
        <div>
          <div className="admin-page-title">Produksjon</div>
          <div className="admin-page-subtitle">{pretty(data.date)}</div>
        </div>
        <DayPicker date={data.date} />
      </div>

      <div className="admin-stats-grid">
        <div className="admin-stat-card">
          <div className="admin-stat-label">Brett denne dagen</div>
          <div className="admin-stat-value">{data.trays_booked}</div>
          <div className="admin-stat-delta">
            {data.capacity > 0
              ? `av ${data.capacity} i kapasitet`
              : 'ingen kapasitetsgrense satt'}
          </div>
        </div>
        <div className="admin-stat-card">
          <div className="admin-stat-label">Ledig kapasitet</div>
          <div className="admin-stat-value">{data.capacity > 0 ? data.trays_remaining : '—'}</div>
          <div className="admin-stat-delta">{full ? 'dagen er full' : 'brett igjen'}</div>
        </div>
        <div className="admin-stat-card">
          <div className="admin-stat-label">Bestillinger</div>
          <div className="admin-stat-value">{data.order_count}</div>
          <div className="admin-stat-delta">skal leveres</div>
        </div>
        <div className="admin-stat-card">
          <div className="admin-stat-label">Logojobber</div>
          <div className="admin-stat-value">{data.logo_jobs.length}</div>
          <div className="admin-stat-delta">spiseark å trykke</div>
        </div>
      </div>

      <div className="admin-card" style={{ marginTop: 16 }}>
        <div className="admin-card-header">
          <div className="admin-card-title">Hva skal lages</div>
          {data.by_product.length > 0 && (
            <a className="admin-btn admin-btn-ghost admin-btn-sm"
               href={`/api/admin-proxy/horeca/production/packing-list?date=${data.date}`}>
              Pakkeliste
            </a>
          )}
        </div>
        <div className="admin-table-wrap">
          <table className="admin-table">
            <thead>
              <tr>
                <th>Produkt</th><th>Uten logo</th><th>Med logo</th>
                <th>Brett totalt</th><th>Biter</th><th>Ordre</th>
              </tr>
            </thead>
            <tbody>
              {data.by_product.length === 0 && (
                <tr><td colSpan={6}>
                  <div className="admin-empty-state">
                    <div className="admin-empty-state-title">Ingenting å lage denne dagen</div>
                    <div className="admin-empty-state-text">Velg en annen dato over.</div>
                  </div>
                </td></tr>
              )}
              {data.by_product.map((r) => (
                <tr key={r.slug}>
                  <td><strong>{r.name}</strong></td>
                  <td className="t-mono">{r.trays_plain || '—'}</td>
                  <td className="t-mono">{r.trays_logo || '—'}</td>
                  <td className="t-mono"><strong>{r.trays}</strong></td>
                  <td className="t-mono">{r.pieces}</td>
                  <td className="t-mono" style={{ fontSize: 11 }}>{r.orders.join(', ')}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {data.logo_jobs.length > 0 && (
        <div className="admin-card" style={{ marginTop: 16 }}>
          <div className="admin-card-header">
            <div className="admin-card-title">Logoer som skal trykkes</div>
            <a className="admin-btn admin-btn-primary admin-btn-sm"
               href={`/api/admin-proxy/horeca/production/logos.zip?date=${data.date}`}>
              Last ned alle
            </a>
          </div>
          <div className="admin-table-wrap">
            <table className="admin-table">
              <thead>
                <tr><th>Logo</th><th>Bedrift</th><th>Brett</th><th>Status</th><th className="t-actions"></th></tr>
              </thead>
              <tbody>
                {data.logo_jobs.map((j) => (
                  <tr key={j.logo_id}>
                    <td><strong>{j.logo_name}</strong></td>
                    <td>{j.company}</td>
                    <td className="t-mono">{j.trays}</td>
                    <td>
                      <span className={`admin-badge ${
                        j.status === 'approved' ? 'admin-badge-green' : 'admin-badge-orange'}`}>
                        {j.status === 'approved' ? 'Godkjent' : 'Ikke godkjent'}
                      </span>
                    </td>
                    <td className="t-actions">
                      <a className="admin-btn admin-btn-ghost admin-btn-sm"
                         href={`/api/admin-proxy/horeca/logos/${j.logo_id}/file`}>Last ned</a>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <div className="admin-card" style={{ marginTop: 16 }}>
        <div className="admin-card-header">
          <div className="admin-card-title">Leveringer</div>
        </div>
        <div className="admin-table-wrap">
          <table className="admin-table">
            <thead>
              <tr><th>Ordre</th><th>Bedrift</th><th>Tidsvindu</th><th>Brett</th><th>Sted</th></tr>
            </thead>
            <tbody>
              {data.orders.map((o) => (
                <tr key={o.order_number}>
                  <td className="t-mono">{o.order_number}</td>
                  <td>{o.company_name}</td>
                  <td className="t-mono">{o.delivery_window_label}</td>
                  <td className="t-mono">{o.tray_count}</td>
                  <td>{o.delivery_label || o.delivery_city}</td>
                </tr>
              ))}
              {data.orders.length === 0 && (
                <tr><td colSpan={5}><div className="admin-empty-state">
                  <div className="admin-empty-state-text">Ingen leveringer denne dagen.</div>
                </div></td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </>
  )
}
