import { useState, useEffect } from "react";
import { X } from "lucide-react";
import { achievementService, SUGGESTED_MILESTONE_TYPES } from "@/services/achievement.service";

const REWARD_MODES = { NONE: "NONE", EXISTING: "EXISTING", NEW: "NEW" };

// Modal เพิ่ม/แก้ไขความสำเร็จ (milestone) — โครงสร้างเดียวกับ WidgetModal.jsx
// (มี overlay, ปิดได้ด้วยการคลิก backdrop, พักข้อมูลไว้ใน local state)
// ใช้ modal เดียวทำได้ทั้งเพิ่ม (initialData: null) และแก้ไข (initialData: ข้อมูลความสำเร็จ)
export default function AchievementFormModal({ isOpen, onClose, initialData, onConfirm }) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [targetValue, setTargetValue] = useState("");
  const [milestoneType, setMilestoneType] = useState("");

  const [rewardMode, setRewardMode] = useState(REWARD_MODES.NONE);
  const [rewardItems, setRewardItems] = useState([]);
  const [rewardItemId, setRewardItemId] = useState("");

  const [itemName, setItemName] = useState("");
  const [itemType, setItemType] = useState("FRAME");
  const [itemDescription, setItemDescription] = useState("");
  const [isActive, setIsActive] = useState(true);
  const [imageFile, setImageFile] = useState(null);

  const isEdit = !!initialData;
  const hadExistingReward = !!(initialData?.reward_item_id || initialData?.reward_item);

  useEffect(() => {
    if (!isOpen) return;

    setTitle(initialData?.title || "");
    setDescription(initialData?.description || "");
    setTargetValue(initialData?.target_value ?? "");
    setMilestoneType(initialData?.milestone_type || "");

    const existingRewardId = initialData?.reward_item_id || initialData?.reward_item?.id || "";
    setRewardMode(existingRewardId ? REWARD_MODES.EXISTING : REWARD_MODES.NONE);
    setRewardItemId(existingRewardId);

    setItemName("");
    setItemType("FRAME");
    setItemDescription("");
    setIsActive(true);
    setImageFile(null);

    achievementService.getRewardItems().then((items) => {
      setRewardItems(items);
      // เผื่อรางวัลที่ผูกไว้อยู่แล้วยังไม่เคยโผล่ใน milestone list ที่โหลดมา
      // ให้ใส่เพิ่มเข้าไปเป็นตัวเลือกด้วย จะได้ไม่หายไปจาก dropdown
      if (initialData?.reward_item && !items.some((i) => i.id === initialData.reward_item.id)) {
        setRewardItems([initialData.reward_item, ...items]);
      }
    });
  }, [isOpen, initialData]);

  if (!isOpen) return null;

  const targetValueNum = Number(targetValue);
  const isValid =
    title.trim() &&
    description.trim() &&
    targetValue !== "" &&
    Number.isInteger(targetValueNum) &&
    targetValueNum > 0 &&
    milestoneType.trim() &&
    (rewardMode !== REWARD_MODES.EXISTING || rewardItemId) &&
    (rewardMode !== REWARD_MODES.NEW || itemName.trim());

  const handleSubmit = () => {
    if (!isValid) return;

    const payload = {
      title: title.trim(),
      description: description.trim(),
      target_value: targetValueNum,
      milestone_type: milestoneType.trim(),
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
              <label className="block text-sm font-semibold text-slate-600 mb-2">เป้าหมาย</label>
              <input
                type="number"
                min={1}
                value={targetValue}
                onChange={(e) => setTargetValue(e.target.value)}
                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-4 focus:ring-primary/10 focus:border-primary text-slate-800 font-medium"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-slate-600 mb-2">
                ประเภทภารกิจ (milestone_type)
              </label>
              <input
                type="text"
                list="milestone-type-suggestions"
                value={milestoneType}
                onChange={(e) => setMilestoneType(e.target.value)}
                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-4 focus:ring-primary/10 focus:border-primary text-slate-800 font-medium"
                placeholder="เช่น FOLLOWERS_COUNT"
              />
              <datalist id="milestone-type-suggestions">
                {SUGGESTED_MILESTONE_TYPES.map((t) => (
                  <option key={t} value={t} />
                ))}
              </datalist>
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
              <select
                value={rewardItemId}
                onChange={(e) => setRewardItemId(e.target.value)}
                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-4 focus:ring-primary/10 focus:border-primary text-slate-800 font-medium"
              >
                <option value="">-- เลือกรางวัล --</option>
                {rewardItems.map((item) => (
                  <option key={item.id} value={item.id}>
                    {item.item_name} ({item.item_type})
                  </option>
                ))}
              </select>
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
                  <option value="FRAME">FRAME</option>
                  <option value="THEME">THEME</option>
                </select>
                <input
                  type="text"
                  value={itemDescription}
                  onChange={(e) => setItemDescription(e.target.value)}
                  placeholder="คำอธิบายรางวัล (ไม่บังคับ)"
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-4 focus:ring-primary/10 focus:border-primary text-slate-800 font-medium"
                />
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => setImageFile(e.target.files?.[0] || null)}
                  className="w-full text-sm text-slate-600 file:mr-3 file:py-2 file:px-4 file:rounded-lg file:border-0 file:bg-primary/10 file:text-primary file:font-bold"
                />
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
