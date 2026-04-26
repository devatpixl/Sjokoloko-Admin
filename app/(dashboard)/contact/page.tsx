'use client'

import { useEffect, useState, Fragment } from 'react'
import ConfirmDialog from '@/components/ConfirmDialog'
import { useToast } from '@/components/Toast'

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('nb-NO', {
    day: '2-digit', month: 'short', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  })
}

export default function AdminContactPage() {
  const toast = useToast()
  const [entries, setEntries] = useState<any[]>([])
  const [filter, setFilter] = useState<'all' | 'unread' | 'read'>('all')
  const [expanded, setExpanded] = useState<number | null>(null)
  const [selected, setSelected] = useState<Set<number>>(new Set())
  const [pending, setPending] = useState(false)
  const [confirmDelete, setConfirmDelete] = useState<{ ids: number[]; label: string } | null>(null)

  async function load() {
    const is_read = filter === 'all' ? undefined : filter === 'read' ? 'true' : 'false'
    const qs = is_read !== undefined ? `?is_read=${is_read}` : ''
    const res = await fetch(`/api/admin-proxy/contact${qs}`)
    if (res.ok) setEntries(await res.json())
    else setEntries([])
  }

  useEffect(() => { load(); setSelected(new Set()) /* eslint-disable-next-line */ }, [filter])

  async function markRead(id: number) {
    setPending(true)
    const res = await fetch(`/api/admin-proxy/contact/${id}`, { method: 'PATCH' })
    if (res.ok) {
      const updated = await res.json()
      setEntries(prev => prev.map(e => e.id === id ? updated : e))
      toast.success('Markert som lest')
    } else {
      toast.error('Kunne ikke oppdatere')
    }
    setPending(false)
  }

  async function deleteIds(ids: number[]) {
    setPending(true)
    let ok = 0, fail = 0
    await Promise.all(ids.map(async id => {
      const res = await fetch(`/api/admin-proxy/contact/${id}`, { method: 'DELETE' })
      if (res.ok) ok++; else fail++
    }))
    if (ok > 0) toast.success(`${ok} henvendelse${ok === 1 ? '' : 'r'} slettet`)
    if (fail > 0) toast.error(`${fail} kunne ikke slettes`)
    setEntries(prev => prev.filter(e => !ids.includes(e.id)))
    setSelected(new Set())
    setConfirmDelete(null)
    setPending(false)
  }

  function toggleSelect(id: number) {
    setSelected(prev => {
      const s = new Set(prev)
      if (s.has(id)) s.delete(id)
      else s.add(id)
      return s
    })
  }

  function toggleAll() {
    if (selected.size === entries.length) setSelected(new Set())
    else setSelected(new Set(entries.map(e => e.id)))
  }

  const unreadCount = entries.filter(e => !e.is_read).length

  return (
    <>
      <div className="admin-page-header">
        <div>
          <div className="admin-page-title">Kontakthenvendelser</div>
          <div className="admin-page-subtitle">
            {unreadCount > 0
              ? `${unreadCount} ulest${unreadCount !== 1 ? 'e' : ''}`
              : 'Alle lest'}
          </div>
        </div>
      </div>

      <div className="admin-card">
        <div className="admin-card-header">
          <div className="admin-card-title">Innboks</div>
          <div style={{ display: 'flex', gap: 6 }}>
            {(['all', 'unread', 'read'] as const).map(f => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={`admin-btn ${filter === f ? 'admin-btn-primary' : 'admin-btn-secondary'}`}
                style={{ height: 28, padding: '0 10px', fontSize: 12 }}
              >
                {f === 'all' ? 'Alle' : f === 'unread' ? 'Uleste' : 'Leste'}
              </button>
            ))}
          </div>
        </div>

        {selected.size > 0 && (
          <div className="admin-bulk-bar">
            <span>{selected.size} valgt</span>
            <div style={{ flex: 1 }} />
            <button
              type="button"
              onClick={() => setConfirmDelete({
                ids: Array.from(selected),
                label: `${selected.size} henvendelse${selected.size === 1 ? '' : 'r'}`,
              })}
              className="admin-btn admin-btn-danger"
              style={{ height: 30 }}
            >
              Slett valgte
            </button>
            <button
              type="button"
              onClick={() => setSelected(new Set())}
              className="admin-btn admin-btn-secondary"
              style={{ height: 30 }}
            >
              Avbryt
            </button>
          </div>
        )}

        <div className="admin-table-wrap">
          <table className="admin-table">
            <thead>
              <tr>
                <th style={{ width: 30 }}>
                  <input
                    type="checkbox"
                    className="admin-checkbox"
                    checked={entries.length > 0 && selected.size === entries.length}
                    onChange={toggleAll}
                    aria-label="Velg alle"
                  />
                </th>
                <th style={{ width: 8 }}></th>
                <th>Fra</th>
                <th>Emne</th>
                <th>Dato</th>
                <th>Status</th>
                <th style={{ textAlign: 'right' }}></th>
              </tr>
            </thead>
            <tbody>
              {entries.length === 0 && (
                <tr>
                  <td colSpan={7}>
                    <div className="admin-empty-state">
                      <div className="admin-empty-state-icon">
                        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                          <path d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                        </svg>
                      </div>
                      <div className="admin-empty-state-title">Ingen henvendelser</div>
                      <div className="admin-empty-state-hint">Innsendinger fra kontaktskjemaet vises her.</div>
                    </div>
                  </td>
                </tr>
              )}
              {entries.map((entry: any) => (
                <Fragment key={entry.id}>
                  <tr
                    style={{ cursor: 'pointer', background: !entry.is_read ? '#FFFBF2' : undefined }}
                    onClick={() => setExpanded(expanded === entry.id ? null : entry.id)}
                  >
                    <td onClick={e => e.stopPropagation()}>
                      <input
                        type="checkbox"
                        className="admin-checkbox"
                        checked={selected.has(entry.id)}
                        onChange={() => toggleSelect(entry.id)}
                        aria-label={`Velg ${entry.email}`}
                      />
                    </td>
                    <td>
                      {!entry.is_read && (
                        <div style={{ width: 7, height: 7, borderRadius: '50%', background: 'var(--admin-accent)' }} />
                      )}
                    </td>
                    <td>
                      <div style={{ fontWeight: entry.is_read ? 400 : 600 }}>{entry.name}</div>
                      <div style={{ fontSize: 12, color: 'var(--admin-text-dim)' }}>{entry.email}</div>
                    </td>
                    <td style={{ fontWeight: entry.is_read ? 400 : 500 }}>{entry.subject}</td>
                    <td style={{ fontSize: 13, color: 'var(--admin-text-dim)' }}>{formatDate(entry.created_at)}</td>
                    <td>
                      <span className={`admin-badge ${entry.is_read ? 'admin-badge-gray' : 'admin-badge-gold'}`}>
                        {entry.is_read ? 'Lest' : 'Ulest'}
                      </span>
                    </td>
                    <td style={{ textAlign: 'right' }} onClick={e => e.stopPropagation()}>
                      <div style={{ display: 'flex', gap: 6, justifyContent: 'flex-end' }}>
                        {!entry.is_read && (
                          <button
                            onClick={() => markRead(entry.id)}
                            disabled={pending}
                            className="admin-btn admin-btn-secondary"
                            style={{ height: 28, padding: '0 10px', fontSize: 12 }}
                          >
                            Merk lest
                          </button>
                        )}
                        <button
                          onClick={() => setConfirmDelete({ ids: [entry.id], label: `henvendelse fra ${entry.name}` })}
                          className="admin-row-delete"
                          title="Slett"
                          aria-label="Slett"
                        >
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                            <path d="M3 6h18M8 6V4a2 2 0 012-2h4a2 2 0 012 2v2M19 6l-1 14a2 2 0 01-2 2H8a2 2 0 01-2-2L5 6M10 11v6M14 11v6" />
                          </svg>
                        </button>
                      </div>
                    </td>
                  </tr>
                  {expanded === entry.id && (
                    <tr>
                      <td colSpan={7} style={{ padding: '16px 20px', background: '#FAFAFA', borderTop: 'none' }}>
                        <div style={{
                          background: 'white',
                          border: '1px solid var(--admin-border)',
                          borderRadius: 8,
                          padding: 20,
                          maxWidth: 640,
                        }}>
                          <div style={{ fontWeight: 600, marginBottom: 4 }}>{entry.subject}</div>
                          <div style={{ fontSize: 12, color: 'var(--admin-text-dim)', marginBottom: 16 }}>
                            Fra {entry.name} &lt;{entry.email}&gt; · {formatDate(entry.created_at)}
                          </div>
                          <div style={{ fontSize: 14, lineHeight: 1.7, whiteSpace: 'pre-wrap', color: 'var(--admin-text)' }}>
                            {entry.message}
                          </div>
                          <div style={{ marginTop: 16 }}>
                            <a
                              href={`mailto:${entry.email}?subject=Re: ${entry.subject}`}
                              className="admin-btn admin-btn-primary"
                              style={{ textDecoration: 'none' }}
                            >
                              Svar via e-post →
                            </a>
                          </div>
                        </div>
                      </td>
                    </tr>
                  )}
                </Fragment>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <ConfirmDialog
        open={!!confirmDelete}
        title="Slette?"
        message={confirmDelete ? `Du er i ferd med å slette ${confirmDelete.label}. Dette kan ikke angres.` : ''}
        confirmLabel="Slett"
        danger
        pending={pending}
        onConfirm={() => confirmDelete && deleteIds(confirmDelete.ids)}
        onCancel={() => setConfirmDelete(null)}
      />
    </>
  )
}
