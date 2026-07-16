import api from '../utils/api';
import { supabase } from '../utils/supabase';

export const profileService = {
  // Fetch My Posts (Active/Published)
  getMyPosts: async () => {
    try {
      const response = await api.get('/posts/user/my-posts');
      if (response.data.success) {
        return formatPosts(response.data.data.filter(p => p.post_status === 'ACTIVE'));
      }
      return [];
    } catch (error) {
      console.error('Error fetching my posts:', error);
      throw error;
    }
  },

  // Fetch Drafts
  getDrafts: async () => {
    try {
      const response = await api.get('/posts/user/my-posts');
      if (response.data.success) {
        return formatPosts(response.data.data.filter(p => p.post_status === 'DRAFT'));
      }
      return [];
    } catch (error) {
      console.error('Error fetching drafts:', error);
      throw error;
    }
  },

  // Fetch Bookmarks (Temporarily disabled due to missing backend API)
  getBookmarks: async () => {
    return [];
  },

  // Fetch Milestones (Temporarily disabled due to RLS blocking direct access — falls back to mock data)
  getMilestones: async () => {
    try {
      const response = await api.get('/achievements/my-milestones');
      if (response.data.success) return response.data.data;
      return MOCK_MILESTONES;
    } catch (error) {
      return MOCK_MILESTONES;
    }
  },

  // Fetch User Stats (Temporarily disabled due to RLS blocking direct access)
  getStats: async () => {
    return {
      points: 0,
      postsCount: 0,
      likesReceived: 0,
      viewsReceived: 0
    };
  },

  // Update Profile Info
  updateProfile: async (userId, data) => {
    try {
      // Create FormData if there are files
      if (data.avatarFile || data.wallpaperFile) {
        // Normally we'd use formData here to send files to the backend
        // const formData = new FormData();
        // Object.keys(data).forEach(key => formData.append(key, data[key]));
        // return await api.put('/users/profile/with-media', formData, {
        //   headers: { 'Content-Type': 'multipart/form-data' }
        // });
      }

      // Fallback: If no dedicated file API exists, try standard update
      // Since backend endpoint isn't fully confirmed, we'll try API first, then Supabase
      try {
         const response = await api.put('/users/profile', data);
         return response.data;
      } catch (apiError) {
         console.log("API /users/profile update failed or doesn't exist, falling back to Supabase", apiError);
         
         const updatePayload = {
            nickname: data.nickname,
            bio: data.bio,
            education_level: data.education_level,
            updated_at: new Date()
         };
         
         // In Supabase, if we have custom fields, we might need a separate query
         // We update basic fields in `users` table
         const { data: updatedData, error } = await supabase
            .from('users')
            .update(updatePayload)
            .eq('id', userId)
            .select()
            .single();

         if (error) throw error;
         
         // Also update auth metadata
         await supabase.auth.updateUser({
           data: {
             education_level: data.education_level,
             bio: data.bio,
             username: data.nickname,
             instagram_url: data.instagram_url,
             facebook_url: data.facebook_url,
             profile_frame_id: data.profile_frame_id,
             wallpaper_url: data.wallpaper_url,
             occupation: data.occupation,
             location: data.location,
             tags: data.tags,
             enter_screen_enabled: data.enter_screen_enabled,
             enter_screen_message: data.enter_screen_message,
             theme_settings: data.theme_settings,
             notification_preferences: data.notification_preferences
           }
         });

         return { success: true, data: updatedData };
      }
    } catch (error) {
      console.error('Error updating profile:', error);
      throw error;
    }
  }
};

// Mock achievement catalog — reward is either a profile-picture FRAME or a
// WALLPAPER background image, equipped via updateProfile once claimed.
const MOCK_MILESTONES = [
  {
    id: 'm1',
    title: 'นักเรียนดีเด่น',
    description: 'มีผู้ติดตามครบ 10 คน',
    current: 12,
    target: 10,
    status: 'CLAIMED',
    reward: { type: 'FRAME', name: 'กรอบทอง', previewUrl: null },
    completedAt: '2026-07-01T17:29:00',
  },
  {
    id: 'm2',
    title: 'ยอดนักอ่าน',
    description: 'มียอดไลก์รวมครบ 50 ครั้ง',
    current: 50,
    target: 50,
    status: 'READY_TO_CLAIM',
    reward: { type: 'FRAME', name: 'กรอบไพลิน', previewUrl: null },
    completedAt: '2026-07-05T09:14:00',
  },
  {
    id: 'm3',
    title: 'นักเขียนตัวยง',
    description: 'เผยแพร่โพสต์ครบ 5 โพสต์',
    current: 2,
    target: 5,
    status: 'LOCKED',
    reward: { type: 'WALLPAPER', name: 'ท้องฟ้ายามเช้า', previewUrl: 'https://images.unsplash.com/photo-1470252649378-9c29740c9fa8?w=800&q=80' },
  },
  {
    id: 'm4',
    title: 'ขวัญใจชุมชน',
    description: 'มียอดไลก์รวมครบ 100 ครั้ง',
    current: 50,
    target: 100,
    status: 'LOCKED',
    reward: { type: 'WALLPAPER', name: 'เมืองยามค่ำคืน', previewUrl: 'https://images.unsplash.com/photo-1519681393784-d120267933ba?w=800&q=80' },
  },
];

// Helper function to format data for PostCard component
function formatPosts(data) {
  if (!data) return [];
  return data.map(post => ({
    id: post.id,
    title: post.title,
    level: mapEducationLevel(post.education_level),
    subject: post.category?.category_name || post.category?.name || 'ทั่วไป',
    views: formatNumber(post.view_count),
    likes: post._count?.likes || post.likes || 0,
    image: post.cover_image || 'https://images.unsplash.com/photo-1456513080510-7bf3a84b82f8?w=500&q=80',
    author: post.author?.username || 'ผู้ใช้งาน',
    created_at: post.created_at,
  }));
}

function formatNumber(num) {
  if (!num) return '0';
  if (num >= 1000) {
    return (num / 1000).toFixed(1) + 'k';
  }
  return num.toString();
}

export function mapEducationLevel(level) {
  switch (level) {
    case 'MIDDLE_SCHOOL': return 'มัธยมศึกษาตอนต้น';
    case 'HIGH_SCHOOL': return 'มัธยมศึกษาตอนปลาย';
    case 'UNIVERSITY': return 'มหาวิทยาลัย';
    default: return level;
  }
}
