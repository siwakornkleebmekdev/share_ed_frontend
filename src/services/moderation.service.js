import api from "@/utils/api";

export const moderationService = {
  getReportedPosts: async () => {
    const response = await api.get("/moderator/reports");
    return response.data?.posts || [];
  },

  reviewPost: async (postId, action) => {
    const response = await api.post(
      `/moderator/posts/${encodeURIComponent(postId)}/action`,
      { action },
    );
    return response.data;
  },
};
