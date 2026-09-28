import { Outlet } from 'react-router';
import AdminSidebar from '@/components/admin/AdminSidebar';

// Standalone dashboard-style layout for /admin/* — intentionally does not
// use MainLayout (no site Navbar/Footer), mirroring SettingsLayout.
// admin.css is imported from index.css, not here (see that file for why).
export default function AdminLayout() {
  return (
    <div className="admin-layout">
      <AdminSidebar />
      <main className="min-w-0 flex-1 px-4 py-6 sm:px-6 lg:p-10">
        <Outlet />
      </main>
    </div>
  );
}
