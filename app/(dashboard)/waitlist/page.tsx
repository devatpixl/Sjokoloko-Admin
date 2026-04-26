import { adminGetWaitlist } from '@/lib/api/admin'
import WaitlistFilter from './_filter'
import WaitlistRowActions from './_row-actions'

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('nb-NO', {
    day: '2-digit', month: 'short', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  })
}

export default async function AdminWaitlistPage({
  searchParams,
}: {
  searchParams: Promise<{ batch?: string }>
}) {
  const params = await searchParams
  const entries = await adminGetWaitlist({ batch: params.batch })

  return (
    <>
      <div className="admin-page-header">
        <div>
          <div className="admin-page-title">Venteliste</div>
          <div className="admin-page-subtitle">{entries.length} påmeldte</div>
        </div>
      </div>

      <div className="admin-card">
        <div className="admin-card-header">
          <div className="admin-card-title">Ventelistepåmeldte</div>
        </div>

        <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--admin-border)' }}>
          <WaitlistFilter />
        </div>

        <div className="admin-table-wrap">
          <table className="admin-table">
            <thead>
              <tr>
                <th>#</th>
                <th>E-post</th>
                <th>Batch</th>
                <th>Posisjon</th>
                <th>Meldt på</th>
                <th style={{ textAlign: 'right' }}></th>
              </tr>
            </thead>
            <tbody>
              {entries.length === 0 && (
                <tr>
                  <td colSpan={6}>
                    <div className="admin-empty-state">
                      <div className="admin-empty-state-icon">
                        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                          <rect x="9" y="3" width="6" height="4" rx="1" />
                          <path d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2" />
                        </svg>
                      </div>
                      <div className="admin-empty-state-title">Ingen påmeldte</div>
                      <div className="admin-empty-state-hint">
                        {params.batch ? `Ingen treff for batch "${params.batch}".` : 'Når noen melder seg på vises de her.'}
                      </div>
                    </div>
                  </td>
                </tr>
              )}
              {entries.map((entry: any, i: number) => (
                <tr key={entry.id}>
                  <td className="mono" style={{ color: 'var(--admin-text-dim)' }}>{i + 1}</td>
                  <td style={{ fontWeight: 500 }}>{entry.email}</td>
                  <td>
                    <span className="admin-badge admin-badge-gold">Batch {entry.batch}</span>
                  </td>
                  <td className="mono">{entry.position}</td>
                  <td style={{ fontSize: 13, color: 'var(--admin-text-dim)' }}>
                    {formatDate(entry.created_at)}
                  </td>
                  <td style={{ textAlign: 'right' }}>
                    <WaitlistRowActions id={entry.id} email={entry.email} />
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
