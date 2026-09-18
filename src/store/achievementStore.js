import { create } from 'zustand';
import { profileService } from '../services/profile.service';
import useAuthStore from './authStore';

/**
 * =========================================================================
 * ตำแหน่งบนหน้าเว็บ: 
 *   1. เมนูแถบนำทางด้านบน (Navbar): แสดงจุดตัวเลขสีแดงแจ้งเตือนจำนวนของรางวัลที่พร้อมรับ (readyToClaimCount)
 *   2. หน้าต่างเลือกกรอบรูป (FrameDecorationModal): ตรวจสอบรายการกรอบรูปภารกิจที่ทำสำเร็จแล้ว
 *   3. หน้าภารกิจและความสำเร็จ (Achievements.jsx): แสดงความคืบหน้าภารกิจและปุ่ม "รับรางวัล"
 * 
 * หน้าที่: จัดการ Global State สำหรับระบบความสำเร็จและภารกิจ (Achievements & Milestones)
 *         รวมถึงการดึงข้อมูลความคืบหน้า และการกดรับของรางวัล (Claim Reward)
 * =========================================================================
 */
const useAchievementStore = create((set, get) => ({
  milestones: [],
  isLoading: false,
  error: null,

  /**
   * ตำแหน่งบนหน้าเว็บ: จุดป้ายแดงตัวเลขแจ้งเตือน (Badge) บนไอคอนถ้วยรางวัลหรือเมนู "ความสำเร็จ" ใน Navbar
   * หน้าที่: คำนวณนับจำนวนภารกิจที่ทำสำเร็จแล้ว แต่ผู้ใช้ยังไม่ได้กดรับรางวัล (status === 'READY_TO_CLAIM')
   */
  readyToClaimCount: () => get().milestones.filter(m => m.status === 'READY_TO_CLAIM').length,

  /**
   * ตำแหน่งบนหน้าเว็บ: เรียกใช้งานอัตโนมัติเมื่อเปิดหน้าเว็บ, หน้าโปรไฟล์, หรือหน้าความสำเร็จ
   * หน้าที่: ยิง API (`profileService.getMilestones()`) เพื่อดึงข้อมูลภารกิจทั้งหมดและความคืบหน้าของผู้ใช้มาเก็บใน store
   */
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

  /**
   * ตำแหน่งบนหน้าเว็บ: ปุ่มกดสีเหลือง/เขียว "รับรางวัล" บนการ์ดภารกิจในหน้าความสำเร็จ (/achievements)
   * หน้าที่: ยิง API POST `/milestones/:id/claim` เพื่อยืนยันการรับรางวัลภารกิจนั้นๆ
   *         เมื่อสำเร็จจะเปลี่ยนสถานะของภารกิจนั้นใน store เป็น 'CLAIMED' ทันที
   */
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
