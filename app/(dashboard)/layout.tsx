import AdminSidebar from '@/components/AdminSidebar'
import AdminShell from '@/components/AdminShell'
import AdminTopBar from '@/components/AdminTopBar'
import { ToastProvider } from '@/components/Toast'

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <ToastProvider>
      <AdminShell sidebar={<AdminSidebar />} topbar={<AdminTopBar />}>
        {children}
      </AdminShell>
    </ToastProvider>
  )
}
