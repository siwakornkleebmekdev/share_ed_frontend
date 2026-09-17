import api from '../utils/api.js';
import { categoryService } from './category.service.js';

// ดึงชื่อไฟล์จาก URL (รองรับทั้ง URL ปกติและ Cloudinary URL ที่มี URL encoding)
function extractFileNameFromUrl(url) {
  if (!url) return 'เอกสารประกอบการเรียน.pdf';
  try {
    const decoded = decodeURIComponent(url);
    const segments = decoded.split('/');
    const fileName = segments[segments.length - 1];
    return fileName || 'เอกสารประกอบการเรียน.pdf';
  } catch {
    return 'เอกสารประกอบการเรียน.pdf';
  }
}

export const postService = {
  // Fetch all posts (Active/Published)
  getAllPosts: async (params = {}) => {
    try {
      const response = await api.get('/posts', { params });
      if (response.data.success) {
        const posts = response.data.data.map(formatPostData);
        return await mergeBookmarkStatus(posts);
      }
      return [];
    } catch (error) {
      console.error('Error fetching all posts:', error);
      throw error;
    }
  },

  // Get categories helper
  getCategories: async () => {
    return await categoryService.getAllCategories();
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
  },

  // Get upload signature from backend for direct Cloudinary upload
  getUploadSignature: async (type = 'media') => {
    try {
      const response = await api.get('/posts/upload-signature', {
        params: { type }
      });
      if (response.data?.success && response.data?.data) {
        return response.data.data;
      }
      throw new Error(response.data?.message || 'ไม่สามารถสร้าง Signature สำหรับอัปโหลดไฟล์ได้');
    } catch (error) {
      console.error('Error fetching upload signature:', error);
      throw error;
    }
  },

  // Upload single file directly to Cloudinary CDN using signed credentials
  uploadDirectToCloudinary: async (file, type = 'media') => {
    if (!file) return null;
    try {
      const sigData = await postService.getUploadSignature(type);
      const { signature, timestamp, apiKey, folder, uploadUrl } = sigData;

      const formData = new FormData();
      formData.append('file', file);
      formData.append('api_key', apiKey);
      formData.append('timestamp', timestamp);
      formData.append('signature', signature);
      formData.append('folder', folder);

      const response = await fetch(uploadUrl, {
        method: 'POST',
        body: formData
      });

      if (!response.ok) {
        const errJson = await response.json().catch(() => ({}));
        throw new Error(errJson?.error?.message || `Cloudinary upload failed (status ${response.status})`);
      }

      const result = await response.json();
      return result.secure_url || result.url;
    } catch (error) {
      console.error(`Error uploading ${type} to Cloudinary:`, error);
      throw error;
    }
  },

  // Upload multiple files directly to Cloudinary in parallel
  uploadMultipleDirectToCloudinary: async (files, type = 'media') => {
    if (!files || files.length === 0) return [];
    try {
      const sigData = await postService.getUploadSignature(type);
      const { signature, timestamp, apiKey, folder, uploadUrl } = sigData;

      const uploadPromises = Array.from(files).map(async (file) => {
        const formData = new FormData();
        formData.append('file', file);
        formData.append('api_key', apiKey);
        formData.append('timestamp', timestamp);
        formData.append('signature', signature);
        formData.append('folder', folder);

        const response = await fetch(uploadUrl, {
          method: 'POST',
          body: formData
        });

        if (!response.ok) {
          const errJson = await response.json().catch(() => ({}));
          throw new Error(errJson?.error?.message || `Cloudinary upload failed (status ${response.status})`);
        }

        const result = await response.json();
        return result.secure_url || result.url;
      });

      return await Promise.all(uploadPromises);
    } catch (error) {
      console.error(`Error uploading multiple ${type} files to Cloudinary:`, error);
      throw error;
    }
  },

  // Create a new post (supports both JSON payload and FormData)
  createPost: async (postData) => {
    try {
      const response = await api.post('/posts', postData);
      return response.data;
    } catch (error) {
      console.error('Error creating post:', error);
      throw error;
    }
  },

  // Update an existing post
  updatePost: async (id, formData) => {
    try {
      const response = await api.put(`/posts/${id}`, formData);
      return response.data;
    } catch (error) {
      console.error(`Error updating post ${id}:`, error);
      throw error;
    }
  },

  // Delete a post (Soft Delete)
  deletePost: async (id) => {
    try {
      const response = await api.delete(`/posts/${id}`);
      return response.data;
    } catch (error) {
      console.error(`Error deleting post ${id}:`, error);
      throw error;
    }
  },

  // Like / Unlike a post
  likePost: async (id) => {
    try {
      const response = await api.post(`/likes/${id}`);
      return response.data;
    } catch (error) {
      console.error(`Error liking post ${id}:`, error);
      throw error;
    }
  },

  // Get like status for a post
  getLikeStatus: async (id) => {
    try {
      const response = await api.get(`/likes/${id}`);
      return response.data;
    } catch (error) {
      console.error(`Error getting like status for post ${id}:`, error);
      throw error;
    }
  },

  // Bookmark / Unbookmark a post
  bookmarkPost: async (id) => {
    try {
      const response = await api.post(`/bookmarks/${id}`);
      return response.data;
    } catch (error) {
      console.error(`Error bookmarking post ${id}:`, error);
      throw error;
    }
  },

  // Get all bookmarks for current user
  getBookmarks: async () => {
    try {
      const response = await api.get('/bookmarks');
      return response.data;
    } catch (error) {
      console.error('Error fetching bookmarks:', error);
      throw error;
    }
  },

  // Create a comment on a post
  createComment: async (id, content) => {
    try {
      const response = await api.post('/comment', { post_id: id, content });
      return response.data;
    } catch (error) {
      console.error(`Error creating comment on post ${id}:`, error);
      throw error;
    }
  },

  // Get comments by post ID
  getComments: async (postId) => {
    try {
      const response = await api.get(`/comment/post/${postId}`);
      return response.data;
    } catch (error) {
      console.error(`Error fetching comments for post ${postId}:`, error);
      throw error;
    }
  },

  // Delete a comment
  deleteComment: async (commentId) => {
    try {
      const response = await api.delete(`/comment/${commentId}`);
      return response.data;
    } catch (error) {
      console.error(`Error deleting comment ${commentId}:`, error);
      throw error;
    }
  },

  // Update a comment
  updateComment: async (commentId, content) => {
    try {
      const response = await api.put(`/comment/${commentId}`, { content });
      return response.data;
    } catch (error) {
      console.error(`Error updating comment ${commentId}:`, error);
      throw error;
    }
  },

  // Get System Stats (total users, total posts)
  getSystemStats: async () => {
    try {
      const response = await api.get('/system/stats');
      if (response.data.success && (response.data.data?.totalSharers || response.data.data?.totalUsers)) {
        return response.data.data;
      }
    } catch (error) {
      console.log('Notice: /system/stats API fallback to Supabase query');
    }

    // Fallback: Query exact count from Supabase
    try {
      const [{ count: userCount }, { count: postCount }] = await Promise.all([
        supabase.from('users').select('id', { count: 'exact', head: true }),
        supabase.from('posts').select('id', { count: 'exact', head: true })
      ]);

      return {
        totalSharers: userCount || 0,
        totalUsers: userCount || 0,
        totalPosts: postCount || 0
      };
    } catch (e) {
      return { totalSharers: 0, totalUsers: 0, totalPosts: 0 };
    }
  }
};

// Public post endpoints cannot know which user is viewing the list.  When a
// user is signed in, merge their persisted bookmarks into the formatted posts
// so a refresh/navigation does not reset every bookmark icon to false.
async function mergeBookmarkStatus(posts) {
  const token = localStorage.getItem('access_token');
  if (!token || token === 'undefined' || token === 'null' || !posts.length) {
    return posts;
  }

  try {
    const response = await api.get('/bookmarks');
    const bookmarks = response.data?.success && Array.isArray(response.data?.data)
      ? response.data.data
      : [];
    const bookmarkedIds = new Set(
      bookmarks
        .map(bookmark => bookmark.post_id || bookmark.postId || bookmark.post?.id)
        .filter(Boolean)
        .map(String)
    );

    return posts.map(post => ({
      ...post,
      isBookmarked: bookmarkedIds.has(String(post.id)),
    }));
  } catch (error) {
    // The post list should still render if bookmark status cannot be loaded.
    console.error('Error merging bookmark status:', error);
    return posts;
  }
}

export const KNOWN_SUBJECTS = [
  'คณิตศาสตร์',
  'ฟิสิกส์',
  'เคมี',
  'ชีววิทยา',
  'วิทยาศาสตร์',
  'ภาษาอังกฤษ',
  'ภาษาไทย',
  'สังคมศึกษา',
  'คอมพิวเตอร์และเทคโนโลยี',
  'ทั่วไป'
];

export function resolveCategoryName(post) {
  if (!post) return 'ทั่วไป';

  // 1. Check if post.category is an object with a valid name
  if (post.category && typeof post.category === 'object') {
    const name = post.category.name || post.category.category_name;
    if (name && typeof name === 'string' && name.trim() && name !== 'null' && name !== 'undefined') {
      return name.trim();
    }
  }

  // 2. Check if post.category is a direct string
  if (typeof post.category === 'string' && post.category.trim() && post.category !== 'null' && post.category !== 'undefined') {
    return post.category.trim();
  }

  // 3. Check direct subject field
  if (typeof post.subject === 'string' && post.subject.trim() && post.subject !== 'ทั่วไป' && post.subject !== 'null' && post.subject !== 'undefined') {
    return post.subject.trim();
  }

  // 4. Look inside tags for any known subject name
  const tagsList = Array.isArray(post.tags) ? post.tags : [];
  for (const t of tagsList) {
    const rawTag = (typeof t === 'string' ? t : (t?.tag?.tag_name || t?.tag_name || t?.name || '')).replace(/^#/, '').trim();
    const matched = KNOWN_SUBJECTS.find(sub => sub.toLowerCase() === rawTag.toLowerCase());
    if (matched) return matched;
  }

  return 'ทั่วไป';
}

export function formatPostData(post) {
  const categoryName = resolveCategoryName(post);
  const authorUsername = post.author?.username || (typeof post.author === 'string' ? post.author : 'ผู้ใช้งาน');
  const authorId = post.author_id || post.author?.id || post.author?.user_id || post.user_id || null;
  const authorAvatar = post.author?.avatar_url || post.author?.profile_image || post.author?.avatar || post.author_avatar || null;
  const authorFrameId = post.author?.current_frame_id || post.author_frame_id || post.authorFrameId || null;
  const authorFrame = post.author?.current_frame || post.author_frame || post.authorFrame || null;

  return {
    id: post.id,
    title: post.title,
    description: post.summary || 'ไม่มีคำอธิบาย',
    level: mapEducationLevel(post.education_level),
    rawLevel: post.education_level,
    subject: categoryName,
    category_id: post.category_id || post.category?.id || null,
    category: post.category || { id: post.category_id, name: categoryName },
    tags: post.tags?.map(t => typeof t === 'string' ? t : (t.tag?.tag_name || t.name)) || [],
    views: formatNumber(post.view_count),
    likes: post._count?.likes || post.like_count || post.likes_count || (Array.isArray(post.likes) ? post.likes.length : (typeof post.likes === 'number' ? post.likes : 0)),
    isLiked: Boolean(post.is_liked || post.isLiked || post.has_liked),
    isBookmarked: Boolean(post.is_bookmarked || post.isBookmarked || post.has_bookmarked),
    image: post.cover_image || 'https://images.unsplash.com/photo-1456513080510-7bf3a84b82f8?w=1280&q=90',
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
}

export function formatSinglePostData(post) {
  const pdfMedia = post.media?.find(m => m.media_type === 'PDF');
  const hashtags = post.tags?.map(t => typeof t === 'string' ? t : (t.tag?.tag_name || t.name)) || [];
  const images = post.media?.filter(m => m.media_type === 'IMAGE').map(m => m.media_url) || [];
  const authorId = post.author?.id || post.author?.user_id || post.author_id || post.user_id || post.userId;
  const authorFrameId = post.author?.current_frame_id || post.author?.profile_frame_id || post.author?.frame_id || post.author_frame_id || post.current_frame_id || null;
  const authorFrame = post.author?.current_frame || post.author_frame || post.authorFrame || null;
  const categoryName = resolveCategoryName(post);

  const comments = (post.comments || []).map(c => {
    const userObj = c.user || c.author || {};
    const cUser = typeof userObj === 'object' ? userObj : {};
    const createdDate = c.created_at || c.createdAt;
    return {
      id: c.id || c._id || `c_${Math.random().toString(36).substring(2, 9)}`,
      content: c.content || c.text || c.comment || '',
      createdAt: createdDate
        ? (new Date(createdDate).toLocaleDateString('th-TH', { hour: '2-digit', minute: '2-digit' }) + ' - ' + new Date(createdDate).toLocaleDateString('th-TH', { year: 'numeric', month: 'short', day: 'numeric' }))
        : 'เมื่อสักครู่',
      user: {
        id: cUser.id || cUser.user_id || c.user_id,
        username: cUser.username || 'ผู้ใช้งาน',
        avatar: cUser.avatar_url || cUser.profile_image || cUser.avatar || ('https://ui-avatars.com/api/?name=' + encodeURIComponent(cUser.username || 'User'))
      }
    };
  });

  return {
    id: post.id,
    // Keep the server-side lifecycle status so detail pages can prevent a
    // soft-deleted post from being rendered to its author or moderators.
    postStatus: post.post_status || post.status || null,
    post_status: post.post_status || post.status || null,
    title: post.title,
    description: post.summary || 'ไม่มีคำอธิบาย',
    details: post.content || '<p>ไม่มีเนื้อหา</p>',
    level: mapEducationLevel(post.education_level),
    rawLevel: post.education_level,
    subject: categoryName,
    category: categoryName,
    category_id: post.category_id || post.category?.id || null,
    categoryObj: post.category || { id: post.category_id, name: categoryName },
    views: formatNumber(post.view_count),
    likes: post._count?.likes || post.like_count || post.likes_count || (Array.isArray(post.likes) ? post.likes.length : (typeof post.likes === 'number' ? post.likes : 0)),
    rawLikes: Array.isArray(post.likes) ? post.likes : [],
    isLiked: Boolean(post.is_liked || post.isLiked || post.has_liked),
    isBookmarked: Boolean(post.is_bookmarked || post.isBookmarked || post.has_bookmarked),
    coverImage: post.cover_image || 'https://images.unsplash.com/photo-1456513080510-7bf3a84b82f8?w=1280&q=90',
    hashtags: hashtags,
    images: images,
    media: post.media || [],
    comments: comments,
    author_id: authorId,
    user_id: authorId,
    authorId: authorId,
    author_frame_id: authorFrameId,
    authorFrameId: authorFrameId,
    author_frame: authorFrame,
    authorFrame: authorFrame,
    current_frame_id: authorFrameId,
    pdf: pdfMedia ? {
      id: pdfMedia.id,
      name: extractFileNameFromUrl(pdfMedia.media_url),
      url: pdfMedia.media_url,
      size: 'PDF'
    } : null,
    author: {
      id: authorId,
      name: post.author?.username || 'ผู้ใช้งาน',
      username: post.author?.username || 'ผู้ใช้งาน',
      role: 'Contributor',
      avatar: post.author?.avatar_url || post.author?.profile_image || post.author?.avatar || ('https://ui-avatars.com/api/?name=' + encodeURIComponent(post.author?.username || 'User')),
      current_frame_id: authorFrameId,
      current_frame: authorFrame
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
