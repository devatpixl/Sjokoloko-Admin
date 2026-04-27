/** Server-safe grafer for admin-dashboard (ingen ekstra avhengigheter). */

type Point = { key: string; label: string; value: number }

function formatNOK(n: number) {
  return `kr ${Math.round(n).toLocaleString('nb-NO')}`
}

export function DashboardRevenueBars({
  points,
  title,
  isDemo,
}: {
  points: Point[]
  title: string
  /** Vis merkelapp «Eksempeldata» (f.eks. demo / forhåndsvisning) */
  isDemo?: boolean
}) {
  const max = Math.max(...points.map((p) => p.value), 1)
  const hasData = points.some((p) => p.value > 0)

  return (
    <div className="admin-card">
      <div className="admin-card-header">
        <div className="admin-card-title" style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
          {title}
          {isDemo && (
            <span
              style={{
                fontSize: 10,
                fontWeight: 700,
                letterSpacing: '0.08em',
                textTransform: 'uppercase',
                color: 'var(--admin-accent)',
                background: 'var(--admin-accent-soft)',
                padding: '4px 8px',
                borderRadius: 4,
              }}
            >
              Eksempeldata
            </span>
          )}
        </div>
      </div>
      <div style={{ padding: '20px 20px 24px' }}>
        {!hasData ? (
          <p style={{ fontSize: 13, color: 'var(--admin-text-dim)', margin: 0 }}>
            Ingen omsetning i denne perioden. Når bestillinger kommer inn, vises de her.
          </p>
        ) : (
          <>
            <div className="admin-dashboard-bars">
              {points.map((p) => (
                <div key={p.key} className="admin-dashboard-bar-col" title={`${p.label}: ${formatNOK(p.value)}`}>
                  <div className="admin-dashboard-bar-track">
                    <div
                      className="admin-dashboard-bar-fill"
                      style={{ height: `${Math.max(6, (p.value / max) * 100)}%` }}
                    />
                  </div>
                  <span className="admin-dashboard-bar-label">{p.label}</span>
                </div>
              ))}
            </div>
            <div style={{ fontSize: 12, color: 'var(--admin-text-dim)', marginTop: 12 }}>
              Sum 14 dager: <strong style={{ color: 'var(--admin-text)' }}>{formatNOK(points.reduce((s, p) => s + p.value, 0))}</strong>
            </div>
          </>
        )}
      </div>
    </div>
  )
}

export function DashboardStatusBars({
  rows,
  title,
  isDemo,
}: {
  rows: { status: string; count: number }[]
  title: string
  isDemo?: boolean
}) {
  const max = Math.max(...rows.map((r) => r.count), 1)
  const hasData = rows.some((r) => r.count > 0)

  return (
    <div className="admin-card">
      <div className="admin-card-header">
        <div className="admin-card-title" style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
          {title}
          {isDemo && (
            <span
              style={{
                fontSize: 10,
                fontWeight: 700,
                letterSpacing: '0.08em',
                textTransform: 'uppercase',
                color: 'var(--admin-accent)',
                background: 'var(--admin-accent-soft)',
                padding: '4px 8px',
                borderRadius: 4,
              }}
            >
              Eksempeldata
            </span>
          )}
        </div>
      </div>
      <div style={{ padding: '16px 20px 20px' }}>
        {!hasData ? (
          <p style={{ fontSize: 13, color: 'var(--admin-text-dim)', margin: 0 }}>Ingen bestillinger ennå.</p>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {rows.map((r) => (
              <div key={r.status}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, marginBottom: 4 }}>
                  <span style={{ fontWeight: 600 }}>{r.status}</span>
                  <span style={{ color: 'var(--admin-text-dim)' }}>{r.count}</span>
                </div>
                <div
                  style={{
                    height: 8,
                    borderRadius: 4,
                    background: 'var(--admin-bg)',
                    overflow: 'hidden',
                  }}
                >
                  <div
                    style={{
                      height: '100%',
                      width: `${(r.count / max) * 100}%`,
                      minWidth: r.count > 0 ? 8 : 0,
                      borderRadius: 4,
                      background: 'linear-gradient(90deg, #C9A35B, #E8C47A)',
                    }}
                  />
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
