import { create } from "zustand";
import { moderationService } from "@/services/moderation.service";

const CACHE_TTL_MS = 10_000;
let reportsFlight = null;

const isPendingPost = (post) =>
  String(post?.post_status || post?.postStatus || "").toUpperCase() !== "DELETED";

const useReportStore = create((set, get) => ({
  reports: [],
  isLoading: false,
  isReviewing: false,
  error: null,
  lastFetchedAt: 0,

  pendingReports: () => get().reports.filter(isPendingPost),
  pendingCount: () => get().reports.filter(isPendingPost).length,

  fetchReports: async ({ force = false } = {}) => {
    const state = get();
    if (!force && state.lastFetchedAt && Date.now() - state.lastFetchedAt < CACHE_TTL_MS) {
      return state.reports;
    }
    if (reportsFlight) return reportsFlight;

    set({ isLoading: true, error: null });
    reportsFlight = moderationService.getReportedPosts()
      .then((reports) => {
        const nextReports = Array.isArray(reports) ? reports : [];
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
      const result = await moderationService.reviewPost(postId, action);
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

  clear: () => set({ reports: [], error: null, lastFetchedAt: 0 }),
}));

export default useReportStore;
