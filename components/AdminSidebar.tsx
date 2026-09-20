'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'

const NAV = [
  {
    label: 'Butikk',
    items: [
      { href: '/dashboard', label: 'Dashboard', shortcut: 'g d', badgeKey: null },
      { href: '/orders', label: 'Bestillinger', shortcut: 'g o', badgeKey: null },
      { href: '/products', label: 'Produkter', shortcut: 'g p', badgeKey: null },
      { href: '/flavors', label: 'Smaker', shortcut: 'g f', badgeKey: null },
      { href: '/customers', label: 'Kunder', shortcut: 'g c', badgeKey: 'new_customers' as const },
    ],
  },
  {
    label: 'Markedsføring',
    items: [
      { href: '/coupons', label: 'Rabattkoder', shortcut: 'g r', badgeKey: null },
      { href: '/bundles', label: 'Tilbud / pakker', shortcut: 'g t', badgeKey: null },
    ],
  },
  {
    label: 'Innhold',
    items: [
      { href: '/loyalty', label: 'Kundeklubb', shortcut: 'g m', badgeKey: null },
      { href: '/waitlist', label: 'Venteliste', shortcut: 'g w', badgeKey: 'waitlist' as const },
      { href: '/contact', label: 'Kontakt', shortcut: 'g k', badgeKey: 'unread_contact' as const },
      { href: '/labels', label: 'Etiketter', shortcut: 'g e', badgeKey: null },
    ],
  },
]

const SHORTCUT_MAP: Record<string, string> = {
  'g d': '/dashboard',
  'g o': '/orders',
  'g p': '/products',
  'g f': '/flavors',
  'g c': '/customers',
  'g r': '/coupons',
  'g t': '/bundles',
  'g m': '/loyalty',
  'g w': '/waitlist',
  'g k': '/contact',
  'g e': '/labels',
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
    // A badge dismissed elsewhere in the panel has to vanish at once. Waiting
    // for the next poll leaves the old count on screen for up to 30s, which
    // reads as "the button didn't work" and invites a second press.
    window.addEventListener('admin:stats-changed', load)
    return () => {
      alive = false
      clearInterval(id)
      window.removeEventListener('admin:stats-changed', load)
    }
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
        <div className="admin-sidebar-mark">Sjokoloko</div>
        <span>Admin</span>
      </div>

      <nav className="admin-sidebar-nav">
        {NAV.map((section) => (
          <div key={section.label} className="admin-nav-section">
            <div className="admin-nav-section-label">{section.label}</div>
            {section.items.map((item) => {
              const active =
                item.href === '/dashboard'
                  ? pathname === '/dashboard'
                  : pathname === item.href || pathname.startsWith(item.href + '/')
              const badge = item.badgeKey ? stats[item.badgeKey] ?? 0 : 0
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`admin-nav-link${active ? ' active' : ''}`}
                  title={`Hurtigtast: ${item.shortcut}`}
                >
                  <span className="admin-nav-link-label">{item.label}</span>
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
        <div className="admin-sidebar-legend-label">
          Hurtigtaster
        </div>
        <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)', padding: '0 8px 12px', lineHeight: 1.7 }}>
          <kbd className="admin-kbd">g</kbd> <kbd className="admin-kbd">d</kbd> · Dashboard<br />
          <kbd className="admin-kbd">g</kbd> <kbd className="admin-kbd">o</kbd> · Bestillinger<br />
          <kbd className="admin-kbd">g</kbd> <kbd className="admin-kbd">p</kbd> · Produkter<br />
          <kbd className="admin-kbd">g</kbd> <kbd className="admin-kbd">c</kbd> · Kunder
        </div>
        <a href={process.env.NEXT_PUBLIC_STOREFRONT_URL ?? 'http://localhost:3000'} target="_blank" rel="noopener noreferrer">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M19 12H5M12 5l-7 7 7 7" />
          </svg>
          Tilbake til nettside
        </a>
      </div>
    </aside>
  )
}









