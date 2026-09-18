import { notificationService } from '../services/notification.service';
import * as realtime from '../utils/socket';
import { createNotificationStore } from './notificationCore';

/**
 * =========================================================================
 * ตำแหน่งบนหน้าเว็บ:
 *   1. แถบนำทางด้านบน (Navbar): แสดงไอคอนกระดิ่ง, ตัวเลขแจ้งเตือนที่ยังไม่ได้อ่าน (Badge) และ Dropdown รายการแจ้งเตือน
 *   2. หน้าการแจ้งเตือนหลัก (/notifications): หน้าแสดงรายการแจ้งเตือนทั้งหมด พร้อมฟังก์ชันกดอ่านและลบแจ้งเตือน
 *   3. ทั้งระบบ (App.jsx): เชื่อมต่อและตัดการเชื่อมต่อ WebSocket Socket.io ตามสถานะการล็อกอินของผู้ใช้
 * 
 * หน้าที่: เป็น Entry Point สำหรับ Export Zustand Store ของระบบการแจ้งเตือน
 *         โดยนำ `notificationService` (API จัดการข้อมูลแจ้งเตือน) มารวมกับ `realtime` (ระบบ WebSocket)
 *         เพื่อสร้างเป็น Notification Store สำเร็จรูปพร้อมใช้งาน
 * =========================================================================
 */
export default createNotificationStore(notificationService, realtime);

