import api from '../utils/api';

export const postService = {
  // Fetch all posts (Active/Published)
  getAllPosts: async () => {
    try {
      const response = await api.get('/posts');
      if (response.data.success) {
        return response.data.data.map(formatPostData);
      }
      return [];
    } catch (error) {
      console.error('Error fetching all posts:', error);
      throw error;
    }
  },
  
  // Fetch a single post by ID
  getPostById: async (id) => {
    try {
      const response = await api.get(`/posts/${id}`);
      if (response.data.success) {
        return formatSinglePostData(response.data.data);
      }
      return null;
    } catch (error) {
      console.error(`Error fetching post ${id}:`, error);
      throw error;
    }
  }
};

function formatPostData(post) {
  return {
    id: post.id,
    title: post.title,
    description: post.summary || 'ไม่มีคำอธิบาย',
    level: mapEducationLevel(post.education_level),
    subject: post.category?.category_name || post.category?.name || 'ทั่วไป',
    views: formatNumber(post.view_count),
    likes: post._count?.likes || post.likes || 0,
    image: post.cover_image || 'https://images.unsplash.com/photo-1456513080510-7bf3a84b82f8?w=500&q=80',
    author: post.author?.username || 'ผู้ใช้งาน',
    created_at: post.created_at,
  };
}

function formatSinglePostData(post) {
  const pdfMedia = post.media?.find(m => m.media_type === 'PDF');
  const hashtags = post.tags?.map(t => t.tag?.tag_name) || [];
  const images = post.media?.filter(m => m.media_type === 'IMAGE').map(m => m.media_url) || [];

  return {
    id: post.id,
    title: post.title,
    description: post.summary || 'ไม่มีคำอธิบาย',
    details: post.content || '<p>ไม่มีเนื้อหา</p>',
    level: mapEducationLevel(post.education_level),
    category: post.category?.category_name || post.category?.name || 'ทั่วไป',
    views: formatNumber(post.view_count),
    likes: post._count?.likes || post.likes || 0,
    coverImage: post.cover_image || 'https://images.unsplash.com/photo-1456513080510-7bf3a84b82f8?w=500&q=80',
    hashtags: hashtags,
    images: images,
    pdf: pdfMedia ? {
      name: 'เอกสารประกอบการเรียน.pdf',
      url: pdfMedia.media_url,
      size: '2MB'
    } : null,
    author: {
      name: post.author?.username || 'ผู้ใช้งาน',
      role: 'Contributor',
      avatar: post.author?.profile_image || 'https://ui-avatars.com/api/?name=' + (post.author?.username || 'User'),
    },
    createdAt: new Date(post.created_at).toLocaleDateString('th-TH', { year: 'numeric', month: 'long', day: 'numeric' }),
  };
}

function mapEducationLevel(level) {
  switch (level) {
    case 'MIDDLE_SCHOOL': return 'มัธยมศึกษาตอนต้น';
    case 'HIGH_SCHOOL': return 'มัธยมศึกษาตอนปลาย';
    case 'UNIVERSITY': return 'มหาวิทยาลัย';
    default: return level;
  }
}

function formatNumber(num) {
  if (!num) return '0';
  if (num >= 1000) {
    return (num / 1000).toFixed(1) + 'k';
  }
  return num.toString();
}
