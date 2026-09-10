import { useState, useEffect, useMemo } from "react";
import { X, Search, Check, Sparkles, Gift, Trash2 } from "lucide-react";
import toast from "react-hot-toast";
import Swal from "sweetalert2";
import {
  achievementService,
  MILESTONE_TYPES,
  MILESTONE_TYPE_MAP,
  MILESTONE_TYPE_ALIASES,
  getMilestoneTypeInfo,
} from "@/services/achievement.service";
import { getValidImageUrl } from "@/utils/imageUtils";

const REWARD_MODES = { NONE: "NONE", EXISTING: "EXISTING", NEW: "NEW" };

// Modal เพิ่ม/แก้ไขความสำเร็จ (milestone) — โครงสร้างเดียวกับ WidgetModal.jsx
// (มี overlay, ปิดได้ด้วยการคลิก backdrop, พักข้อมูลไว้ใน local state)
// ใช้ modal เดียวทำได้ทั้งเพิ่ม (initialData: null) และแก้ไข (initialData: ข้อมูลความสำเร็จ)
export default function AchievementFormModal({ isOpen, onClose, initialData, onConfirm }) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [targetValue, setTargetValue] = useState("");
  const [selectedTypeKey, setSelectedTypeKey] = useState("FOLLOWERS_COUNT");
  const [customType, setCustomType] = useState("");

  const [rewardMode, setRewardMode] = useState(REWARD_MODES.NONE);
  const [rewardItems, setRewardItems] = useState([]);
  const [rewardItemId, setRewardItemId] = useState("");
  const [rewardSearch, setRewardSearch] = useState("");

  const [itemName, setItemName] = useState("");
  const [itemType, setItemType] = useState("FRAME");
  const [itemDescription, setItemDescription] = useState("");
  const [isActive, setIsActive] = useState(true);
  const [imageFile, setImageFile] = useState(null);
  const [newImagePreview, setNewImagePreview] = useState(null);

  const isEdit = !!initialData;
  const hadExistingReward = !!(initialData?.reward_item_id || initialData?.reward_item);

  useEffect(() => {
    if (!isOpen) return;

    setTitle(initialData?.title || "");
    setDescription(initialData?.description || "");
    setTargetValue(initialData?.target_value !== undefined ? String(initialData.target_value) : "");

    const rawType = initialData?.milestone_type || initialData?.achievement_type || "FOLLOWERS_COUNT";
    const resolved = MILESTONE_TYPE_ALIASES[rawType] || rawType;
    if (MILESTONE_TYPE_MAP[resolved]) {
      setSelectedTypeKey(resolved);
      setCustomType("");
    } else {
      setSelectedTypeKey("CUSTOM");
      setCustomType(rawType);
    }

    const existingRewardId = initialData?.reward_item_id || initialData?.reward_item?.id || "";
    setRewardMode(existingRewardId ? REWARD_MODES.EXISTING : REWARD_MODES.NONE);
    setRewardItemId(existingRewardId);

    setItemName("");
    setItemType("FRAME");
    setItemDescription("");
    setIsActive(true);
    setImageFile(null);
    setNewImagePreview(null);
    setRewardSearch("");

    achievementService.getRewardItems().then((items) => {
      setRewardItems(items);
      // เผื่อรางวัลที่ผูกไว้อยู่แล้วยังไม่เคยโผล่ใน milestone list ที่โหลดมา
      // ให้ใส่เพิ่มเข้าไปเป็นตัวเลือกด้วย จะได้ไม่หายไปจาก dropdown
      if (initialData?.reward_item && !items.some((i) => i.id === initialData.reward_item.id)) {
        setRewardItems([initialData.reward_item, ...items]);
      }
    });
  }, [isOpen, initialData]);

  const effectiveMilestoneType = selectedTypeKey === "CUSTOM" ? customType.trim() : selectedTypeKey;
  const currentTypeInfo = getMilestoneTypeInfo(effectiveMilestoneType);

  const selectedReward = useMemo(() => {
    return rewardItems.find((item) => String(item.id) === String(rewardItemId)) || null;
  }, [rewardItems, rewardItemId]);

  const filteredRewards = useMemo(() => {
    if (!rewardSearch.trim()) return rewardItems;
    const q = rewardSearch.toLowerCase().trim();
    return rewardItems.filter(
      (item) =>
        (item.item_name && item.item_name.toLowerCase().includes(q)) ||
        (item.item_type && item.item_type.toLowerCase().includes(q)) ||
        (item.item_description && item.item_description.toLowerCase().includes(q))
    );
  }, [rewardItems, rewardSearch]);

  if (!isOpen) return null;

  const targetValueNum = Number(targetValue);
  const isValid =
    title.trim() &&
    description.trim() &&
    targetValue !== "" &&
    Number.isInteger(targetValueNum) &&
    targetValueNum > 0 &&
    effectiveMilestoneType &&
    (rewardMode !== REWARD_MODES.EXISTING || rewardItemId) &&
    (rewardMode !== REWARD_MODES.NEW || itemName.trim());

  const handleSubmit = () => {
    if (!isValid) return;

    const payload = {
      title: title.trim(),
      description: description.trim(),
      target_value: targetValueNum,
      milestone_type: effectiveMilestoneType,
      achievement_type: effectiveMilestoneType,
    };

    if (rewardMode === REWARD_MODES.EXISTING) {
      payload.reward_item_id = rewardItemId;
    } else if (rewardMode === REWARD_MODES.NEW) {
      payload.item_name = itemName.trim();
      payload.item_type = itemType;
      payload.item_description = itemDescription.trim() || undefined;
      payload.is_active = isActive;
      payload.imageFile = imageFile;
    }

    onConfirm(payload);
    onClose();
  };

  const handleDeleteReward = async (item, e) => {
    if (e) e.stopPropagation();
    if (!item) return;

    const result = await Swal.fire({
      title: "ลบของรางวัลนี้?",
      text: `คุณต้องการลบ "${item.item_name}" หรือไม่? การกระทำนี้ไม่สามารถย้อนกลับได้`,
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#ef4444",
      cancelButtonColor: "#64748b",
      confirmButtonText: "ลบของรางวัล",
      cancelButtonText: "ยกเลิก",
    });

    if (!result.isConfirmed) return;

    try {
      await achievementService.deleteRewardItem(item.id);
      toast.success(`ลบของรางวัล "${item.item_name}" สำเร็จ`);

      if (String(rewardItemId) === String(item.id)) {
        setRewardItemId("");
      }

      setRewardItems((prev) => prev.filter((r) => String(r.id) !== String(item.id)));
    } catch (error) {
      toast.error(
        error?.response?.data?.message || "ไม่สามารถลบของรางวัลนี้ได้"
      );
    }
  };

  const modeButtonClass = (mode) =>
    `flex-1 py-2 rounded-lg text-xs font-bold transition-colors ${
      rewardMode === mode
        ? "bg-primary text-white"
        : "bg-slate-50 text-slate-600 hover:bg-slate-100"
    }`;

  return (
    <div
      className="fixed inset-0 z-[120] flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-3xl shadow-2xl w-full max-w-2xl max-h-[85vh] overflow-hidden flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-6 py-5 border-b border-slate-100 shrink-0">
          <h2 className="font-bold text-slate-800 text-lg">
            {isEdit ? "แก้ไข" : "เพิ่ม"}ความสำเร็จ
          </h2>
          <button
            onClick={onClose}
            className="p-2 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-50 transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          <div>
            <label className="block text-sm font-semibold text-slate-600 mb-2">ชื่อภารกิจ</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-4 focus:ring-primary/10 focus:border-primary text-slate-800 font-medium"
              placeholder="เช่น นักเรียนดีเด่น"
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-slate-600 mb-2">คำอธิบาย</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={2}
              className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-4 focus:ring-primary/10 focus:border-primary text-slate-800 font-medium resize-none"
              placeholder="เงื่อนไขการปลดล็อกภารกิจนี้"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2">
                เป้าหมายที่ต้องทำให้สำเร็จ <span className="text-red-500">*</span>
              </label>
              <div className="relative flex items-center">
                <input
                  type="number"
                  min={1}
                  value={targetValue}
                  onChange={(e) => setTargetValue(e.target.value)}
                  className="w-full px-4 py-3 pr-16 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-4 focus:ring-primary/10 focus:border-primary text-slate-800 font-bold"
                  placeholder={currentTypeInfo?.placeholder || "เช่น 10"}
                />
                <span className="absolute right-3 px-2.5 py-1 text-xs font-bold text-slate-600 bg-slate-200/80 rounded-lg pointer-events-none">
                  {currentTypeInfo?.unit || "หน่วย"}
                </span>
              </div>
            </div>
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2">
                ประเภทภารกิจ (เงื่อนไขความสำเร็จ) <span className="text-red-500">*</span>
              </label>
              <select
                value={selectedTypeKey}
                onChange={(e) => {
                  setSelectedTypeKey(e.target.value);
                  if (e.target.value !== "CUSTOM") {
                    setCustomType("");
                  }
                }}
                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-4 focus:ring-primary/10 focus:border-primary text-slate-800 font-semibold cursor-pointer"
              >
                {MILESTONE_TYPES.map((t) => (
                  <option key={t.key} value={t.key}>
                    {t.label}
                  </option>
                ))}
                <option value="CUSTOM">⚙️ กำหนดประเภทเอง (Custom Type)</option>
              </select>
            </div>
          </div>

          {selectedTypeKey === "CUSTOM" && (
            <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl">
              <label className="block text-xs font-semibold text-slate-600 mb-1.5">
                ระบุรหัสประเภทภารกิจ (ภาษาอังกฤษ เช่น SHARE_COUNT, QUIZ_PASSED)
              </label>
              <input
                type="text"
                value={customType}
                onChange={(e) => setCustomType(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-white border border-slate-300 rounded-lg text-sm text-slate-800 font-medium focus:outline-none focus:border-primary"
                placeholder="เช่น SHARE_COUNT"
              />
            </div>
          )}

          {/* กล่องอธิบายเงื่อนไขภารกิจให้เข้าใจง่าย */}
          <div className="p-3.5 bg-blue-50/80 border border-blue-100 rounded-xl flex items-start gap-2.5 text-xs text-blue-950 leading-relaxed">
            <span className="text-base leading-none mt-0.5">💡</span>
            <div>
              <span className="font-bold text-blue-900">การทำงานของระบบ:</span>{" "}
              {currentTypeInfo?.description}
              {targetValue && (
                <div className="mt-1 font-semibold text-blue-800">
                  🎯 สมาชิกจะปลดล็อกสำเร็จเมื่อทำครบ:{" "}
                  <span className="underline decoration-blue-400 font-extrabold text-blue-950">
                    {targetValue} {currentTypeInfo?.unit || "หน่วย"}
                  </span>
                </div>
              )}
            </div>
          </div>

          <div className="pt-2 border-t border-slate-100">
            <label className="block text-sm font-semibold text-slate-600 mb-2">รางวัล</label>
            <div className="flex gap-2 mb-3">
              <button type="button" className={modeButtonClass(REWARD_MODES.NONE)} onClick={() => setRewardMode(REWARD_MODES.NONE)}>
                ไม่มีรางวัล
              </button>
              <button type="button" className={modeButtonClass(REWARD_MODES.EXISTING)} onClick={() => setRewardMode(REWARD_MODES.EXISTING)}>
                เลือกที่มีอยู่
              </button>
              <button type="button" className={modeButtonClass(REWARD_MODES.NEW)} onClick={() => setRewardMode(REWARD_MODES.NEW)}>
                สร้างใหม่
              </button>
            </div>

            {isEdit && hadExistingReward && rewardMode === REWARD_MODES.NONE && (
              <p className="text-xs text-amber-600 bg-amber-50 rounded-lg p-2.5 mb-3">
                หมายเหตุ: ระบบยังไม่รองรับการลบรางวัลที่ผูกไว้แล้วออกผ่านฟอร์มนี้ (สามารถเปลี่ยนเป็นรางวัลอื่นได้)
              </p>
            )}

            {rewardMode === REWARD_MODES.EXISTING && (
              <div className="space-y-3">
                {/* Selected Reward Summary (if chosen) */}
                {selectedReward && (
                  <div className="flex items-center gap-3.5 p-3 rounded-2xl bg-primary/5 border-2 border-primary shadow-sm">
                    <div className="h-14 w-14 rounded-xl bg-white border border-slate-200 overflow-hidden shrink-0 relative flex items-center justify-center shadow-inner">
                      {getValidImageUrl(selectedReward.image_url) ? (
                        selectedReward.item_type === "FRAME" ? (
                          <div className="relative w-11 h-11 rounded-full overflow-hidden bg-slate-100">
                            <img
                              src="https://ui-avatars.com/api/?name=User&background=1e293b&color=38bdf8"
                              alt=""
                              className="w-full h-full object-cover"
                            />
                            <img
                              src={getValidImageUrl(selectedReward.image_url)}
                              alt={selectedReward.item_name}
                              onError={(e) => { e.currentTarget.style.display = 'none'; }}
                              className="absolute inset-0 w-full h-full object-contain pointer-events-none"
                            />
                          </div>
                        ) : (
                          <img
                            src={getValidImageUrl(selectedReward.image_url)}
                            alt={selectedReward.item_name}
                            onError={(e) => { e.currentTarget.style.display = 'none'; }}
                            className="w-full h-full object-cover"
                          />
                        )
                      ) : (
                        <Gift className="h-6 w-6 text-primary" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-slate-800 text-sm truncate">
                          {selectedReward.item_name}
                        </span>
                        <span
                          className={`text-[10px] font-extrabold px-2 py-0.5 rounded-full ${
                            selectedReward.item_type === "FRAME"
                              ? "bg-amber-100 text-amber-700"
                              : "bg-indigo-100 text-indigo-700"
                          }`}
                        >
                          {selectedReward.item_type === "FRAME" ? "กรอบรูป" : "ธีม"}
                        </span>
                      </div>
                      <p className="text-xs text-slate-500 truncate mt-0.5">
                        {selectedReward.item_description || "ของรางวัลที่ผูกกับภารกิจนี้"}
                      </p>
                    </div>
                    <div className="flex items-center gap-1 shrink-0">
                      <button
                        type="button"
                        onClick={(e) => handleDeleteReward(selectedReward, e)}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-red-500 hover:bg-red-50 transition-colors"
                        title="ลบของรางวัลนี้ออกจากระบบ"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                      <button
                        type="button"
                        onClick={() => setRewardItemId("")}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
                        title="ยกเลิกการเลือกรางวัล"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                )}

                {/* Search Bar */}
                <div className="relative">
                  <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                  <input
                    type="text"
                    value={rewardSearch}
                    onChange={(e) => setRewardSearch(e.target.value)}
                    placeholder="ค้นหาของรางวัลจากชื่อหรือประเภท..."
                    className="w-full pl-10 pr-9 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all text-slate-800"
                  />
                  {rewardSearch && (
                    <button
                      type="button"
                      onClick={() => setRewardSearch("")}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-0.5"
                    >
                      <X className="h-3.5 w-3.5" />
                    </button>
                  )}
                </div>

                {/* Visual Reward Cards Grid */}
                <div className="max-h-60 overflow-y-auto pr-1 grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  {filteredRewards.length === 0 ? (
                    <div className="col-span-full py-8 text-center text-xs text-slate-400 bg-slate-50 rounded-2xl border border-dashed border-slate-200">
                      ไม่พบของรางวัลที่ค้นหา
                    </div>
                  ) : (
                    filteredRewards.map((item) => {
                      const isSelected = rewardItemId === item.id;
                      return (
                        <div
                          key={item.id}
                          role="button"
                          tabIndex={0}
                          onClick={() => setRewardItemId(item.id)}
                          className={`group flex items-center gap-3 p-2.5 rounded-2xl border-2 transition-all text-left cursor-pointer ${
                            isSelected
                              ? "border-primary bg-primary/5 ring-1 ring-primary/30 shadow-sm"
                              : "border-slate-100 hover:border-slate-200 bg-white hover:bg-slate-50/70"
                          }`}
                        >
                          {/* Thumbnail / Frame Preview */}
                          <div className="h-12 w-12 rounded-xl bg-slate-100 border border-slate-200 overflow-hidden shrink-0 relative flex items-center justify-center shadow-inner">
                            {getValidImageUrl(item.image_url) ? (
                              item.item_type === "FRAME" ? (
                                <div className="relative w-9 h-9 rounded-full overflow-hidden bg-slate-200">
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
                              <Gift className="h-5 w-5 text-slate-400" />
                            )}
                          </div>

                          <div className="flex-1 min-w-0">
                            <p className="font-bold text-xs text-slate-800 truncate">
                              {item.item_name}
                            </p>
                            <div className="flex items-center gap-1.5 mt-1">
                              <span
                                className={`text-[9px] font-extrabold px-1.5 py-0.5 rounded-full ${
                                  item.item_type === "FRAME"
                                    ? "bg-amber-100 text-amber-700"
                                    : "bg-indigo-100 text-indigo-700"
                                }`}
                              >
                                {item.item_type === "FRAME" ? "กรอบรูป" : "ธีม"}
                              </span>
                              {item.item_description && (
                                <span className="text-[10px] text-slate-400 truncate">
                                  {item.item_description}
                                </span>
                              )}
                            </div>
                          </div>

                          {/* Action Buttons: Delete & Selection indicator */}
                          <div
                            className="flex items-center gap-1.5 shrink-0"
                            onClick={(e) => e.stopPropagation()}
                          >
                            <button
                              type="button"
                              onClick={(e) => handleDeleteReward(item, e)}
                              title="ลบของรางวัลนี้ออกจากระบบ"
                              className="p-1.5 rounded-lg text-slate-300 hover:text-red-500 hover:bg-red-50 transition-colors opacity-70 group-hover:opacity-100"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                            <div
                              onClick={() => setRewardItemId(item.id)}
                              className="cursor-pointer"
                            >
                              {isSelected ? (
                                <div className="h-5 w-5 rounded-full bg-primary text-white flex items-center justify-center shrink-0 shadow-sm">
                                  <Check className="h-3 w-3 stroke-[3]" />
                                </div>
                              ) : (
                                <div className="h-5 w-5 rounded-full border-2 border-slate-200 shrink-0" />
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>
            )}

            {rewardMode === REWARD_MODES.NEW && (
              <div className="space-y-3">
                <input
                  type="text"
                  value={itemName}
                  onChange={(e) => setItemName(e.target.value)}
                  placeholder="ชื่อรางวัล เช่น กรอบทอง"
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-4 focus:ring-primary/10 focus:border-primary text-slate-800 font-medium"
                />
                <select
                  value={itemType}
                  onChange={(e) => setItemType(e.target.value)}
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-4 focus:ring-primary/10 focus:border-primary text-slate-800 font-medium"
                >
                  <option value="FRAME">FRAME (กรอบรูป)</option>
                  <option value="THEME">THEME (ธีม)</option>
                </select>
                <input
                  type="text"
                  value={itemDescription}
                  onChange={(e) => setItemDescription(e.target.value)}
                  placeholder="คำอธิบายรางวัล (ไม่บังคับ)"
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-4 focus:ring-primary/10 focus:border-primary text-slate-800 font-medium"
                />

                {/* Upload Image with Live Preview */}
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1.5">
                    รูปภาพของรางวัล
                  </label>
                  {newImagePreview ? (
                    <div className="flex items-center gap-3.5 p-3 bg-slate-50 rounded-2xl border border-slate-200">
                      <div className="h-14 w-14 rounded-xl overflow-hidden border border-slate-200 bg-white shrink-0 relative flex items-center justify-center shadow-inner">
                        {itemType === "FRAME" ? (
                          <div className="relative w-11 h-11 rounded-full overflow-hidden bg-slate-100">
                            <img
                              src="https://ui-avatars.com/api/?name=User&background=1e293b&color=38bdf8"
                              alt=""
                              className="w-full h-full object-cover"
                            />
                            <img
                              src={newImagePreview}
                              alt="Preview"
                              className="absolute inset-0 w-full h-full object-cover pointer-events-none"
                            />
                          </div>
                        ) : (
                          <img
                            src={newImagePreview}
                            alt="Preview"
                            className="w-full h-full object-cover"
                          />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-bold text-slate-800 truncate">
                          {imageFile?.name}
                        </p>
                        <p className="text-[11px] text-slate-400 mt-0.5">
                          {(imageFile?.size / 1024).toFixed(1)} KB
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          setImageFile(null);
                          setNewImagePreview(null);
                        }}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-red-500 hover:bg-red-50 transition-colors"
                        title="ลบรูปที่เลือก"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    </div>
                  ) : (
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) => {
                        const file = e.target.files?.[0] || null;
                        setImageFile(file);
                        if (file) {
                          setNewImagePreview(URL.createObjectURL(file));
                        } else {
                          setNewImagePreview(null);
                        }
                      }}
                      className="w-full text-sm text-slate-600 file:mr-3 file:py-2.5 file:px-4 file:rounded-xl file:border-0 file:bg-primary/10 file:text-primary file:font-bold hover:file:bg-primary/20 transition-all cursor-pointer"
                    />
                  )}
                </div>

                {itemType === "FRAME" && (
                  <p className="text-[11px] text-primary/80 bg-primary/5 p-2.5 rounded-xl font-medium border border-primary/10">
                    💡 เคล็ดลับ: รองรับไฟล์ภาพ <strong>.gif</strong>, <strong>.svg</strong>, <strong>.png</strong> หรือ <strong>.webp</strong> ที่มีพื้นหลังโปร่งใส (Transparent) สัดส่วน 1:1
                  </p>
                )}
                <label className="flex items-center justify-between bg-slate-50 border border-slate-200 rounded-xl p-4 cursor-pointer">
                  <div>
                    <p className="font-bold text-slate-700 text-sm">เปิดใช้งานรางวัลนี้</p>
                    <p className="text-xs text-slate-500">is_active</p>
                  </div>
                  <button
                    type="button"
                    role="switch"
                    aria-checked={isActive}
                    onClick={() => setIsActive((v) => !v)}
                    className={`relative h-6 w-11 rounded-full transition-colors shrink-0 ${isActive ? "bg-primary" : "bg-slate-300"}`}
                  >
                    <span
                      className={`absolute top-0.5 left-0.5 h-5 w-5 bg-white rounded-full shadow transition-transform ${isActive ? "translate-x-5" : "translate-x-0"}`}
                    />
                  </button>
                </label>
              </div>
            )}
          </div>
        </div>

        <div className="px-6 py-4 border-t border-slate-100 shrink-0">
          <button
            type="button"
            disabled={!isValid}
            onClick={handleSubmit}
            className="w-full px-6 py-2.5 rounded-xl font-bold text-sm text-white bg-primary hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed shadow-sm transition-all"
          >
            {isEdit ? "บันทึกการเปลี่ยนแปลง" : "+ เพิ่มความสำเร็จ"}
          </button>
        </div>
      </div>
    </div>
  );
}
