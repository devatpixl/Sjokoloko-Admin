import { auth } from '@/auth'

export default async function AdminTopBar() {
  const session = await auth()
  const name = session?.user?.name ?? 'Admin'

  return (
    <div className="admin-topbar">
      <div className="admin-topbar-title" />
      <span className="admin-topbar-badge">
        {name}
      </span>
    </div>
  )
}
