import { Outlet } from 'react-router';
import AdminSidebar from '@/components/admin/AdminSidebar';

// Standalone dashboard-style layout for /admin/* — intentionally does not
// use MainLayout (no site Navbar/Footer), mirroring SettingsLayout.
// admin.css is imported from index.css, not here (see that file for why).
export default function AdminLayout() {
  return (
    <div className="admin-layout">
      <AdminSidebar />
      <main className="flex-1 min-w-0 p-6 sm:p-10">
        <Outlet />
      </main>
    </div>
  );
}
