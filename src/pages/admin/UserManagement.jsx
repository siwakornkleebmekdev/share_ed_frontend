import { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router";
import { Search, Ban, RotateCcw } from "lucide-react";
import toast from "react-hot-toast";
import Swal from "sweetalert2";
import { adminService } from "@/services/admin.service";

const ROLE_OPTIONS = ["MEMBER", "ADMIN"];

const STATUS_BADGE_CLASS = {
  ACTIVE: "admin-badge-active",
  SUSPENDED: "admin-badge-suspended",
  BANNED: "admin-badge-banned",
};

export default function UserManagement() {
  const navigate = useNavigate();
  const [users, setUsers] = useState([]); // รายชื่อผู้ใช้ทั้งหมดจาก backend
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState(""); // คำค้นหา (ชื่อ/อีเมล)
  const [roleFilter, setRoleFilter] = useState("ALL");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [busyUserId, setBusyUserId] = useState(null); // id ผู้ใช้ที่กำลังกดปุ่มทำรายการอยู่ (กันกดซ้ำ)

  // ดึงรายชื่อผู้ใช้ทั้งหมดใหม่ — เรียกซ้ำหลังทำรายการสำเร็จทุกครั้ง
  // เพื่อให้ข้อมูลตรงกับ backend เสมอ (ไม่ทำ optimistic update)
  const fetchUsers = async () => {
    setIsLoading(true);
    try {
      const data = await adminService.getAllUsers();
      setUsers(Array.isArray(data) ? data : []);
    } catch (error) {
      toast.error(
        error?.response?.data?.message || "ไม่สามารถโหลดรายชื่อผู้ใช้งานได้",
      );
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  // กรอง/ค้นหาฝั่ง frontend เอง เพราะ backend ยังไม่มีพารามิเตอร์ค้นหา
  const filteredUsers = useMemo(() => {
    const q = search.trim().toLowerCase();
    return users.filter((u) => {
      const matchesQuery =
        !q ||
        u.username?.toLowerCase().includes(q) ||
        u.nickname?.toLowerCase().includes(q) ||
        u.email?.toLowerCase().includes(q);
      const matchesRole = roleFilter === "ALL" || u.role === roleFilter;
      const matchesStatus = statusFilter === "ALL" || u.status === statusFilter;
      return matchesQuery && matchesRole && matchesStatus;
    });
  }, [users, search, roleFilter, statusFilter]);

  // "ระงับ" ผู้ใช้ — ฝั่ง backend คือ ban (เปลี่ยนสถานะเป็น BANNED)
  // เก็บเหตุผลจากช่อง input ของ Swal ได้ (ไม่บังคับกรอก)
  const handleSuspend = async (targetUser) => {
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

    setBusyUserId(targetUser.id);
    try {
      await adminService.banUser(targetUser.id, result.value || undefined);
      toast.success("ระงับการใช้งานผู้ใช้สำเร็จ");
      await fetchUsers();
    } catch (error) {
      toast.error(
        error?.response?.data?.message || "ไม่สามารถระงับการใช้งานผู้ใช้ได้",
      );
    } finally {
      setBusyUserId(null);
    }
  };

  // "คืนสิทธิ์" ผู้ใช้ — ฝั่ง backend คือ unban (เปลี่ยนสถานะกลับเป็น ACTIVE)
  const handleReactivate = async (targetUser) => {
    const result = await Swal.fire({
      title: "คืนสิทธิ์การใช้งานผู้ใช้นี้?",
      text: `${targetUser.username || targetUser.email} จะกลับมาใช้งานได้ตามปกติ`,
      icon: "question",
      showCancelButton: true,
      confirmButtonColor: "#3b82f6",
      cancelButtonColor: "#64748b",
      confirmButtonText: "คืนสิทธิ์",
      cancelButtonText: "ยกเลิก",
    });
    if (!result.isConfirmed) return;

    setBusyUserId(targetUser.id);
    try {
      await adminService.unbanUser(targetUser.id);
      toast.success("คืนสิทธิ์การใช้งานผู้ใช้สำเร็จ");
      await fetchUsers();
    } catch (error) {
      toast.error(
        error?.response?.data?.message || "ไม่สามารถคืนสิทธิ์การใช้งานผู้ใช้ได้",
      );
    } finally {
      setBusyUserId(null);
    }
  };

  return (
    <div className="max-w-6xl space-y-6">
      <div>
        <h1 className="admin-page-title">จัดการผู้ใช้งาน</h1>
        <p className="admin-page-subtitle">
          ดูรายชื่อ บทบาท และสถานะของผู้ใช้งานทั้งหมด
        </p>
      </div>

      <div className="admin-filter-bar">
        <div className="relative flex-1">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="ค้นหาด้วยชื่อผู้ใช้หรืออีเมล"
            className="admin-input"
          />
        </div>
        <select
          value={roleFilter}
          onChange={(e) => setRoleFilter(e.target.value)}
          className="admin-select"
        >
          <option value="ALL">ทุกสิทธิ์</option>
          {ROLE_OPTIONS.map((role) => (
            <option key={role} value={role}>
              {role}
            </option>
          ))}
        </select>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="admin-select"
        >
          <option value="ALL">ทุกสถานะ</option>
          <option value="ACTIVE">ACTIVE</option>
          <option value="SUSPENDED">SUSPENDED</option>
          <option value="BANNED">BANNED</option>
        </select>
      </div>

      <div className="admin-table-card">
        <div className="divide-y divide-slate-100 md:hidden">
          {isLoading ? (
            <p className="px-4 py-10 text-center text-sm text-slate-400">กำลังโหลดข้อมูล...</p>
          ) : filteredUsers.length === 0 ? (
            <p className="px-4 py-10 text-center text-sm text-slate-400">ไม่พบผู้ใช้งานที่ตรงกับเงื่อนไข</p>
          ) : (
            filteredUsers.map((u) => (
              <article
                key={u.id}
                onClick={() => navigate(`/admin/users/${u.id}`)}
                className="cursor-pointer space-y-4 p-4 transition-colors hover:bg-slate-50"
              >
                <div className="min-w-0">
                  <p className="truncate font-bold text-slate-800">
                    {u.username || u.nickname || "ไม่ระบุชื่อ"}
                  </p>
                  <p className="mt-0.5 break-all text-xs text-slate-500">{u.email}</p>
                </div>

                <div className="grid grid-cols-2 gap-3 text-xs">
                  <div>
                    <p className="mb-1.5 font-semibold text-slate-400">บทบาท</p>
                    <span className="admin-badge admin-badge-default">{u.role || "MEMBER"}</span>
                  </div>
                  <div>
                    <p className="mb-1.5 font-semibold text-slate-400">สถานะ</p>
                    <span className={`admin-badge ${STATUS_BADGE_CLASS[u.status] || "admin-badge-default"}`}>
                      {u.status}
                    </span>
                  </div>
                  <div className="col-span-2">
                    <p className="font-semibold text-slate-400">สมัครเมื่อ</p>
                    <p className="mt-1 font-semibold text-slate-700">
                      {u.created_at ? new Date(u.created_at).toLocaleDateString("th-TH") : "-"}
                    </p>
                  </div>
                </div>

                <div onClick={(event) => event.stopPropagation()}>
                  {u.status === "BANNED" ? (
                    <button
                      type="button"
                      onClick={() => handleReactivate(u)}
                      disabled={busyUserId === u.id}
                      className="flex w-full items-center justify-center gap-2 rounded-xl bg-emerald-50 px-4 py-2.5 text-sm font-bold text-emerald-600 disabled:opacity-50"
                    >
                      <RotateCcw className="h-4 w-4" /> คืนสิทธิ์การใช้งาน
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={() => handleSuspend(u)}
                      disabled={busyUserId === u.id || u.role === "ADMIN"}
                      className="flex w-full items-center justify-center gap-2 rounded-xl bg-red-50 px-4 py-2.5 text-sm font-bold text-red-600 disabled:opacity-40"
                    >
                      <Ban className="h-4 w-4" /> ระงับการใช้งาน
                    </button>
                  )}
                </div>
              </article>
            ))
          )}
        </div>

        <div className="hidden overflow-x-auto md:block">
          <table className="admin-table">
            <thead>
              <tr>
                <th>ผู้ใช้งาน</th>
                <th>สิทธิ์</th>
                <th>สถานะ</th>
                <th>สมัครเมื่อ</th>
                <th className="text-right">การจัดการ</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <tr>
                  <td colSpan={5} className="admin-table-empty">
                    กำลังโหลดข้อมูล...
                  </td>
                </tr>
              ) : filteredUsers.length === 0 ? (
                <tr>
                  <td colSpan={5} className="admin-table-empty">
                    ไม่พบผู้ใช้งานที่ตรงกับเงื่อนไข
                  </td>
                </tr>
              ) : (
                filteredUsers.map((u) => (
                  // คลิกที่แถว (นอกปุ่ม/select) เพื่อไปหน้ารายละเอียดผู้ใช้
                  <tr
                    key={u.id}
                    className="admin-table-row"
                    onClick={() => navigate(`/admin/users/${u.id}`)}
                  >
                    <td>
                      <p className="font-bold text-slate-800">
                        {u.username || u.nickname || "ไม่ระบุชื่อ"}
                      </p>
                      <p className="text-xs text-slate-400">{u.email}</p>
                    </td>
                    <td>
                      <span className="admin-badge admin-badge-default">
                        {u.role || "MEMBER"}
                      </span>
                    </td>
                    <td>
                      <span
                        className={`admin-badge ${STATUS_BADGE_CLASS[u.status] || "admin-badge-default"}`}
                      >
                        {u.status}
                      </span>
                    </td>
                    <td className="text-slate-500">
                      {u.created_at
                        ? new Date(u.created_at).toLocaleDateString("th-TH")
                        : "-"}
                    </td>
                    {/* stopPropagation กันไม่ให้คลิก select/ปุ่มใน cell นี้ ไปสั่ง navigate ที่ tr ด้วย */}
                    <td onClick={(e) => e.stopPropagation()}>
                      <div className="flex justify-end gap-2">
                        {u.status === "BANNED" ? (
                          <button
                            onClick={() => handleReactivate(u)}
                            disabled={busyUserId === u.id}
                            title="คืนสิทธิ์การใช้งาน"
                            className="admin-icon-btn admin-icon-btn-success"
                          >
                            <RotateCcw className="h-4 w-4" />
                          </button>
                        ) : (
                          // ปิดปุ่มระงับถ้าเป็น ADMIN เพราะ backend ไม่ยอมให้แบนบัญชี ADMIN อยู่แล้ว
                          <button
                            onClick={() => handleSuspend(u)}
                            disabled={busyUserId === u.id || u.role === "ADMIN"}
                            title={
                              u.role === "ADMIN"
                                ? "ไม่สามารถระงับบัญชีผู้ดูแลระบบได้"
                                : "ระงับการใช้งาน"
                            }
                            className="admin-icon-btn admin-icon-btn-danger"
                          >
                            <Ban className="h-4 w-4" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
