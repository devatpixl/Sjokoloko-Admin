'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'

const NAV = [
  {
    label: 'Butikk',
    items: [
      { href: '/orders', label: 'Bestillinger', shortcut: 'g o', icon: <IconOrders />, badgeKey: null },
      { href: '/products', label: 'Produkter', shortcut: 'g p', icon: <IconProducts />, badgeKey: null },
      { href: '/customers', label: 'Kunder', shortcut: 'g c', icon: <IconCustomers />, badgeKey: null },
    ],
  },
  {
    label: 'Innhold',
    items: [
      { href: '/waitlist', label: 'Venteliste', shortcut: 'g w', icon: <IconWaitlist />, badgeKey: 'waitlist' as const },
      { href: '/contact', label: 'Kontakt', shortcut: 'g k', icon: <IconContact />, badgeKey: 'unread_contact' as const },
    ],
  },
]

const SHORTCUT_MAP: Record<string, string> = {
  'g o': '/orders',
  'g p': '/products',
  'g c': '/customers',
  'g w': '/waitlist',
  'g k': '/contact',
}

export default function AdminSidebar() {
  const pathname = usePathname()
  const router = useRouter()
  const [stats, setStats] = useState<Record<string, number>>({})

  // Fetch counts for sidebar badges
  useEffect(() => {
    let alive = true
    async function load() {
      try {
        const res = await fetch('/api/admin-proxy/stats', { cache: 'no-store' })
        if (!res.ok) return
        const data = await res.json()
        if (alive) setStats(data)
      } catch {}
    }
    load()
    const id = setInterval(load, 30_000)
    return () => { alive = false; clearInterval(id) }
  }, [pathname])

  // Keyboard shortcuts: g o → orders, etc.
  useEffect(() => {
    let firstKey: string | null = null
    let timer: number | null = null

    function onKey(e: KeyboardEvent) {
      // Ignore when typing in inputs
      const tag = (e.target as HTMLElement)?.tagName
      if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') return
      if (e.metaKey || e.ctrlKey || e.altKey) return

      if (firstKey === null) {
        if (e.key === 'g') {
          firstKey = 'g'
          if (timer) window.clearTimeout(timer)
          timer = window.setTimeout(() => { firstKey = null }, 800)
        }
        return
      }
      const combo = `${firstKey} ${e.key}`
      const target = SHORTCUT_MAP[combo]
      firstKey = null
      if (timer) window.clearTimeout(timer)
      if (target) {
        e.preventDefault()
        router.push(target)
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [router])

  return (
    <aside className="admin-sidebar">
      <div className="admin-sidebar-logo">
        <div style={{ fontSize: 17, fontWeight: 700, letterSpacing: '-0.02em', color: '#FFF' }}>
          Sjokoloko
        </div>
        <span>Admin</span>
      </div>

      <nav className="admin-sidebar-nav">
        {NAV.map((section) => (
          <div key={section.label} className="admin-nav-section">
            <div className="admin-nav-section-label">{section.label}</div>
            {section.items.map((item) => {
              const active = pathname === item.href || pathname.startsWith(item.href + '/')
              const badge = item.badgeKey ? stats[item.badgeKey] ?? 0 : 0
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`admin-nav-link${active ? ' active' : ''}`}
                  title={`Hurtigtast: ${item.shortcut}`}
                >
                  {item.icon}
                  <span style={{ flex: 1 }}>{item.label}</span>
                  {badge > 0 && (
                    <span className="admin-nav-badge">{badge}</span>
                  )}
                </Link>
              )
            })}
          </div>
        ))}
      </nav>

      <div className="admin-sidebar-footer">
        <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.3)', marginBottom: 8, letterSpacing: '0.1em', textTransform: 'uppercase', padding: '0 8px' }}>
          Hurtigtaster
        </div>
        <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)', padding: '0 8px 12px', lineHeight: 1.7 }}>
          <kbd className="admin-kbd">g</kbd> <kbd className="admin-kbd">o</kbd> · Bestillinger<br />
          <kbd className="admin-kbd">g</kbd> <kbd className="admin-kbd">p</kbd> · Produkter
        </div>
        <a href="http://localhost:3000">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M19 12H5M12 5l-7 7 7 7" />
          </svg>
          Tilbake til nettside
        </a>
      </div>
    </aside>
  )
}

function IconOrders() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
      <path d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
    </svg>
  )
}

function IconProducts() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
      <rect x="2" y="7" width="20" height="14" rx="2" />
      <path d="M16 7V5a2 2 0 00-2-2h-4a2 2 0 00-2 2v2" />
    </svg>
  )
}

function IconCustomers() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
      <circle cx="9" cy="7" r="4" />
      <path d="M3 21v-2a4 4 0 014-4h4a4 4 0 014 4v2" />
      <path d="M16 3.13a4 4 0 010 7.75M21 21v-2a4 4 0 00-3-3.87" />
    </svg>
  )
}

function IconWaitlist() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
      <path d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2" />
      <rect x="9" y="3" width="6" height="4" rx="1" />
      <path d="M9 12h6M9 16h4" />
    </svg>
  )
}

function IconContact() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
      <path d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
    </svg>
  )
}
