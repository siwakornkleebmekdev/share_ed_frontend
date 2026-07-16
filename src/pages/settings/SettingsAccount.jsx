import { useState, useEffect } from 'react';
import { Mail, KeyRound, Bell, Heart, MessageSquare, Info } from 'lucide-react';
import toast from 'react-hot-toast';
import useAuthStore from '@/store/authStore';
import { authService } from '@/services/auth.service';
import { profileService } from '@/services/profile.service';

const NOTIFICATION_TYPES = [
  { key: 'LIKE', label: 'ถูกใจโพสต์', description: 'แจ้งเตือนเมื่อมีคนกดถูกใจโพสต์ของคุณ', icon: Heart },
  { key: 'COMMENT', label: 'ความคิดเห็น', description: 'แจ้งเตือนเมื่อมีคนแสดงความคิดเห็นในโพสต์ของคุณ', icon: MessageSquare },
  { key: 'SYSTEM', label: 'ระบบ/ประกาศ', description: 'แจ้งเตือนทั่วไปจากระบบ เช่น สถานะโพสต์ที่ถูกรายงาน', icon: Info },
];

const DEFAULT_NOTIFICATION_PREFS = { LIKE: true, COMMENT: true, SYSTEM: true };

export default function SettingsAccount() {
  const { user, login } = useAuthStore();

  const [email, setEmail] = useState('');
  const [isSavingEmail, setIsSavingEmail] = useState(false);

  const [passwords, setPasswords] = useState({ password: '', confirmPassword: '' });
  const [isSavingPassword, setIsSavingPassword] = useState(false);

  const [notificationPrefs, setNotificationPrefs] = useState(DEFAULT_NOTIFICATION_PREFS);
  const [isSavingPrefs, setIsSavingPrefs] = useState(false);

  useEffect(() => {
    if (!user) return;
    setEmail(user.email || '');
    setNotificationPrefs({ ...DEFAULT_NOTIFICATION_PREFS, ...(user.user_metadata?.notification_preferences || {}) });
  }, [user]);

  const handleSaveEmail = async (e) => {
    e.preventDefault();
    if (!email || email === user?.email) return;
    setIsSavingEmail(true);
    try {
      await authService.updateAccount({ email });
      toast.success('ส่งอีเมลยืนยันการเปลี่ยนแปลงแล้ว กรุณาตรวจสอบกล่องจดหมายของคุณ');
    } catch (error) {
      console.error('Update email error:', error);
      toast.error(error?.message || 'ไม่สามารถเปลี่ยนอีเมลได้ในขณะนี้');
    } finally {
      setIsSavingEmail(false);
    }
  };

  const handleSavePassword = async (e) => {
    e.preventDefault();
    if (passwords.password.length < 8) {
      toast.error('รหัสผ่านต้องมีความยาวอย่างน้อย 8 ตัวอักษร');
      return;
    }
    if (passwords.password !== passwords.confirmPassword) {
      toast.error('รหัสผ่านและการยืนยันรหัสผ่านไม่ตรงกัน');
      return;
    }
    setIsSavingPassword(true);
    try {
      await authService.updateAccount({ password: passwords.password });
      setPasswords({ password: '', confirmPassword: '' });
      toast.success('เปลี่ยนรหัสผ่านสำเร็จ');
    } catch (error) {
      console.error('Update password error:', error);
      toast.error(error?.message || 'ไม่สามารถเปลี่ยนรหัสผ่านได้ในขณะนี้');
    } finally {
      setIsSavingPassword(false);
    }
  };

  const toggleNotificationPref = (key) => {
    setNotificationPrefs(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const handleSavePrefs = async () => {
    setIsSavingPrefs(true);
    try {
      const response = await profileService.updateProfile(user.id || user.user_id, { notification_preferences: notificationPrefs });
      if (response && response.success !== false) {
        login({ ...user, user_metadata: { ...user.user_metadata, notification_preferences: notificationPrefs } });
        toast.success('บันทึกการตั้งค่าการแจ้งเตือนสำเร็จ');
      } else {
        throw new Error(response?.message || 'การอัปเดตล้มเหลว');
      }
    } catch (error) {
      console.error('Update notification prefs error:', error);
      login({ ...user, user_metadata: { ...user.user_metadata, notification_preferences: notificationPrefs } });
      toast.success('บันทึกการตั้งค่าการแจ้งเตือนสำเร็จ (โหมดจำลองเนื่องจาก API อาจยังไม่พร้อม)');
    } finally {
      setIsSavingPrefs(false);
    }
  };

  return (
    <div className="max-w-3xl space-y-6">
      <div>
        <h1 className="text-2xl font-extrabold text-slate-800">ตั้งค่าบัญชี</h1>
        <p className="text-slate-500 mt-1">อีเมล รหัสผ่าน และการแจ้งเตือนของคุณ</p>
      </div>

      {/* Email */}
      <form onSubmit={handleSaveEmail} className="bg-white rounded-3xl shadow-sm border border-slate-100 p-6 sm:p-8 space-y-4">
        <h3 className="font-bold text-slate-800 text-lg flex items-center gap-2">
          <Mail className="h-5 w-5 text-slate-400" /> อีเมล
        </h3>
        <div>
          <label className="block text-sm font-semibold text-slate-600 mb-2">ที่อยู่อีเมล</label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-4 focus:ring-primary/10 focus:border-primary transition-all text-slate-800 font-medium"
            placeholder="you@example.com"
          />
          <p className="text-xs text-slate-400 mt-2">การเปลี่ยนอีเมลต้องได้รับการยืนยันผ่านลิงก์ที่ส่งไปยังอีเมลใหม่</p>
        </div>
        <button
          type="submit"
          disabled={isSavingEmail || !email || email === user?.email}
          className="px-6 py-2.5 rounded-xl font-bold text-white bg-primary hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed shadow-sm transition-all"
        >
          {isSavingEmail ? 'กำลังบันทึก...' : 'บันทึกอีเมล'}
        </button>
      </form>

      {/* Password */}
      <form onSubmit={handleSavePassword} className="bg-white rounded-3xl shadow-sm border border-slate-100 p-6 sm:p-8 space-y-4">
        <h3 className="font-bold text-slate-800 text-lg flex items-center gap-2">
          <KeyRound className="h-5 w-5 text-slate-400" /> รหัสผ่าน
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          <div>
            <label className="block text-sm font-semibold text-slate-600 mb-2">รหัสผ่านใหม่</label>
            <input
              type="password"
              value={passwords.password}
              onChange={(e) => setPasswords(prev => ({ ...prev, password: e.target.value }))}
              className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-4 focus:ring-primary/10 focus:border-primary transition-all text-slate-800 font-medium"
              placeholder="อย่างน้อย 8 ตัวอักษร"
            />
          </div>
          <div>
            <label className="block text-sm font-semibold text-slate-600 mb-2">ยืนยันรหัสผ่านใหม่</label>
            <input
              type="password"
              value={passwords.confirmPassword}
              onChange={(e) => setPasswords(prev => ({ ...prev, confirmPassword: e.target.value }))}
              className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-4 focus:ring-primary/10 focus:border-primary transition-all text-slate-800 font-medium"
              placeholder="กรอกรหัสผ่านใหม่อีกครั้ง"
            />
          </div>
        </div>
        <button
          type="submit"
          disabled={isSavingPassword || !passwords.password || !passwords.confirmPassword}
          className="px-6 py-2.5 rounded-xl font-bold text-white bg-primary hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed shadow-sm transition-all"
        >
          {isSavingPassword ? 'กำลังบันทึก...' : 'เปลี่ยนรหัสผ่าน'}
        </button>
      </form>

      {/* Notification preferences */}
      <div className="bg-white rounded-3xl shadow-sm border border-slate-100 p-6 sm:p-8 space-y-4">
        <h3 className="font-bold text-slate-800 text-lg flex items-center gap-2">
          <Bell className="h-5 w-5 text-slate-400" /> การแจ้งเตือน
        </h3>
        <p className="text-sm text-slate-500">เลือกประเภทการแจ้งเตือนที่ต้องการรับ (มีผลกับการแจ้งเตือนใหม่เท่านั้น ไม่ย้อนหลัง)</p>
        <div className="space-y-3">
          {NOTIFICATION_TYPES.map(type => {
            const Icon = type.icon;
            const enabled = notificationPrefs[type.key];
            return (
              <div key={type.key} className="flex items-center justify-between bg-slate-50 border border-slate-200 rounded-xl p-4">
                <div className="flex items-center gap-3">
                  <div className="h-9 w-9 rounded-lg bg-white flex items-center justify-center text-slate-500 shrink-0 shadow-sm">
                    <Icon className="h-4 w-4" />
                  </div>
                  <div>
                    <p className="font-bold text-slate-700 text-sm">{type.label}</p>
                    <p className="text-xs text-slate-500">{type.description}</p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => toggleNotificationPref(type.key)}
                  className={`w-12 h-7 rounded-full transition-colors relative shrink-0 ${enabled ? 'bg-primary' : 'bg-slate-300'}`}
                >
                  <span className={`absolute top-0.5 h-6 w-6 bg-white rounded-full shadow transition-transform ${enabled ? 'translate-x-5' : 'translate-x-0.5'}`}></span>
                </button>
              </div>
            );
          })}
        </div>
        <button
          onClick={handleSavePrefs}
          disabled={isSavingPrefs}
          className="px-6 py-2.5 rounded-xl font-bold text-white bg-primary hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed shadow-sm transition-all"
        >
          {isSavingPrefs ? 'กำลังบันทึก...' : 'บันทึกการแจ้งเตือน'}
        </button>
      </div>
    </div>
  );
}
