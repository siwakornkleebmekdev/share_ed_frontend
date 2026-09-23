import { useState, useEffect, useMemo } from "react";
import { X, Search, Trash2, Gift, Plus } from "lucide-react";
import toast from "react-hot-toast";
import Swal from "sweetalert2";
import { achievementService } from "@/services/achievement.service";
import { getValidImageUrl } from "@/utils/imageUtils";

export default function RewardManagementModal({ isOpen, onClose, onRewardDeleted }) {
  const [rewards, setRewards] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [search, setSearch] = useState("");
  const [busyId, setBusyId] = useState(null);
  const [isCreating, setIsCreating] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [newName, setNewName] = useState("");
  const [newType, setNewType] = useState("FRAME");
  const [newDescription, setNewDescription] = useState("");
  const [newImageFile, setNewImageFile] = useState(null);
  const [newImagePreview, setNewImagePreview] = useState(null);

  useEffect(() => () => {
    if (newImagePreview) URL.revokeObjectURL(newImagePreview);
  }, [newImagePreview]);

  const loadRewards = async () => {
    setIsLoading(true);
    try {
      const items = await achievementService.getRewardItems();
      setRewards(items);
    } catch (error) {
      console.error("Error loading rewards:", error);
      setRewards([]);
      toast.error("ไม่สามารถโหลดรายการของรางวัลได้");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      setSearch("");
      loadRewards();
    }
  }, [isOpen]);

  const filteredRewards = useMemo(() => {
    if (!search.trim()) return rewards;
    const q = search.toLowerCase().trim();
    return rewards.filter(
      (r) =>
        (r.item_name && r.item_name.toLowerCase().includes(q)) ||
        (r.item_type && r.item_type.toLowerCase().includes(q)) ||
        (r.item_description && r.item_description.toLowerCase().includes(q))
    );
  }, [rewards, search]);

  const handleDelete = async (item) => {
    const result = await Swal.fire({
      title: "ลบของรางวัลนี้?",
      text: `คุณต้องการลบ "${item.item_name}" ออกจากระบบหรือไม่? การกระทำนี้ไม่สามารถย้อนกลับได้`,
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#ef4444",
      cancelButtonColor: "#64748b",
      confirmButtonText: "ลบของรางวัล",
      cancelButtonText: "ยกเลิก",
    });

    if (!result.isConfirmed) return;

    setBusyId(item.id);
    try {
      await achievementService.deleteRewardItem(item.id);
      toast.success(`ลบของรางวัล "${item.item_name}" สำเร็จ`);
      setRewards((prev) => prev.filter((r) => String(r.id) !== String(item.id)));
      if (onRewardDeleted) {
        onRewardDeleted(item.id);
      }
    } catch (error) {
      toast.error(
        error?.response?.data?.message || "ไม่สามารถลบของรางวัลนี้ได้"
      );
    } finally {
      setBusyId(null);
    }
  };

  const handleCreate = async (event) => {
    event.preventDefault();
    if (!newName.trim() || !newImageFile || isSubmitting) return;
    setIsSubmitting(true);
    try {
      const created = await achievementService.createRewardItem({
        item_name: newName,
        item_type: newType,
        description: newDescription,
        imageFile: newImageFile,
      });
      if (!created?.id) throw new Error("Backend ไม่ส่งรหัสของรางวัลกลับมา");
      await loadRewards();
      setNewName("");
      setNewDescription("");
      setNewImageFile(null);
      setNewImagePreview(null);
      setIsCreating(false);
      toast.success("เพิ่มของรางวัลสำเร็จ");
    } catch (error) {
      toast.error(error?.response?.data?.message || error.message || "ไม่สามารถเพิ่มของรางวัลได้");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-[130] flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-3xl shadow-2xl w-full max-w-3xl max-h-[85vh] overflow-hidden flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-slate-100 shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="h-9 w-9 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
              <Gift className="h-5 w-5" />
            </div>
            <div>
              <h2 className="font-bold text-slate-800 text-lg">จัดการของรางวัลในระบบ</h2>
              <p className="text-xs text-slate-400">
                รายการของรางวัลทั้งหมด ({rewards.length} ชิ้น) ที่สามารถเลือกผูกกับความสำเร็จได้
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button type="button" onClick={() => setIsCreating((value) => !value)} className="flex items-center gap-1 rounded-xl bg-primary px-3 py-2 text-xs font-bold text-white hover:bg-blue-600"><Plus className="h-4 w-4" /> เพิ่มของรางวัล</button>
            <button type="button" onClick={onClose} aria-label="ปิด" className="p-2 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-50 transition-colors"><X className="h-5 w-5" /></button>
          </div>
        </div>

        {isCreating && (
          <form onSubmit={handleCreate} className="grid gap-3 border-b border-slate-100 bg-slate-50 p-5 sm:grid-cols-2">
            <label className="text-xs font-semibold text-slate-700">ชื่อของรางวัล
              <input required maxLength={100} value={newName} onChange={(e) => setNewName(e.target.value)} className="mt-1 w-full rounded-xl border border-slate-200 bg-white p-2.5 text-sm" />
            </label>
            <label className="text-xs font-semibold text-slate-700">ประเภท
              <select value={newType} onChange={(e) => setNewType(e.target.value)} className="mt-1 w-full rounded-xl border border-slate-200 bg-white p-2.5 text-sm"><option value="FRAME">กรอบโปรไฟล์</option><option value="THEME">ธีม</option></select>
            </label>
            <label className="text-xs font-semibold text-slate-700 sm:col-span-2">คำอธิบาย
              <input value={newDescription} onChange={(e) => setNewDescription(e.target.value)} className="mt-1 w-full rounded-xl border border-slate-200 bg-white p-2.5 text-sm" />
            </label>
            <label className="text-xs font-semibold text-slate-700 sm:col-span-2">ไฟล์ภาพ PNG/APNG, GIF หรือ WebP
              <input required type="file" accept="image/png,image/apng,image/gif,image/webp,.png,.apng,.gif,.webp" onChange={(e) => { const file = e.target.files?.[0] || null; setNewImageFile(file); setNewImagePreview(file ? URL.createObjectURL(file) : null); }} className="mt-1 block w-full text-sm" />
            </label>
            {newImagePreview && <img src={newImagePreview} alt="ตัวอย่างของรางวัลใหม่" className="h-16 w-16 rounded-full object-contain" />}
            <button type="submit" disabled={isSubmitting || !newName.trim() || !newImageFile} className="rounded-xl bg-primary px-4 py-2.5 text-sm font-bold text-white disabled:opacity-50 sm:col-span-2">{isSubmitting ? "กำลังเพิ่ม..." : "บันทึกของรางวัล"}</button>
          </form>
        )}

        {/* Search Bar */}
        <div className="p-6 pb-3 border-b border-slate-100/60 bg-slate-50/50 shrink-0">
          <div className="relative">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="ค้นหาตามชื่อรางวัล หรือประเภท (เช่น FRAME, THEME)..."
              className="w-full pl-10 pr-9 py-2.5 bg-white border border-slate-200 rounded-xl text-xs font-medium focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all text-slate-800 shadow-sm"
            />
            {search && (
              <button
                type="button"
                onClick={() => setSearch("")}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-0.5"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            )}
          </div>
        </div>

        {/* Rewards List Grid */}
        <div className="flex-1 overflow-y-auto p-6">
          {isLoading ? (
            <div className="py-16 text-center text-sm text-slate-400">
              กำลังโหลดรายการของรางวัล...
            </div>
          ) : filteredRewards.length === 0 ? (
            <div className="py-16 text-center text-sm text-slate-400 bg-slate-50 rounded-2xl border border-dashed border-slate-200">
              ไม่พบของรางวัลที่ค้นหา
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {filteredRewards.map((item) => (
                <div
                  key={item.id}
                  className="flex items-center gap-3.5 p-3 rounded-2xl border border-slate-200/80 bg-white hover:border-slate-300 hover:shadow-sm transition-all"
                >
                  {/* Thumbnail / Frame Preview */}
                  <div className="h-14 w-14 rounded-2xl bg-slate-100 border border-slate-200 overflow-hidden shrink-0 relative flex items-center justify-center shadow-inner">
                    {getValidImageUrl(item.image_url) ? (
                      item.item_type === "FRAME" ? (
                        <div className="relative w-11 h-11 rounded-full overflow-hidden bg-slate-200">
                          <img
                            src="https://ui-avatars.com/api/?name=User&background=1e293b&color=38bdf8"
                            alt=""
                            className="w-full h-full object-cover"
                          />
                          <img
                            src={getValidImageUrl(item.image_url)}
                            alt={item.item_name}
                            onError={(e) => { e.currentTarget.style.display = 'none'; }}
                            className="absolute inset-0 w-full h-full object-contain pointer-events-none"
                          />
                        </div>
                      ) : (
                        <img
                          src={getValidImageUrl(item.image_url)}
                          alt={item.item_name}
                          onError={(e) => { e.currentTarget.style.display = 'none'; }}
                          className="w-full h-full object-cover"
                        />
                      )
                    ) : (
                      <Gift className="h-6 w-6 text-slate-400" />
                    )}
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <p className="font-bold text-sm text-slate-800 truncate">
                      {item.item_name}
                    </p>
                    <div className="flex items-center gap-2 mt-1">
                      <span
                        className={`text-[10px] font-extrabold px-2 py-0.5 rounded-full ${
                          item.item_type === "FRAME"
                            ? "bg-amber-100 text-amber-700"
                            : "bg-indigo-100 text-indigo-700"
                        }`}
                      >
                        {item.item_type === "FRAME" ? "กรอบรูป" : item.item_type || "ธีม"}
                      </span>
                      {item.item_description && (
                        <span className="text-xs text-slate-400 truncate">
                          {item.item_description}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Delete Button */}
                  <button
                    type="button"
                    disabled={busyId === item.id}
                    onClick={() => handleDelete(item)}
                    title="ลบของรางวัลนี้"
                    className="p-2.5 rounded-xl text-slate-400 hover:text-red-500 hover:bg-red-50 disabled:opacity-50 transition-colors shrink-0"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-4 border-t border-slate-100 shrink-0 flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2 rounded-xl text-sm font-semibold text-slate-600 hover:bg-slate-100 transition-colors"
          >
            ปิด
          </button>
        </div>
      </div>
    </div>
  );
}
