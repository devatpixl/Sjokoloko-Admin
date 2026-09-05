import { adminGetLoyalty } from '@/lib/api/admin'
import LoyaltyFilter from './_filter'

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('nb-NO', {
    day: '2-digit', month: 'short', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  })
}

function formatBirthday(iso: string | null) {
  if (!iso) return '—'
  return new Date(iso).toLocaleDateString('nb-NO', { day: '2-digit', month: 'short', year: 'numeric' })
}

export default async function AdminLoyaltyPage({
  searchParams,
}: {
  searchParams: Promise<{ search?: string }>
}) {
  const params = await searchParams
  const members = await adminGetLoyalty({ search: params.search })

  return (
    <>
      <div className="admin-page-header">
        <div>
          <div className="admin-page-title">Kundeklubb</div>
          <div className="admin-page-subtitle">{members.length} medlemmer</div>
        </div>
        <a href="/api/admin-proxy/loyalty-export" className="admin-btn admin-btn-secondary">
          Last ned CSV
        </a>
      </div>

      <div className="admin-card">
        <div className="admin-card-header">
          <div className="admin-card-title">Påmeldte fra /bli-medlem</div>
        </div>

        <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--admin-border)' }}>
          <LoyaltyFilter />
        </div>

        <div className="admin-table-wrap">
          <table className="admin-table">
            <thead>
              <tr>
                <th>#</th>
                <th>Navn</th>
                <th>E-post</th>
                <th>Telefon</th>
                <th>Bursdag</th>
                <th>Meldt på</th>
              </tr>
            </thead>
            <tbody>
              {members.length === 0 && (
                <tr>
                  <td colSpan={6}>
                    <div className="admin-empty-state">
                      <div className="admin-empty-state-icon">
                        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                          <path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2" />
                          <circle cx="9" cy="7" r="4" />
                          <path d="M23 21v-2a4 4 0 00-3-3.87" />
                        </svg>
                      </div>
                      <div className="admin-empty-state-title">Ingen medlemmer</div>
                      <div className="admin-empty-state-hint">
                        {params.search
                          ? `Ingen treff for "${params.search}".`
                          : 'Påmeldinger fra /bli-medlem vises her.'}
                      </div>
                    </div>
                  </td>
                </tr>
              )}
              {members.map((m: any, i: number) => (
                <tr key={m.id}>
                  <td data-label="#" className="mono" style={{ color: 'var(--admin-text-dim)' }}>{i + 1}</td>
                  <td data-label="Navn" style={{ fontWeight: 500 }}>{m.first_name}</td>
                  <td data-label="E-post">
                    <a href={`mailto:${m.email}`} style={{ color: 'inherit' }}>{m.email}</a>
                  </td>
                  <td data-label="Telefon" className="mono">
                    <a href={`tel:${m.phone.replace(/\s/g, '')}`} style={{ color: 'inherit' }}>{m.phone}</a>
                  </td>
                  <td data-label="Bursdag" style={{ fontSize: 13, color: 'var(--admin-text-dim)' }}>{formatBirthday(m.birthday)}</td>
                  <td data-label="Meldt på" style={{ fontSize: 13, color: 'var(--admin-text-dim)' }}>{formatDate(m.created_at)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </>
  )
}
