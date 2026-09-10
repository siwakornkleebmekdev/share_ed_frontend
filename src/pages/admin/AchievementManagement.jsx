import { useState, useEffect, useMemo } from "react";
import { Search, Pencil, Trash2, Plus, Gift, Zap, Loader2, Sparkles } from "lucide-react";
import toast from "react-hot-toast";
import Swal from "sweetalert2";
import {
  achievementService,
  getMilestoneTypeInfo,
  getMilestoneTypeLabel,
} from "@/services/achievement.service";
import AchievementFormModal from "@/components/admin/AchievementFormModal";
import RewardManagementModal from "@/components/admin/RewardManagementModal";
import { getValidImageUrl } from "@/utils/imageUtils";

export default function AchievementManagement() {
  const [achievements, setAchievements] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSyncing, setIsSyncing] = useState(false);
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState("ALL");
  const [busyId, setBusyId] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isRewardModalOpen, setIsRewardModalOpen] = useState(false);
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

  const unsyncedCount = useMemo(() => {
    return achievements.filter((a) => a.is_default_template).length;
  }, [achievements]);

  const availableTypes = useMemo(() => {
    return Array.from(
      new Set(
        achievements
          .map((a) => a.milestone_type || a.achievement_type)
          .filter(Boolean),
      ),
    );
  }, [achievements]);

  const filteredAchievements = useMemo(() => {
    const q = search.trim().toLowerCase();
    return achievements.filter((a) => {
      const matchesQuery =
        !q ||
        a.title?.toLowerCase().includes(q) ||
        a.description?.toLowerCase().includes(q);
      const itemType = a.milestone_type || a.achievement_type;
      const matchesType = typeFilter === "ALL" || itemType === typeFilter;
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
        toast.success("บันทึกความสำเร็จเข้าสู่ระบบสำเร็จ");
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

  const handleSyncDefaultAchievements = async () => {
    const unsyncedItems = achievements.filter((a) => a.is_default_template);
    if (unsyncedItems.length === 0) {
      toast.success("ภารกิจทั้งหมดอยู่ในระบบเรียบร้อยแล้ว");
      return;
    }

    const confirmResult = await Swal.fire({
      title: "ซิงค์ภารกิจเริ่มต้นสู่ระบบ?",
      html: `
        <div class="text-left text-sm text-slate-600 space-y-2">
          <p>ระบบจะนำเข้าภารกิจเริ่มต้นจำนวน <b>${unsyncedItems.length}</b> รายการ เข้าสู่ฐานข้อมูลจริงของ Backend</p>
          <p class="text-xs text-slate-400">กรอบรูป SVG ทั้งหมดจะถูกลงทะเบียนในระบบโดยอัตโนมัติ ทำให้สมาชิกสามารถทำภารกิจและปลดล็อกกรอบได้จริง</p>
        </div>
      `,
      icon: "question",
      showCancelButton: true,
      confirmButtonColor: "#2563eb",
      cancelButtonColor: "#64748b",
      confirmButtonText: "⚡ ยืนยันซิงค์ข้อมูล",
      cancelButtonText: "ยกเลิก",
    });

    if (!confirmResult.isConfirmed) return;

    setIsSyncing(true);
    const loadingToast = toast.loading(`กำลังซิงค์ภารกิจ ${unsyncedItems.length} รายการเข้าสู่ระบบ...`);

    try {
      const result = await achievementService.syncDefaultAchievementsToBackend();
      toast.dismiss(loadingToast);

      if (result.count > 0) {
        toast.success(`ซิงค์ภารกิจเริ่มต้น ${result.count} รายการเข้าสู่ระบบเรียบร้อยแล้ว!`, {
          duration: 4000,
        });
      } else {
        toast.info("ภารกิจทั้งหมดอยู่ในระบบเรียบร้อยแล้ว");
      }
      await fetchAchievements();
    } catch (error) {
      toast.dismiss(loadingToast);
      toast.error(error?.response?.data?.message || error?.message || "เกิดข้อผิดพลาดในการซิงค์ข้อมูล");
    } finally {
      setIsSyncing(false);
    }
  };

  const handleDelete = async (achievement) => {
    const isTemplate = !!achievement.is_default_template;
    const result = await Swal.fire({
      title: "ลบความสำเร็จนี้?",
      text: isTemplate
        ? `นำแม่แบบ "${achievement.title}" ออกจากรายการแสดงผล`
        : `"${achievement.title}" จะถูกลบออกจากระบบจริง`,
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
        <div className="flex items-center gap-3 flex-wrap">
          {unsyncedCount > 0 && (
            <button
              type="button"
              disabled={isSyncing}
              onClick={handleSyncDefaultAchievements}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold text-amber-800 bg-amber-50 border border-amber-300 hover:bg-amber-100 shadow-sm transition-all"
              title="นำเข้าภารกิจเริ่มต้นทั้งหมดสู่ฐานข้อมูล Backend"
            >
              {isSyncing ? (
                <Loader2 className="h-4 w-4 animate-spin text-amber-600" />
              ) : (
                <Zap className="h-4 w-4 text-amber-600 fill-amber-500" />
              )}
              <span>ซิงค์ภารกิจเริ่มต้นสู่ระบบ ({unsyncedCount})</span>
            </button>
          )}
          <button
            type="button"
            onClick={() => setIsRewardModalOpen(true)}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold text-slate-700 bg-white border border-slate-200 hover:bg-slate-50 shadow-sm transition-colors"
          >
            <Gift className="h-4 w-4 text-primary" /> จัดการของรางวัล
          </button>
          <button
            type="button"
            onClick={openCreateModal}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl font-bold text-white bg-primary hover:bg-blue-600 shadow-sm transition-colors"
          >
            <Plus className="h-4 w-4" /> เพิ่มความสำเร็จใหม่
          </button>
        </div>
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
          <option value="ALL">ทุกประเภทภารกิจ</option>
          {availableTypes.map((type) => (
            <option key={type} value={type}>
              {getMilestoneTypeLabel(type)}
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
                <th>ประเภทภารกิจ</th>
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
                filteredAchievements.map((a) => {
                  const rawType = a.milestone_type || a.achievement_type;
                  const typeInfo = getMilestoneTypeInfo(rawType);

                  return (
                    <tr key={a.id} className="admin-table-row" onClick={() => openEditModal(a)}>
                      <td>
                        <div className="flex items-center gap-2">
                          <p className="font-bold text-slate-800">{a.title}</p>
                          {a.is_default_template ? (
                            <span
                              className="inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-bold bg-amber-50 text-amber-700 border border-amber-200 shrink-0"
                              title="ภารกิจแม่แบบเริ่มต้น (คลิกแก้ไขเพื่อบันทึกจริง หรือกดปุ่มซิงค์ด้านบน)"
                            >
                              แม่แบบเริ่มต้น
                            </span>
                          ) : (
                            <span
                              className="inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200 shrink-0"
                              title="บันทึกอยู่ในฐานข้อมูลระบบแล้ว"
                            >
                              ในระบบ
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-slate-400 line-clamp-1">{a.description}</p>
                      </td>
                      <td className="text-slate-700">
                        <div className="flex items-baseline gap-1">
                          <span className="font-extrabold text-slate-900 text-sm">
                            {a.target_value}
                          </span>
                          <span className="text-xs font-semibold text-slate-500">
                            {typeInfo?.unit || "หน่วย"}
                          </span>
                        </div>
                      </td>
                      <td>
                        <div className="inline-flex flex-col items-start gap-0.5">
                          <span
                            className={`inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-bold border ${
                              typeInfo?.color || "bg-slate-100 text-slate-700 border-slate-200"
                            }`}
                          >
                            {typeInfo?.shortLabel || rawType}
                          </span>
                          <span className="text-[10px] text-slate-400 font-mono tracking-tight">
                            {rawType}
                          </span>
                        </div>
                      </td>
                    <td className="text-slate-600">
                      {a.reward_item ? (
                        <div className="flex items-center gap-2.5">
                          <div className="h-9 w-9 rounded-xl bg-slate-100 border border-slate-200 overflow-hidden shrink-0 flex items-center justify-center shadow-inner">
                            {getValidImageUrl(a.reward_item.image_url) ? (
                              a.reward_item.item_type === "FRAME" ? (
                                <div className="relative w-7 h-7 rounded-full overflow-hidden bg-slate-200">
                                  <img
                                    src="https://ui-avatars.com/api/?name=User&background=1e293b&color=38bdf8"
                                    alt=""
                                    className="w-full h-full object-cover"
                                  />
                                  <img
                                    src={getValidImageUrl(a.reward_item.image_url)}
                                    alt={a.reward_item.item_name}
                                    onError={(e) => { e.currentTarget.style.display = 'none'; }}
                                    className="absolute inset-0 w-full h-full object-contain pointer-events-none"
                                  />
                                </div>
                              ) : (
                                <img
                                  src={getValidImageUrl(a.reward_item.image_url)}
                                  alt={a.reward_item.item_name}
                                  onError={(e) => { e.currentTarget.style.display = 'none'; }}
                                  className="w-full h-full object-cover"
                                />
                              )
                            ) : (
                              <Gift className="h-4 w-4 text-slate-400" />
                            )}
                          </div>
                          <div className="min-w-0">
                            <p className="font-semibold text-xs text-slate-800 truncate max-w-[150px]">
                              {a.reward_item.item_name}
                            </p>
                            <span
                              className={`inline-block text-[9px] font-extrabold px-1.5 py-0.2 rounded-full ${
                                a.reward_item.item_type === "FRAME"
                                  ? "bg-amber-100 text-amber-700"
                                  : "bg-indigo-100 text-indigo-700"
                              }`}
                            >
                              {a.reward_item.item_type === "FRAME" ? "กรอบรูป" : a.reward_item.item_type || "ของรางวัล"}
                            </span>
                          </div>
                        </div>
                      ) : (
                        <span className="text-xs text-slate-400 italic">ไม่มีรางวัล</span>
                      )}
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
                );
              })
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

      <RewardManagementModal
        isOpen={isRewardModalOpen}
        onClose={() => setIsRewardModalOpen(false)}
        onRewardDeleted={() => fetchAchievements()}
      />
    </div>
  );
}
