'use client'

/**
 * Create a company and its first user in one step.
 *
 * The same thing the Django admin form does, brought into the panel so nobody
 * has to leave it: the company is created ACTIVE (we typed it in, so it is
 * already vetted), the contact becomes bedriftsadmin, and they get an e-mail
 * with a link to choose their own password. We never handle a password.
 */
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useToast } from '@/components/Toast'

const EMPTY = {
  name: '', org_number: '', contact_email: '', contact_person_name: '',
  phone: '', invoice_street: '', invoice_postal_code: '', invoice_city: '',
}

export default function NewCompany() {
  const router = useRouter()
  const toast = useToast()
  const [open, setOpen] = useState(false)
  const [form, setForm] = useState(EMPTY)
  const [pending, setPending] = useState(false)
  const set = (k: keyof typeof EMPTY) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm((f) => ({ ...f, [k]: e.target.value }))

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    setPending(true)
    try {
      const res = await fetch('/api/admin-proxy/horeca/companies', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      })
      if (!res.ok) {
        const d = await res.json().catch(() => ({}))
        throw new Error(d.detail ?? Object.values(d).flat().join(' • '))
      }
      toast.success(
        form.contact_email
          ? `${form.name} opprettet — ${form.contact_email} har fått e-post`
          : `${form.name} opprettet`
      )
      setForm(EMPTY)
      setOpen(false)
      router.refresh()
    } catch (err) {
      toast.error(err instanceof Error && err.message ? err.message : 'Kunne ikke opprette')
    } finally {
      setPending(false)
    }
  }

  if (!open) {
    return (
      <button type="button" className="admin-btn admin-btn-primary" onClick={() => setOpen(true)}>
        Ny bedrift
      </button>
    )
  }

  return (
    <div className="admin-card" style={{ minWidth: 520 }}>
      <div className="admin-card-header">
        <div className="admin-card-title">Ny bedrift</div>
      </div>
      <form className="admin-form" onSubmit={submit} style={{ padding: 16 }}>
        <div className="admin-form-group">
          <label className="admin-label" htmlFor="c-name">Firmanavn *</label>
          <input id="c-name" className="admin-input" required value={form.name} onChange={set('name')} />
        </div>
        <div className="admin-form-group">
          <label className="admin-label" htmlFor="c-org">Organisasjonsnummer *</label>
          <input id="c-org" className="admin-input" required inputMode="numeric"
                 placeholder="9 siffer" value={form.org_number} onChange={set('org_number')} />
        </div>
        <div className="admin-form-group">
          <label className="admin-label" htmlFor="c-email">Kontaktperson — e-post</label>
          <input id="c-email" type="email" className="admin-input"
                 value={form.contact_email} onChange={set('contact_email')} />
          <div className="admin-muted" style={{ fontSize: 12, marginTop: 4 }}>
            Blir bedriftsadmin og får lenke for å velge passord. La stå tom for å
            legge til brukere senere.
          </div>
        </div>
        <div className="admin-form-group">
          <label className="admin-label" htmlFor="c-cname">Kontaktperson — navn</label>
          <input id="c-cname" className="admin-input"
                 value={form.contact_person_name} onChange={set('contact_person_name')} />
        </div>
        <div className="admin-form-group">
          <label className="admin-label" htmlFor="c-phone">Telefon</label>
          <input id="c-phone" className="admin-input" value={form.phone} onChange={set('phone')} />
        </div>
        <div className="admin-form-group">
          <label className="admin-label" htmlFor="c-street">Fakturaadresse</label>
          <input id="c-street" className="admin-input"
                 value={form.invoice_street} onChange={set('invoice_street')} />
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: 12 }}>
          <div className="admin-form-group">
            <label className="admin-label" htmlFor="c-zip">Postnr</label>
            <input id="c-zip" className="admin-input"
                   value={form.invoice_postal_code} onChange={set('invoice_postal_code')} />
          </div>
          <div className="admin-form-group">
            <label className="admin-label" htmlFor="c-city">Sted</label>
            <input id="c-city" className="admin-input"
                   value={form.invoice_city} onChange={set('invoice_city')} />
          </div>
        </div>
        <div className="admin-form-actions">
          <button type="button" className="admin-btn admin-btn-ghost"
                  onClick={() => { setOpen(false); setForm(EMPTY) }}>Avbryt</button>
          <button type="submit" className="admin-btn admin-btn-primary" disabled={pending}>
            {pending ? 'Oppretter…' : 'Opprett bedrift'}
          </button>
        </div>
      </form>
    </div>
  )
}
