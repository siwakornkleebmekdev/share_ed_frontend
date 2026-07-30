import api from "../utils/api";

export const adminService = {
  // Fetch all registered users (ADMIN role required on backend)
  getAllUsers: async () => {
    try {
      const response = await api.get("/admin/users");
      return response.data?.data || response.data;
    } catch (error) {
      console.error("Error fetching users:", error);
      throw error;
    }
  },

  // Change a user's role to MEMBER, MODERATOR, or ADMIN
  updateUserRole: async (userId, role) => {
    try {
      const response = await api.patch(`/admin/users/${userId}/role`, { role });
      return response.data?.data || response.data;
    } catch (error) {
      console.error("Error updating user role:", error);
      throw error;
    }
  },

  // "Suspend" a user — backend calls this ban; sets status to BANNED.
  // Backend rejects banning an ADMIN account.
  banUser: async (userId, reason) => {
    try {
      const response = await api.patch(`/admin/users/${userId}/ban`, { reason });
      return response.data?.data || response.data;
    } catch (error) {
      console.error("Error banning user:", error);
      throw error;
    }
  },

  // "Reactivate" a user — backend calls this unban; restores status to ACTIVE.
  unbanUser: async (userId) => {
    try {
      const response = await api.patch(`/admin/users/${userId}/unban`);
      return response.data?.data || response.data;
    } catch (error) {
      console.error("Error unbanning user:", error);
      throw error;
    }
  },

  // Single user's public profile — includes role/status too.
  getUserDetails: async (userId) => {
    try {
      const response = await api.get(`/users/${userId}`);
      return response.data?.data || response.data;
    } catch (error) {
      console.error("Error fetching user details:", error);
      throw error;
    }
  },
};
