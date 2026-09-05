'use client'

import { useEffect, useState } from 'react'
import { usePathname } from 'next/navigation'

/**
 * Wraps the sidebar and the page body so the sidebar can behave as an
 * off-canvas drawer on phones while staying a normal column on desktop.
 * The sidebar and top bar are server components, so they arrive as props.
 */
export default function AdminShell({
  sidebar,
  topbar,
  children,
}: {
  sidebar: React.ReactNode
  topbar: React.ReactNode
  children: React.ReactNode
}) {
  const [navOpen, setNavOpen] = useState(false)
  const pathname = usePathname()

  // Navigating away must close the drawer, or it covers the page you just opened.
  useEffect(() => {
    setNavOpen(false)
  }, [pathname])

  // While the drawer is open: Escape closes it and the page behind stays put.
  useEffect(() => {
    if (!navOpen) return
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') setNavOpen(false)
    }
    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    window.addEventListener('keydown', onKey)
    return () => {
      document.body.style.overflow = previousOverflow
      window.removeEventListener('keydown', onKey)
    }
  }, [navOpen])

  return (
    <div className={`admin-shell${navOpen ? ' nav-open' : ''}`}>
      {sidebar}

      <button
        type="button"
        className="admin-scrim"
        onClick={() => setNavOpen(false)}
        tabIndex={navOpen ? 0 : -1}
        aria-label="Lukk meny"
      />

      <button
        type="button"
        className="admin-nav-close"
        onClick={() => setNavOpen(false)}
        tabIndex={navOpen ? 0 : -1}
        aria-label="Lukk meny"
      >
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
          <path d="M18 6L6 18M6 6l12 12" />
        </svg>
      </button>

      <div className="admin-body">
        <div className="admin-topwrap">
          <button
            type="button"
            className="admin-hamburger"
            onClick={() => setNavOpen(v => !v)}
            aria-label="Åpne meny"
            aria-expanded={navOpen}
          >
            <span />
            <span />
            <span />
          </button>
          {topbar}
        </div>
        <main className="admin-main">{children}</main>
      </div>
    </div>
  )
}
