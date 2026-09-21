import api from "../utils/api";

export const DEFAULT_FRAMES = [
  {
    id: "m1",
    reward_item_id: "m1",
    title: "ยินดีต้อนรับสู่ ShareEd",
    description: "สมัครสมาชิกและเข้าสู่ระบบ ShareEd ครั้งแรก",
    milestone_type: "LOGIN_STREAK",
    achievement_type: "LOGIN_STREAK",
    current: 1,
    target: 1,
    // Template records are display-only until the backend confirms ownership.
    status: "LOCKED",
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
    milestone_type: "POSTS_CREATED",
    achievement_type: "POSTS_CREATED",
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
    milestone_type: "POST_LIKES",
    achievement_type: "POST_LIKES",
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
    milestone_type: "FOLLOWERS_COUNT",
    achievement_type: "FOLLOWERS_COUNT",
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
    milestone_type: "COMMENTS_CREATED",
    achievement_type: "COMMENTS_CREATED",
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
    milestone_type: "LOGIN_STREAK",
    achievement_type: "LOGIN_STREAK",
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
    milestone_type: "POSTS_CREATED",
    achievement_type: "POSTS_CREATED",
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
    milestone_type: "POST_LIKES",
    achievement_type: "POST_LIKES",
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
    milestone_type: "FOLLOWERS_COUNT",
    achievement_type: "FOLLOWERS_COUNT",
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
    milestone_type: "COMMENTS_CREATED",
    achievement_type: "COMMENTS_CREATED",
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
    milestone_type: "LOGIN_STREAK",
    achievement_type: "LOGIN_STREAK",
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
    milestone_type: "POSTS_CREATED",
    achievement_type: "POSTS_CREATED",
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
    milestone_type: "POST_LIKES",
    achievement_type: "POST_LIKES",
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
    milestone_type: "FOLLOWERS_COUNT",
    achievement_type: "FOLLOWERS_COUNT",
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
        return await mergeProfileBookmarkStatus(formatPosts(
          response.data.data.filter((p) => p.post_status === "ACTIVE"),
        ));
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

  // Fetch Bookmarks
  getBookmarks: async () => {
    try {
      const response = await api.get("/bookmarks");
      if (response.data?.success && Array.isArray(response.data?.data)) {
        const posts = response.data.data
          .map((b) => (b.post ? { ...b.post, id: b.post.id || b.post_id, isBookmarked: true } : b))
          .filter(Boolean);
        return formatPosts(posts);
      }
      return [];
    } catch (error) {
      console.log("Error fetching bookmarks:", error);
      return [];
    }
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

      // Keep the designed templates for presentation, but replace a matching
      // template with the backend record so claims/equips use real UUIDs.
      const map = new Map();
      DEFAULT_FRAMES.forEach((df) => {
        map.set(df.id, {
          ...df,
          status: "LOCKED",
          is_template: true,
          reward: df.reward ? { ...df.reward } : null,
        });
      });

      // Overlay live backend achievements
      backendList.forEach((item) => {
        const normalizedTitle = item.title?.trim().toLowerCase();
        const normalizedRewardName = item.reward?.name?.trim().toLowerCase();
        const templateEntry = Array.from(map.entries()).find(([, candidate]) =>
          candidate.is_template &&
          ((normalizedTitle && candidate.title?.trim().toLowerCase() === normalizedTitle) ||
            (normalizedRewardName && candidate.reward?.name?.trim().toLowerCase() === normalizedRewardName)),
        );
        const key = templateEntry?.[0] || item.id || item.reward_item_id;
        const template = templateEntry?.[1];
        map.set(key, {
          ...template,
          ...item,
          template_id: template?.id || null,
          is_template: false,
          reward: item.reward
            ? { ...template?.reward, ...item.reward }
            : template?.reward || null,
        });
      });

      // Inventory is the source of truth for items the current user may equip.
      try {
        const invRes = await api.get("/users/me/inventory");
        const invList = invRes.data?.data || [];
        invList.forEach((inv) => {
          if (inv.item && (inv.item.item_type === "FRAME" || inv.item.item_type === "THEME")) {
            let matched = false;
            for (const [, v] of map.entries()) {
              if (
                v.id === inv.item.id ||
                v.reward_item_id === inv.item.id ||
                v.reward?.id === inv.item.id
              ) {
                v.status = "CLAIMED";
                v.reward_item_id = inv.item.id;
                if (v.reward) v.reward.id = inv.item.id;
                matched = true;
              }
            }

            // An owned reward can exist even when its achievement is no longer
            // returned. Keep it selectable and retain the backend reward UUID.
            if (!matched) {
              map.set(`inventory:${inv.item.id}`, {
                id: `inventory:${inv.item.id}`,
                reward_item_id: inv.item.id,
                title: inv.item.item_name,
                description: inv.item.metadata?.description || "ของรางวัลที่ปลดล็อกแล้ว",
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
            }
          }
        });
      } catch (invErr) {
        // Inventory fetch is optional
      }

      return Array.from(map.values());
    } catch (error) {
      console.log("Achievements fetch notice, using default designed achievements:", error);
      return DEFAULT_FRAMES.map((df) => ({
        ...df,
        status: "LOCKED",
        reward: df.reward ? { ...df.reward } : null,
      }));
    }
  },

  // Claim achievement reward (POST /achievements/:id/claim)
  claimMilestone: async (id) => {
    let response;
    try {
      response = await api.post(`/achievements/${id}/claim`);
    } catch (error) {
      if (error.response?.status !== 404) throw error;
      response = await api.post(`/milestones/${id}/claim`);
    }

    if (response.data?.success === false) {
      throw new Error(response.data?.message || "ไม่สามารถรับรางวัลได้");
    }

    return response.data;
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
      throw error;
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

  // Get a public profile using the internal user id (GET /users/:id)
  getUserProfile: async (userId) => {
    try {
      const response = await api.get(`/users/${encodeURIComponent(userId)}`);
      return response.data?.data || response.data;
    } catch (error) {
      console.error(`Error fetching profile for user ${userId}:`, error);
      throw error;
    }
  },

  // Get User Posts by author ID
  getUserPosts: async (userId) => {
    try {
      try {
        const response = await api.get(`/posts/user/${userId}`);
        if (response.data?.success && Array.isArray(response.data?.data)) {
          return await mergeProfileBookmarkStatus(
            formatPosts(response.data.data.filter((p) => p.post_status === "ACTIVE")),
          );
        }
      } catch (_) {}

      // Fallback: fetch active posts and filter by author ID
      const response = await api.get("/posts");
      if (response.data?.success && Array.isArray(response.data?.data)) {
        const userPosts = response.data.data.filter(
          (p) => String(p.author_id || p.author?.id || p.user_id) === String(userId) && p.post_status === "ACTIVE"
        );
        return await mergeProfileBookmarkStatus(formatPosts(userPosts));
      }
      return [];
    } catch (error) {
      console.error(`Error fetching posts for user ${userId}:`, error);
      return [];
    }
  },

  // Follow a user (POST /follow/:id)
  followUser: async (userId) => {
    try {
      const response = await api.post(`/follow/${userId}`);
      return response.data;
    } catch (error) {
      console.error(`Error following user ${userId}:`, error);
      throw error;
    }
  },

  // Unfollow a user (DELETE /follow/:id)
  unfollowUser: async (userId) => {
    try {
      const response = await api.delete(`/follow/${userId}`);
      return response.data;
    } catch (error) {
      console.error(`Error unfollowing user ${userId}:`, error);
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
  const rewardItemId = m.reward_item_id || m.reward_item?.id || null;
  return {
    id: m.id,
    reward_item_id: rewardItemId,
    milestone_type: m.milestone_type || m.achievement_type,
    achievement_type: m.achievement_type || m.milestone_type,
    title: m.title,
    description: m.description,
    current: m.current_progress,
    target: m.target_value,
    status: m.status, // backend already computes LOCKED|READY_TO_CLAIM|CLAIMED
    reward: m.reward_item
      ? {
          id: rewardItemId,
          type: m.reward_item.item_type, // FRAME | THEME (no WALLPAPER on the real backend)
          name: m.reward_item.item_name,
          previewUrl: m.reward_item.image_url,
        }
      : null,
    completedAt: m.completed_at,
  };
}

import { resolveCategoryName } from './post.service';

async function mergeProfileBookmarkStatus(posts) {
  const token = localStorage.getItem("access_token");
  if (!token || token === "undefined" || token === "null" || !posts.length) {
    return posts;
  }

  try {
    const response = await api.get("/bookmarks");
    const bookmarks = response.data?.success && Array.isArray(response.data?.data)
      ? response.data.data
      : [];
    const bookmarkedIds = new Set(
      bookmarks
        .map((bookmark) => bookmark.post_id || bookmark.postId || bookmark.post?.id)
        .filter(Boolean)
        .map(String),
    );

    return posts.map((post) => ({
      ...post,
      isBookmarked: bookmarkedIds.has(String(post.id)),
    }));
  } catch (error) {
    console.error("Error merging profile bookmark status:", error);
    return posts;
  }
}

// Helper function to format data for PostCard component
function formatPosts(data) {
  if (!data) return [];
  return data.map((post) => {
    const authorUsername = post.author?.username || (typeof post.author === 'string' ? post.author : "ผู้ใช้งาน");
    const authorId = post.author_id || post.author?.id || post.author?.user_id || post.user_id || null;
    const authorAvatar = post.author?.avatar_url || post.author?.profile_image || post.author?.avatar || post.author_avatar || null;
    const authorFrameId = post.author?.current_frame_id || post.author_frame_id || post.authorFrameId || null;
    const authorFrame = post.author?.current_frame || post.author_frame || post.authorFrame || null;

    return {
      id: post.id,
      title: post.title,
      description: post.summary || "ไม่มีคำอธิบาย",
      level: mapEducationLevel(post.education_level),
      subject: resolveCategoryName(post),
      views: formatNumber(post.view_count),
      likes: post._count?.likes || (typeof post.likes === 'number' ? post.likes : 0),
      isLiked: Boolean(post.is_liked || post.isLiked || post.has_liked),
      isBookmarked: Boolean(post.is_bookmarked || post.isBookmarked || post.has_bookmarked),
      image:
        post.cover_image ||
        (post.post_status === "DRAFT"
          ? "/draft-placeholder.png"
          : "https://images.unsplash.com/photo-1456513080510-7bf3a84b82f8?w=500&q=80"),
      author: authorUsername,
      author_id: authorId,
      authorId: authorId,
      authorAvatar: authorAvatar,
      author_avatar: authorAvatar,
      author_frame_id: authorFrameId,
      authorFrameId: authorFrameId,
      author_frame: authorFrame,
      authorFrame: authorFrame,
      created_at: post.created_at,
    };
  });
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
