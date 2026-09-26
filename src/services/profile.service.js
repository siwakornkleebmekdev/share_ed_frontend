import api from "../utils/api";
import { supabase } from "../utils/supabase";

export const profileService = {
  // ดึงรายการโพสต์ของฉัน (สถานะเผยแพร่ ACTIVE)
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

  // ดึงรายการโพสต์ฉบับร่าง (สถานะ DRAFT)
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

  // ดึงรายการโพสต์ที่บันทึกไว้ (Bookmarks)
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

  // ดึงรายการความสำเร็จ/ภารกิจทั้งหมดของผู้ใช้จาก Backend (GET /achievements หรือ /milestones)
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

      const rows = response.data?.data || response.data;
      const backendList = Array.isArray(rows) ? rows.map(mapMilestoneToAchievement) : [];
      const map = new Map(backendList.map((item) => [String(item.id), item]));

      // ดึงข้อมูลคลังไอเทม (Inventory) ซึ่งเป็นแหล่งข้อมูลหลักที่ยืนยันว่าผู้ใช้ปลดล็อกของรางวัลใดแล้วบ้าง เพื่ออัปเดตสถานะเป็น CLAIMED
      try {
        const invRes = await api.get("/users/me/inventory");
        const invList = invRes.data?.data || [];
        invList.forEach((inv) => {
          if (inv.item?.item_type === "FRAME") {
            let matched = false;
            for (const [, v] of map.entries()) {
              if (String(v.reward_item_id || v.reward?.id) === String(inv.item.id)) {
                v.status = "CLAIMED";
                v.reward_item_id = inv.item.id;
                if (v.reward) v.reward.id = inv.item.id;
                matched = true;
              }
            }

            // ของรางวัลที่เคยปลดล็อกแล้วจะยังคงอยู่ในคลัง แม้ภารกิจต้นทางจะถูกปรับเปลี่ยนหรือลบไปแล้ว
            // ยังคงสามารถเลือกสวมใส่ได้โดยใช้ UUID จากฐานข้อมูลจริง
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
        // การดึงข้อมูล Inventory เป็นแบบทางเลือก (หากล้มเหลวยังใช้งานภารกิจหลักได้)
      }

      return Array.from(map.values());
    } catch (error) {
      console.warn("Unable to fetch achievements:", error);
      throw error;
    }
  },

  // กดรับรางวัลความสำเร็จ (POST /achievements/:id/claim หรือ /milestones/:id/claim)
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

  // ดึงรายการของรางวัลในคลังที่ผู้ใช้ปลดล็อกแล้ว (GET /users/me/inventory)
  getUserInventory: async () => {
    try {
      const response = await api.get("/users/me/inventory");
      return response.data?.data || [];
    } catch (error) {
      console.warn("Error fetching inventory:", error);
      return [];
    }
  },

  // สวมใส่กรอบรูปหรือธีมผ่าน API จริง (PUT /users/equip)
  equipItem: async (itemId, type = "FRAME") => {
    try {
      const response = await api.put("/users/equip", {
        itemId: itemId || null,
        type,
      });
      return { success: response.data?.success !== false, data: response.data?.data || response.data };
    } catch (error) {
      console.warn(`Backend equip ${type} notice:`, error?.response?.data || error.message);
      return { success: false, error: error?.response?.data || error.message };
    }
  },

  // ดึงสถิติผู้ใช้ (ปิดใช้งานชั่วคราวเนื่องจาก RLS)
  getStats: async () => {
    return {
      points: 0,
      postsCount: 0,
      likesReceived: 0,
      viewsReceived: 0,
    };
  },

  // อัปเดตข้อมูลโปรไฟล์ผู้ใช้
  updateProfile: async (userId, data) => {
    try {
      const hasFiles = data.avatarFile || data.wallpaperFile || data.bannerFile;

      if (hasFiles) {
        // สร้าง FormData กรณีมีไฟล์อัปโหลด
        const formData = new FormData();

        if (data.avatarFile) formData.append("avatar", data.avatarFile);
        if (data.wallpaperFile) formData.append("wallpaper", data.wallpaperFile);
        if (data.bannerFile) formData.append("banner", data.bannerFile);

        // แนบฟิลด์ข้อความทั่วไป
        if (data.username !== undefined) formData.append("username", data.username);
        if (data.nickname !== undefined) formData.append("nickname", data.nickname);
        if (data.bio !== undefined) formData.append("bio", data.bio);
        if (data.education_level !== undefined) formData.append("education_level", data.education_level);

        // ลิงก์โซเชียลมีเดีย
        if (data.facebook_url !== undefined) formData.append("facebook_url", data.facebook_url);
        if (data.instagram_url !== undefined) formData.append("instagram_url", data.instagram_url);
        if (data.discord_url !== undefined) formData.append("discord_url", data.discord_url);

        const response = await api.put("/users/profile/with-media", formData);
        return response.data;
      }

      // หากไม่มีไฟล์รูปภาพ ให้ส่งเป็น JSON ปกติ
      const response = await api.put("/users/profile", data);
      return response.data;
    } catch (error) {
      console.error("Error updating profile:", error);
      throw error;
    }
  },

  // ดึงข้อมูลโปรไฟล์สาธารณะด้วย User ID (GET /users/:id)
  getUserProfile: async (userId) => {
    try {
      const response = await api.get(`/users/${encodeURIComponent(userId)}`, {
        requiresAuth: false,
      });
      return response.data?.data || response.data;
    } catch (error) {
      console.error(`Error fetching profile for user ${userId}:`, error);
      throw error;
    }
  },

  // ดึงโพสต์ของนักเขียนด้วย Author ID
  getUserPosts: async (userId) => {
    try {
      try {
        const response = await api.get(`/posts/user/${userId}`, { requiresAuth: false });
        if (response.data?.success && Array.isArray(response.data?.data)) {
          return await mergeProfileBookmarkStatus(
            formatPosts(response.data.data.filter((p) => p.post_status === "ACTIVE")),
          );
        }
      } catch (_) {}

      // สำรอง: ดึงโพสต์ที่เผยแพร่แล้วและกรองตาม Author ID
      const response = await api.get("/posts", { requiresAuth: false });
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

  // ติดตามผู้ใช้ (POST /follow/:id)
  followUser: async (userId) => {
    try {
      const response = await api.post(`/follow/${userId}`);
      return response.data;
    } catch (error) {
      console.error(`Error following user ${userId}:`, error);
      throw error;
    }
  },

  // ยกเลิกการติดตามผู้ใช้ (DELETE /follow/:id)
  unfollowUser: async (userId) => {
    try {
      const response = await api.delete(`/follow/${userId}`);
      return response.data;
    } catch (error) {
      console.error(`Error unfollowing user ${userId}:`, error);
      throw error;
    }
  },

  // Fetch Followers of a user (GET /follow/:userId/followers)
  getFollowers: async (userId) => {
    try {
      const response = await api.get(`/follow/${encodeURIComponent(userId)}/followers`, {
        requiresAuth: false,
      });
      return response.data?.data || [];
    } catch (error) {
      console.error(`Error fetching followers for ${userId}:`, error);
      return [];
    }
  },

  // Fetch Following of a user (GET /follow/:userId/following)
  getFollowing: async (userId) => {
    try {
      const response = await api.get(`/follow/${encodeURIComponent(userId)}/following`, {
        requiresAuth: false,
      });
      return response.data?.data || [];
    } catch (error) {
      console.error(`Error fetching following for ${userId}:`, error);
      return [];
    }
  },
};

// แปลงโครงสร้างข้อมูล Milestone/Achievement จาก Backend ให้เป็นรูปแบบมาตรฐานสำหรับหน้า UI (Achievements.jsx และ Store)




function mapMilestoneToAchievement(m) {
  const rewardItemId = m.reward_item_id || m.reward_item?.id || m.reward?.id || null;
  const reward = m.reward_item || m.reward;
  return {
    id: m.id,
    reward_item_id: rewardItemId,
    milestone_type: m.milestone_type || m.achievement_type,
    achievement_type: m.achievement_type || m.milestone_type,
    title: m.title,
    description: m.description,
    current: m.current_progress,
    target: m.target_value,
    status: m.status, // ระบบหลังบ้านคำนวณสถานะมาให้แล้ว (LOCKED | READY_TO_CLAIM | CLAIMED)
    reward: reward
      ? {
          id: rewardItemId,
          type: reward.item_type || reward.type,
          name: reward.item_name || reward.name,
          previewUrl: reward.image_url || reward.previewUrl,
        }
      : null,
    completedAt: m.completed_at,
  };
}

import { resolveCategoryName } from './post.service';

async function mergeProfileBookmarkStatus(posts) {
  if (!posts.length) {
    return posts;
  }

  try {
    const { data, error } = await supabase.auth.getSession();
    if (error || !data?.session) return posts;

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

// ฟังก์ชันแปลงรูปแบบข้อมูลโพสต์สำหรับการ์ด PostCard
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

// ปรับค่าผู้ติดตาม (Followers) และกำลังติดตาม (Following) ให้ถูกต้องตามการตอบกลับของ Backend API




export function normalizeFollowCounts(userProfile) {
  return {
    followersCount: userProfile?._count?.following || 0,
    followingCount: userProfile?._count?.followers || 0,
  };
}
