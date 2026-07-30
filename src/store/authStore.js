import { create } from "zustand";

const useAuthStore = create((set) => ({
  isAuthenticated: false,
  user: null,
  // Indicates whether the app is performing the initial auth check
  isInitializing: true,
  // Indicates whether the backend-sourced role/status merge (see App.jsx
  // handleSession -> authService.getMe) is still in flight. The Supabase
  // session/JWT never carries the Mongoose-side role, so admin route guards
  // must wait on this instead of isInitializing alone.
  isRoleLoading: true,
  // Setter used by App to flip the initializing state after checks
  setInitializing: (val) => set({ isInitializing: val }),
  setRoleLoading: (val) => set({ isRoleLoading: val }),
  login: (userData) => set({ isAuthenticated: true, user: userData }),
  logout: () => {
    try {
      localStorage.removeItem("access_token");
      localStorage.removeItem("login_timestamp");
      sessionStorage.clear();
    } catch (e) {}
    set({ isAuthenticated: false, user: null, isRoleLoading: false });
  },
}));

export default useAuthStore;
