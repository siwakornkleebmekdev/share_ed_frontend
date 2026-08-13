import api from "../utils/api";

export const profileService = {
  // Fetch My Posts (Active/Published)
  getMyPosts: async () => {
    try {
      const response = await api.get("/posts/user/my-posts");
      if (response.data.success) {
        return formatPosts(
          response.data.data.filter((p) => p.post_status === "ACTIVE"),
        );
      }
      return [];
    } catch (error) {
      console.error("Error fetching my posts:", error);
      throw error;
    }
  },

  // Fetch Drafts
  getDrafts: async () => {
    try {
      const response = await api.get("/posts/user/my-posts");
      if (response.data.success) {
        return formatPosts(
          response.data.data.filter((p) => p.post_status === "DRAFT"),
        );
      }
      return [];
    } catch (error) {
      console.error("Error fetching drafts:", error);
      throw error;
    }
  },

  // Fetch Bookmarks (Temporarily disabled due to missing backend API)
  getBookmarks: async () => {
    return [];
  },

  // Public profile of any user (self or someone else) — GET /users/:id.
  // Includes _count.{posts,followers,following}.
  getUserProfile: async (userId) => {
    const response = await api.get(`/users/${userId}`);
    return response.data?.data;
  },

  // Fetch Milestones (Temporarily disabled due to RLS blocking direct access — falls back to mock data)
  getMilestones: async () => {
    try {
      const response = await api.get("/milestones");
      if (response.data.success) {
        return response.data.data.map(mapMilestoneToAchievement);
      }
      return MOCK_MILESTONES;
    } catch (error) {
      console.log("Milestones fetch failed, falling back to mock:", error);
      return MOCK_MILESTONES;
    }
  },

  // Claim a completed milestone's reward — unlocks the reward server-side
  // (see /milestones/:id/claim) and marks it CLAIMED.
  claimMilestone: async (id) => {
    const response = await api.post(`/milestones/${id}/claim`);
    return response.data;
  },

  // Fetch User Stats (Temporarily disabled due to RLS blocking direct access)
  getStats: async () => {
    return {
      points: 0,
      postsCount: 0,
      likesReceived: 0,
      viewsReceived: 0,
    };
  },

  // Update Profile Info
  updateProfile: async (userId, data) => {
    try {
      const hasFiles = data.avatarFile || data.wallpaperFile || data.bannerFile;

      if (hasFiles) {
        // Build FormData for file upload
        const formData = new FormData();

        if (data.avatarFile) formData.append("avatar", data.avatarFile);
        if (data.wallpaperFile) formData.append("wallpaper", data.wallpaperFile);
        if (data.bannerFile) formData.append("banner", data.bannerFile);

        // Append text fields
        if (data.username !== undefined) formData.append("username", data.username);
        if (data.bio !== undefined) formData.append("bio", data.bio);
        if (data.education_level !== undefined) formData.append("education_level", data.education_level);
        if (data.location !== undefined) formData.append("location", data.location);
        if (data.occupation !== undefined) formData.append("occupation", data.occupation);

        // Social links
        if (data.facebook_url !== undefined) formData.append("facebook_url", data.facebook_url);
        if (data.instagram_url !== undefined) formData.append("instagram_url", data.instagram_url);
        if (data.discord_url !== undefined) formData.append("discord_url", data.discord_url);

        const response = await api.put("/users/profile/with-media", formData);
        return response.data;
      }

      // No files — use standard JSON update
      const response = await api.put("/users/profile", data);
      return response.data;
    } catch (error) {
      console.error("Error updating profile:", error);
      throw error;
    }
  },
};

// Mock achievement catalog — reward is either a profile-picture FRAME or a
// WALLPAPER background image, equipped via updateProfile once claimed.
const MOCK_MILESTONES = [
  {
    id: "m1",
    title: "นักเรียนดีเด่น",
    description: "มีผู้ติดตามครบ 10 คน",
    current: 12,
    target: 10,
    status: "CLAIMED",
    reward: { type: "FRAME", name: "กรอบทอง", previewUrl: null },
    completedAt: "2026-07-01T17:29:00",
  },
  {
    id: "m2",
    title: "ยอดนักอ่าน",
    description: "มียอดไลก์รวมครบ 50 ครั้ง",
    current: 50,
    target: 50,
    status: "READY_TO_CLAIM",
    reward: { type: "FRAME", name: "กรอบไพลิน", previewUrl: null },
    completedAt: "2026-07-05T09:14:00",
  },
  {
    id: "m3",
    title: "นักเขียนตัวยง",
    description: "เผยแพร่โพสต์ครบ 5 โพสต์",
    current: 2,
    target: 5,
    status: "LOCKED",
    reward: {
      type: "WALLPAPER",
      name: "ท้องฟ้ายามเช้า",
      previewUrl:
        "https://images.unsplash.com/photo-1470252649378-9c29740c9fa8?w=800&q=80",
    },
  },
  {
    id: "m4",
    title: "ขวัญใจชุมชน",
    description: "มียอดไลก์รวมครบ 100 ครั้ง",
    current: 50,
    target: 100,
    status: "LOCKED",
    reward: {
      type: "WALLPAPER",
      name: "เมืองยามค่ำคืน",
      previewUrl:
        "https://images.unsplash.com/photo-1519681393784-d120267933ba?w=800&q=80",
    },
  },
];

// GET /milestones returns each Milestone spread with the current user's
// progress (current_progress, is_completed, completed_at, claimed_at, status)
// and a nested reward_item ({item_name, item_type: THEME|FRAME, image_url}).
// Maps that real shape onto the shape Achievements.jsx/achievementStore.js
// already render (current/target/status/reward.{type,name,previewUrl}).
function mapMilestoneToAchievement(m) {
  return {
    id: m.id,
    title: m.title,
    description: m.description,
    current: m.current_progress,
    target: m.target_value,
    status: m.status, // backend already computes LOCKED|READY_TO_CLAIM|CLAIMED
    reward: m.reward_item
      ? {
          type: m.reward_item.item_type, // FRAME | THEME (no WALLPAPER on the real backend)
          name: m.reward_item.item_name,
          previewUrl: m.reward_item.image_url,
        }
      : null,
    completedAt: m.completed_at,
  };
}

// Helper function to format data for PostCard component
function formatPosts(data) {
  if (!data) return [];
  return data.map((post) => ({
    id: post.id,
    title: post.title,
    level: mapEducationLevel(post.education_level),
    subject: post.category?.category_name || post.category?.name || "ทั่วไป",
    views: formatNumber(post.view_count),
    likes: post._count?.likes || post.likes || 0,
    image:
      post.cover_image ||
      "https://images.unsplash.com/photo-1456513080510-7bf3a84b82f8?w=500&q=80",
    author: post.author?.username || "ผู้ใช้งาน",
    created_at: post.created_at,
  }));
}

function formatNumber(num) {
  if (!num) return "0";
  if (num >= 1000) {
    return (num / 1000).toFixed(1) + "k";
  }
  return num.toString();
}

export function mapEducationLevel(level) {
  switch (level) {
    case "MIDDLE_SCHOOL":
      return "มัธยมศึกษาตอนต้น";
    case "HIGH_SCHOOL":
      return "มัธยมศึกษาตอนปลาย";
    case "UNIVERSITY":
      return "มหาวิทยาลัย";
    default:
      return level;
  }
}

// GET /users/:id's `_count.followers` / `_count.following` are swapped from
// their natural meaning on the live backend — following someone increments
// *your own* `_count.followers` instead of `_count.following`. Centralized
// here so there's one place to delete this swap if the backend ever
// corrects it.
export function normalizeFollowCounts(userProfile) {
  return {
    followersCount: userProfile?._count?.following || 0,
    followingCount: userProfile?._count?.followers || 0,
  };
}
