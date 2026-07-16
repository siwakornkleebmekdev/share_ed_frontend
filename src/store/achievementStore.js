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

  // No real backend endpoint for claiming yet — optimistic local flip only,
  // matching the mock-data fallback profileService.getMilestones() already uses.
  claimReward: (id) => {
    set((state) => ({
      milestones: state.milestones.map((m) =>
        m.id === id ? { ...m, status: 'CLAIMED' } : m
      ),
    }));
  },
}));

export default useAchievementStore;
