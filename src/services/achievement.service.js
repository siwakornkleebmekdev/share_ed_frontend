import api from "../utils/api";

// Non-binding suggestions only — the backend's milestone_type is a bare
// string with no enum/whitelist, so the form uses free text + <datalist>.
export const SUGGESTED_MILESTONE_TYPES = [
  "POSTS_COUNT",
  "FOLLOWERS_COUNT",
  "LIKES_RECEIVED",
  "LOGIN_STREAK",
];

// Cache of reward items seen so far, keyed by id — populated from the
// `reward_item` relation nested in GET /admin/milestones. Interim stand-in
// for a real reward-listing endpoint (none confirmed yet); swap
// getRewardItems() for a direct API call once that endpoint is available.
let rewardItemCache = new Map();

function buildAchievementFormData(payload) {
  const formData = new FormData();
  formData.append("title", payload.title);
  formData.append("description", payload.description);
  formData.append("target_value", payload.target_value);
  formData.append("milestone_type", payload.milestone_type);

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
      // Field name for the reward image upload isn't confirmed from the
      // shared controller source (it only shows req.file, not the route's
      // multer.single(fieldName) call) — verify against a real request.
      formData.append("image", payload.imageFile);
    }
  }

  return formData;
}

export const achievementService = {
  getAllAchievements: async () => {
    try {
      const response = await api.get("/admin/milestones");
      const data = response.data?.data || response.data;
      const achievements = Array.isArray(data) ? data : [];
      achievements.forEach((a) => {
        if (a.reward_item?.id) rewardItemCache.set(a.reward_item.id, a.reward_item);
      });
      return achievements;
    } catch (error) {
      console.error("Error fetching achievements:", error);
      throw error;
    }
  },

  // Interim: derived from rewards seen in loaded milestones, not a real
  // listing endpoint. Replace with a direct GET call once confirmed.
  getRewardItems: async () => {
    return Array.from(rewardItemCache.values());
  },

  createAchievement: async (payload) => {
    try {
      const formData = buildAchievementFormData(payload);
      const response = await api.post("/admin/milestones", formData);
      return response.data?.data || response.data;
    } catch (error) {
      console.error("Error creating achievement:", error);
      throw error;
    }
  },

  updateAchievement: async (id, payload) => {
    try {
      const formData = buildAchievementFormData(payload);
      const response = await api.put(`/admin/milestones/${id}`, formData);
      return response.data?.data || response.data;
    } catch (error) {
      console.error("Error updating achievement:", error);
      throw error;
    }
  },

  deleteAchievement: async (id) => {
    try {
      const response = await api.delete(`/admin/milestones/${id}`);
      return response.data;
    } catch (error) {
      console.error("Error deleting achievement:", error);
      throw error;
    }
  },
};
