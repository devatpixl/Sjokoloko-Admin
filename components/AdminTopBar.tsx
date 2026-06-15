import { auth, signOut } from '@/auth'

export default async function AdminTopBar() {
  const session = await auth()
  const name = session?.user?.name ?? 'Admin'

  return (
    <div className="admin-topbar">
      <div className="admin-topbar-title" />
      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        <span className="admin-topbar-badge">{name}</span>
        <form
          action={async () => {
            'use server'
            await signOut({ redirectTo: '/login' })
          }}
        >
          <button
            type="submit"
            className="admin-btn admin-btn-secondary"
            style={{ fontSize: 12, height: 30, padding: '0 12px' }}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4" />
              <path d="M16 17l5-5-5-5M21 12H9" />
            </svg>
            Logg ut
          </button>
        </form>
      </div>
    </div>
  )
}
