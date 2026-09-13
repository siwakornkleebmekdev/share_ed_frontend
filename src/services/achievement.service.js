import api from "../utils/api";
import { DEFAULT_FRAMES } from "./profile.service";

// Configuration and Thai metadata for milestone/achievement types
export const MILESTONE_TYPES = [
  {
    key: "FOLLOWERS_COUNT",
    label: "👥 จำนวนผู้ติดตาม (Followers)",
    shortLabel: "ผู้ติดตาม",
    unit: "คน",
    description: "ระบบจะตรวจจับและนับจำนวนผู้ติดตามของสมาชิกโดยอัตโนมัติเมื่อมีผู้อื่นกดติดตาม",
    placeholder: "เช่น 10",
    color: "bg-blue-50 text-blue-700 border-blue-200",
  },
  {
    key: "POST_LIKES",
    label: "❤️ ยอดถูกใจที่ได้รับ (Post Likes)",
    shortLabel: "ยอดถูกใจ",
    unit: "ไลก์",
    description: "ระบบจะรวมยอดถูกใจสะสมจากทุกโพสต์ที่สมาชิกเผยแพร่โดยอัตโนมัติ",
    placeholder: "เช่น 50",
    color: "bg-rose-50 text-rose-700 border-rose-200",
  },
  {
    key: "POSTS_CREATED",
    label: "📝 จำนวนโพสต์ที่สร้าง (Posts Created)",
    shortLabel: "จำนวนโพสต์",
    unit: "โพสต์",
    description: "ระบบจะนับจำนวนโพสต์สรุปบทเรียนที่ผู้ใช้สร้างและเผยแพร่สำเร็จ",
    placeholder: "เช่น 5",
    color: "bg-emerald-50 text-emerald-700 border-emerald-200",
  },
  {
    key: "COMMENTS_CREATED",
    label: "💬 จำนวนความคิดเห็น (Comments)",
    shortLabel: "ความคิดเห็น",
    unit: "คอมเมนต์",
    description: "ระบบจะนับจำนวนความคิดเห็นที่ผู้ใช้ร่วมพูดคุยแลกเปลี่ยนใต้โพสต์",
    placeholder: "เช่น 10",
    color: "bg-purple-50 text-purple-700 border-purple-200",
  },
  {
    key: "LOGIN_STREAK",
    label: "🔥 เข้าสู่ระบบต่อเนื่อง (Login Streak)",
    shortLabel: "ล็อกอินต่อเนื่อง",
    unit: "วัน",
    description: "ระบบจะนับจำนวนวันติดต่อกันที่ผู้ใช้เข้าสู่ระบบอย่างต่อเนื่อง",
    placeholder: "เช่น 7",
    color: "bg-amber-50 text-amber-700 border-amber-200",
  },
];

export const MILESTONE_TYPE_ALIASES = {
  POSTS_COUNT: "POSTS_CREATED",
  LIKES_RECEIVED: "POST_LIKES",
};

export const MILESTONE_TYPE_MAP = MILESTONE_TYPES.reduce((acc, curr) => {
  acc[curr.key] = curr;
  return acc;
}, {});

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

export function getMilestoneTypeLabel(typeKey, short = false) {
  const info = getMilestoneTypeInfo(typeKey);
  if (!info) return typeKey || "-";
  return short ? info.shortLabel : info.label;
}

export const SUGGESTED_MILESTONE_TYPES = MILESTONE_TYPES.map((m) => m.key);

// Cache of reward items seen so far, keyed by id
let rewardItemCache = new Map();

// Initialize default frames into cache
DEFAULT_FRAMES.forEach((df) => {
  rewardItemCache.set(df.id, {
    id: df.id,
    item_name: df.reward.name,
    item_type: df.reward.type,
    image_url: df.reward.previewUrl,
    item_description: df.description,
    is_active: true,
  });
});

function buildAchievementFormData(payload) {
  const formData = new FormData();
  formData.append("title", payload.title);
  formData.append("description", payload.description);
  formData.append("target_value", payload.target_value);
  const type = payload.achievement_type || payload.milestone_type || "POSTS_COUNT";
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

async function resolvePayloadReward(payload) {
  if (!payload || !payload.reward_item_id) {
    return payload;
  }

  const rawId = String(payload.reward_item_id);
  // If it's not a local template ID (e.g. doesn't start with "m"), it's already a real backend ID
  if (!rawId.startsWith("m")) {
    return payload;
  }

  const localItem = rewardItemCache.get(payload.reward_item_id);
  if (!localItem) {
    return payload;
  }

  // 1. Check if backend /admin/rewards already has this item by name
  try {
    const res = await api.get("/admin/rewards");
    const backendRewards = res.data?.data || res.data || [];
    const match = backendRewards.find(
      (r) =>
        r.item_name &&
        r.item_name.trim().toLowerCase() === localItem.item_name.trim().toLowerCase()
    );
    if (match && match.id && !String(match.id).startsWith("m")) {
      rewardItemCache.set(match.id, match);
      return { ...payload, reward_item_id: match.id };
    }
  } catch (err) {
    console.warn("Could not check /admin/rewards:", err);
  }

  // 2. Create the reward item in the backend database via POST /admin/rewards
  try {
    const rewardForm = new FormData();
    rewardForm.append("item_name", localItem.item_name);
    rewardForm.append("item_type", localItem.item_type || "FRAME");
    if (localItem.item_description) {
      rewardForm.append("description", localItem.item_description);
    }
    rewardForm.append("is_active", "true");

    // Fetch the SVG file from public folder as a Blob to attach to FormData
    if (localItem.image_url && localItem.image_url.startsWith("/")) {
      try {
        const fileRes = await fetch(localItem.image_url);
        const blob = await fileRes.blob();
        const svgFile = new File([blob], `${localItem.item_name}.svg`, {
          type: "image/svg+xml",
        });
        rewardForm.append("image", svgFile);
      } catch (fetchErr) {
        console.warn("Could not fetch SVG blob for reward upload:", fetchErr);
      }
    }

    const createRes = await api.post("/admin/rewards", rewardForm);
    const newReward = createRes.data?.data || createRes.data;
    if (newReward?.id) {
      rewardItemCache.set(newReward.id, newReward);
      return { ...payload, reward_item_id: newReward.id };
    }
  } catch (createErr) {
    console.warn(
      "Auto-creating backend reward via /admin/rewards failed, falling back to inline payload:",
      createErr
    );
    // Fallback: pass inline parameters to achievement endpoint so it creates the reward inline
    const cloned = { ...payload };
    delete cloned.reward_item_id;
    cloned.item_name = localItem.item_name;
    cloned.item_type = localItem.item_type || "FRAME";
    cloned.item_description = localItem.item_description;
    cloned.is_active = true;
    if (localItem.image_url && localItem.image_url.startsWith("/")) {
      try {
        const fileRes = await fetch(localItem.image_url);
        const blob = await fileRes.blob();
        cloned.imageFile = new File([blob], `${localItem.item_name}.svg`, {
          type: "image/svg+xml",
        });
      } catch (_) {}
    }
    return cloned;
  }

  return payload;
}

export const achievementService = {
  getAllAchievements: async () => {
    let backendAchievements = [];
    try {
      const response = await api.get("/admin/achievements");
      const data = response.data?.data || response.data;
      backendAchievements = Array.isArray(data) ? data : [];
      backendAchievements.forEach((a) => {
        if (!a.milestone_type && a.achievement_type) a.milestone_type = a.achievement_type;
        if (!a.achievement_type && a.milestone_type) a.achievement_type = a.milestone_type;
        if (a.reward_item?.id) rewardItemCache.set(a.reward_item.id, a.reward_item);
        a.is_default_template = false;
      });
    } catch (error) {
      console.warn("Could not fetch /admin/achievements from backend, using templates:", error);
    }

    // Read any hidden template IDs from localStorage
    let hiddenIds = [];
    try {
      hiddenIds = JSON.parse(localStorage.getItem("shareed_hidden_achievement_templates") || "[]");
    } catch (_) {}

    const mergedList = [...backendAchievements];

    // Merge DEFAULT_FRAMES so admin sees all 14 designed achievements
    DEFAULT_FRAMES.forEach((df) => {
      if (hiddenIds.includes(df.id)) return;

      const alreadyExists = backendAchievements.some((ba) => {
        const titleMatch =
          ba.title && ba.title.trim().toLowerCase() === df.title.trim().toLowerCase();
        const idMatch = ba.id === df.id;
        const rewardMatch =
          ba.reward_item?.item_name &&
          df.reward?.name &&
          ba.reward_item.item_name.trim().toLowerCase() === df.reward.name.trim().toLowerCase();
        return titleMatch || idMatch || rewardMatch;
      });

      if (!alreadyExists) {
        mergedList.push({
          id: df.id,
          title: df.title,
          description: df.description,
          target_value: df.target,
          achievement_type: df.achievement_type || df.milestone_type || "POSTS_CREATED",
          milestone_type: df.milestone_type || df.achievement_type || "POSTS_CREATED",
          reward_item_id: df.reward_item_id || df.reward?.id,
          reward_item: {
            id: df.reward?.id || df.id,
            item_name: df.reward?.name,
            item_type: df.reward?.type || "FRAME",
            image_url: df.reward?.previewUrl,
            is_active: true,
          },
          is_default_template: true,
        });
      }
    });

    return mergedList;
  },

  getRewardItems: async () => {
    try {
      const response = await api.get("/admin/rewards");
      const data = response.data?.data || response.data;
      if (Array.isArray(data)) {
        data.forEach((r) => {
          if (r.id) rewardItemCache.set(r.id, r);
        });
      }
    } catch (e) {
      console.warn("Failed to fetch /admin/rewards, falling back to cache:", e);
    }
    return Array.from(rewardItemCache.values());
  },

  createAchievement: async (payload) => {
    try {
      const resolvedPayload = await resolvePayloadReward(payload);
      const formData = buildAchievementFormData(resolvedPayload);
      const response = await api.post("/admin/achievements", formData);
      return response.data?.data || response.data;
    } catch (error) {
      console.error("Error creating achievement:", error);
      throw error;
    }
  },

  updateAchievement: async (id, payload) => {
    try {
      const resolvedPayload = await resolvePayloadReward(payload);
      // If it is a template item not yet created in backend DB, create it directly
      if (String(id).startsWith("m")) {
        return await achievementService.createAchievement(resolvedPayload);
      }

      const formData = buildAchievementFormData(resolvedPayload);
      try {
        const response = await api.put(`/admin/achievements/${id}`, formData);
        return response.data?.data || response.data;
      } catch (err) {
        if (err.response?.status === 404) {
          // If backend returned 404, fallback to creating it in the database
          return await achievementService.createAchievement(resolvedPayload);
        }
        throw err;
      }
    } catch (error) {
      console.error("Error updating achievement:", error);
      throw error;
    }
  },

  deleteAchievement: async (id) => {
    if (String(id).startsWith("m")) {
      // Template item: mark as hidden in localStorage
      try {
        const hidden = JSON.parse(
          localStorage.getItem("shareed_hidden_achievement_templates") || "[]"
        );
        if (!hidden.includes(id)) {
          hidden.push(id);
          localStorage.setItem("shareed_hidden_achievement_templates", JSON.stringify(hidden));
        }
      } catch (_) {}
      return { success: true, message: "Template removed" };
    }

    try {
      const response = await api.delete(`/admin/achievements/${id}`);
      return response.data;
    } catch (error) {
      console.error("Error deleting achievement:", error);
      throw error;
    }
  },

  syncDefaultAchievementsToBackend: async () => {
    let existingAchievements = [];
    try {
      const res = await api.get("/admin/achievements");
      const data = res.data?.data || res.data;
      existingAchievements = Array.isArray(data) ? data : [];
    } catch (err) {
      console.warn("Could not fetch existing achievements:", err);
    }

    const existingTitles = new Set(
      existingAchievements
        .map((a) => a.title && a.title.trim().toLowerCase())
        .filter(Boolean)
    );
    const existingRewardNames = new Set(
      existingAchievements
        .map((a) => a.reward_item?.item_name && a.reward_item.item_name.trim().toLowerCase())
        .filter(Boolean)
    );

    let syncedCount = 0;
    const errors = [];

    for (const df of DEFAULT_FRAMES) {
      const titleLower = df.title?.trim()?.toLowerCase();
      const rewardLower = df.reward?.name?.trim()?.toLowerCase();

      if (existingTitles.has(titleLower) || (rewardLower && existingRewardNames.has(rewardLower))) {
        continue;
      }

      try {
        const payload = {
          title: df.title,
          description: df.description,
          target_value: df.target,
          achievement_type: df.achievement_type || df.milestone_type || "POSTS_CREATED",
          milestone_type: df.milestone_type || df.achievement_type || "POSTS_CREATED",
          reward_item_id: df.reward_item_id || df.reward?.id,
        };

        await achievementService.createAchievement(payload);
        syncedCount++;
      } catch (err) {
        console.error(`Failed to sync achievement "${df.title}":`, err);
        errors.push({ title: df.title, error: err?.response?.data?.message || err.message });
      }
    }

    return { success: true, count: syncedCount, errors };
  },

  deleteRewardItem: async (id) => {
    try {
      try {
        await api.delete(`/admin/rewards/${id}`);
      } catch (err) {
        if (err.response?.status === 404) {
          try {
            await api.delete(`/rewards/${id}`);
          } catch (_) {}
        } else {
          throw err;
        }
      }
      for (const [key] of rewardItemCache.entries()) {
        if (String(key) === String(id)) {
          rewardItemCache.delete(key);
        }
      }
      return { success: true };
    } catch (error) {
      console.error("Error deleting reward item:", error);
      throw error;
    }
  },
};
