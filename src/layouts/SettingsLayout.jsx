import { Outlet } from 'react-router';
import SettingsSidebar from '@/components/settings/SettingsSidebar';

// Standalone dashboard-style layout for /settings/* — intentionally does not
// use MainLayout (no site Navbar/Footer); the sidebar itself carries the
// brand header, navigation, and a "back to home"/logout footer.
export default function SettingsLayout() {
  return (
    <div className="flex min-h-screen flex-col bg-slate-50 lg:flex-row">
      <SettingsSidebar />
      <main className="min-w-0 flex-1 px-4 py-6 sm:px-6 lg:p-10">
        <Outlet />
      </main>
    </div>
  );
}
