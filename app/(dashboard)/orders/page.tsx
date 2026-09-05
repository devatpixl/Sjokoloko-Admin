import { adminGetOrders, adminGetStats } from '@/lib/api/admin'
import OrdersFilter from './_filter'
import OrderRowActions from './_row-actions'

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

      <div className="admin-stats-grid" style={{ gridTemplateColumns: 'repeat(4, 1fr)', marginBottom: 24 }}>
        <div className="admin-stat-card">
          <div className="admin-stat-label">Totalt</div>
          <div className="admin-stat-value">{stats.orders}</div>
        </div>
        <div className="admin-stat-card">
          <div className="admin-stat-label">Omsetning</div>
          <div className="admin-stat-value accent">{formatNOK(stats.revenue)}</div>
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

        <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--admin-border)' }}>
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
                <th style={{ textAlign: 'right' }}></th>
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
                  <td className="mono">{order.order_number}</td>
                  <td style={{ color: 'var(--admin-text-dim)', fontSize: 13 }}>{formatDate(order.created_at)}</td>
                  <td>
                    <div style={{ fontWeight: 500 }}>{order.customer_name}</div>
                    <div style={{ fontSize: 12, color: 'var(--admin-text-dim)' }}>{order.ship_email}</div>
                  </td>
                  <td style={{ color: 'var(--admin-text-dim)', fontSize: 13 }}>
                    {order.items?.length ?? 0} vare{order.items?.length !== 1 ? 'r' : ''}
                  </td>
                  <td style={{ fontWeight: 600 }}>{formatNOK(order.total)}</td>
                  <td>
                    <span className={`admin-badge ${statusBadge(order.status)}`}>{order.status}</span>
                  </td>
                  <td style={{ textAlign: 'right' }}>
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
