import { create } from 'zustand';
import { profileService } from '../services/profile.service';
import useAuthStore from './authStore';

const useAchievementStore = create((set, get) => ({
  milestones: [],
  isLoading: false,
  error: null,

  // Computed count of rewards waiting to be claimed
  readyToClaimCount: () => get().milestones.filter(m => m.status === 'READY_TO_CLAIM').length,

  fetchMilestones: async () => {
    if (!useAuthStore.getState().isAuthenticated) {
      set({ milestones: [], isLoading: false });
      return;
    }
    set({ isLoading: true, error: null });
    try {
      const data = await profileService.getMilestones();
      set({ milestones: data || [], isLoading: false });
    } catch (error) {
      set({ error: error.message, isLoading: false });
    }
  },

  // Claims via the real POST /milestones/:id/claim endpoint, then flips the
  // local copy to CLAIMED on success. Throws on failure so the caller can
  // show the backend's actual error message (e.g. already claimed).
  claimReward: async (id) => {
    await profileService.claimMilestone(id);
    set((state) => ({
      milestones: state.milestones.map((m) =>
        m.id === id ? { ...m, status: 'CLAIMED' } : m
      ),
    }));
  },
}));

export default useAchievementStore;
