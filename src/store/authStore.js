import { create } from 'zustand';

const useAuthStore = create((set) => ({
  isAuthenticated: false,
  user: null,
  login: (userData) => set({ isAuthenticated: true, user: userData }),
  logout: () => {
    try {
      localStorage.removeItem('access_token');
      localStorage.removeItem('login_timestamp');
      sessionStorage.clear();
    } catch (e) {}
    set({ isAuthenticated: false, user: null });
  },
}));

export default useAuthStore;