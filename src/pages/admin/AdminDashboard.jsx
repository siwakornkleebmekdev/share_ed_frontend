import { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router";
import { Users, ShieldCheck, UserCog, Ban } from "lucide-react";
import toast from "react-hot-toast";
import { adminService } from "@/services/admin.service";

const STAT_TILES = [
  { key: "total", label: "ผู้ใช้งานทั้งหมด", icon: Users, color: "text-primary" },
  { key: "admins", label: "ผู้ดูแลระบบ (ADMIN)", icon: ShieldCheck, color: "text-purple-500" },
  { key: "moderators", label: "ผู้ตรวจสอบ (MODERATOR)", icon: UserCog, color: "text-amber-500" },
  { key: "banned", label: "ถูกระงับการใช้งาน", icon: Ban, color: "text-red-500" },
];

export default function AdminDashboard() {
  const navigate = useNavigate();
  const [users, setUsers] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  // backend ไม่มี endpoint สถิติแยกต่างหาก เลยดึงผู้ใช้ทั้งหมดมาครั้งเดียว
  // แล้วคำนวณตัวเลข (จำนวนรวม/แยกตาม role/แยกตามสถานะ) ที่ฝั่ง frontend เอง
  useEffect(() => {
    (async () => {
      try {
        const data = await adminService.getAllUsers();
        setUsers(Array.isArray(data) ? data : []);
      } catch (error) {
        toast.error(
          error?.response?.data?.message || "ไม่สามารถโหลดข้อมูลแดชบอร์ดได้",
        );
      } finally {
        setIsLoading(false);
      }
    })();
  }, []);

  const stats = useMemo(() => {
    const total = users.length;
    const admins = users.filter((u) => u.role === "ADMIN").length;
    const moderators = users.filter((u) => u.role === "MODERATOR").length;
    const banned = users.filter((u) => u.status === "BANNED").length;
    return { total, admins, moderators, banned };
  }, [users]);

  const recentUsers = useMemo(() => {
    return [...users]
      .sort((a, b) => new Date(b.created_at || 0) - new Date(a.created_at || 0))
      .slice(0, 5);
  }, [users]);

  return (
    <div className="max-w-6xl space-y-6">
      <div>
        <h1 className="admin-page-title">แดชบอร์ด</h1>
        <p className="admin-page-subtitle">ภาพรวมผู้ใช้งานทั้งหมดในระบบ</p>
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
