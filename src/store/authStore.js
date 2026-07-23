import { create } from 'zustand';

const useAuthStore = create((set) => ({
  isAuthenticated: false,
  isInitializing: true,
  user: null,
  login: (userData) => set({ isAuthenticated: true, isInitializing: false, user: userData }),
  logout: () => {
    try {
      localStorage.removeItem('access_token');
      localStorage.removeItem('login_timestamp');
    } catch (e) {}
    set({ isAuthenticated: false, isInitializing: false, user: null });
  },
  setInitializing: (isInitializing) => set({ isInitializing }),
}));

export default useAuthStore;

