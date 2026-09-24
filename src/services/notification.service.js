import api from '../utils/api';
import { supabase } from '../utils/supabase';

const checked = response => {
  if (response.data?.success === false) throw new Error('Notification request failed');
  return response.data;
};
const options = { timeout: 15000 };

const withAuthenticatedSession = async request => {
  let session = null;
  try {
    const current = await supabase.auth.getSession();
    session = current.data?.session || null;
    if (!session?.access_token) {
      const refreshed = await supabase.auth.refreshSession();
      session = refreshed.data?.session || null;
    }
  } catch {
    session = null;
  }

  if (!session?.access_token) {
    await supabase.auth.signOut({ scope: 'local' }).catch(() => {});
    const error = new Error('เซสชันหมดอายุ กรุณาเข้าสู่ระบบใหม่');
    error.code = 'AUTH_SESSION_MISSING';
    throw error;
  }

  return request({
    ...options,
    headers: { Authorization: `Bearer ${session.access_token}` },
  });
};

export const notificationService = {
  getNotifications: async () => checked(await withAuthenticatedSession(config => api.get('/notifications', config))),
  markAsRead: async id => checked(await withAuthenticatedSession(config => api.patch(`/notifications/${encodeURIComponent(id)}/read`, undefined, config))),
  markAllAsRead: async () => checked(await withAuthenticatedSession(config => api.patch('/notifications/read-all', undefined, config))),
  deleteNotification: async id => checked(await withAuthenticatedSession(config => api.delete(`/notifications/${encodeURIComponent(id)}`, config))),
};
