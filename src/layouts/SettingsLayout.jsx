import { Outlet } from 'react-router';
import SettingsSidebar from '@/components/settings/SettingsSidebar';

// Standalone dashboard-style layout for /settings/* — intentionally does not
// use MainLayout (no site Navbar/Footer); the sidebar itself carries the
// brand header, navigation, and a "back to home"/logout footer.
export default function SettingsLayout() {
  return (
    <div className="flex min-h-screen bg-slate-50">
      <SettingsSidebar />
      <main className="flex-1 min-w-0 p-6 sm:p-10">
        <Outlet />
      </main>
    </div>
  );
}
