import Link from 'next/link'
import { adminGetStats, adminGetOrders } from '@/lib/api/admin'
import { RevenueArea, StatusBreakdown } from '@/components/DashboardCharts'

export const metadata = { title: 'Dashboard — Sjokoloko Admin' }

function formatNOK(val: string | number) {
  return `kr ${Number(val).toLocaleString('nb-NO', { minimumFractionDigits: 0 })}`
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('nb-NO', { day: '2-digit', month: 'short' })
}

const STATUS_BADGE: Record<string, string> = {
  Mottatt: 'admin-badge-gold',
  Bekreftet: 'admin-badge-blue',
  Pakkes: 'admin-badge-orange',
  Sendt: 'admin-badge-purple',
  Levert: 'admin-badge-green',
}

export default async function DashboardPage() {
  let stats = { orders: 0, users: 0, revenue: 0, waitlist: 0, unread_contact: 0 }
  try {
    stats = (await adminGetStats()) as typeof stats
  } catch {
    /* API utilgjengelig */
  }

  // Everything below is aggregated from this one list. The charts that used to
  // sit here ran on hardcoded arrays behind an "Eksempeldata" pill — not
  // because the numbers were unavailable, but because nobody had done the
  // aggregation. No new endpoint, no backend change.
  let orders: any[] = []
  try {
    orders = (await adminGetOrders({})) as any[]
  } catch {
    /* API utilgjengelig */
  }

  const recentOrders = orders.slice(0, 6)

  // ── Revenue, last 14 days ──
  // CAPTURED only: an order that was abandoned in Vipps is not revenue, and a
  // chart that counts it is telling the shop it earned money it never got.
  const DAYS = 14
  const today = new Date()
  today.setHours(0, 0, 0, 0)

  const buckets = new Map<string, number>()
  const labels: { key: string; label: string }[] = []
  for (let i = DAYS - 1; i >= 0; i--) {
    const d = new Date(today)
    d.setDate(d.getDate() - i)
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
    buckets.set(key, 0)
    labels.push({ key, label: `${d.getDate()}.${d.getMonth() + 1}` })
  }

  for (const o of orders) {
    if (o.payment_status !== 'CAPTURED') continue
    const key = String(o.created_at).slice(0, 10)
    if (buckets.has(key)) buckets.set(key, (buckets.get(key) ?? 0) + Number(o.total ?? 0))
  }

  const revenuePoints = labels.map(l => ({ ...l, value: buckets.get(l.key) ?? 0 }))

  // The API's revenue figure is Sum('total') over every order, so it counts
  // baskets that were abandoned in Vipps, expired or aborted. On this data it
  // reads roughly ten times what actually arrived. Computed here from the same
  // orders the charts use, so the card, the chart and the truth agree.
  const capturedRevenue = orders
    .filter(o => o.payment_status === 'CAPTURED')
    .reduce((sum, o) => sum + Number(o.total ?? 0), 0)

  // ── Orders by status, in pipeline order rather than by size ──
  const STATUS_ORDER = ['Mottatt', 'Bekreftet', 'Pakkes', 'Sendt', 'Levert']
  const counts = new Map<string, number>()
  for (const o of orders) counts.set(o.status, (counts.get(o.status) ?? 0) + 1)
  const statusRows = STATUS_ORDER
    .filter(s => (counts.get(s) ?? 0) > 0)
    .map(s => ({ status: s, count: counts.get(s) ?? 0 }))

  const storefrontUrl = process.env.NEXT_PUBLIC_STOREFRONT_URL ?? 'http://localhost:3000'

  return (
    <>
      <div className="admin-page-header">
        <div>
          <div className="admin-page-title">Dashboard</div>
          <div className="admin-page-subtitle">Oversikt · Sjokoloco</div>
        </div>
      </div>

      <div className="admin-stats-grid cols-4">
        <div className="admin-stat-card">
          <div className="admin-stat-label">Bestillinger</div>
          <div className="admin-stat-value">{stats.orders}</div>
        </div>
        <div className="admin-stat-card">
          <div className="admin-stat-label">Omsetning (betalt)</div>
          <div className="admin-stat-value accent">{formatNOK(capturedRevenue)}</div>
          <div className="admin-stat-delta">Kun gjennomførte betalinger</div>
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

      <div className="chart-grid-2">
        <RevenueArea
          points={revenuePoints}
          title="Omsetning siste 14 dager"
          note="Kun betalte ordrer — avbrutte og ubetalte teller ikke som omsetning."
        />
        <StatusBreakdown
          rows={statusRows}
          title="Bestillinger etter status"
          note={`${orders.length} bestillinger totalt.`}
        />
      </div>

      <div className="admin-card">
        <div className="admin-card-header">
          <div className="admin-card-title">Siste bestillinger</div>
          <Link href="/orders" className="admin-btn admin-btn-ghost admin-btn-sm">
            Se alle
          </Link>
        </div>
        <div className="admin-table-wrap">
          <table className="admin-table">
            <thead>
              <tr>
                <th>Ordrenr.</th>
                <th>Dato</th>
                <th>Kunde</th>
                <th>Total</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {recentOrders.length === 0 && (
                <tr>
                  <td colSpan={5}>
                    <div className="admin-empty-state">
                      <div className="admin-empty-state-title">Ingen bestillinger enda</div>
                      <div className="admin-empty-state-hint">Bestillinger fra nettstedet vises her.</div>
                    </div>
                  </td>
                </tr>
              )}
              {recentOrders.map((order: any) => (
                <tr key={order.order_number}>
                  <td className="mono" data-label="Ordrenr.">{order.order_number}</td>
                  <td className="t-dim" data-label="Dato">{formatDate(order.created_at)}</td>
                  <td data-label="Kunde">{order.customer_name}</td>
                  <td className="t-bold" data-label="Total">{formatNOK(order.total)}</td>
                  <td data-label="Status">
                    <span className={`admin-badge ${STATUS_BADGE[order.status] ?? 'admin-badge-gray'}`}>
                      {order.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="admin-card">
        <div className="admin-card-header">
          <div className="admin-card-title">Hurtighandlinger</div>
        </div>
        <div className="admin-card-body">
          <div className="admin-quick-actions">
            <Link href="/orders" className="admin-quick-action">
              <span className="admin-quick-action-icon" aria-hidden>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                  <path d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
                </svg>
              </span>
              <div>
                <div className="admin-quick-action-title">Bestillinger</div>
                <div className="admin-quick-action-desc">Se og oppdater alle ordre</div>
              </div>
            </Link>
            <Link href="/products/new" className="admin-quick-action">
              <span className="admin-quick-action-icon" aria-hidden>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                  <path d="M12 5v14M5 12h14" />
                </svg>
              </span>
              <div>
                <div className="admin-quick-action-title">Nytt produkt</div>
                <div className="admin-quick-action-desc">Legg inn en ny vare i butikken</div>
              </div>
            </Link>
            <Link href="/customers" className="admin-quick-action">
              <span className="admin-quick-action-icon" aria-hidden>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                  <circle cx="9" cy="7" r="4" />
                  <path d="M3 21v-2a4 4 0 014-4h4a4 4 0 014 4v2" />
                </svg>
              </span>
              <div>
                <div className="admin-quick-action-title">Kunder</div>
                <div className="admin-quick-action-desc">Kundeliste og detaljer</div>
              </div>
            </Link>
            <Link href="/waitlist" className="admin-quick-action">
              <span className="admin-quick-action-icon" aria-hidden>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                  <path d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2" />
                  <rect x="9" y="3" width="6" height="4" rx="1" />
                </svg>
              </span>
              <div>
                <div className="admin-quick-action-title">Venteliste</div>
                <div className="admin-quick-action-desc">{stats.waitlist} påmeldt</div>
              </div>
            </Link>
            <Link href="/contact" className="admin-quick-action">
              <span className="admin-quick-action-icon" aria-hidden>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                  <path d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
              </span>
              <div>
                <div className="admin-quick-action-title">Kontakt</div>
                <div className="admin-quick-action-desc">
                  {stats.unread_contact > 0 ? `${stats.unread_contact} uleste` : 'Innkomne meldinger'}
                </div>
              </div>
            </Link>
            <a href={storefrontUrl} target="_blank" rel="noopener noreferrer" className="admin-quick-action">
              <span className="admin-quick-action-icon" aria-hidden>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                  <path d="M18 13v6a2 2 0 01-2 2H5a2 2 0 01-2-2V8a2 2 0 012-2h6M15 3h6v6M10 14L21 3" />
                </svg>
              </span>
              <div>
                <div className="admin-quick-action-title">Åpne nettbutikk</div>
                <div className="admin-quick-action-desc">Forhåndsvis kundesiden</div>
              </div>
            </a>
          </div>
        </div>
      </div>
    </>
  )
}
