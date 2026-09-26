import api from "../utils/api";
import { convertSvgToPngFile } from "../utils/imageUtils";
import { prepareRewardImageFile } from "../utils/rewardImage";

// การตั้งค่าและข้อมูลอธิบายประเภทภารกิจความสำเร็จ (Milestone / Achievement Types)
export const MILESTONE_TYPES = [
  {
    key: "FOLLOWERS_COUNT",
    label: "👥 จำนวนผู้ติดตาม (Followers)",
    shortLabel: "ผู้ติดตาม",
    achievementDescription: "จำนวนผู้ติดตาม",
    unit: "คน",
    description: "ระบบจะตรวจจับและนับจำนวนผู้ติดตามของสมาชิกโดยอัตโนมัติเมื่อมีผู้อื่นกดติดตาม",
    placeholder: "เช่น 10",
    color: "bg-blue-50 text-blue-700 border-blue-200",
  },
  {
    key: "POST_LIKES",
    label: "❤️ ยอดถูกใจที่ได้รับ (Post Likes)",
    shortLabel: "ยอดถูกใจ",
    achievementDescription: "ยอดถูกใจที่ได้รับ",
    unit: "ไลก์",
    description: "ระบบจะรวมยอดถูกใจสะสมจากทุกโพสต์ที่สมาชิกเผยแพร่โดยอัตโนมัติ",
    placeholder: "เช่น 50",
    color: "bg-rose-50 text-rose-700 border-rose-200",
  },
];

export const MILESTONE_TYPE_ALIASES = {
  LIKES_RECEIVED: "POST_LIKES",
};

export const MILESTONE_TYPE_MAP = MILESTONE_TYPES.reduce((acc, curr) => {
  acc[curr.key] = curr;
  return acc;
}, {});

/**
 * ดึงข้อมูลและคำอธิบายของประเภทภารกิจ (Milestone Type)
 * - การทำงาน: ค้นหาข้อมูลประเภทภารกิจจาก MILESTONE_TYPE_MAP (รองรับชื่อ alias เช่น LIKES_RECEIVED)
 * - อิงจาก: ประเภทภารกิจที่ Backend รองรับ
 * - เชื่อมโยงกับ: getMilestoneTypeLabel และ UI ต่างๆ ในการแสดงป้ายชื่อ/สี/หน่วยนับ
 */
export function getMilestoneTypeInfo(typeKey) {
  if (!typeKey) return null;
  const resolvedKey = MILESTONE_TYPE_ALIASES[typeKey] || typeKey;
  if (MILESTONE_TYPE_MAP[resolvedKey]) {
    return MILESTONE_TYPE_MAP[resolvedKey];
  }
  return {
    key: typeKey,
    label: `${typeKey} (กำหนดเอง)`,
    shortLabel: typeKey,
    unit: "หน่วย",
    description: "ภารกิจประเภทกำหนดเองตามรหัสระบบ",
    placeholder: "เช่น 1",
    color: "bg-slate-100 text-slate-700 border-slate-200",
  };
}

/**
 * แปลงรหัสประเภทภารกิจเป็นข้อความภาษาไทย
 * - การทำงาน: ส่งคืนชื่อเต็มหรือชื่อสั้นสำหรับนำไปแสดงบน UI
 * - อิงจาก: getMilestoneTypeInfo
 * - เชื่อมโยงกับ: หน้า AchievementManagement.jsx และ Achievements.jsx
 */
export function getMilestoneTypeLabel(typeKey, short = false) {
  const info = getMilestoneTypeInfo(typeKey);
  if (!info) return typeKey || "-";
  return short ? info.shortLabel : info.label;
}

export const SUGGESTED_MILESTONE_TYPES = MILESTONE_TYPES.map((m) => m.key);

/**
 * สร้าง FormData สำหรับส่งข้อมูลภารกิจพร้อมไฟล์รูปภาพ
 * - การทำงาน: รวบรวมฟิลด์ข้อความและไฟล์รูปภาพเพื่อส่งเป็น multipart/form-data
 * - อิงจาก: Backend API /admin/achievements กรณีที่เซิร์ฟเวอร์ต้องการรับรูปแบบ Form-Data
 * - เชื่อมโยงกับ: เรียกใช้เป็น Fallback ใน createAchievement และ updateAchievement
 */
function buildAchievementFormData(payload) {
  const formData = new FormData();
  formData.append("title", payload.title);
  formData.append("description", payload.description);
  formData.append("target_value", payload.target_value);
  const type = payload.achievement_type || payload.milestone_type || "FOLLOWERS_COUNT";
  formData.append("achievement_type", type);
  formData.append("milestone_type", type);

  if (payload.reward_item_id) {
    formData.append("reward_item_id", payload.reward_item_id);
  } else if (payload.item_name) {
    formData.append("item_name", payload.item_name);
    formData.append("item_type", payload.item_type);
    if (payload.item_description) {
      formData.append("item_description", payload.item_description);
    }
    formData.append("is_active", String(payload.is_active !== false));
    if (payload.imageFile) {
      formData.append("image", payload.imageFile);
    }
  }

  return formData;
}

/**
 * จัดการของรางวัลที่แนบมากับภารกิจ (Auto-create Reward Item)
 * - การทำงาน: หากผู้ใช้กรอกชื่อของรางวัลใหม่พร้อมไฟล์ภาพ แต่ยังไม่มี reward_item_id
 *   ระบบจะทำการสร้างไอเทมของรางวัลขึ้นก่อนอัตโนมัติ โดยตรวจไฟล์ APNG หรือแปลง SVG เป็น PNG
 *   จากนั้นนำ ID ของรางวัลที่ได้มาผูกเข้ากับภารกิจ
 * - อิงจาก: Backend API POST /admin/rewards
 * - เชื่อมโยงกับ: AchievementFormModal.jsx -> prepareRewardImageFile() ใน rewardImage.js -> createAchievement() / updateAchievement()
 */
async function resolvePayloadReward(payload) {
  if (!payload) {
    return payload;
  }

  // 1. กรณีผู้ใช้ระบุของรางวัลใหม่พร้อมภารกิจ (ชื่อรางวัล + ไฟล์/ประเภท)
  if (payload.item_name && !payload.reward_item_id) {
    try {
      let fileToUpload = await prepareRewardImageFile(payload.imageFile);
      if (fileToUpload && (fileToUpload.type === 'image/svg+xml' || fileToUpload.name?.toLowerCase().endsWith('.svg'))) {
        // รักษาข้อมูลไฟล์ APNG และไฟล์รูปภาพอื่นแบบ byte-for-byte เพื่อคงความต่อเนื่องของแอนิเมชัน
        fileToUpload = await convertSvgToPngFile(fileToUpload);
      }

      const rewardForm = new FormData();
      rewardForm.append("item_name", payload.item_name);
      rewardForm.append("item_type", payload.item_type || "FRAME");
      if (payload.item_description) {
        rewardForm.append("description", payload.item_description);
      }
      rewardForm.append("is_active", "true");
      if (fileToUpload) {
        rewardForm.append("image", fileToUpload);
      }
      const createRes = await api.post("/admin/rewards", rewardForm);
      const newReward = createRes.data?.data || createRes.data;
      if (newReward?.id) {
        const updated = { ...payload, reward_item_id: newReward.id };
        delete updated.imageFile;
        delete updated.item_name;
        delete updated.item_type;
        delete updated.item_description;
        return updated;
      }
    } catch (err) {
      console.error("Creating reward failed with details:", err?.response?.data || err);
      const msg = err?.response?.data?.message || err?.response?.data?.error || err.message;
      throw new Error(`ไม่สามารถสร้างของรางวัล "${payload.item_name}" ได้: ${msg}`);
    }
  }

  return payload;
}

export const achievementService = {
  /**
   * ดึงรายการภารกิจความสำเร็จทั้งหมดในระบบสำหรับฝั่งแอดมิน
   * - การทำงาน: ส่งคำขอ GET ไปยังเซิร์ฟเวอร์ และ map ฟิลด์ milestone_type/achievement_type ให้เข้ากันได้
   * - อิงจาก: Backend API GET /admin/achievements
   * - เชื่อมโยงกับ: หน้า AchievementManagement.jsx เพื่อแสดงตารางภารกิจทั้งหมด
   */
  getAllAchievements: async () => {
    const response = await api.get('/admin/achievements');
    const data = response.data?.data || response.data;
    if (!Array.isArray(data)) return [];
    return data.map((achievement) => ({
      ...achievement,
      milestone_type: achievement.milestone_type || achievement.achievement_type,
      achievement_type: achievement.achievement_type || achievement.milestone_type,
    }));
  },

  /**
   * ดึงรายการไอเทมของรางวัลทั้งหมดที่มีในระบบ
   * - การทำงาน: ส่งคำขอ GET เพื่อรับของรางวัลกรอบโปรไฟล์ (FRAME)
   * - อิงจาก: Backend API GET /admin/rewards
   * - เชื่อมโยงกับ: RewardManagementModal.jsx และตัวเลือกของรางวัลใน AchievementFormModal.jsx
   */
  getRewardItems: async () => {
    const response = await api.get("/admin/rewards");
    const data = response.data?.data || response.data;
    return Array.isArray(data) ? data : [];
  },

  /**
   * สร้างของรางวัลใหม่ในระบบโดยตรง
   * - การทำงาน: รวบรวมข้อมูลผ่าน FormData พร้อมตรวจสอบไฟล์ภาพด้วย prepareRewardImageFile
   * - อิงจาก: Backend API POST /admin/rewards
   * - เชื่อมโยงกับ: ปุ่ม "+ เพิ่มของรางวัล" ใน RewardManagementModal.jsx
   */
  createRewardItem: async ({ item_name, item_type = 'FRAME', description, imageFile }) => {
    const formData = new FormData();
    formData.append('item_name', item_name.trim());
    formData.append('item_type', item_type);
    if (description?.trim()) formData.append('description', description.trim());
    formData.append('is_active', 'true');
    formData.append('image', await prepareRewardImageFile(imageFile));
    const response = await api.post('/admin/rewards', formData);
    return response.data?.data || response.data;
  },

  /**
   * สร้างภารกิจความสำเร็จใหม่เข้าสู่ระบบ
   * - การทำงาน: เรียก resolvePayloadReward เพื่อจัดการของรางวัลก่อน จากนั้นส่งคำขอเป็น JSON (มี FormData เป็น Fallback)
   * - อิงจาก: Backend API POST /admin/achievements
   * - เชื่อมโยงกับ: AchievementFormModal.jsx -> เรียกบันทึกภารกิจใหม่
   */
  createAchievement: async (payload) => {
    try {
      const resolvedPayload = await resolvePayloadReward(payload);
      const type =
        resolvedPayload.achievement_type || resolvedPayload.milestone_type || "FOLLOWERS_COUNT";

      const jsonPayload = {
        title: resolvedPayload.title,
        description: resolvedPayload.description,
        target_value: Number(resolvedPayload.target_value),
        milestone_type: type,
        achievement_type: type,
      };

      if (resolvedPayload.reward_item_id) {
        jsonPayload.reward_item_id = resolvedPayload.reward_item_id;
      }

      try {
        const response = await api.post("/admin/achievements", jsonPayload);
        return response.data?.data || response.data;
      } catch (jsonErr) {
        if (
          jsonErr.response?.status === 400 ||
          jsonErr.response?.status === 415 ||
          jsonErr.response?.status === 422
        ) {
          try {
            const formData = buildAchievementFormData(resolvedPayload);
            const formRes = await api.post("/admin/achievements", formData);
            return formRes.data?.data || formRes.data;
          } catch (_) {
            throw jsonErr;
          }
        }
        throw jsonErr;
      }
    } catch (error) {
      console.error("Error creating achievement:", error);
      throw error;
    }
  },

  /**
   * อัปเดตข้อมูลภารกิจความสำเร็จที่มีอยู่แล้ว
   * - การทำงาน: อัปเดตของรางวัล (ถ้ามีการระบุใหม่) และส่งคำขอ PUT อัปเดตข้อมูลภารกิจ
   * - อิงจาก: Backend API PUT /admin/achievements/:id
   * - เชื่อมโยงกับ: AchievementFormModal.jsx ในโหมดแก้ไข (isEdit = true)
   */
  updateAchievement: async (id, payload) => {
    try {
      const resolvedPayload = await resolvePayloadReward(payload);
      const type =
        resolvedPayload.achievement_type || resolvedPayload.milestone_type || "FOLLOWERS_COUNT";

      const jsonPayload = {
        title: resolvedPayload.title,
        description: resolvedPayload.description,
        target_value: Number(resolvedPayload.target_value),
        milestone_type: type,
        achievement_type: type,
      };

      if (resolvedPayload.reward_item_id) {
        jsonPayload.reward_item_id = resolvedPayload.reward_item_id;
      }

      try {
        const response = await api.put(`/admin/achievements/${id}`, jsonPayload);
        return response.data?.data || response.data;
      } catch (err) {
        if (
          err.response?.status === 400 ||
          err.response?.status === 415 ||
          err.response?.status === 422
        ) {
          try {
            const formData = buildAchievementFormData(resolvedPayload);
            const formRes = await api.put(`/admin/achievements/${id}`, formData);
            return formRes.data?.data || formRes.data;
          } catch (_) {
            throw err;
          }
        }
        throw err;
      }
    } catch (error) {
      console.error("Error updating achievement:", error);
      throw error;
    }
  },

  /**
   * ลบภารกิจความสำเร็จออกจากระบบจริง
   * - การทำงาน: ส่งคำขอ DELETE ไปยัง Backend (หากมีผู้ใช้ที่มี progress ค้างอยู่ Backend จะบล็อกไม่ให้ลบ)
   * - อิงจาก: Backend API DELETE /admin/achievements/:id
   * - เชื่อมโยงกับ: ปุ่มลบภารกิจในตารางของหน้า AchievementManagement.jsx
   */
  deleteAchievement: async (id) => {
    try {
      const response = await api.delete(`/admin/achievements/${id}`);
      return response.data;
    } catch (error) {
      console.error("Error deleting achievement:", error);
      throw error;
    }
  },

  /**
   * ลบไอเทมของรางวัลออกจากระบบ
   * - การทำงาน: ส่งคำขอ DELETE ไปยัง /admin/rewards/:id (มี fallback ไปที่ /rewards/:id กรณี route แตกต่าง)
   * - อิงจาก: Backend API DELETE /admin/rewards/:id
   * - เชื่อมโยงกับ: ปุ่มลบของรางวัลใน RewardManagementModal.jsx
   */
  deleteRewardItem: async (id) => {
    try {
      try {
        await api.delete(`/admin/rewards/${id}`);
      } catch (err) {
        if (err.response?.status === 404) {
          try {
            await api.delete(`/rewards/${id}`);
          } catch (_) { }
        } else {
          throw err;
        }
      }
      return { success: true };
    } catch (error) {
      console.error("Error deleting reward item:", error);
      throw error;
    }
  },
};
