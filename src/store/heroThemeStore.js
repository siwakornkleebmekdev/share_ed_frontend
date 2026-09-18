import { create } from 'zustand';
import { getImageColorProfile } from '@/utils/imageBrightness';

// Brightness below this is treated as a "dark hero" — the navbar switches to
// its translucent dark/glass style so it stays readable over the image.
const DARK_THRESHOLD = 0.55;

const FALLBACK_DARK_COLOR = { r: 15, g: 23, b: 42 }; // slate-900
const FALLBACK_LIGHT_COLOR = { r: 255, g: 255, b: 255 };

/**
 * =========================================================================
 * ตำแหน่งบนหน้าเว็บ:
 *   1. แถบนำทางด้านบน (Navbar): ปรับสีตัวอักษรและสีพื้นหลังโปร่งใส (Frosted Glass) ให้กลมกลืนกับรูปภาพพื้นหลัง
 *   2. หน้าโปรไฟล์ (Profile.jsx): ใช้ภาพ Wallpaper/Cover ของผู้ใช้เพื่อปรับธีมทั้งหน้า
 *   3. ส่วนท้ายเว็บ (Footer.jsx), Layout และการ์ดโพสต์ (PostCard.jsx): ปรับโทนสีตามความมืด/สว่างของภาพ Header
 * 
 * หน้าที่: จัดการ Global State สำหรับปรับแต่งธีมสีและความสว่าง (Brightness / Hero Theme) อัตโนมัติ 
 *         โดยวิเคราะห์สีเฉลี่ยและความสว่างของภาพหน้าปก/วอลเปเปอร์ เพื่อให้ Navbar และองค์ประกอบ UI อื่นๆ
 *         สามารถแสดงผลตัวหนังสือได้อย่างชัดเจนและสวยงาม
 * =========================================================================
 */
const useHeroThemeStore = create((set, get) => ({
  isDarkHero: false,
  heroColor: FALLBACK_LIGHT_COLOR,
  requestId: 0,

  /**
   * ตำแหน่งบนหน้าเว็บ: เรียกใช้ในหน้าโปรไฟล์ (Profile.jsx) เมื่อโหลดรูปภาพหน้าปก/วอลเปเปอร์ของผู้ใช้สำเร็จ
   * หน้าที่: ดาวน์โหลดและวิเคราะห์รูปภาพ เพื่อตรวจสอบค่าความสว่าง (brightness) และค่าสีเฉลี่ย (RGB) 
   *         หากภาพมืดกว่าเกณฑ์ (DARK_THRESHOLD) จะปรับ `isDarkHero` เป็น true เพื่อให้ Navbar สลับเป็นธีมตัวหนังสือสีขาว
   */
  setHeroImage: (url, { fallbackDark = false } = {}) => {
    const requestId = get().requestId + 1;
    set({ requestId });

    if (!url) {
      set({
        isDarkHero: fallbackDark,
        heroColor: fallbackDark ? FALLBACK_DARK_COLOR : FALLBACK_LIGHT_COLOR,
      });
      return;
    }

    getImageColorProfile(url)
      .then(({ brightness, r, g, b }) => {
        if (get().requestId === requestId) {
          set({ isDarkHero: brightness < DARK_THRESHOLD, heroColor: { r, g, b } });
        }
      })
      .catch(() => {
        // Can't sample it (CORS-blocked host, load failure, etc.) — default
        // to dark since these hero backgrounds are usually photos/gradients.
        if (get().requestId === requestId) {
          set({ isDarkHero: true, heroColor: FALLBACK_DARK_COLOR });
        }
      });
  },

  /**
   * ตำแหน่งบนหน้าเว็บ: เรียกใช้เมื่อออกจากหน้าโปรไฟล์ (Unmount) หรือเปลี่ยนไปยังหน้าอื่นที่ไม่มี Wallpaper
   * หน้าที่: รีเซ็ตค่าธีมกลับเป็นค่าเริ่มต้น (สว่าง) เพื่อให้ Navbar กลับมาเป็นสีมาตรฐานของระบบ
   */
  clearHeroImage: () =>
    set({ isDarkHero: false, heroColor: FALLBACK_LIGHT_COLOR, requestId: get().requestId + 1 }),
}));

export default useHeroThemeStore;
