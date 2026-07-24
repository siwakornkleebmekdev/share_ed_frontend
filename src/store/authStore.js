import { create } from "zustand";

const useAuthStore = create((set) => ({
  isAuthenticated: false,
  user: null,
  // Indicates whether the app is performing the initial auth check
  isInitializing: true,
  // Setter used by App to flip the initializing state after checks
  setInitializing: (val) => set({ isInitializing: val }),
  login: (userData) => set({ isAuthenticated: true, user: userData }),
  logout: () => {
    try {
      localStorage.removeItem("access_token");
      localStorage.removeItem("login_timestamp");
      sessionStorage.clear();
    } catch (e) {}
    set({ isAuthenticated: false, user: null });
  },
}));

export default useAuthStore;
