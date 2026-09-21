/**
 * Dashboard charts, drawn from real orders.
 *
 * Server components with no library: the panel ships zero UI dependencies and
 * these are plain SVG, which costs nothing in the bundle and themes itself
 * from the same tokens as everything else.
 *
 * The data comes from the orders list the page already fetches. The charts
 * that used to sit here ran on hardcoded arrays behind an "Eksempeldata"
 * pill — not because the numbers were unavailable, but because nobody had
 * done the aggregation.
 */

function formatNOK(v: number) {
  return `kr ${Math.round(v).toLocaleString('nb-NO')}`
}

/* ── Revenue over the last N days ─────────────────────────────────────── */

export function RevenueArea({
  points,
  title,
  note,
  className = '',
}: {
  points: { key: string; label: string; value: number }[]
  title: string
  note?: string
  className?: string
}) {
  const W = 720
  const H = 200
  const PAD = { t: 16, r: 4, b: 4, l: 4 }
  const max = Math.max(...points.map(p => p.value), 1)
  const innerW = W - PAD.l - PAD.r
  const innerH = H - PAD.t - PAD.b
  const step = points.length > 1 ? innerW / (points.length - 1) : 0

  const xy = points.map((p, i) => ({
    x: PAD.l + i * step,
    y: PAD.t + innerH - (p.value / max) * innerH,
    ...p,
  }))

  // A monotone-ish curve: control points are pulled horizontally only, so the
  // line never overshoots below zero between two points — an area chart that
  // dips under its own baseline reads as negative revenue, which is a lie.
  const line = xy
    .map((p, i) => {
      if (i === 0) return `M ${p.x} ${p.y}`
      const prev = xy[i - 1]
      const cx = (prev.x + p.x) / 2
      return `C ${cx} ${prev.y}, ${cx} ${p.y}, ${p.x} ${p.y}`
    })
    .join(' ')

  const area = `${line} L ${xy[xy.length - 1].x} ${H} L ${xy[0].x} ${H} Z`
  const total = points.reduce((s, p) => s + p.value, 0)
  const peak = xy.reduce((a, b) => (b.value > a.value ? b : a), xy[0])

  // A flat line pinned to the baseline looks like a broken chart rather than
  // a quiet fortnight, so say it in words instead of drawing nothing.
  if (total === 0) {
    return (
      <div className={`admin-card chart-card ${className}`.trim()}>
        <div className="admin-card-header">
          <div className="admin-card-title">{title}</div>
          <div className="admin-card-figure">{formatNOK(0)}</div>
        </div>
        <div className="admin-card-body chart-empty">
          <div className="admin-empty-state-title">Ingen betalte ordrer på 14 dager</div>
          <div className="admin-empty-state-hint">
            Omsetning vises her så snart en betaling er gjennomført.
          </div>
        </div>
        {note && <div className="admin-card-footer chart-note">{note}</div>}
      </div>
    )
  }

  return (
    <div className={`admin-card chart-card ${className}`.trim()}>
      <div className="admin-card-header">
        <div className="admin-card-title">{title}</div>
        <div className="admin-card-figure">{formatNOK(total)}</div>
      </div>

      <div className="chart-body">
        <svg
          className="chart-svg"
          viewBox={`0 0 ${W} ${H}`}
          preserveAspectRatio="none"
          role="img"
          aria-label={`${title}: ${formatNOK(total)}`}
        >
          <defs>
            <linearGradient id="revFill" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="var(--admin-accent)" stopOpacity="0.28" />
              <stop offset="100%" stopColor="var(--admin-accent)" stopOpacity="0" />
            </linearGradient>
          </defs>

          {[0.25, 0.5, 0.75].map(f => (
            <line
              key={f}
              x1={0}
              x2={W}
              y1={PAD.t + innerH * f}
              y2={PAD.t + innerH * f}
              className="chart-grid"
              vectorEffect="non-scaling-stroke"
            />
          ))}

          <path d={area} fill="url(#revFill)" />
          <path
            d={line}
            className="chart-line"
            fill="none"
            vectorEffect="non-scaling-stroke"
          />

          {peak.value > 0 && (
            <circle cx={peak.x} cy={peak.y} r="3" className="chart-peak" vectorEffect="non-scaling-stroke" />
          )}
        </svg>

        <div className="chart-axis">
          {points.map((p, i) => (
            <span key={p.key} className={i % 2 ? 'is-muted' : undefined}>
              {p.label}
            </span>
          ))}
        </div>
      </div>

      {note && <div className="admin-card-footer chart-note">{note}</div>}
    </div>
  )
}

/* ── Orders by status ─────────────────────────────────────────────────── */

const STATUS_TONE: Record<string, string> = {
  Mottatt: 'tone-gold',
  Bekreftet: 'tone-info',
  Pakkes: 'tone-warn',
  Sendt: 'tone-alt',
  Levert: 'tone-pos',
}

export function StatusBreakdown({
  rows,
  title,
  note,
}: {
  rows: { status: string; count: number }[]
  title: string
  note?: string
}) {
  const total = rows.reduce((s, r) => s + r.count, 0)

  return (
    <div className="admin-card chart-card">
      <div className="admin-card-header">
        <div className="admin-card-title">{title}</div>
        <div className="admin-card-figure">{total}</div>
      </div>

      <div className="admin-card-body">
        {rows.length === 0 && (
          <div className="admin-empty-state-hint">Ingen bestillinger enda.</div>
        )}

        {/* One bar showing the whole mix, then the legend beneath. A stacked
            bar answers "what is the shape of the pipeline" at a glance, which
            five separate bars never quite do. */}
        {total > 0 && (
          <div className="chart-stack" role="img" aria-label={`${total} bestillinger fordelt på status`}>
            {rows.map(r => (
              <span
                key={r.status}
                className={`chart-stack-seg ${STATUS_TONE[r.status] ?? 'tone-neutral'}`}
                style={{ width: `${(r.count / total) * 100}%` }}
                title={`${r.status}: ${r.count}`}
              />
            ))}
          </div>
        )}

        <ul className="chart-legend">
          {rows.map(r => (
            <li key={r.status}>
              <span className={`chart-dot ${STATUS_TONE[r.status] ?? 'tone-neutral'}`} />
              <span className="chart-legend-label">{r.status}</span>
              <span className="chart-legend-value">{r.count}</span>
              <span className="chart-legend-pct">
                {total ? Math.round((r.count / total) * 100) : 0}%
              </span>
            </li>
          ))}
        </ul>
      </div>

      {note && <div className="admin-card-footer chart-note">{note}</div>}
    </div>
  )
}
