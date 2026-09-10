import api from "../utils/api";

export const DEFAULT_FRAMES = [
  {
    id: "m1",
    reward_item_id: "m1",
    title: "ยินดีต้อนรับสู่ ShareEd",
    description: "สมัครสมาชิกและเข้าสู่ระบบ ShareEd ครั้งแรก",
    current: 1,
    target: 1,
    status: "CLAIMED",
    reward: {
      id: "m1",
      type: "FRAME",
      name: "กรอบทองพรีเมียม",
      previewUrl: "/frames/frame-gold-luxury.svg",
    },
    completedAt: "2026-09-01T10:00:00",
  },
  {
    id: "m5",
    reward_item_id: "m5",
    title: "ก้าวแรกสู่นักแบ่งปัน",
    description: "สร้างและเผยแพร่โพสต์สรุปบทเรียนแรกในชุมชน",
    current: 1,
    target: 1,
    status: "READY_TO_CLAIM",
    reward: {
      id: "m5",
      type: "FRAME",
      name: "กรอบน่ารักสดใสการศึกษา",
      previewUrl: "/frames/frame-friendly-edu.svg",
    },
    completedAt: "2026-09-10T20:00:00",
  },
  {
    id: "m2",
    reward_item_id: "m2",
    title: "สรุปบทเรียนโดนใจ",
    description: "ได้รับยอดถูกใจ (Likes) จากโพสต์สรุปรวมครบ 5 ไลก์",
    current: 3,
    target: 5,
    status: "LOCKED",
    reward: {
      id: "m2",
      type: "FRAME",
      name: "กรอบคริสตัลเวทมนตร์",
      previewUrl: "/frames/frame-crystal-magic.svg",
    },
  },
  {
    id: "m6",
    reward_item_id: "m6",
    title: "มิตรภาพเริ่มต้น",
    description: "มีผู้ติดตามในโปรไฟล์ครบ 3 คน",
    current: 1,
    target: 3,
    status: "LOCKED",
    reward: {
      id: "m6",
      type: "FRAME",
      name: "กรอบนีออนไซเบอร์",
      previewUrl: "/frames/frame-cyber-neon.svg",
    },
  },
  {
    id: "m11",
    reward_item_id: "m11",
    title: "นักแลกเปลี่ยนความคิดเห็น",
    description: "ร่วมแสดงความคิดเห็นในบทเรียนครบ 3 ครั้ง",
    current: 2,
    target: 3,
    status: "LOCKED",
    reward: {
      id: "m11",
      type: "FRAME",
      name: "กรอบซากุระผลิบาน",
      previewUrl: "/frames/frame-sakura-blossom.svg",
    },
  },
  {
    id: "m7",
    reward_item_id: "m7",
    title: "ไฟแห่งการเรียนรู้",
    description: "เข้าสู่ระบบ ShareEd ต่อเนื่องครบ 3 วัน",
    current: 2,
    target: 3,
    status: "LOCKED",
    reward: {
      id: "m7",
      type: "FRAME",
      name: "กรอบเพลิงสุริยะ",
      previewUrl: "/frames/frame-inferno-flame.svg",
    },
  },
  {
    id: "m9",
    reward_item_id: "m9",
    title: "ขยันแบ่งปันบทเรียน",
    description: "สร้างและเผยแพร่โพสต์สรุปบทเรียนครบ 3 โพสต์",
    current: 1,
    target: 3,
    status: "LOCKED",
    reward: {
      id: "m9",
      type: "FRAME",
      name: "กรอบมรกตพฤกษา",
      previewUrl: "/frames/frame-emerald-nature.svg",
    },
  },
  {
    id: "m10",
    reward_item_id: "m10",
    title: "สรุปยอดนิยม",
    description: "ได้รับยอดถูกใจสะสมจากโพสต์ครบ 15 ไลก์",
    current: 3,
    target: 15,
    status: "LOCKED",
    reward: {
      id: "m10",
      type: "FRAME",
      name: "กรอบธารน้ำแข็งเหมันต์",
      previewUrl: "/frames/frame-frost-glacier.svg",
    },
  },
  {
    id: "m8",
    reward_item_id: "m8",
    title: "ดาวเด่นแห่งชุมชน",
    description: "มีผู้ติดตามในโปรไฟล์ครบ 5 คน",
    current: 1,
    target: 5,
    status: "LOCKED",
    reward: {
      id: "m8",
      type: "FRAME",
      name: "กรอบกาแล็กซี่ห้วงอวกาศ",
      previewUrl: "/frames/frame-galaxy-cosmic.svg",
    },
  },
  {
    id: "m14",
    reward_item_id: "m14",
    title: "ผู้เชี่ยวชาญการตอบคำถาม",
    description: "ร่วมแสดงความคิดเห็นแลกเปลี่ยนบทเรียนครบ 8 ครั้ง",
    current: 2,
    target: 8,
    status: "LOCKED",
    reward: {
      id: "m14",
      type: "FRAME",
      name: "กรอบเฟืองกลสตีมพังก์",
      previewUrl: "/frames/frame-steampunk-gear.svg",
    },
  },
  {
    id: "m13",
    reward_item_id: "m13",
    title: "เรียนรู้อย่างสม่ำเสมอ",
    description: "เข้าสู่ระบบ ShareEd ต่อเนื่องครบ 7 วัน",
    current: 2,
    target: 7,
    status: "LOCKED",
    reward: {
      id: "m13",
      type: "FRAME",
      name: "กรอบแสงเหนือรุ้งประกาย",
      previewUrl: "/frames/frame-aurora-rainbow.svg",
    },
  },
  {
    id: "m12",
    reward_item_id: "m12",
    title: "คลังข้อสอบเดินได้",
    description: "สร้างและเผยแพร่โพสต์สรุปบทเรียนครบ 5 โพสต์",
    current: 1,
    target: 5,
    status: "LOCKED",
    reward: {
      id: "m12",
      type: "FRAME",
      name: "กรอบเงาทมิฬแอ็บบิส",
      previewUrl: "/frames/frame-void-shadow.svg",
    },
  },
  {
    id: "m15",
    reward_item_id: "m15",
    title: "เนื้อหาทรงคุณค่า",
    description: "ได้รับยอดถูกใจสะสมจากโพสต์ครบ 30 ไลก์",
    current: 3,
    target: 30,
    status: "LOCKED",
    reward: {
      id: "m15",
      type: "FRAME",
      name: "กรอบเพชรแพลทินัมเลอค่า",
      previewUrl: "/frames/frame-diamond-platinum.svg",
    },
  },
  {
    id: "m16",
    reward_item_id: "m16",
    title: "ไอดอลสายวิชาการ",
    description: "มีผู้ติดตามในโปรไฟล์ครบ 10 คน",
    current: 1,
    target: 10,
    status: "LOCKED",
    reward: {
      id: "m16",
      type: "FRAME",
      name: "กรอบไซเบอร์เมทริกซ์",
      previewUrl: "/frames/frame-glitch-matrix.svg",
    },
  },
];

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

  // Fetch Achievements / Milestones from Backend (GET /achievements)
  getMilestones: async () => {
    try {
      let response;
      try {
        response = await api.get("/achievements");
      } catch (err) {
        if (err.response?.status === 404) {
          response = await api.get("/milestones");
        } else {
          throw err;
        }
      }

      let backendList = [];
      if (
        response.data?.success &&
        Array.isArray(response.data?.data) &&
        response.data.data.length > 0
      ) {
        backendList = response.data.data.map(mapMilestoneToAchievement);
      }

      // Map keyed by ID/Reward to ensure our designed progressive achievements exist
      const map = new Map();
      DEFAULT_FRAMES.forEach((df) => {
        map.set(df.id, { ...df });
      });

      // Overlay live backend achievements
      backendList.forEach((item) => {
        const key = item.id || item.reward_item_id;
        if (map.has(key)) {
          map.set(key, { ...map.get(key), ...item });
        } else {
          map.set(key, item);
        }
      });

      // Merge user unlocked items from inventory if available
      try {
        const invRes = await api.get("/users/me/inventory");
        const invList = invRes.data?.data || [];
        invList.forEach((inv) => {
          if (inv.item && (inv.item.item_type === "FRAME" || inv.item.item_type === "THEME")) {
            for (const [, v] of map.entries()) {
              if (
                v.id === inv.item.id ||
                v.reward_item_id === inv.item.id ||
                v.reward?.id === inv.item.id
              ) {
                v.status = "CLAIMED";
              }
            }
          }
        });
      } catch (invErr) {
        // Inventory fetch is optional
      }

      // Check locally claimed milestones (for instant client-side claim response)
      try {
        const claimedLocal = JSON.parse(localStorage.getItem("claimed_milestones") || "[]");
        claimedLocal.forEach((claimedId) => {
          for (const [, v] of map.entries()) {
            if (
              v.id === claimedId ||
              v.reward_item_id === claimedId ||
              v.reward?.id === claimedId
            ) {
              v.status = "CLAIMED";
            }
          }
        });
      } catch (_) {}

      return Array.from(map.values());
    } catch (error) {
      console.log("Achievements fetch notice, using default designed achievements:", error);
      const fallbackList = DEFAULT_FRAMES.map((df) => ({ ...df }));
      try {
        const claimedLocal = JSON.parse(localStorage.getItem("claimed_milestones") || "[]");
        fallbackList.forEach((item) => {
          if (claimedLocal.includes(item.id) || claimedLocal.includes(item.reward_item_id)) {
            item.status = "CLAIMED";
          }
        });
      } catch (_) {}
      return fallbackList;
    }
  },

  // Claim achievement reward (POST /achievements/:id/claim)
  claimMilestone: async (id) => {
    try {
      let res;
      try {
        res = await api.post(`/achievements/${id}/claim`);
      } catch (err) {
        if (err.response?.status === 404) {
          try {
            res = await api.post(`/milestones/${id}/claim`);
          } catch (_) {}
        }
      }

      // Always save to localStorage claimed_milestones so frame is unlocked immediately
      try {
        const claimedLocal = JSON.parse(localStorage.getItem("claimed_milestones") || "[]");
        if (!claimedLocal.includes(id)) {
          claimedLocal.push(id);
          localStorage.setItem("claimed_milestones", JSON.stringify(claimedLocal));
        }
      } catch (_) {}

      return res?.data || { success: true };
    } catch (err) {
      // Fallback save to localStorage claimed list
      try {
        const claimedLocal = JSON.parse(localStorage.getItem("claimed_milestones") || "[]");
        if (!claimedLocal.includes(id)) {
          claimedLocal.push(id);
          localStorage.setItem("claimed_milestones", JSON.stringify(claimedLocal));
        }
      } catch (_) {}
      return { success: true };
    }
  },

  // Get user's unlocked reward items (GET /users/me/inventory)
  getUserInventory: async () => {
    try {
      const response = await api.get("/users/me/inventory");
      return response.data?.data || [];
    } catch (error) {
      console.warn("Error fetching inventory:", error);
      return [];
    }
  },

  // Equip a Frame or Theme via Backend API (PUT /users/equip)
  equipItem: async (itemId, type = "FRAME") => {
    try {
      const response = await api.put("/users/equip", {
        itemId: itemId || null,
        type,
      });
      return response.data;
    } catch (error) {
      console.warn(`Backend equip ${type} notice:`, error?.response?.data || error.message);
      return { success: false, error };
    }
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
        if (data.nickname !== undefined) formData.append("nickname", data.nickname);
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
    reward: {
      type: "FRAME",
      name: "กรอบทองพรีเมียม",
      previewUrl: "/frames/frame-gold-luxury.svg",
    },
    completedAt: "2026-07-01T17:29:00",
  },
  {
    id: "m2",
    title: "ยอดนักอ่าน",
    description: "มียอดไลก์รวมครบ 50 ครั้ง",
    current: 50,
    target: 50,
    status: "READY_TO_CLAIM",
    reward: {
      type: "FRAME",
      name: "กรอบคริสตัลเวทมนตร์",
      previewUrl: "/frames/frame-crystal-magic.svg",
    },
    completedAt: "2026-07-05T09:14:00",
  },
  {
    id: "m5",
    title: "ผู้ร่วมแบ่งปันความรู้",
    description: "สร้างโพสต์แบ่งปันชีทสรุปบทเรียน",
    current: 10,
    target: 10,
    status: "CLAIMED",
    reward: {
      type: "FRAME",
      name: "กรอบน่ารักสดใสการศึกษา",
      previewUrl: "/frames/frame-friendly-edu.svg",
    },
    completedAt: "2026-07-10T14:20:00",
  },
  {
    id: "m6",
    title: "นักท่องโลกไซเบอร์",
    description: "เข้าสู่ระบบและมีปฏิสัมพันธ์ในชุมชนอย่างต่อเนื่อง",
    current: 5,
    target: 5,
    status: "CLAIMED",
    reward: {
      type: "FRAME",
      name: "กรอบนีออนไซเบอร์",
      previewUrl: "/frames/frame-cyber-neon.svg",
    },
    completedAt: "2026-07-12T11:00:00",
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
