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

  // Fetch Milestones (Temporarily disabled due to RLS blocking direct access)
  getMilestones: async () => {
    return [];
  },

  // Fetch User Stats (Temporarily disabled due to RLS blocking direct access)
  getStats: async () => {
    return {
      points: 0,
      postsCount: 0,
      likesReceived: 0,
      viewsReceived: 0
    };
  }
};

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
  }));
}

function formatNumber(num) {
  if (!num) return '0';
  if (num >= 1000) {
    return (num / 1000).toFixed(1) + 'k';
  }
  return num.toString();
}

function mapEducationLevel(level) {
  switch (level) {
    case 'MIDDLE_SCHOOL': return 'มัธยมศึกษาตอนต้น';
    case 'HIGH_SCHOOL': return 'มัธยมศึกษาตอนปลาย';
    case 'UNIVERSITY': return 'มหาวิทยาลัย';
    default: return level;
  }
}
