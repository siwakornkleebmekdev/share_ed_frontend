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

/**
 * =========================================================================
 * ตำแหน่งบนหน้าเว็บ: หน้าแดชบอร์ดหลักของผู้ดูแลระบบ (URL: /admin)
 * หน้าที่: แสดงภาพรวมของระบบ ประกอบไปด้วย:
 *         1. การ์ดสถิติ 4 ช่องด้านบน (ผู้ใช้ทั้งหมด, ผู้ดูแลระบบ, ผู้ตรวจสอบ, ผู้ใช้ที่ถูกระงับ)
 *         2. การ์ดแสดงรายชื่อผู้ใช้งานที่สมัครล่าสุด 5 อันดับแรกด้านล่าง
 * =========================================================================
 */
export default function AdminDashboard() {
  const navigate = useNavigate();
  const [users, setUsers] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  /**
   * ตำแหน่งบนหน้าเว็บ: ข้อมูลทั้งหมดในหน้าแดชบอร์ด
   * หน้าที่: ทำงานอัตโนมัติเมื่อเปิดเข้าสู่หน้าแดชบอร์ด
   *         ยิง API ไปยัง backend (`adminService.getAllUsers()`) เพื่อดึงรายชื่อผู้ใช้ทั้งหมด
   *         แล้วนำมาบันทึกใน state `users` เพื่อเตรียมนำไปคำนวณสถิติ
   */
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

  /**
   * ตำแหน่งบนหน้าเว็บ: การ์ดสถิติ 4 กล่องที่เรียงกันด้านบนสุดของหน้าแดชบอร์ด
   *         (ผู้ใช้งานทั้งหมด, ผู้ดูแลระบบ, ผู้ตรวจสอบ, ถูกระงับการใช้งาน)
   * หน้าที่: คำนวณสรุปตัวเลขสถิติจากรายชื่อผู้ใช้งานทั้งหมด โดยคัดกรองแยกตาม role และ status
   *         เพื่อนำตัวเลขไปแสดงผลบนการ์ดแต่ละใบ
   */
  const stats = useMemo(() => {
    const total = users.length;
    const admins = users.filter((u) => u.role === "ADMIN").length;
    const moderators = users.filter((u) => u.role === "MODERATOR").length;
    const banned = users.filter((u) => u.status === "BANNED").length;
    return { total, admins, moderators, banned };
  }, [users]);

  /**
   * ตำแหน่งบนหน้าเว็บ: การ์ด "ผู้ใช้งานที่สมัครล่าสุด" ด้านล่างของหน้าแดชบอร์ด
   * หน้าที่: คัดเลือกและเรียงลำดับผู้ใช้งานตามวันเวลาที่สมัคร (`created_at`) จากใหม่สุดไปเก่าสุด
   *         โดยดึงมาแสดงเพียง 5 คนแรก หากคลิกที่แถวผู้ใช้จะพาไปหน้ารายละเอียดของผู้ใช้คนนั้น (/admin/users/:id)
   */
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
