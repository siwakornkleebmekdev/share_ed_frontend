import api from "@/utils/api";
import useAuthStore from "./authStore";
import { createBookmarkStatusStore } from "./bookmarkStatusCore";

const useBookmarkStatusStore = createBookmarkStatusStore(
  async () => {
    const response = await api.get("/bookmarks");
    return response.data?.success && Array.isArray(response.data?.data)
      ? response.data.data : [];
  },
  () => {
    const auth = useAuthStore.getState();
    return auth.isAuthenticated ? (auth.user?.id || auth.user?.user_id || null) : null;
  },
);

export default useBookmarkStatusStore;
