import { create } from "zustand";
import { moderationService } from "@/services/moderation.service";
import { subscribeSocketEvent } from "@/utils/socket";

const CACHE_TTL_MS = 10_000;
let reportsFlight = null;
let realtimeCleanup = () => {};

const isPendingPost = (post) =>
  String(post?.post_status || post?.postStatus || "").toUpperCase() !== "DELETED";
const isConsolePost = (post) =>
  String(post?.post_status || post?.postStatus || "").toUpperCase() === "DELETED"
  || (post?._count?.reports ?? post?.reports?.length ?? 0) >= 10;

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
      const result = await moderationService.reviewPost(postId, action);
      set((state) => ({
        reports: action === "SUSPEND"
          ? state.reports.map((post) =>
              String(post.id) === String(postId)
                ? { ...post, post_status: "UNACTIVED" }
                : post,
            )
          : action === "SOFT_DELETE"
            ? state.reports.map((post) =>
                String(post.id) === String(postId)
                  ? {
                      ...post,
                      post_status: "DELETED",
                      updated_at: new Date().toISOString(),
                      recoverable_until: result.recoverableUntil,
                    }
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
      if (action === "SOFT_DELETE" && !get().reports.some((post) => String(post.id) === String(postId))) {
        get().fetchReports({ force: true }).catch(() => {});
        return;
      }
      set((state) => ({
        reports: action === "SUSPEND"
          ? state.reports.map((post) =>
              String(post.id) === String(postId)
                ? { ...post, post_status: "UNACTIVED" }
                : post,
            )
          : action === "SOFT_DELETE"
            ? state.reports.map((post) =>
                String(post.id) === String(postId)
                  ? {
                      ...post,
                      post_status: "DELETED",
                      updated_at: new Date().toISOString(),
                      recoverable_until: payload.recoverableUntil || payload.recoverable_until,
                    }
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
