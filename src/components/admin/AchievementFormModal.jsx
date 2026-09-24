import { useState, useEffect } from "react";
import { X } from "lucide-react";
import toast from "react-hot-toast";
import {
  MILESTONE_TYPES,
  MILESTONE_TYPE_MAP,
  MILESTONE_TYPE_ALIASES,
  getMilestoneTypeInfo,
} from "@/services/achievement.service";
import { getValidImageUrl, convertSvgToPngFile } from "@/utils/imageUtils";

// Modal เพิ่ม/แก้ไขความสำเร็จ (milestone) — โครงสร้างเดียวกับ WidgetModal.jsx
// (มี overlay, ปิดได้ด้วยการคลิก backdrop, พักข้อมูลไว้ใน local state)
// ใช้ modal เดียวทำได้ทั้งเพิ่ม (initialData: null) และแก้ไข (initialData: ข้อมูลความสำเร็จ)
export default function AchievementFormModal({ isOpen, onClose, initialData, onConfirm }) {
  const [title, setTitle] = useState("");
  const [targetValue, setTargetValue] = useState("");
  const [selectedTypeKey, setSelectedTypeKey] = useState("FOLLOWERS_COUNT");
  const [itemName, setItemName] = useState("");
  const [itemType, setItemType] = useState("FRAME");
  const [itemDescription, setItemDescription] = useState("");
  const [isActive, setIsActive] = useState(true);
  const [imageFile, setImageFile] = useState(null);
  const [newImagePreview, setNewImagePreview] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const isEdit = !!initialData;

  useEffect(() => {
    if (!isOpen) return;

    setTitle(initialData?.title ? String(initialData.title).slice(0, 100) : "");
    setTargetValue(initialData?.target_value !== undefined ? String(initialData.target_value) : "");

    const rawType = initialData?.milestone_type || initialData?.achievement_type || "FOLLOWERS_COUNT";
    const resolved = MILESTONE_TYPE_ALIASES[rawType] || rawType;
    setSelectedTypeKey(resolved);

    setItemName("");
    setItemType("FRAME");
    setItemDescription("");
    setIsActive(true);
    setImageFile(null);
    setNewImagePreview(null);
  }, [isOpen, initialData]);

  const effectiveMilestoneType = selectedTypeKey;
  const currentTypeInfo = getMilestoneTypeInfo(effectiveMilestoneType);
  const description = MILESTONE_TYPE_MAP[effectiveMilestoneType]?.achievementDescription
    || initialData?.description
    || currentTypeInfo?.description
    || "";

  if (!isOpen) return null;

  const targetValueNum = Number(targetValue);
  const existingRewardId = initialData?.reward_item_id || initialData?.reward_item?.id;
  const hasNewReward = Boolean(itemName.trim() || imageFile);
  const isValid =
    title.trim() &&
    title.length <= 100 &&
    description.trim() &&
    description.length <= 200 &&
    targetValue !== "" &&
    Number.isInteger(targetValueNum) &&
    targetValueNum > 0 &&
    effectiveMilestoneType &&
    (existingRewardId && !hasNewReward ? true : Boolean(itemName.trim() && imageFile));

  const handleSubmit = async () => {
    if (!isValid || isSubmitting) return;

    const payload = {
      title: title.trim().slice(0, 100),
      description: description.trim().slice(0, 200),
      target_value: targetValueNum,
      milestone_type: effectiveMilestoneType,
      achievement_type: effectiveMilestoneType,
    };

    if (existingRewardId && !hasNewReward) {
      payload.reward_item_id = existingRewardId;
    } else {
      payload.item_name = itemName.trim();
      payload.item_type = itemType;
      payload.item_description = itemDescription.trim() || undefined;
      payload.is_active = isActive;
      payload.imageFile = imageFile;
    }

    setIsSubmitting(true);
    try {
      const saved = await onConfirm(payload);
      if (saved) onClose();
    } finally {
      setIsSubmitting(false);
    }
  };

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
            <label className="flex items-center justify-between text-sm font-semibold text-slate-600 mb-2">
              <span>ชื่อภารกิจ</span>
              <span className={`text-xs font-semibold ${title.length >= 100 ? "text-rose-500" : "text-slate-400"}`}>
                {title.length}/100 ตัวอักษร
              </span>
            </label>
            <input
              type="text"
              maxLength={100}
              value={title}
              onChange={(e) => setTitle(e.target.value.slice(0, 100))}
              className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-4 focus:ring-primary/10 focus:border-primary text-slate-800 font-medium"
                  placeholder="ชื่อภารกิจ"
            />
          </div>

          <div>
            <label className="flex items-center justify-between text-sm font-semibold text-slate-600 mb-2">
              <span>คำอธิบาย</span>
              <span className={`text-xs font-semibold ${description.length >= 200 ? "text-rose-500" : "text-slate-400"}`}>
                {description.length}/200 ตัวอักษร
              </span>
            </label>
            <textarea
              maxLength={200}
              value={description}
              readOnly
              rows={2}
              className="w-full px-4 py-3 bg-slate-100 border border-slate-200 rounded-xl text-slate-700 font-medium resize-none cursor-default"
              aria-label="คำอธิบายที่กำหนดตามประเภทภารกิจ"
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
                onChange={(e) => setSelectedTypeKey(e.target.value)}
                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-4 focus:ring-primary/10 focus:border-primary text-slate-800 font-semibold cursor-pointer"
              >
                {MILESTONE_TYPES.map((t) => (
                  <option key={t.key} value={t.key}>
                    {t.label}
                  </option>
                ))}
                {!MILESTONE_TYPE_MAP[selectedTypeKey] && <option value={selectedTypeKey}>{selectedTypeKey} (ประเภทเดิม)</option>}
              </select>
            </div>
          </div>

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
            {existingRewardId && initialData?.reward_item && (
              <div className="flex items-center gap-3 p-3 mb-3 rounded-xl bg-slate-50 border border-slate-200">
                {getValidImageUrl(initialData.reward_item.image_url) && (
                  <img
                    src={getValidImageUrl(initialData.reward_item.image_url)}
                    alt=""
                    className="h-12 w-12 rounded-full object-contain"
                  />
                )}
                <div>
                  <p className="text-sm font-semibold text-slate-700">{initialData.reward_item.item_name}</p>
                  <p className="text-xs text-slate-500">รางวัลปัจจุบัน · อัปโหลดรูปใหม่เพื่อเปลี่ยนรางวัล</p>
                </div>
              </div>
            )}
            <div className="space-y-3">
                <input
                  type="text"
                  value={itemName}
                  onChange={(e) => setItemName(e.target.value)}
                  placeholder="ชื่อของรางวัล"
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-4 focus:ring-primary/10 focus:border-primary text-slate-800 font-medium"
                />
                <div className="w-full px-4 py-3 bg-slate-100/70 border border-slate-200 rounded-xl text-slate-700 font-medium text-sm flex items-center justify-between select-none">
                  <span className="text-slate-700 font-semibold">กรอบรูป (FRAME)</span>
                  <span className="text-[11px] text-slate-400">ประเภทรางวัล</span>
                </div>
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
                      accept="image/png, image/apng, .apng, image/jpeg, image/webp, image/gif, image/svg+xml, .svg"
                      onChange={async (e) => {
                        const file = e.target.files?.[0] || null;
                        if (!file) {
                          setImageFile(null);
                          setNewImagePreview(null);
                          return;
                        }

                        const isSvg =
                          file.type === "image/svg+xml" ||
                          file.name.toLowerCase().endsWith(".svg");

                        if (isSvg) {
                          try {
                            const converted = await convertSvgToPngFile(file, 512, 512);
                            setImageFile(converted);
                            setNewImagePreview(URL.createObjectURL(converted));
                            toast.success("แปลงไฟล์ SVG เป็นภาพโปร่งใสเรียบร้อย พร้อมใช้งาน!", {
                              icon: "✨",
                            });
                          } catch (err) {
                            console.warn("SVG instant conversion fallback:", err);
                            setImageFile(file);
                            setNewImagePreview(URL.createObjectURL(file));
                          }
                        } else {
                          setImageFile(file);
                          setNewImagePreview(URL.createObjectURL(file));
                        }
                      }}
                      className="w-full text-sm text-slate-600 file:mr-3 file:py-2.5 file:px-4 file:rounded-xl file:border-0 file:bg-primary/10 file:text-primary file:font-bold hover:file:bg-primary/20 transition-all cursor-pointer"
                    />
                  )}
                </div>

                {itemType === "FRAME" && (
                  <p className="text-[11px] text-primary/80 bg-primary/5 p-2.5 rounded-xl font-medium border border-primary/10">
                    💡 แนะนำ <strong>APNG (.png)</strong> สำหรับกรอบเคลื่อนไหว และ PNG ปกติสำหรับกรอบนิ่ง ใช้พื้นหลังโปร่งใส สัดส่วน 1:1 ขนาดประมาณ 288×288 px และไฟล์ไม่เกินประมาณ 1 MB หากใช้ SVG ระบบจะแปลงเป็น PNG ซึ่งทำให้แอนิเมชัน SVG หายไป
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
          </div>
        </div>

        <div className="px-6 py-4 border-t border-slate-100 shrink-0">
          <button
            type="button"
            disabled={!isValid || isSubmitting}
            onClick={handleSubmit}
            className="w-full px-6 py-2.5 rounded-xl font-bold text-sm text-white bg-primary hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed shadow-sm transition-all"
          >
            {isSubmitting ? "กำลังบันทึก..." : isEdit ? "บันทึกการเปลี่ยนแปลง" : "+ เพิ่มความสำเร็จ"}
          </button>
        </div>
      </div>
    </div>
  );
}
