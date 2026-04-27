import Link from 'next/link'
import { adminGetStats } from '@/lib/api/admin'
import { DashboardRevenueBars, DashboardStatusBars } from '@/components/DashboardCharts'

export const metadata = { title: 'Dashboard — Sjokoloko Admin' }

function formatNOK(val: string | number) {
  return `kr ${Number(val).toLocaleString('nb-NO', { minimumFractionDigits: 0 })}`
}

/** Faste tall for visning — bytt til ekte `adminGetOrders` + aggregering når du vil. */
const FAKE_DAILY_REVENUE = [
  850, 1200, 0, 2100, 1340, 2980, 1650, 920, 2450, 1880, 720, 3420, 1990, 2760,
]

function buildFakeRevenuePoints() {
  const out: { key: string; label: string; value: number }[] = []
  for (let i = 13; i >= 0; i--) {
    const d = new Date()
    d.setHours(0, 0, 0, 0)
    d.setDate(d.getDate() - i)
    const key = d.toISOString().slice(0, 10)
    const [, m, day] = key.split('-')
    out.push({
      key,
      label: `${Number(day)}.${Number(m)}`,
      value: FAKE_DAILY_REVENUE[13 - i] ?? 0,
    })
  }
  return out
}

const FAKE_STATUS_ROWS = [
  { status: 'Levert', count: 28 },
  { status: 'Bekreftet', count: 14 },
  { status: 'Sendt', count: 9 },
  { status: 'Pakkes', count: 6 },
]

export default async function DashboardPage() {
  let stats = { orders: 0, users: 0, revenue: 0, waitlist: 0, unread_contact: 0 }
  try {
    stats = (await adminGetStats()) as typeof stats
  } catch {
    /* API utilgjengelig */
  }

  const revenuePoints = buildFakeRevenuePoints()
  const statusRows = FAKE_STATUS_ROWS
  const storefrontUrl = process.env.NEXT_PUBLIC_STOREFRONT_URL ?? 'http://localhost:3000'

  return (
    <>
      <div className="admin-page-header">
        <div>
          <div className="admin-page-title">Dashboard</div>
          <div className="admin-page-subtitle">Oversikt · Sjokoloco</div>
        </div>
      </div>

      <div className="admin-stats-grid" style={{ gridTemplateColumns: 'repeat(4, 1fr)' }}>
        <div className="admin-stat-card">
          <div className="admin-stat-label">Bestillinger</div>
          <div className="admin-stat-value">{stats.orders}</div>
        </div>
        <div className="admin-stat-card">
          <div className="admin-stat-label">Omsetning (total)</div>
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

      <div className="admin-dashboard-grid">
        <DashboardRevenueBars
          points={revenuePoints}
          title="Omsetning siste 14 dager"
          isDemo
        />
        <DashboardStatusBars rows={statusRows} title="Bestillinger etter status" isDemo />
      </div>

      <div className="admin-card" style={{ marginBottom: 28 }}>
        <div className="admin-card-header">
          <div className="admin-card-title">Hurtighandlinger</div>
        </div>
        <div style={{ padding: 20 }}>
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
