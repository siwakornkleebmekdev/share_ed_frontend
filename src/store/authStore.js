import { create } from "zustand";

/**
 * =========================================================================
 * ตำแหน่งบนหน้าเว็บ: 
 *   1. แถบนำทางด้านบน (Navbar): สลับปุ่ม "เข้าสู่ระบบ/สมัครสมาชิก" กับ "โปรไฟล์/แจ้งเตือน"
 *   2. การป้องกันเส้นทาง (Route Guards ใน App.jsx): ตรวจสอบสิทธิ์การเข้าถึงหน้า /admin, /settings, /create-post
 *   3. แถบเมนูแอดมิน (AdminSidebar) และแถบตั้งค่า (SettingsSidebar): แสดงชื่อ, รูป Avatar และปุ่มออกจากระบบ
 * 
 * หน้าที่: จัดการ Global Authentication State ของทั้งระบบ เก็บสถานะการล็อกอิน (`isAuthenticated`),
 *         ข้อมูลผู้ใช้ปัจจุบัน (`user`), สถานะกำลังตรวจสอบสิทธิ์ (`isInitializing`),
 *         และฟังก์ชันล็อกอิน (`login`) กับออกจากระบบ (`logout`)
 * =========================================================================
 */
const useAuthStore = create((set) => ({
  isAuthenticated: false,
  user: null,
  // Indicates whether the app is performing the initial auth check
  isInitializing: true,
  // Indicates whether the backend-sourced role/status merge (see App.jsx
  // handleSession -> authService.getMe) is still in flight. The Supabase
  // session/JWT never carries the Mongoose-side role, so admin route guards
  // must wait on this instead of isInitializing alone.
  isRoleLoading: true,

  /**
   * ตำแหน่งบนหน้าเว็บ: เรียกใช้ใน App.jsx ระหว่างขั้นตอนบูตระบบตอนเปิดหน้าเว็บครั้งแรก
   * หน้าที่: ตั้งค่าสถานะการโหลดตรวจสอบ session เริ่มต้น (เมื่อโหลดเสร็จจะเซ็ตเป็น false เพื่อให้แสดงหน้าเว็บ)
   */
  setInitializing: (val) => set({ isInitializing: val }),

  /**
   * ตำแหน่งบนหน้าเว็บ: เรียกใช้ใน App.jsx ตอนดึงข้อมูล role จาก backend
   * หน้าที่: ตั้งค่าสถานะการโหลดสิทธิ์ (role) ของผู้ใช้ เพื่อให้ route guard ของแอดมินทำงานถูกต้อง
   */
  setRoleLoading: (val) => set({ isRoleLoading: val }),

  /**
   * ตำแหน่งบนหน้าเว็บ: หน้าเข้าสู่ระบบ (/login), หน้าสมัครสมาชิก (/register), หรือหน้าตั้งค่าโปรไฟล์
   * หน้าที่: บันทึกข้อมูลผู้ใช้ที่ล็อกอินสำเร็จเข้าสู่ State (`user`) และเปลี่ยน `isAuthenticated` เป็น true
   */
  login: (userData) => set({ isAuthenticated: true, user: userData }),

  /**
   * ตำแหน่งบนหน้าเว็บ: ปุ่มไอคอน "ออกจากระบบ" (Logout) ใน Sidebar ของ Admin, Settings, หรือเมนู Dropdown ใน Navbar
   * หน้าที่: ล้าง access_token และ session ทั้งหมดออกจากเบราว์เซอร์ พร้อมรีเซ็ต State กลับสู่ค่าเริ่มต้น
   */
  logout: () => {
    try {
      localStorage.removeItem("access_token");
      localStorage.removeItem("login_timestamp");
      sessionStorage.clear();
    } catch (e) {}
    set({ isAuthenticated: false, user: null, isRoleLoading: false });
  },
}));

export default useAuthStore;
