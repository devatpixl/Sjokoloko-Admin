/**
 * K-59 — the approval queue, and the customer directory behind it.
 *
 * The list is ordered pending-first by the API because this is a work queue
 * before it is a directory: the question it answers is "is anyone waiting on
 * me?", not "who are our customers?".
 */
import { adminGetHorecaCompanies } from '@/lib/api/admin'
import CompanyRowActions from './_row-actions'
import NewCompany from './_new'
import StatusFilter from './_filter'

type Company = {
  id: string; name: string; org_number: string
  status: string; status_label: string; rejection_reason: string
  phone: string; email: string
  contact_email: string; contact_name: string
  invoice_street: string; invoice_postal_code: string; invoice_city: string
  created_at: string; member_count: number
}

const TONE: Record<string, string> = {
  pending: 'admin-badge-orange',
  active: 'admin-badge-green',
  rejected: 'admin-badge-red',
  suspended: 'admin-badge-gray',
}

function date(iso: string) {
  return new Date(iso).toLocaleDateString('nb-NO',
    { day: '2-digit', month: 'short', year: 'numeric' })
}

export default async function HorecaCompaniesPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string }>
}) {
  const params = await searchParams
  const companies: Company[] = await adminGetHorecaCompanies({ status: params.status })
  const pending = companies.filter((c) => c.status === 'pending').length

  return (
    <>
      <div className="admin-page-header">
        <div>
          <div className="admin-page-title">Bedrifter</div>
          <div className="admin-page-subtitle">
            {companies.length} bedrift{companies.length === 1 ? '' : 'er'}
            {pending > 0 && ` · ${pending} venter på godkjenning`}
          </div>
        </div>
        <NewCompany />
      </div>

      <div className="admin-card">
        <div className="admin-card-header">
          <div className="admin-card-title">Bedriftskontoer</div>
        </div>

        <div className="admin-card-toolbar">
          <StatusFilter />
        </div>

        <div className="admin-table-wrap">
          <table className="admin-table">
            <thead>
              <tr>
                <th>Firma</th>
                <th>Org.nr</th>
                <th>Kontakt</th>
                <th>Brukere</th>
                <th>Registrert</th>
                <th>Status</th>
                <th className="t-actions"></th>
              </tr>
            </thead>
            <tbody>
              {companies.length === 0 && (
                <tr>
                  <td colSpan={7}>
                    <div className="admin-empty-state">
                      <div className="admin-empty-state-title">Ingen bedrifter ennå</div>
                      <div className="admin-empty-state-text">
                        Opprett den første med knappen oppe til høyre. Kontaktpersonen
                        får e-post med lenke for å velge passord.
                      </div>
                    </div>
                  </td>
                </tr>
              )}
              {companies.map((c) => (
                <tr key={c.id}>
                  <td>
                    <strong>{c.name}</strong>
                    {c.status === 'rejected' && c.rejection_reason && (
                      <div className="admin-muted" style={{ fontSize: 12, marginTop: 2 }}>
                        {c.rejection_reason}
                      </div>
                    )}
                  </td>
                  <td className="t-mono">{c.org_number}</td>
                  <td>
                    {/* The first administrator, not company.email — that field
                        is the invoice address and is usually blank, which made
                        this render a dash beside a company that had a user. */}
                    {c.contact_email || c.email || '—'}
                    {(c.contact_name || c.phone) && (
                      <div className="admin-muted" style={{ fontSize: 12 }}>
                        {[c.contact_name, c.phone].filter(Boolean).join(' · ')}
                      </div>
                    )}
                  </td>
                  <td className="t-mono">{c.member_count}</td>
                  <td>{date(c.created_at)}</td>
                  <td>
                    <span className={`admin-badge ${TONE[c.status] ?? 'admin-badge-gray'}`}>
                      {c.status_label}
                    </span>
                  </td>
                  <td className="t-actions">
                    <CompanyRowActions
                      id={c.id}
                      name={c.name}
                      status={c.status}
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
