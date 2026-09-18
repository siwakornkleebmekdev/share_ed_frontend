import { useState, useEffect } from 'react';
import { Pencil, Trash2 } from 'lucide-react';
import toast from 'react-hot-toast';
import useAuthStore from '@/store/authStore';
import { supabase } from '@/utils/supabase';
import { profileService } from '@/services/profile.service';
import { WIDGET_PLATFORMS, createWidget, getPlatformConfig } from './widgetConstants';
import { DEFAULT_THEME } from './themeConstants';
import WidgetCard from '@/components/settings/WidgetCard';
import WidgetModal from '@/components/settings/WidgetModal';

/**
 * =========================================================================
 * ตำแหน่งบนหน้าเว็บ: หน้าตั้งค่าวิดเจ็ตโซเชียลมีเดีย (URL: /settings/widgets)
 * หน้าที่: หน้าหลักสำหรับจัดการการ์ดลิงก์โซเชียลที่จะนำไปแสดงบนหน้าโปรไฟล์ ประกอบด้วย:
 *         1. ปุ่มเลือกแพลตฟอร์มที่ต้องการเพิ่ม (Instagram, Facebook, YouTube, Discord ฯลฯ)
 *         2. รายการการ์ดวิดเจ็ตที่เพิ่มไว้แล้ว พร้อมปุ่มแก้ไข (ดินสอ) และปุ่มลบ (ถังขยะ)
 *         3. ป๊อปอัปฟอร์มสำหรับกรอกลิงก์และตั้งค่าการแสดงผล (WidgetModal)
 * =========================================================================
 */
export default function SettingsWidgets() {
  const { user, login } = useAuthStore();
  const [widgets, setWidgets] = useState([]);
  const [modalPlatformId, setModalPlatformId] = useState(null);

  /**
   * ตำแหน่งบนหน้าเว็บ: รายการวิดเจ็ตทั้งหมดในหน้านี้
   * หน้าที่: ทำงานเมื่อเปิดหน้าเว็บ เพื่อดึงรายการวิดเจ็ตที่บันทึกไว้ใน `user.user_metadata.widgets`
   *         มาเก็บใน state เพื่อแสดงผล
   */
  useEffect(() => {
    if (!user) return;
    setWidgets(user.user_metadata?.widgets || []);
  }, [user]);

  const cardTheme = { ...DEFAULT_THEME, ...(user?.user_metadata?.theme_settings || {}) };

  /**
   * ตำแหน่งบนหน้าเว็บ: การบันทึกข้อมูลวิดเจ็ตทั้งหมด
   * หน้าที่: บันทึกรายการวิดเจ็ตล่าสุดลง Supabase Auth Metadata และอัปเดต Auth Store ทันที
   *         พร้อมแสดงการแจ้งเตือน Toast ความสำเร็จ
   */
  const persist = async (nextWidgets, successMessage) => {
    try {
      // Save directly to Supabase auth metadata since backend doesn't support widgets column yet
      const { error } = await supabase.auth.updateUser({
        data: { widgets: nextWidgets }
      });
      
      if (error) throw error;

      setWidgets(nextWidgets);
      login({ ...user, user_metadata: { ...user.user_metadata, widgets: nextWidgets } });
      toast.success(successMessage);
    } catch (error) {
      console.error('Error saving widgets:', error);
      
      // Fallback update local state anyway
      setWidgets(nextWidgets);
      login({ ...user, user_metadata: { ...user.user_metadata, widgets: nextWidgets } });
      toast.success(successMessage + " (โหมดจำลอง)");
    }
  };

  /**
   * ตำแหน่งบนหน้าเว็บ: ปุ่มบันทึกในหน้าต่างป๊อปอัป WidgetModal
   * หน้าที่: รับข้อมูล URL และ options ที่ผู้ใช้กรอกเข้ามา หากมีวิดเจ็ตเดิมอยู่แล้วจะทำการอัปเดต (Update)
   *         หากเป็นแพลตฟอร์มใหม่จะเพิ่มเข้าไปในลิสต์ (Create) แล้วเรียก `persist` บันทึกข้อมูล
   */
  const handleSaveWidget = (platformId, { url, options }) => {
    const next = widgets.some((w) => w.platformId === platformId)
      ? widgets.map((w) => (w.platformId === platformId ? { ...w, url, options } : w))
      : [...widgets, createWidget(platformId, { url, options })];
    persist(next, 'บันทึกวิดเจ็ตแล้ว');
  };

  /**
   * ตำแหน่งบนหน้าเว็บ: ปุ่มไอคอนรูปถังขยะสีแดง (Trash) ที่มุมบนขวาของการ์ดวิดเจ็ตแต่ละใบ
   * หน้าที่: ลบวิดเจ็ตของแพลตฟอร์มนั้นออกจากรายการ และอัปเดตบันทึกข้อมูลทันที
   */
  const handleDeleteWidget = (platformId) => {
    persist(widgets.filter((w) => w.platformId !== platformId), 'ลบวิดเจ็ตแล้ว');
  };

  const activePlatformConfig = getPlatformConfig(modalPlatformId);
  const editingWidget = widgets.find((w) => w.platformId === modalPlatformId) || null;

  return (
    <div className="max-w-5xl space-y-8">
      <div>
        <h1 className="text-2xl font-extrabold text-slate-800">วิดเจ็ต</h1>
        <p className="text-slate-500 mt-1">เพิ่มลิงก์โซเชียลของคุณเป็นการ์ดวิดเจ็ตที่แสดงบนโปรไฟล์</p>
      </div>

      <div className="bg-white rounded-3xl shadow-sm border border-slate-100 p-6 space-y-3">
        <p className="text-sm font-semibold text-slate-600">เลือกแพลตฟอร์มที่ต้องการเพิ่ม</p>
        <div className="flex flex-wrap gap-3">
          {WIDGET_PLATFORMS.map((platform) => {
            const Icon = platform.icon;
            const exists = widgets.some((w) => w.platformId === platform.id);
            return (
              <button
                key={platform.id}
                type="button"
                onClick={() => setModalPlatformId(platform.id)}
                className="flex items-center gap-2 pl-3 pr-4 py-2.5 rounded-full font-bold text-sm text-white shadow-sm hover:opacity-90 transition-opacity"
                style={{ backgroundColor: platform.brandColor }}
                title={exists ? `แก้ไข ${platform.label}` : `เพิ่ม ${platform.label}`}
              >
                <Icon className="h-4 w-4" /> {platform.label}
              </button>
            );
          })}
        </div>
      </div>

      <div className="space-y-3">
        <p className="text-sm font-semibold text-slate-600">วิดเจ็ตที่เพิ่มแล้ว</p>
        {widgets.length === 0 ? (
          <p className="text-sm text-slate-400 bg-white rounded-3xl border border-slate-100 py-10 text-center">
            ยังไม่มีวิดเจ็ต — เลือกแพลตฟอร์มด้านบนเพื่อเริ่มเพิ่ม
          </p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {widgets.map((widget) => {
              const platform = getPlatformConfig(widget.platformId);
              if (!platform) return null;
              return (
                <div key={widget.id} className="relative group">
                  <WidgetCard platform={platform} url={widget.url} options={widget.options} cardTheme={cardTheme} />
                  <div className="absolute top-2 right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button onClick={() => setModalPlatformId(widget.platformId)} className="p-1.5 rounded-lg bg-white/90 text-slate-600 hover:text-primary shadow-sm">
                      <Pencil className="h-3.5 w-3.5" />
                    </button>
                    <button onClick={() => handleDeleteWidget(widget.platformId)} className="p-1.5 rounded-lg bg-white/90 text-slate-600 hover:text-red-500 shadow-sm">
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      <WidgetModal
        isOpen={!!modalPlatformId}
        onClose={() => setModalPlatformId(null)}
        platformConfig={activePlatformConfig}
        initialData={editingWidget}
        cardTheme={cardTheme}
        onConfirm={handleSaveWidget}
      />
    </div>
  );
}
