import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router";
import { ChevronLeft, Mail, MapPin, Briefcase, Calendar, Ban, RotateCcw } from "lucide-react";
import toast from "react-hot-toast";
import Swal from "sweetalert2";
import { adminService } from "@/services/admin.service";
import { mapEducationLevel } from "@/services/profile.service";

const ROLE_OPTIONS = ["MEMBER", "MODERATOR", "ADMIN"];

const STATUS_BADGE_CLASS = {
  ACTIVE: "admin-badge-active",
  SUSPENDED: "admin-badge-suspended",
  BANNED: "admin-badge-banned",
};

export default function UserDetails() {
  const { id } = useParams(); // มาจาก route /admin/users/:id
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isBusy, setIsBusy] = useState(false);

  // ดึงข้อมูลผู้ใช้รายคน (GET /users/:id มี role/status มาให้ด้วย)
  const fetchUser = async () => {
    setIsLoading(true);
    try {
      const data = await adminService.getUserDetails(id);
      setUser(data);
    } catch (error) {
      toast.error(
        error?.response?.data?.message || "ไม่สามารถโหลดข้อมูลผู้ใช้งานได้",
      );
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchUser();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const handleRoleChange = async (nextRole) => {
    if (!user || nextRole === user.role) return;
    const result = await Swal.fire({
      title: "เปลี่ยนสิทธิ์ผู้ใช้งาน?",
      text: `เปลี่ยนสิทธิ์ของ ${user.username || user.email} เป็น ${nextRole}`,
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#3b82f6",
      cancelButtonColor: "#64748b",
      confirmButtonText: "ยืนยัน",
      cancelButtonText: "ยกเลิก",
    });
    if (!result.isConfirmed) return;

    setIsBusy(true);
    try {
      await adminService.updateUserRole(user.id, nextRole);
      toast.success("เปลี่ยนสิทธิ์ผู้ใช้งานสำเร็จ");
      await fetchUser();
    } catch (error) {
      toast.error(
        error?.response?.data?.message || "ไม่สามารถเปลี่ยนสิทธิ์ผู้ใช้งานได้",
      );
    } finally {
      setIsBusy(false);
    }
  };

  const handleSuspend = async () => {
    const result = await Swal.fire({
      title: "ระงับการใช้งานผู้ใช้นี้?",
      input: "text",
      inputLabel: "เหตุผล (ไม่บังคับ)",
      inputPlaceholder: "ระบุเหตุผลในการระงับ",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#ef4444",
      cancelButtonColor: "#64748b",
      confirmButtonText: "ระงับการใช้งาน",
      cancelButtonText: "ยกเลิก",
    });
    if (!result.isConfirmed) return;

    setIsBusy(true);
    try {
      await adminService.banUser(user.id, result.value || undefined);
      toast.success("ระงับการใช้งานผู้ใช้สำเร็จ");
      await fetchUser();
    } catch (error) {
      toast.error(
        error?.response?.data?.message || "ไม่สามารถระงับการใช้งานผู้ใช้ได้",
      );
    } finally {
      setIsBusy(false);
    }
  };

  const handleReactivate = async () => {
    const result = await Swal.fire({
      title: "คืนสิทธิ์การใช้งานผู้ใช้นี้?",
      icon: "question",
      showCancelButton: true,
      confirmButtonColor: "#3b82f6",
      cancelButtonColor: "#64748b",
      confirmButtonText: "คืนสิทธิ์",
      cancelButtonText: "ยกเลิก",
    });
    if (!result.isConfirmed) return;

    setIsBusy(true);
    try {
      await adminService.unbanUser(user.id);
      toast.success("คืนสิทธิ์การใช้งานผู้ใช้สำเร็จ");
      await fetchUser();
    } catch (error) {
      toast.error(
        error?.response?.data?.message || "ไม่สามารถคืนสิทธิ์การใช้งานผู้ใช้ได้",
      );
    } finally {
      setIsBusy(false);
    }
  };

  if (isLoading) {
    return (
      <div className="max-w-3xl py-20 text-center text-slate-400">
        กำลังโหลดข้อมูล...
      </div>
    );
  }

  if (!user) {
    return (
      <div className="max-w-3xl py-20 text-center text-slate-400">
        ไม่พบข้อมูลผู้ใช้งานนี้
      </div>
    );
  }

  return (
    <div className="max-w-3xl space-y-6">
      <button
        onClick={() => navigate("/admin/users")}
        className="admin-back-link"
      >
        <ChevronLeft className="h-4 w-4" /> กลับไปหน้าจัดการผู้ใช้งาน
      </button>

      <div className="admin-card space-y-6">
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div className="flex items-center gap-4">
            <div className="h-16 w-16 rounded-full bg-slate-100 overflow-hidden shrink-0 flex items-center justify-center text-slate-400 font-bold text-xl">
              {user.profile_image ? (
                <img
                  src={user.profile_image}
                  alt={user.username}
                  className="w-full h-full object-cover"
                />
              ) : (
                (user.username || user.email || "?").charAt(0).toUpperCase()
              )}
            </div>
            <div>
              <h1 className="text-xl font-extrabold text-slate-800">
                {user.username || user.nickname || "ไม่ระบุชื่อ"}
              </h1>
              <p className="text-sm text-slate-400 flex items-center gap-1.5">
                <Mail className="h-3.5 w-3.5" /> {user.email}
              </p>
            </div>
          </div>
          <span
            className={`admin-badge-lg ${STATUS_BADGE_CLASS[user.status] || "admin-badge-default"}`}
          >
            {user.status}
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 text-sm">
          <div>
            <p className="admin-field-label">สิทธิ์การใช้งาน</p>
            <select
              value={user.role}
              disabled={isBusy}
              onChange={(e) => handleRoleChange(e.target.value)}
              className="admin-select"
            >
              {ROLE_OPTIONS.map((role) => (
                <option key={role} value={role}>
                  {role}
                </option>
              ))}
            </select>
          </div>
          <div>
            <p className="admin-field-label">ระดับการศึกษา</p>
            <p className="admin-field-value">
              {mapEducationLevel(user.education_level) || "ไม่ระบุ"}
            </p>
          </div>
          <div>
            <p className="admin-field-label">
              <MapPin className="h-3.5 w-3.5" /> ที่อยู่
            </p>
            <p className="admin-field-value">{user.location || "ไม่ระบุ"}</p>
          </div>
          <div>
            <p className="admin-field-label">
              <Briefcase className="h-3.5 w-3.5" /> อาชีพ
            </p>
            <p className="admin-field-value">{user.occupation || "ไม่ระบุ"}</p>
          </div>
          <div>
            <p className="admin-field-label">
              <Calendar className="h-3.5 w-3.5" /> สมัครเมื่อ
            </p>
            <p className="admin-field-value">
              {user.created_at
                ? new Date(user.created_at).toLocaleDateString("th-TH")
                : "-"}
            </p>
          </div>
        </div>

        {user.bio && (
          <div>
            <p className="admin-field-label">เกี่ยวกับ</p>
            <p className="text-slate-600">{user.bio}</p>
          </div>
        )}

        {/* สลับปุ่มตามสถานะปัจจุบัน: BANNED -> โชว์ปุ่มคืนสิทธิ์, อื่นๆ -> โชว์ปุ่มระงับ */}
        <div className="pt-4 border-t border-slate-100 flex gap-3">
          {user.status === "BANNED" ? (
            <button
              onClick={handleReactivate}
              disabled={isBusy}
              className="admin-btn admin-btn-success"
            >
              <RotateCcw className="h-4 w-4" /> คืนสิทธิ์การใช้งาน
            </button>
          ) : (
            <button
              onClick={handleSuspend}
              disabled={isBusy || user.role === "ADMIN"}
              title={
                user.role === "ADMIN"
                  ? "ไม่สามารถระงับบัญชีผู้ดูแลระบบได้"
                  : undefined
              }
              className="admin-btn admin-btn-danger"
            >
              <Ban className="h-4 w-4" /> ระงับการใช้งาน
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
