import { create } from 'zustand';
import { notificationService } from '../services/notification.service';
import useAuthStore from './authStore';

const useNotificationStore = create((set, get) => ({
  notifications: [],
  isLoading: false,
  error: null,
  
  // Computed unread count
  unreadCount: () => get().notifications.filter(n => !n.isRead).length,

  fetchNotifications: async () => {
    if (!useAuthStore.getState().isAuthenticated) {
      set({ notifications: [], isLoading: false });
      return;
    }
    set({ isLoading: true, error: null });
    try {
      const response = await notificationService.getNotifications();
      // Assuming response.data contains the array
      set({ notifications: response.data || response || [], isLoading: false });
    } catch (error) {
      set({ error: error.message, isLoading: false });
    }
  },

  markAsRead: async (id) => {
    // Optimistic update
    set((state) => ({
      notifications: state.notifications.map((n) => 
        n.id === id ? { ...n, isRead: true } : n
      )
    }));
    
    // Background API call
    await notificationService.markAsRead(id);
  },

  markAllAsRead: async () => {
    // Optimistic update
    set((state) => ({
      notifications: state.notifications.map((n) => ({ ...n, isRead: true }))
    }));
    
    // Background API call
    await notificationService.markAllAsRead();
  },

  // Client-side clear for demo purposes, if needed
  clearAll: () => set({ notifications: [] })
}));

export default useNotificationStore;
