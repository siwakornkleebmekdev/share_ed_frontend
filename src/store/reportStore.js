import { create } from "zustand";
import { moderationService } from "@/services/moderation.service";
import { postService } from "@/services/post.service";
import { subscribeSocketEvent } from "@/utils/socket";
import useAuthStore from "./authStore";

const CACHE_TTL_MS = 10_000;
let reportsFlight = null;
let realtimeCleanup = () => {};

const isConsolePost = (post) =>
  (post?._count?.reports ?? post?.reports?.length ?? 0) > 0;

const useReportStore = create((set, get) => ({
  reports: [],
  isLoading: false,
  isReviewing: false,
  error: null,
  lastFetchedAt: 0,

  pendingReports: () => get().reports,
  pendingCount: () => get().reports.length,

  fetchReports: async ({ force = false } = {}) => {
    const auth = useAuthStore.getState();
    const role = String(auth.user?.role || "").toUpperCase();
    if (!auth.isAuthenticated || role !== "ADMIN") {
      set({ reports: [], isLoading: false });
      return [];
    }

    const state = get();
    if (!force && state.lastFetchedAt && Date.now() - state.lastFetchedAt < CACHE_TTL_MS) {
      return state.reports;
    }
    if (reportsFlight) return reportsFlight;

    set({ isLoading: true, error: null });
    reportsFlight = moderationService.getReportedPosts()
      .then((reports) => {
        const nextReports = Array.isArray(reports) ? reports.filter(isConsolePost) : [];
        set({ reports: nextReports, isLoading: false, lastFetchedAt: Date.now() });
        return nextReports;
      })
      .catch((error) => {
        set({
          isLoading: false,
          error: error.response?.data?.message || "ไม่สามารถโหลดรายการรายงานได้",
        });
        throw error;
      })
      .finally(() => {
        reportsFlight = null;
      });

    return reportsFlight;
  },

  reviewPost: async (postId, action) => {
    set({ isReviewing: true, error: null });
    try {
      let result;
      if (action === "DELETE") {
        try {
          result = await postService.deletePost(postId);
        } catch (directErr) {
          result = await moderationService.reviewPost(postId, action);
        }
      } else {
        result = await moderationService.reviewPost(postId, action);
      }
      set((state) => ({
        reports: action === "SUSPEND"
          ? state.reports.map((post) =>
              String(post.id) === String(postId)
                ? { ...post, post_status: "UNACTIVED" }
                : post,
            )
          : state.reports.filter((post) => String(post.id) !== String(postId)),
        isReviewing: false,
        lastFetchedAt: Date.now(),
      }));
      return result;
    } catch (error) {
      set({
        isReviewing: false,
        error: error.response?.data?.message || "ไม่สามารถดำเนินการกับโพสต์ได้",
      });
      throw error;
    }
  },

  deletePostDirectly: async (postId) => {
    return get().reviewPost(postId, "DELETE");
  },

  startRealtime: () => {
    realtimeCleanup();

    const stopCreated = subscribeSocketEvent("report_created", (payload = {}) => {
      const incomingPost = payload.post;
      if (!incomingPost?.id) {
        get().fetchReports({ force: true }).catch(() => {});
        return;
      }
      if (!isConsolePost(incomingPost)) return;

      set((state) => {
        const exists = state.reports.some((post) => String(post.id) === String(incomingPost.id));
        return {
          reports: exists
            ? state.reports.map((post) => String(post.id) === String(incomingPost.id) ? incomingPost : post)
            : [incomingPost, ...state.reports],
          lastFetchedAt: Date.now(),
        };
      });
    });
    const stopReviewed = subscribeSocketEvent("report_reviewed", (payload = {}) => {
      const postId = payload.postId || payload.post_id;
      const action = String(payload.action || "").toUpperCase();
      if (!postId) return;
      set((state) => ({
        reports: action === "SUSPEND"
          ? state.reports.map((post) =>
              String(post.id) === String(postId)
                ? { ...post, post_status: "UNACTIVED" }
                : post,
            )
          : state.reports.filter((post) => String(post.id) !== String(postId)),
        lastFetchedAt: Date.now(),
      }));
    });

    realtimeCleanup = () => {
      stopCreated();
      stopReviewed();
      realtimeCleanup = () => {};
    };
  },

  stopRealtime: () => realtimeCleanup(),

  clear: () => set({ reports: [], error: null, lastFetchedAt: 0 }),
}));

export default useReportStore;
