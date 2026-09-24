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

  // คำนวณจำนวนรางวัลความสำเร็จที่พร้อมกดรับ (READY_TO_CLAIM)
  readyToClaimCount: () => get().milestones.filter(m => m.status === 'READY_TO_CLAIM').length,

  invalidateMilestones: () => {
    milestonesRequestId++;
    milestonesFlight = null;
    milestonesFlightOwner = null;
    set({ lastFetchedAt: 0 });
  },

  fetchMilestones: async (options = false) => {
    const force = typeof options === 'boolean' ? options : Boolean(options?.force);
    const auth = useAuthStore.getState();
    const userId = auth.user?.id || auth.user?.user_id || null;
    if (!auth.isAuthenticated || !userId) {
      milestonesRequestId++;
      milestonesFlight = null;
      milestonesFlightOwner = null;
      set({ milestones: [], isLoading: false, ownerId: null, lastFetchedAt: 0 });
      return;
    }

    let state = get();
    if (state.ownerId !== userId) {
      milestonesRequestId++;
      milestonesFlight = null;
      milestonesFlightOwner = null;
      set({ milestones: [], isLoading: false, error: null, ownerId: userId, lastFetchedAt: 0 });
      state = get();
    }
    if (
      !force &&
      state.ownerId === userId &&
      state.milestones.length > 0 &&
      Date.now() - state.lastFetchedAt < CACHE_TTL_MS
    ) {
      return state.milestones;
    }
    if (!force && milestonesFlight && milestonesFlightOwner === userId) return milestonesFlight;

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

  // กดรับรางวัลผ่าน API จริง (POST /milestones/:id/claim หรือ /achievements/:id/claim)
  // เมื่อสำเร็จจะอัปเดตสถานะใน store เป็น CLAIMED ทันที
  // หากเกิดข้อผิดพลาดจะ throw error เพื่อให้หน้า UI แสดงข้อความแจ้งเตือนจากหลังบ้าน


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
