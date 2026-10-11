import { useState, useEffect } from 'react';
import { Pencil, Trash2 } from 'lucide-react';
import toast from 'react-hot-toast';
import useAuthStore from '@/store/authStore';
import { profileService } from '@/services/profile.service';
import { WIDGET_PLATFORMS, createWidget, getPlatformConfig } from './widgetConstants';
import { DEFAULT_THEME } from './themeConstants';
import WidgetCard from '@/components/settings/WidgetCard';
import WidgetModal from '@/components/settings/WidgetModal';
import { getWidgetUrlError } from '@/utils/widgetUrl';

export default function SettingsWidgets() {
  const { user, login } = useAuthStore();
  const [widgets, setWidgets] = useState([]);
  const [modalPlatformId, setModalPlatformId] = useState(null);
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user?.id) return;
    let active = true;
    profileService.getMyWidgets()
      .then(async (saved) => {
        if (saved === null && Array.isArray(user.user_metadata?.widgets)) {
          const legacy = user.user_metadata.widgets
            .filter((widget) => typeof widget?.url === 'string' && !getWidgetUrlError(widget?.platformId, widget.url))
            .map((widget) => createWidget(widget.platformId, widget));
          const unique = [...new Map(legacy.map((widget) => [widget.platformId, widget])).values()];
          if (unique.length) saved = await profileService.updateMyWidgets(unique);
        }
        if (active) setWidgets(Array.isArray(saved) ? saved : []);
      })
      .catch((error) => {
        console.error('Error loading widgets:', error);
        if (active) toast.error('โหลดวิดเจ็ตไม่สำเร็จ กรุณาลองใหม่');
      })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [user?.id, user?.user_metadata?.widgets]);

  const cardTheme = { ...DEFAULT_THEME, ...(user?.user_metadata?.theme_settings || {}) };

  const persist = async (nextWidgets, successMessage) => {
    if (saving) return false;
    setSaving(true);
    try {
      const saved = await profileService.updateMyWidgets(nextWidgets);
      setWidgets(saved);
      login({ ...useAuthStore.getState().user, widgets: saved, user_metadata: { ...useAuthStore.getState().user?.user_metadata, widgets: saved } });
      toast.success(successMessage);
      return true;
    } catch (error) {
      console.error('Error saving widgets:', error);
      toast.error(error.response?.data?.message || 'บันทึกวิดเจ็ตไม่สำเร็จ กรุณาลองใหม่');
      return false;
    } finally {
      setSaving(false);
    }
  };

  const handleSaveWidget = async (platformId, { url, options }) => {
    // ตรวจอีกครั้งก่อนส่งไปเก็บในข้อมูลผู้ใช้ เผื่อมีทางเรียกบันทึกนอกฟอร์ม
    const urlError = getWidgetUrlError(platformId, url);
    if (urlError) {
      toast.error(urlError);
      return false;
    }
    const next = widgets.some((w) => w.platformId === platformId)
      ? widgets.map((w) => (w.platformId === platformId ? { ...w, url, options } : w))
      : [...widgets, createWidget(platformId, { url, options })];
    return persist(next, 'บันทึกวิดเจ็ตแล้ว');
  };

  const handleDeleteWidget = (platformId) => {
    void persist(widgets.filter((w) => w.platformId !== platformId), 'ลบวิดเจ็ตแล้ว');
  };

  const activePlatformConfig = getPlatformConfig(modalPlatformId);
  const editingWidget = widgets.find((w) => w.platformId === modalPlatformId) || null;

  return (
    <div className="max-w-5xl space-y-8">
      <div>
        <h1 className="text-2xl font-extrabold text-slate-800">วิดเจ็ต</h1>
        <p className="text-slate-500 mt-1">เพิ่มลิงก์โซเชียลของคุณเป็นการ์ดวิดเจ็ตที่แสดงบนโปรไฟล์</p>
      </div>

      <div className="space-y-3 rounded-2xl border border-slate-100 bg-white p-4 shadow-sm sm:rounded-3xl sm:p-6">
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
                disabled={loading || saving}
                className="flex flex-1 items-center justify-center gap-2 rounded-full py-2.5 pl-3 pr-4 text-sm font-bold text-white shadow-sm transition-opacity hover:opacity-90 sm:flex-none"
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
        {loading ? (
          <p className="text-sm text-slate-400 bg-white rounded-3xl border border-slate-100 py-10 text-center">กำลังโหลดวิดเจ็ต...</p>
        ) : widgets.length === 0 ? (
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
                  <WidgetCard platform={platform} url={widget.url} cardTheme={cardTheme} />
                  <div className="absolute right-2 top-2 flex gap-1 opacity-100 transition-opacity sm:opacity-0 sm:group-hover:opacity-100">
                    <button onClick={() => setModalPlatformId(widget.platformId)} className="p-1.5 rounded-lg bg-white/90 text-slate-600 hover:text-primary shadow-sm">
                      <Pencil className="h-3.5 w-3.5" />
                    </button>
                    <button disabled={saving} onClick={() => handleDeleteWidget(widget.platformId)} className="p-1.5 rounded-lg bg-white/90 text-slate-600 hover:text-red-500 shadow-sm">
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
        saving={saving}
      />
    </div>
  );
}
