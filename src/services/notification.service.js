import api from '../utils/api';

const checked = response => {
  if (response.data?.success === false) throw new Error('Notification request failed');
  return response.data;
};
const options = { timeout: 15000 };
export const notificationService = {
  getNotifications: async () => checked(await api.get('/notifications', options)),
  markAsRead: async id => checked(await api.patch(`/notifications/${encodeURIComponent(id)}/read`, undefined, options)),
  markAllAsRead: async () => checked(await api.patch('/notifications/read-all', undefined, options)),
  deleteNotification: async id => checked(await api.delete(`/notifications/${encodeURIComponent(id)}`, options)),
};
