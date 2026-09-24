/** K-52, K-56, K-58 — every B2B order, filterable, with the status flow. */
import { adminGetHorecaOrders } from '@/lib/api/admin'
import OrderStatus from './_status'
import OrderFilter from './_filter'

type Order = {
  id: string; order_number: string; status: string; status_label: string
  company_name: string; delivery_date: string | null
  delivery_window_label: string; tray_count: number
  subtotal_ex_vat: string; total_inc_vat: string
  delivery_label: string; delivery_city: string
  placed_by_name: string; created_at: string
}

const TONE: Record<string, string> = {
  sendt: 'admin-badge-orange', bekreftet: 'admin-badge-blue',
  produksjon: 'admin-badge-blue', klar: 'admin-badge-purple',
  levert: 'admin-badge-green', avbestilt: 'admin-badge-red',
  utkast: 'admin-badge-gray',
}
const nok = (v: string) => `kr ${Math.round(Number(v)).toLocaleString('nb-NO')}`
const short = (iso: string | null) => {
  if (!iso) return '—'
  const [y, m, d] = iso.split('-').map(Number)
  return `${d}.${m}.${y}`
}

export default async function HorecaOrdersPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string; from?: string; to?: string }>
}) {
  const params = await searchParams
  const orders: Order[] = await adminGetHorecaOrders(params)
  const trays = orders.reduce((s, o) => s + (o.status === 'avbestilt' ? 0 : o.tray_count), 0)
  const qs = new URLSearchParams(
    Object.entries(params).filter(([, v]) => v) as [string, string][]
  ).toString()

  return (
    <>
      <div className="admin-page-header">
        <div>
          <div className="admin-page-title">Bestillinger</div>
          <div className="admin-page-subtitle">
            {orders.length} ordre · {trays} brett
          </div>
        </div>
        <a className="admin-btn admin-btn-secondary"
           href={`/api/admin-proxy/horeca/orders/export${qs ? `?${qs}` : ''}`}>
          Eksporter
        </a>
      </div>

      <div className="admin-card">
        <div className="admin-card-header">
          <div className="admin-card-title">B2B-ordre</div>
        </div>
        <div className="admin-card-toolbar"><OrderFilter /></div>

        <div className="admin-table-wrap">
          <table className="admin-table">
            <thead>
              <tr>
                <th>Ordre</th><th>Bedrift</th><th>Levering</th>
                <th>Brett</th><th>Sum eks. mva</th><th>Status</th>
                <th className="t-actions"></th>
              </tr>
            </thead>
            <tbody>
              {orders.length === 0 && (
                <tr><td colSpan={7}>
                  <div className="admin-empty-state">
                    <div className="admin-empty-state-title">Ingen bestillinger</div>
                    <div className="admin-empty-state-text">
                      B2B-ordre dukker opp her så snart en bedriftskunde sender en.
                    </div>
                  </div>
                </td></tr>
              )}
              {orders.map((o) => (
                <tr key={o.id}>
                  <td className="t-mono"><strong>{o.order_number}</strong>
                    <div className="admin-muted" style={{ fontSize: 11 }}>{o.placed_by_name}</div>
                  </td>
                  <td>{o.company_name}</td>
                  <td>
                    {short(o.delivery_date)}
                    <div className="admin-muted t-mono" style={{ fontSize: 11 }}>
                      {o.delivery_window_label} · {o.delivery_label || o.delivery_city}
                    </div>
                  </td>
                  <td className="t-mono">{o.tray_count}</td>
                  <td className="t-mono">{nok(o.subtotal_ex_vat)}</td>
                  <td>
                    <span className={`admin-badge ${TONE[o.status] ?? 'admin-badge-gray'}`}>
                      {o.status_label}
                    </span>
                  </td>
                  <td className="t-actions">
                    <OrderStatus orderNumber={o.order_number} status={o.status} />
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
