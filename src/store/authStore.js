import { create } from 'zustand';

const useAuthStore = create((set) => ({
  isAuthenticated: false,
  user: null,
  login: (userData) => set({ isAuthenticated: true, user: userData }),
  logout: () => {
    localStorage.removeItem('access_token');
    set({ isAuthenticated: false, user: null });
  },
}));

export default useAuthStore;