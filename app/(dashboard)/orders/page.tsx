import { adminGetOrders, adminGetStats } from '@/lib/api/admin'
import OrdersFilter from './_filter'
import OrderRowActions from './_row-actions'

// An unpaid order must be obvious from the list, not only after opening it.
// CAPTURED is the only status that means the money actually arrived, so
// anything else is flagged — including a status we do not recognise, which
// must never be mistaken for paid.
const PAYMENT_FLAGS: Record<string, { text: string; className: string }> = {
  AUTHORIZED: { text: 'Reservert', className: 'admin-badge-blue' },
  REFUNDED: { text: 'Refundert', className: 'admin-badge-gray' },
  PENDING: { text: 'Ikke betalt', className: 'admin-badge-red' },
  CREATED: { text: 'Ikke betalt', className: 'admin-badge-red' },
  ABORTED: { text: 'Avbrutt', className: 'admin-badge-red' },
  EXPIRED: { text: 'Utløpt', className: 'admin-badge-red' },
  CANCELLED: { text: 'Kansellert', className: 'admin-badge-red' },
  TERMINATED: { text: 'Avsluttet', className: 'admin-badge-red' },
  FAILED: { text: 'Feilet', className: 'admin-badge-red' },
}

function paymentFlag(paymentStatus?: string | null) {
  const s = (paymentStatus ?? '').toUpperCase()
  if (s === 'CAPTURED') return null
  return PAYMENT_FLAGS[s] ?? { text: 'Ikke betalt', className: 'admin-badge-red' }
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
    day: '2-digit', month: 'short', year: 'numeric',
  })
}

function formatNOK(val: string | number) {
  return `kr ${Number(val).toLocaleString('nb-NO', { minimumFractionDigits: 0 })}`
}

export default async function AdminOrdersPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string; search?: string }>
}) {
  const params = await searchParams
  const [orders, stats] = await Promise.all([
    adminGetOrders({ status: params.status, search: params.search }),
    adminGetStats(),
  ])

  return (
    <>
      <div className="admin-page-header">
        <div>
          <div className="admin-page-title">Bestillinger</div>
          <div className="admin-page-subtitle">{stats.orders} totalt</div>
        </div>
      </div>

      <div className="admin-stats-grid cols-4">
        <div className="admin-stat-card">
          <div className="admin-stat-label">Totalt</div>
          <div className="admin-stat-value">{stats.orders}</div>
        </div>
        <div className="admin-stat-card">
          {/* This page fetches a FILTERED order list, so captured revenue cannot
              be computed here the way the dashboard does it. The API figure is
              Sum('total') over every order — abandoned and expired baskets
              included — so the label says what the number actually is rather
              than letting it pass for earnings. */}
          <div className="admin-stat-label">Ordreverdi (alle)</div>
          <div className="admin-stat-value accent">{formatNOK(stats.revenue)}</div>
          <div className="admin-stat-delta">Inkl. ubetalte og avbrutte</div>
        </div>
        <div className="admin-stat-card">
          <div className="admin-stat-label">Kunder</div>
          <div className="admin-stat-value">{stats.users}</div>
        </div>
        <div className="admin-stat-card">
          <div className="admin-stat-label">Venteliste</div>
          <div className="admin-stat-value">{stats.waitlist}</div>
        </div>
      </div>

      <div className="admin-card">
        <div className="admin-card-header">
          <div className="admin-card-title">Alle bestillinger</div>
        </div>

        <div className="admin-card-toolbar">
          <OrdersFilter />
        </div>

        <div className="admin-table-wrap">
          <table className="admin-table">
            <thead>
              <tr>
                <th>Ordrenr.</th>
                <th>Dato</th>
                <th>Kunde</th>
                <th>Produkter</th>
                <th>Total</th>
                <th>Status</th>
                <th className="t-actions"></th>
              </tr>
            </thead>
            <tbody>
              {orders.length === 0 && (
                <tr>
                  <td colSpan={7}>
                    <div className="admin-empty-state">
                      <div className="admin-empty-state-icon">
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                          <path d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
                        </svg>
                      </div>
                      <div className="admin-empty-state-title">Ingen bestillinger funnet</div>
                      <div className="admin-empty-state-hint">
                        {params.search || params.status ? 'Prøv et annet filter eller nullstill.' : 'Bestillinger fra nettstedet vises her.'}
                      </div>
                    </div>
                  </td>
                </tr>
              )}
              {orders.map((order: any) => (
                <tr key={order.order_number}>
                  <td data-label="Ordrenr." className="mono">{order.order_number}</td>
                  <td className="t-dim" data-label="Dato">{formatDate(order.created_at)}</td>
                  <td data-label="Kunde">
                    <div className="t-strong">{order.customer_name}</div>
                    <div className="t-dim">{order.ship_email}</div>
                  </td>
                  <td className="t-dim" data-label="Produkter">
                    {order.items?.length ?? 0} vare{order.items?.length !== 1 ? 'r' : ''}
                  </td>
                  <td className="t-bold" data-label="Total">{formatNOK(order.total)}</td>
                  <td data-label="Status">
                    <span className={`admin-badge ${statusBadge(order.status)}`}>{order.status}</span>
                    {paymentFlag(order.payment_status) && (
                      <span
                        className={`admin-badge ${paymentFlag(order.payment_status)!.className}`}
                        style={{ marginLeft: 6 }}
                      >
                        {paymentFlag(order.payment_status)!.text}
                      </span>
                    )}
                  </td>
                  <td className="t-actions" data-label="">
                    <OrderRowActions orderNumber={order.order_number} />
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
