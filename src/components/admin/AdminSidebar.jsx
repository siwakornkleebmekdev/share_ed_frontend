import { NavLink, Link, useNavigate } from "react-router";
import {
  BookOpen,
  LayoutDashboard,
  Users,
  Award,
  Undo2,
  LogOut,
  ShieldCheck,
  ShieldAlert,
} from "lucide-react";
import { useEffect } from "react";
import toast from "react-hot-toast";
import useAuthStore from "@/store/authStore";
import { authService } from "@/services/auth.service";
import useReportStore from "@/store/reportStore";

const NAV_GROUPS = [
  {
    label: "ภาพรวม",
    items: [{ to: "/admin", label: "แดชบอร์ด", icon: LayoutDashboard, end: true, roles: ["ADMIN"] }],
  },
  {
    label: "จัดการ",
    items: [
      { to: "/admin/reports", label: "จัดการรีพอร์ต", icon: ShieldAlert, roles: ["ADMIN", "MODERATOR"], showReportCount: true },
      { to: "/admin/users", label: "จัดการผู้ใช้งาน", icon: Users, roles: ["ADMIN"] },
      { to: "/admin/achievements", label: "จัดการความสำเร็จ", icon: Award, roles: ["ADMIN"] },
    ],
  },
];

export default function AdminSidebar() {
  const navigate = useNavigate();
  const { user, logout } = useAuthStore();
  const { pendingCount, fetchReports, startRealtime, stopRealtime } = useReportStore();
  const role = String(user?.role || "").toUpperCase();
  const reportCount = pendingCount();

  useEffect(() => {
    startRealtime();
    fetchReports({ force: true }).catch(() => { });
    return () => stopRealtime();
  }, [fetchReports, startRealtime, stopRealtime]);

  const handleLogout = async () => {
    try {
      await authService.logout();
      logout();
      navigate("/login", { replace: true });
      toast.success("ออกจากระบบสำเร็จ");
    } catch (error) {
      toast.error("เกิดข้อผิดพลาดในการออกจากระบบ");
    }
  };

  const displayName =
    user?.display_name || user?.username || user?.name || "ผู้ดูแลระบบ";
  const avatarUrl =
    user?.avatar_url || user?.avatar || user?.user_metadata?.avatar_url;

  const navLinkClass = ({ isActive }) =>
    `admin-sidebar-link ${isActive ? "admin-sidebar-link-active" : ""}`;

  return (
    <aside className="admin-sidebar">
      <div className="admin-sidebar-brand">
        <BookOpen className="text-primary h-7 w-7" />
        <span className="font-bold tracking-tight text-lg text-slate-800">
          SHARE-ED
        </span>
      </div>

      <nav className="admin-sidebar-nav">
        {NAV_GROUPS.map((group) => {
          const visibleItems = group.items.filter((item) => item.roles.includes(role));
          if (visibleItems.length === 0) return null;
          return (
            <div key={group.label}>
              <p className="admin-sidebar-group-label">{group.label}</p>
              <div className="space-y-1">
                {visibleItems.map((item) => {
                  const Icon = item.icon;
                  return (
                    <NavLink
                      key={item.to}
                      to={item.to}
                      end={item.end}
                      className={navLinkClass}
                    >
                      <Icon className="h-4 w-4 shrink-0" />
                      <span className="flex-1">{item.label}</span>
                      {item.showReportCount && (
                        <span className={`inline-flex min-w-6 items-center justify-center rounded-full px-1.5 py-0.5 text-xs font-extrabold ${reportCount > 0 ? "bg-rose-500 text-white" : "bg-slate-100 text-slate-500"}`}>
                          {reportCount}
                        </span>
                      )}
                    </NavLink>
                  );
                })}
              </div>
            </div>
          );
        })}

        <div>
          <p className="admin-sidebar-group-label">ระบบ</p>
          <div className="space-y-1">
            <Link to="/home" className="admin-sidebar-link">
              <Undo2 className="h-4 w-4 shrink-0" />
              กลับหน้าหลัก
            </Link>
          </div>
        </div>
      </nav>

      <div className="admin-sidebar-footer">
        <Link
          to={`/profile/${encodeURIComponent(user?.user_id || user?.id || "")}`}
          className="flex-1 min-w-0 flex items-center gap-3 hover:opacity-80 transition-opacity"
        >
          <div className="admin-sidebar-avatar">
            {avatarUrl ? (
              <img
                src={avatarUrl}
                alt={displayName}
                className="w-full h-full object-cover"
              />
            ) : (
              displayName.charAt(0).toUpperCase()
            )}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-bold text-slate-800 truncate">
              {displayName}
            </p>
            <p className="text-xs text-slate-400 truncate flex items-center gap-1">
              <ShieldCheck className="h-3 w-3" /> {role === "ADMIN" ? "ผู้ดูแลระบบ" : "ผู้ตรวจสอบ"}
            </p>
          </div>
        </Link>
        <button
          onClick={handleLogout}
          title="ออกจากระบบ"
          className="admin-sidebar-logout"
        >
          <LogOut className="h-4 w-4" />
        </button>
      </div>
    </aside>
  );
}
