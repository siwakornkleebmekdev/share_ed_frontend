import { useState, useEffect, useMemo } from "react";
import { Search, Pencil, Trash2, Plus } from "lucide-react";
import toast from "react-hot-toast";
import Swal from "sweetalert2";
import { achievementService } from "@/services/achievement.service";
import AchievementFormModal from "@/components/admin/AchievementFormModal";

export default function AchievementManagement() {
  const [achievements, setAchievements] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState("ALL");
  const [busyId, setBusyId] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingAchievement, setEditingAchievement] = useState(null);

  const fetchAchievements = async () => {
    setIsLoading(true);
    try {
      const data = await achievementService.getAllAchievements();
      setAchievements(Array.isArray(data) ? data : []);
    } catch (error) {
      toast.error(
        error?.response?.data?.message || "ไม่สามารถโหลดรายการความสำเร็จได้",
      );
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchAchievements();
  }, []);

  const availableTypes = useMemo(() => {
    return Array.from(new Set(achievements.map((a) => a.milestone_type).filter(Boolean)));
  }, [achievements]);

  const filteredAchievements = useMemo(() => {
    const q = search.trim().toLowerCase();
    return achievements.filter((a) => {
      const matchesQuery =
        !q ||
        a.title?.toLowerCase().includes(q) ||
        a.description?.toLowerCase().includes(q);
      const matchesType = typeFilter === "ALL" || a.milestone_type === typeFilter;
      return matchesQuery && matchesType;
    });
  }, [achievements, search, typeFilter]);

  const openCreateModal = () => {
    setEditingAchievement(null);
    setIsModalOpen(true);
  };

  const openEditModal = (achievement) => {
    setEditingAchievement(achievement);
    setIsModalOpen(true);
  };

  const handleModalConfirm = async (payload) => {
    try {
      if (editingAchievement) {
        await achievementService.updateAchievement(editingAchievement.id, payload);
        toast.success("แก้ไขความสำเร็จสำเร็จ");
      } else {
        await achievementService.createAchievement(payload);
        toast.success("เพิ่มความสำเร็จสำเร็จ");
      }
      await fetchAchievements();
    } catch (error) {
      toast.error(
        error?.response?.data?.message || "ไม่สามารถบันทึกความสำเร็จได้",
      );
    }
  };

  const handleDelete = async (achievement) => {
    const result = await Swal.fire({
      title: "ลบความสำเร็จนี้?",
      text: `"${achievement.title}" จะถูกลบออกจากระบบ`,
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#ef4444",
      cancelButtonColor: "#64748b",
      confirmButtonText: "ลบเลย",
      cancelButtonText: "ยกเลิก",
    });
    if (!result.isConfirmed) return;

    setBusyId(achievement.id);
    try {
      await achievementService.deleteAchievement(achievement.id);
      toast.success("ลบความสำเร็จสำเร็จ");
      await fetchAchievements();
    } catch (error) {
      // Backend blocks deletion when users already have progress on this
      // milestone — surface that exact message rather than a generic one.
      toast.error(
        error?.response?.data?.message || "ไม่สามารถลบความสำเร็จนี้ได้",
      );
    } finally {
      setBusyId(null);
    }
  };

  return (
    <div className="max-w-6xl space-y-6">
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="admin-page-title">จัดการความสำเร็จ</h1>
          <p className="admin-page-subtitle">
            สร้าง แก้ไข และลบภารกิจ/ความสำเร็จที่ผู้ใช้งานสามารถปลดล็อกได้
          </p>
        </div>
        <button
          onClick={openCreateModal}
          className="flex items-center gap-2 px-5 py-2.5 rounded-xl font-bold text-white bg-primary hover:bg-blue-600 shadow-sm transition-colors"
        >
          <Plus className="h-4 w-4" /> เพิ่มความสำเร็จใหม่
        </button>
      </div>

      <div className="admin-filter-bar">
        <div className="relative flex-1">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="ค้นหาด้วยชื่อหรือคำอธิบาย"
            className="admin-input"
          />
        </div>
        <select
          value={typeFilter}
          onChange={(e) => setTypeFilter(e.target.value)}
          className="admin-select"
        >
          <option value="ALL">ทุกประเภท</option>
          {availableTypes.map((type) => (
            <option key={type} value={type}>
              {type}
            </option>
          ))}
        </select>
      </div>

      <div className="admin-table-card">
        <div className="overflow-x-auto">
          <table className="admin-table">
            <thead>
              <tr>
                <th>ชื่อภารกิจ</th>
                <th>เป้าหมาย</th>
                <th>ประเภท</th>
                <th>รางวัล</th>
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
              ) : filteredAchievements.length === 0 ? (
                <tr>
                  <td colSpan={5} className="admin-table-empty">
                    ไม่พบความสำเร็จที่ตรงกับเงื่อนไข
                  </td>
                </tr>
              ) : (
                filteredAchievements.map((a) => (
                  <tr key={a.id} className="admin-table-row" onClick={() => openEditModal(a)}>
                    <td>
                      <p className="font-bold text-slate-800">{a.title}</p>
                      <p className="text-xs text-slate-400 line-clamp-1">{a.description}</p>
                    </td>
                    <td className="text-slate-500">{a.target_value}</td>
                    <td>
                      <span className="admin-badge admin-badge-default">
                        {a.milestone_type}
                      </span>
                    </td>
                    <td className="text-slate-500">
                      {a.reward_item?.item_name || "ไม่มีรางวัล"}
                    </td>
                    <td onClick={(e) => e.stopPropagation()}>
                      <div className="flex justify-end gap-2">
                        <button
                          onClick={() => openEditModal(a)}
                          disabled={busyId === a.id}
                          title="แก้ไข"
                          className="admin-icon-btn text-slate-500 hover:bg-slate-100"
                        >
                          <Pencil className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(a)}
                          disabled={busyId === a.id}
                          title="ลบ"
                          className="admin-icon-btn admin-icon-btn-danger"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      <AchievementFormModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        initialData={editingAchievement}
        onConfirm={handleModalConfirm}
      />
    </div>
  );
}
