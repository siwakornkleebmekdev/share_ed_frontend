import { NavLink, Link, useNavigate } from 'react-router';
import { BookOpen, LayoutDashboard, User, Palette, Puzzle, Settings, Undo2, LogOut } from 'lucide-react';
import toast from 'react-hot-toast';
import useAuthStore from '@/store/authStore';
import { supabase } from '@/utils/supabase';
import { authService } from '@/services/auth.service';
import { mapEducationLevel } from '@/services/profile.service';

const NAV_GROUPS = [
  {
    label: 'แดชบอร์ด',
    items: [
      { to: '/settings', label: 'ภาพรวม', icon: LayoutDashboard, end: true },
    ],
  },
  {
    label: 'ปรับแต่ง',
    items: [
      { to: '/settings/profile', label: 'โปรไฟล์', icon: User },
      { to: '/settings/appearance', label: 'รูปลักษณ์', icon: Palette },
      { to: '/settings/widgets', label: 'วิดเจ็ต', icon: Puzzle },
    ],
  },
];

export default function SettingsSidebar() {
  const navigate = useNavigate();
  const { user, logout } = useAuthStore();

  const handleLogout = async () => {
    try {
      await authService.logout();
      logout();
      navigate('/login', { replace: true });
      toast.success('ออกจากระบบสำเร็จ');
    } catch (error) {
      toast.error('เกิดข้อผิดพลาดในการออกจากระบบ');
    }
  };

  const displayName = user?.display_name || user?.username || user?.name || 'ผู้ใช้งาน';
  const avatarUrl = user?.avatar_url || user?.avatar || user?.user_metadata?.avatar_url;
  const educationLabel = mapEducationLevel(user?.education_level) || 'ไม่ระบุระดับชั้น';

  const navLinkClass = ({ isActive }) =>
    `flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-bold transition-colors ${
      isActive ? 'bg-slate-900 text-white shadow-sm' : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
    }`;

  return (
    <aside className="w-72 shrink-0 h-screen sticky top-0 bg-white border-r border-slate-100 flex flex-col">
      <div className="px-6 h-20 flex items-center gap-2 border-b border-slate-100 shrink-0">
        <BookOpen className="text-primary h-7 w-7" />
        <span className="font-bold tracking-tight text-lg text-slate-800">SHARE-ED</span>
      </div>

      <nav className="flex-1 overflow-y-auto px-4 py-6 space-y-6">
        {NAV_GROUPS.map(group => (
          <div key={group.label}>
            <p className="px-3.5 mb-2 text-[11px] font-bold uppercase tracking-wide text-slate-400">{group.label}</p>
            <div className="space-y-1">
              {group.items.map(item => {
                const Icon = item.icon;
                return (
                  <NavLink key={item.to} to={item.to} end={item.end} className={navLinkClass}>
                    <Icon className="h-4 w-4 shrink-0" />
                    {item.label}
                  </NavLink>
                );
              })}
            </div>
          </div>
        ))}

        <div>
          <p className="px-3.5 mb-2 text-[11px] font-bold uppercase tracking-wide text-slate-400">จัดการ</p>
          <div className="space-y-1">
            <NavLink to="/settings/account" className={navLinkClass}>
              <Settings className="h-4 w-4 shrink-0" />
              ตั้งค่า
            </NavLink>
            <Link
              to="/home"
              className="flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-bold text-slate-600 hover:bg-slate-50 hover:text-slate-900 transition-colors"
            >
              <Undo2 className="h-4 w-4 shrink-0" />
              กลับหน้าหลัก
            </Link>
          </div>
        </div>
      </nav>

      <div className="px-4 py-4 border-t border-slate-100 shrink-0 flex items-center gap-3">
        <Link to="/profile" className="flex-1 min-w-0 flex items-center gap-3 hover:opacity-80 transition-opacity">
          <div className="h-10 w-10 rounded-full bg-slate-100 overflow-hidden shrink-0 flex items-center justify-center text-slate-400 font-bold">
            {avatarUrl ? (
              <img src={avatarUrl} alt={displayName} className="w-full h-full object-cover" />
            ) : (
              displayName.charAt(0).toUpperCase()
            )}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-bold text-slate-800 truncate">{displayName}</p>
            <p className="text-xs text-slate-400 truncate">{educationLabel}</p>
          </div>
        </Link>
        <button
          onClick={handleLogout}
          title="ออกจากระบบ"
          className="p-2 rounded-lg text-slate-400 hover:text-red-500 hover:bg-red-50 transition-colors shrink-0"
        >
          <LogOut className="h-4 w-4" />
        </button>
      </div>
    </aside>
  );
}
