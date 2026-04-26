import AdminSidebar from '@/components/AdminSidebar'
import AdminTopBar from '@/components/AdminTopBar'
import { ToastProvider } from '@/components/Toast'

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <ToastProvider>
      <div className="admin-shell">
        <AdminSidebar />
        <div className="admin-body">
          <AdminTopBar />
          <main className="admin-main">{children}</main>
        </div>
      </div>
    </ToastProvider>
  )
}
