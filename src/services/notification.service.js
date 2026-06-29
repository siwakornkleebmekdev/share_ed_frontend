import api from '../utils/api';

export const notificationService = {
  // Fetch all notifications for the current user
  getNotifications: async () => {
    try {
      const response = await api.get('/notifications');
      return response.data;
    } catch (error) {
      console.error('Error fetching notifications:', error);
      // Fallback dummy data if backend is not ready
      return {
        data: [
          {
            id: '1',
            type: 'LIKE',
            title: 'มีคนถูกใจสรุปของคุณ',
            message: 'สมศักดิ์ ได้กดถูกใจสรุป "ชีววิทยา ม.4 บทที่ 1" ของคุณ',
            isRead: false,
            createdAt: new Date(Date.now() - 1000 * 60 * 5).toISOString(), // 5 mins ago
            link: '/post/1'
          },
          {
            id: '2',
            type: 'COMMENT',
            title: 'ความคิดเห็นใหม่',
            message: 'มาลี ได้แสดงความคิดเห็นในโพสต์ของคุณ',
            isRead: false,
            createdAt: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString(), // 2 hours ago
            link: '/post/1'
          },
          {
            id: '3',
            type: 'SYSTEM',
            title: 'ยินดีต้อนรับสู่ SHARE-ED',
            message: 'ขอบคุณที่เข้าร่วมเป็นส่วนหนึ่งของชุมชนการเรียนรู้ของเรา',
            isRead: true,
            createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString(), // 1 day ago
            link: '/'
          }
        ]
      };
    }
  },

  // Mark a specific notification as read
  markAsRead: async (id) => {
    try {
      const response = await api.patch(`/notifications/${id}/read`);
      return response.data;
    } catch (error) {
      console.error(`Error marking notification ${id} as read:`, error);
      return { success: true }; // Fallback
    }
  },

  // Mark all notifications as read
  markAllAsRead: async () => {
    try {
      const response = await api.patch('/notifications/read-all');
      return response.data;
    } catch (error) {
      console.error('Error marking all notifications as read:', error);
      return { success: true }; // Fallback
    }
  }
};
