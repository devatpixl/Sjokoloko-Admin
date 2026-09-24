/**
 * K-28, K-29 — the logo review queue.
 *
 * "En fil som ser fin ut på skjerm kan bli ubrukelig i trykk." Nothing goes
 * into production unapproved, and a rejection carries a reason the customer
 * reads, because "avvist" on its own just produces a phone call.
 */
import { adminGetHorecaLogos } from '@/lib/api/admin'
import LogoReview from './_review'

type Logo = {
  id: string; name: string; original_filename: string
  detected_format: string; kind: 'raster' | 'vector'
  width_px: number | null; height_px: number | null; byte_size: number
  status: string; status_label: string; rejection_reason: string
  company_name?: string; created_at: string
}

const TONE: Record<string, string> = {
  pending: 'admin-badge-orange', approved: 'admin-badge-green', rejected: 'admin-badge-red',
}
const kb = (b: number) => b > 1048576 ? `${(b / 1048576).toFixed(1)} MB` : `${Math.round(b / 1024)} KB`

export default async function HorecaLogosPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string }>
}) {
  const params = await searchParams
  const logos: Logo[] = await adminGetHorecaLogos({ status: params.status })
  const pending = logos.filter((l) => l.status === 'pending').length

  return (
    <>
      <div className="admin-page-header">
        <div>
          <div className="admin-page-title">Logoer</div>
          <div className="admin-page-subtitle">
            {logos.length} fil{logos.length === 1 ? '' : 'er'}
            {pending > 0 && ` · ${pending} venter på gjennomgang`}
          </div>
        </div>
      </div>

      <div className="admin-card">
        <div className="admin-card-header">
          <div className="admin-card-title">Til godkjenning</div>
        </div>
        <div className="admin-table-wrap">
          <table className="admin-table">
            <thead>
              <tr>
                <th>Logo</th><th>Bedrift</th><th>Fil</th>
                <th>Oppløsning</th><th>Status</th><th className="t-actions"></th>
              </tr>
            </thead>
            <tbody>
              {logos.length === 0 && (
                <tr><td colSpan={6}>
                  <div className="admin-empty-state">
                    <div className="admin-empty-state-title">Ingen logoer ennå</div>
                    <div className="admin-empty-state-text">
                      Filer bedriftskunder laster opp havner her for gjennomgang.
                    </div>
                  </div>
                </td></tr>
              )}
              {logos.map((l) => (
                <tr key={l.id}>
                  <td>
                    <strong>{l.name}</strong>
                    <div className="admin-muted" style={{ fontSize: 11 }}>
                      {l.original_filename}
                    </div>
                    {l.status === 'rejected' && l.rejection_reason && (
                      <div className="admin-muted" style={{ fontSize: 12, marginTop: 3 }}>
                        {l.rejection_reason}
                      </div>
                    )}
                  </td>
                  <td>{l.company_name ?? '—'}</td>
                  <td className="t-mono">
                    {l.detected_format.toUpperCase()}
                    <div className="admin-muted" style={{ fontSize: 11 }}>{kb(l.byte_size)}</div>
                  </td>
                  <td className="t-mono">
                    {l.kind === 'vector'
                      ? <span className="admin-muted">vektor</span>
                      : `${l.width_px} × ${l.height_px}`}
                  </td>
                  <td>
                    <span className={`admin-badge ${TONE[l.status] ?? 'admin-badge-gray'}`}>
                      {l.status_label}
                    </span>
                  </td>
                  <td className="t-actions">
                    <LogoReview id={l.id} name={l.name} status={l.status} />
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
