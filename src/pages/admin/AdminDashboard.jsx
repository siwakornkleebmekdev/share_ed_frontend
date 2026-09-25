import { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router";
import { AlertTriangle, Ban, FileWarning, ShieldAlert, ShieldCheck, Users } from "lucide-react";
import toast from "react-hot-toast";
import { adminService } from "@/services/admin.service";
import useReportStore from "@/store/reportStore";

const STAT_TILES = [
  { key: "total", label: "ผู้ใช้งานทั้งหมด", icon: Users, color: "text-primary" },
  { key: "admins", label: "ผู้ดูแลระบบ (ADMIN)", icon: ShieldCheck, color: "text-purple-500" },
  { key: "suspended", label: "บัญชีที่ถูกพักใช้งาน", icon: AlertTriangle, color: "text-amber-500" },
  { key: "banned", label: "ถูกระงับการใช้งาน", icon: Ban, color: "text-red-500" },
];

export default function AdminDashboard() {
  const navigate = useNavigate();
  const { reports, fetchReports, isLoading: reportsLoading } = useReportStore();
  const [users, setUsers] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  // backend ไม่มี endpoint สถิติแยกต่างหาก เลยดึงผู้ใช้ทั้งหมดมาครั้งเดียว
  // แล้วคำนวณตัวเลข (จำนวนรวม/แยกตาม role/แยกตามสถานะ) ที่ฝั่ง frontend เอง
  useEffect(() => {
    (async () => {
      try {
        const [data] = await Promise.all([
          adminService.getAllUsers(),
          fetchReports().catch(() => []),
        ]);
        setUsers(Array.isArray(data) ? data : []);
      } catch (error) {
        toast.error(
          error?.response?.data?.message || "ไม่สามารถโหลดข้อมูลแดชบอร์ดได้",
        );
      } finally {
        setIsLoading(false);
      }
    })();
  }, [fetchReports]);

  const stats = useMemo(() => {
    const total = users.length;
    const admins = users.filter((u) => u.role === "ADMIN").length;
    const suspended = users.filter((u) => u.status === "SUSPENDED").length;
    const banned = users.filter((u) => u.status === "BANNED").length;
    return { total, admins, suspended, banned };
  }, [users]);

  const recentUsers = useMemo(() => {
    return [...users]
      .sort((a, b) => new Date(b.created_at || 0) - new Date(a.created_at || 0))
      .slice(0, 5);
  }, [users]);

  const reportStats = useMemo(() => {
    const totalReports = reports.reduce(
      (sum, post) => sum + (post?._count?.reports ?? post?.reports?.length ?? 0),
      0,
    );
    const activePosts = reports.filter((post) => post.post_status === "ACTIVE").length;
    const suspendedPosts = reports.filter((post) => post.post_status === "UNACTIVED").length;
    return {
      reportedPosts: reports.length,
      totalReports,
      activePosts,
      suspendedPosts,
    };
  }, [reports]);

  const mostReportedPosts = useMemo(() => (
    [...reports]
      .sort((a, b) =>
        (b?._count?.reports ?? b?.reports?.length ?? 0) -
        (a?._count?.reports ?? a?.reports?.length ?? 0),
      )
      .slice(0, 5)
  ), [reports]);

  return (
    <div className="max-w-6xl space-y-6">
      <div>
        <h1 className="admin-page-title">แดชบอร์ด</h1>
        <p className="admin-page-subtitle">ภาพรวมผู้ใช้งานและสถานการณ์รีพอร์ตในระบบ</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {STAT_TILES.map((tile) => {
          const Icon = tile.icon;
          return (
            <div key={tile.key} className="admin-stat-tile">
              <Icon className={`h-6 w-6 mb-3 ${tile.color}`} />
              <p className="admin-stat-value">
                {isLoading ? "-" : stats[tile.key]}
              </p>
              <p className="admin-stat-label">{tile.label}</p>
            </div>
          );
        })}
      </div>

      <div className="admin-card">
        <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h3 className="text-lg font-bold text-slate-800">ภาพรวมรีพอร์ต</h3>
            <p className="mt-1 text-sm text-slate-500">ติดตามโพสต์ตั้งแต่ได้รับรายงานครั้งแรก</p>
          </div>
          <button
            type="button"
            onClick={() => navigate("/admin/reports")}
            className="rounded-xl bg-slate-900 px-4 py-2 text-sm font-bold text-white transition-colors hover:bg-slate-800 cursor-pointer"
          >
            เปิด Report Console
          </button>
        </div>

        <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
          {[
            { label: "โพสต์ที่ถูกรายงาน", value: reportStats.reportedPosts, icon: FileWarning, color: "text-rose-500", bg: "bg-rose-50" },
            { label: "รายงานทั้งหมด", value: reportStats.totalReports, icon: ShieldAlert, color: "text-amber-500", bg: "bg-amber-50" },
            { label: "ยังเผยแพร่อยู่", value: reportStats.activePosts, icon: AlertTriangle, color: "text-blue-500", bg: "bg-blue-50" },
            { label: "ถูกระงับแล้ว", value: reportStats.suspendedPosts, icon: Ban, color: "text-slate-600", bg: "bg-slate-100" },
          ].map(({ label, value, icon: Icon, color, bg }) => (
            <div key={label} className={`rounded-2xl p-4 ${bg}`}>
              <Icon className={`mb-3 h-5 w-5 ${color}`} />
              <p className="text-2xl font-extrabold text-slate-900">{reportsLoading ? "-" : value}</p>
              <p className="mt-1 text-xs font-semibold text-slate-500">{label}</p>
            </div>
          ))}
        </div>

        <div className="mt-5">
          <p className="mb-3 text-sm font-bold text-slate-700">โพสต์ที่ถูกรายงานมากที่สุด</p>
          {mostReportedPosts.length === 0 ? (
            <p className="rounded-xl bg-slate-50 px-4 py-5 text-center text-sm text-slate-400">ยังไม่มีโพสต์ถูกรายงาน</p>
          ) : (
            <div className="divide-y divide-slate-100 rounded-xl border border-slate-100">
              {mostReportedPosts.map((post) => {
                const count = post?._count?.reports ?? post?.reports?.length ?? 0;
                return (
                  <button
                    type="button"
                    key={post.id}
                    onClick={() => navigate(`/admin/reports?post=${encodeURIComponent(post.id)}`)}
                    className="flex w-full items-center justify-between gap-4 px-4 py-3 text-left transition-colors hover:bg-slate-50 cursor-pointer"
                  >
                    <div className="min-w-0">
                      <p className="truncate text-sm font-bold text-slate-800">{post.title || "โพสต์ไม่มีชื่อ"}</p>
                      <p className="mt-0.5 text-xs text-slate-400">โดย {post.author?.username || "ไม่พบชื่อผู้เขียน"}</p>
                    </div>
                    <span className="shrink-0 rounded-full bg-rose-50 px-2.5 py-1 text-xs font-extrabold text-rose-600">{count} รายงาน</span>
                  </button>
                );
              })}
            </div>
          )}
        </div>
      </div>

      <div className="admin-card">
        <h3 className="font-bold text-slate-800 text-lg mb-4">
          ผู้ใช้งานที่สมัครล่าสุด
        </h3>
        {isLoading ? (
          <p className="text-slate-400 text-sm">กำลังโหลดข้อมูล...</p>
        ) : recentUsers.length === 0 ? (
          <p className="text-slate-400 text-sm">ยังไม่มีผู้ใช้งาน</p>
        ) : (
          <div className="divide-y divide-slate-50">
            {recentUsers.map((u) => (
              <div
                key={u.id}
                onClick={() => navigate(`/admin/users/${u.id}`)}
                className="admin-recent-row"
              >
                <div>
                  <p className="font-bold text-slate-800 text-sm">
                    {u.username || u.nickname || "ไม่ระบุชื่อ"}
                  </p>
                  <p className="text-xs text-slate-400">{u.email}</p>
                </div>
                <span className="text-xs font-semibold text-slate-500">
                  {u.created_at
                    ? new Date(u.created_at).toLocaleDateString("th-TH")
                    : "-"}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
