import api from "../utils/api";

export const DEFAULT_FRAMES = [
  {
    id: "m1",
    reward_item_id: "m1",
    title: "นักเรียนดีเด่น",
    description: "มีผู้ติดตามครบ 10 คน",
    current: 10,
    target: 10,
    status: "CLAIMED",
    reward: {
      id: "m1",
      type: "FRAME",
      name: "กรอบทองพรีเมียม",
      previewUrl: "/frames/frame-gold-luxury.svg",
    },
    completedAt: "2026-07-01T17:29:00",
  },
  {
    id: "m2",
    reward_item_id: "m2",
    title: "ยอดนักอ่าน",
    description: "มียอดไลก์รวมครบ 50 ครั้ง",
    current: 50,
    target: 50,
    status: "CLAIMED",
    reward: {
      id: "m2",
      type: "FRAME",
      name: "กรอบคริสตัลเวทมนตร์",
      previewUrl: "/frames/frame-crystal-magic.svg",
    },
    completedAt: "2026-07-05T09:14:00",
  },
  {
    id: "m5",
    reward_item_id: "m5",
    title: "ผู้ร่วมแบ่งปันความรู้",
    description: "สร้างโพสต์แบ่งปันชีทสรุปบทเรียน",
    current: 10,
    target: 10,
    status: "CLAIMED",
    reward: {
      id: "m5",
      type: "FRAME",
      name: "กรอบน่ารักสดใสการศึกษา",
      previewUrl: "/frames/frame-friendly-edu.svg",
    },
    completedAt: "2026-07-10T14:20:00",
  },
  {
    id: "m6",
    reward_item_id: "m6",
    title: "นักท่องโลกไซเบอร์",
    description: "เข้าสู่ระบบและมีปฏิสัมพันธ์ในชุมชนอย่างต่อเนื่อง",
    current: 5,
    target: 5,
    status: "CLAIMED",
    reward: {
      id: "m6",
      type: "FRAME",
      name: "กรอบนีออนไซเบอร์",
      previewUrl: "/frames/frame-cyber-neon.svg",
    },
    completedAt: "2026-07-12T11:00:00",
  },
  {
    id: "m7",
    reward_item_id: "m7",
    title: "เพลิงสุริยะร้อนแรง",
    description: "สร้างความร้อนแรงในการมีส่วนร่วมกับชุมชน",
    current: 1,
    target: 1,
    status: "CLAIMED",
    reward: {
      id: "m7",
      type: "FRAME",
      name: "กรอบเพลิงสุริยะ",
      previewUrl: "/frames/frame-inferno-flame.svg",
    },
    completedAt: "2026-07-15T12:00:00",
  },
  {
    id: "m8",
    reward_item_id: "m8",
    title: "ท่องห้วงอวกาศ",
    description: "สำรวจความรู้ไร้ที่สิ้นสุดในกาแล็กซี่",
    current: 1,
    target: 1,
    status: "CLAIMED",
    reward: {
      id: "m8",
      type: "FRAME",
      name: "กรอบกาแล็กซี่ห้วงอวกาศ",
      previewUrl: "/frames/frame-galaxy-cosmic.svg",
    },
    completedAt: "2026-07-15T12:30:00",
  },
  {
    id: "m9",
    reward_item_id: "m9",
    title: "ผู้พิทักษ์พฤกษา",
    description: "เติบโตและผลิบานไปกับความรู้ใหม่ๆ",
    current: 1,
    target: 1,
    status: "CLAIMED",
    reward: {
      id: "m9",
      type: "FRAME",
      name: "กรอบมรกตพฤกษา",
      previewUrl: "/frames/frame-emerald-nature.svg",
    },
    completedAt: "2026-07-15T13:00:00",
  },
  {
    id: "m10",
    reward_item_id: "m10",
    title: "ผู้พิชิตเหมันต์",
    description: "เยือกเย็นและเฉียบคมในการเรียนรู้",
    current: 1,
    target: 1,
    status: "CLAIMED",
    reward: {
      id: "m10",
      type: "FRAME",
      name: "กรอบธารน้ำแข็งเหมันต์",
      previewUrl: "/frames/frame-frost-glacier.svg",
    },
    completedAt: "2026-07-15T13:30:00",
  },
  {
    id: "m11",
    reward_item_id: "m11",
    title: "ซากุระแรกแย้ม",
    description: "ส่งต่อความสดใสและมิตรภาพในชุมชน",
    current: 1,
    target: 1,
    status: "CLAIMED",
    reward: {
      id: "m11",
      type: "FRAME",
      name: "กรอบซากุระผลิบาน",
      previewUrl: "/frames/frame-sakura-blossom.svg",
    },
    completedAt: "2026-07-15T14:00:00",
  },
  {
    id: "m12",
    reward_item_id: "m12",
    title: "พลังแห่งความมืด",
    description: "ครอบครองพลังลึกลับแห่งห้วงอเวจี",
    current: 1,
    target: 1,
    status: "CLAIMED",
    reward: {
      id: "m12",
      type: "FRAME",
      name: "กรอบเงาทมิฬแอ็บบิส",
      previewUrl: "/frames/frame-void-shadow.svg",
    },
    completedAt: "2026-07-15T14:30:00",
  },
  {
    id: "m13",
    reward_item_id: "m13",
    title: "ประกายรุ้งเจิดจรัส",
    description: "เปล่งประกายสีสันอันสดใสสู่โลกการเรียนรู้",
    current: 1,
    target: 1,
    status: "CLAIMED",
    reward: {
      id: "m13",
      type: "FRAME",
      name: "กรอบแสงเหนือรุ้งประกาย",
      previewUrl: "/frames/frame-aurora-rainbow.svg",
    },
    completedAt: "2026-07-15T15:00:00",
  },
  {
    id: "m14",
    reward_item_id: "m14",
    title: "วิศวกรเครื่องกล",
    description: "ขับเคลื่อนฟันเฟืองแห่งปัญญาและความคิดสร้างสรรค์",
    current: 1,
    target: 1,
    status: "CLAIMED",
    reward: {
      id: "m14",
      type: "FRAME",
      name: "กรอบเฟืองกลสตีมพังก์",
      previewUrl: "/frames/frame-steampunk-gear.svg",
    },
    completedAt: "2026-07-15T15:30:00",
  },
  {
    id: "m15",
    reward_item_id: "m15",
    title: "เพชรน้ำหนึ่ง",
    description: "ยอดเยี่ยม เลอค่า และเปล่งประกายไร้ที่ติ",
    current: 1,
    target: 1,
    status: "CLAIMED",
    reward: {
      id: "m15",
      type: "FRAME",
      name: "กรอบเพชรแพลทินัมเลอค่า",
      previewUrl: "/frames/frame-diamond-platinum.svg",
    },
    completedAt: "2026-07-15T16:00:00",
  },
  {
    id: "m16",
    reward_item_id: "m16",
    title: "แฮกเกอร์โค้ดดิ้ง",
    description: "เจาะทะลุทุกมิติข้อมูลด้วยพลังแห่งดิจิทัล",
    current: 1,
    target: 1,
    status: "CLAIMED",
    reward: {
      id: "m16",
      type: "FRAME",
      name: "กรอบไซเบอร์เมทริกซ์",
      previewUrl: "/frames/frame-glitch-matrix.svg",
    },
    completedAt: "2026-07-15T16:30:00",
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

      let list = [];
      if (
        response.data?.success &&
        Array.isArray(response.data?.data) &&
        response.data.data.length > 0
      ) {
        list = response.data.data.map(mapMilestoneToAchievement);
      } else {
        list = [...MOCK_MILESTONES];
      }

      // Merge user unlocked items from inventory if available
      try {
        const invRes = await api.get("/users/me/inventory");
        const invList = invRes.data?.data || [];
        invList.forEach((inv) => {
          if (inv.item && (inv.item.item_type === "FRAME" || inv.item.item_type === "THEME")) {
            const existing = list.find((x) => x.id === inv.item.id || x.reward_item_id === inv.item.id);
            if (!existing) {
              list.push({
                id: inv.item.id,
                reward_item_id: inv.item.id,
                title: inv.item.item_name,
                description: inv.item.metadata?.description || "ของรางวัลสะสม",
                current: 1,
                target: 1,
                status: "CLAIMED",
                reward: {
                  id: inv.item.id,
                  type: inv.item.item_type,
                  name: inv.item.item_name,
                  previewUrl: inv.item.image_url,
                },
                completedAt: inv.unlocked_at,
              });
            } else {
              existing.status = "CLAIMED";
            }
          }
        });
      } catch (invErr) {
        // Inventory fetch is optional
      }

      // Ensure default starter frames are ALWAYS included and claimed so the user has frames to wear!
      DEFAULT_FRAMES.forEach((df) => {
        const alreadyExists = list.some(
          (item) =>
            item.id === df.id ||
            item.reward?.previewUrl === df.reward?.previewUrl ||
            item.reward_item_id === df.id,
        );
        if (!alreadyExists) {
          list.unshift(df);
        }
      });

      return list;
    } catch (error) {
      console.log("Achievements fetch notice, using fallback:", error);
      return MOCK_MILESTONES;
    }
  },

  // Claim achievement reward (POST /achievements/:id/claim)
  claimMilestone: async (id) => {
    try {
      const response = await api.post(`/achievements/${id}/claim`);
      return response.data;
    } catch (err) {
      if (err.response?.status === 404) {
        const fallbackRes = await api.post(`/milestones/${id}/claim`);
        return fallbackRes.data;
      }
      throw err;
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
