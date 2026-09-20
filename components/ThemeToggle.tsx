'use client'

/**
 * Light/dark switch for the admin panel.
 *
 * Deliberately holds no React state: the `data-theme` attribute on <html> IS
 * the state, written here and read by the stylesheet. That avoids a
 * server/client mismatch on first paint — the value is already on the element
 * before React hydrates, put there by the bootstrap script in app/layout.tsx —
 * and it keeps this component out of the app's data-fetching surface entirely.
 *
 * Both icons ship in the DOM and CSS picks which one shows, so toggling costs
 * no re-render. `aria-pressed` would need state to be truthful, so the button
 * carries a plain label instead.
 */
export default function ThemeToggle() {
  function toggle() {
    const el = document.documentElement
    const current =
      el.dataset.theme ||
      (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light')
    const next = current === 'dark' ? 'light' : 'dark'
    el.dataset.theme = next
    try {
      localStorage.setItem('sl-admin-theme', next)
    } catch {
      // Private browsing or blocked storage: the theme still applies for this
      // page view, it just will not be remembered. Not worth surfacing.
    }
  }

  return (
    <button
      type="button"
      onClick={toggle}
      className="admin-theme-toggle"
      title="Bytt mellom lyst og mørkt tema"
      aria-label="Bytt mellom lyst og mørkt tema"
    >
      <svg
        className="i-sun"
        width="16" height="16" viewBox="0 0 24 24"
        fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"
      >
        <circle cx="12" cy="12" r="4" />
        <path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4" />
      </svg>
      <svg
        className="i-moon"
        width="16" height="16" viewBox="0 0 24 24"
        fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"
      >
        <path d="M21 12.8A9 9 0 1111.2 3a7 7 0 009.8 9.8z" />
      </svg>
    </button>
  )
}
