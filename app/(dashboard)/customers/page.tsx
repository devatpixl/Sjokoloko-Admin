import { adminGetUsers } from '@/lib/api/admin'
import CustomersFilter from './_filter'
import CustomerRowActions from './_row-actions'

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('nb-NO', {
    day: '2-digit', month: 'short', year: 'numeric',
  })
}

export default async function AdminCustomersPage({
  searchParams,
}: {
  searchParams: Promise<{ search?: string }>
}) {
  const params = await searchParams
  const users = await adminGetUsers({ search: params.search })

  return (
    <>
      <div className="admin-page-header">
        <div>
          <div className="admin-page-title">Kunder</div>
          <div className="admin-page-subtitle">{users.length} registrerte</div>
        </div>
      </div>

      <div className="admin-card">
        <div className="admin-card-header">
          <div className="admin-card-title">Alle kunder</div>
        </div>

        <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--admin-border)' }}>
          <CustomersFilter />
        </div>

        <div className="admin-table-wrap">
          <table className="admin-table">
            <thead>
              <tr>
                <th>Navn</th>
                <th>E-post</th>
                <th>Registrert</th>
                <th>Bestillinger</th>
                <th>Venteliste</th>
                <th style={{ textAlign: 'right' }}></th>
              </tr>
            </thead>
            <tbody>
              {users.length === 0 && (
                <tr>
                  <td colSpan={6}>
                    <div className="admin-empty-state">
                      <div className="admin-empty-state-icon">
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                          <circle cx="9" cy="7" r="4" />
                          <path d="M3 21v-2a4 4 0 014-4h4a4 4 0 014 4v2" />
                        </svg>
                      </div>
                      <div className="admin-empty-state-title">Ingen kunder funnet</div>
                      <div className="admin-empty-state-hint">
                        {params.search ? `Ingen treff for "${params.search}".` : 'Registrerte kunder vises her.'}
                      </div>
                    </div>
                  </td>
                </tr>
              )}
              {users.map((user: any) => (
                <tr key={user.id}>
                  <td style={{ fontWeight: 500 }}>{user.name}</td>
                  <td style={{ color: 'var(--admin-text-dim)', fontSize: 13 }}>{user.email}</td>
                  <td style={{ color: 'var(--admin-text-dim)', fontSize: 13 }}>{formatDate(user.created_at)}</td>
                  <td style={{ fontFamily: 'var(--admin-mono)', fontSize: 13 }}>
                    {user.order_count ?? 0}
                  </td>
                  <td>
                    {user.waitlist_batches?.length > 0 ? (
                      <span className="admin-badge admin-badge-gold">
                        Batch {user.waitlist_batches.join(', ')}
                      </span>
                    ) : (
                      <span style={{ color: 'var(--admin-text-dim)', fontSize: 12 }}>—</span>
                    )}
                  </td>
                  <td style={{ textAlign: 'right' }}>
                    <CustomerRowActions
                      id={user.id}
                      name={user.name}
                      orderCount={user.order_count ?? 0}
                    />
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
