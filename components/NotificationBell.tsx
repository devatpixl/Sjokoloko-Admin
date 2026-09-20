'use client'

import { useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'

interface Item {
  id: string
  kind: string
  title: string
  subtitle: string
  meta: string
  href: string
  created_at: string
}

function timeAgo(iso: string) {
  const mins = Math.floor((Date.now() - new Date(iso).getTime()) / 60000)
  if (mins < 1) return 'nå nettopp'
  if (mins < 60) return `${mins} min siden`
  const hours = Math.floor(mins / 60)
  if (hours < 24) return `${hours} t siden`
  const days = Math.floor(hours / 24)
  if (days === 1) return 'i går'
  if (days < 30) return `${days} dager siden`
  return new Date(iso).toLocaleDateString('nb-NO', { day: '2-digit', month: 'short' })
}

/**
 * The bell that replaced the per-signup e-mail to ops.
 *
 * It lists what happened, not just how many — the e-mail told them who had
 * registered, and a bare counter would have been a downgrade. Opening the
 * dropdown deliberately does not clear anything: ops asked for notifications
 * that survive a look, so only "Merk alle som lest" dismisses them.
 */
export default function NotificationBell() {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [count, setCount] = useState(0)
  const [items, setItems] = useState<Item[]>([])
  const [pending, setPending] = useState(false)
  const boxRef = useRef<HTMLDivElement>(null)

  async function load() {
    try {
      const res = await fetch('/api/admin-proxy/notifications', { cache: 'no-store' })
      if (!res.ok) return
      const data = await res.json()
      setCount(data.count ?? 0)
      setItems(data.items ?? [])
    } catch {}
  }

  useEffect(() => {
    load()
    const id = setInterval(load, 30_000)
    // Keeps the bell in step when the Kunder page clears the same flag.
    window.addEventListener('admin:stats-changed', load)
    return () => {
      clearInterval(id)
      window.removeEventListener('admin:stats-changed', load)
    }
  }, [])

  // Click-away and Escape, so the panel never traps the page.
  useEffect(() => {
    if (!open) return
    function onDown(e: MouseEvent) {
      if (boxRef.current && !boxRef.current.contains(e.target as Node)) setOpen(false)
    }
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') setOpen(false)
    }
    document.addEventListener('mousedown', onDown)
    document.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('mousedown', onDown)
      document.removeEventListener('keydown', onKey)
    }
  }, [open])

  async function markAllRead() {
    setPending(true)
    try {
      const res = await fetch('/api/admin-proxy/notifications/mark-read', { method: 'POST' })
      if (!res.ok) throw new Error()
      setCount(0)
      setItems([])
      setOpen(false)
      // Clears the Kunder badge at the same moment, not on its next poll.
      window.dispatchEvent(new Event('admin:stats-changed'))
      router.refresh()
    } catch {
      // Leaving the count as-is is the honest failure: nothing was dismissed.
    } finally {
      setPending(false)
    }
  }

  return (
    <div ref={boxRef} style={{ position: 'relative' }}>
      <button
        type="button"
        onClick={() => setOpen(o => !o)}
        className={`admin-bell${count > 0 ? ' has-new' : ''}`}
        aria-label={count > 0 ? `${count} nye varsler` : 'Varsler'}
        aria-expanded={open}
      >
        <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
          <path d="M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9" />
          <path d="M13.73 21a2 2 0 01-3.46 0" />
        </svg>
        {/* Spelled out, not just a dot: ops should be able to read what is
            waiting without clicking. Collapses to the number on narrow
            screens, where the header has no room for the words. */}
        {count > 0 && (
          <span className="admin-bell-label">
            {count} {count === 1 ? 'nytt varsel' : 'nye varsler'}
          </span>
        )}
        {count > 0 && <span className="admin-bell-count">{count > 99 ? '99+' : count}</span>}
      </button>

      {open && (
        <div className="admin-bell-panel">
          <div className="admin-bell-panel-head">
            <span>Varsler</span>
            {count > 0 && <span className="admin-bell-panel-count">{count} nye</span>}
          </div>

          {items.length === 0 ? (
            <div className="admin-bell-empty">Ingen nye varsler</div>
          ) : (
            <div className="admin-bell-list">
              {items.map(item => (
                <button
                  key={item.id}
                  type="button"
                  className="admin-bell-item"
                  onClick={() => {
                    setOpen(false)
                    router.push(item.href)
                  }}
                >
                  <span className="admin-bell-item-dot" />
                  <span style={{ flex: 1, minWidth: 0 }}>
                    <span className="admin-bell-item-title">{item.title}</span>
                    <span className="admin-bell-item-sub">{item.subtitle}</span>
                    <span className="admin-bell-item-meta">{item.meta}</span>
                  </span>
                  <span className="admin-bell-item-time">{timeAgo(item.created_at)}</span>
                </button>
              ))}
            </div>
          )}

          {count > 0 && (
            <button
              type="button"
              className="admin-bell-clear"
              onClick={markAllRead}
              disabled={pending}
            >
              {pending ? 'Merker …' : 'Merk alle som lest'}
            </button>
          )}
        </div>
      )}
    </div>
  )
}
