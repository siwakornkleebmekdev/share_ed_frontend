import { create } from 'zustand';
import { profileService } from '../services/profile.service';
import useAuthStore from './authStore';

const CACHE_TTL_MS = 60_000;
let milestonesFlight = null;
let milestonesFlightOwner = null;
let milestonesRequestId = 0;

const useAchievementStore = create((set, get) => ({
  milestones: [],
  isLoading: false,
  error: null,
  ownerId: null,
  lastFetchedAt: 0,

  // Computed count of rewards waiting to be claimed
  readyToClaimCount: () => get().milestones.filter(m => m.status === 'READY_TO_CLAIM').length,

  fetchMilestones: async () => {
    const auth = useAuthStore.getState();
    const userId = auth.user?.id || auth.user?.user_id || null;
    if (!auth.isAuthenticated || !userId) {
      milestonesRequestId++;
      milestonesFlight = null;
      milestonesFlightOwner = null;
      set({ milestones: [], isLoading: false, ownerId: null, lastFetchedAt: 0 });
      return;
    }

    const state = get();
    if (
      state.ownerId === userId &&
      state.milestones.length > 0 &&
      Date.now() - state.lastFetchedAt < CACHE_TTL_MS
    ) {
      return state.milestones;
    }
    if (milestonesFlight && milestonesFlightOwner === userId) return milestonesFlight;

    set({ isLoading: true, error: null });
    const requestId = ++milestonesRequestId;
    milestonesFlightOwner = userId;
    milestonesFlight = (async () => {
      try {
        const data = await profileService.getMilestones();
        if (requestId === milestonesRequestId) {
          set({
            milestones: data || [],
            isLoading: false,
            ownerId: userId,
            lastFetchedAt: Date.now(),
          });
        }
        return data || [];
      } catch (error) {
        if (requestId === milestonesRequestId) {
          set({ error: error.message, isLoading: false });
        }
        return [];
      } finally {
        if (requestId === milestonesRequestId) {
          milestonesFlight = null;
          milestonesFlightOwner = null;
        }
      }
    })();
    return milestonesFlight;
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
