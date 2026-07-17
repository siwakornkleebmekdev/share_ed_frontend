import { create } from 'zustand';

const useAuthStore = create((set) => ({
  isAuthenticated: false,
  isInitializing: true,
  user: null,
<<<<<<< HEAD
  login: (userData) => set({ isAuthenticated: true, isInitializing: false, user: userData }),
  logout: () => {
    try {
      localStorage.removeItem('access_token');
      localStorage.removeItem('login_timestamp');
    } catch (e) {}
    set({ isAuthenticated: false, isInitializing: false, user: null });
  },
  setInitializing: (isInitializing) => set({ isInitializing }),
=======
  login: (userData) => set({ isAuthenticated: true, user: userData }),
  logout: () => {
    localStorage.removeItem('access_token');
    set({ isAuthenticated: false, user: null });
  },
>>>>>>> 01c96c7 (ADD Profile , Setting Profile , achievements/reward_claiming , Fixing AuthStore , Token access google , logout)
}));

export default useAuthStore;

