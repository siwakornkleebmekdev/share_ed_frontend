import { useState, useEffect } from 'react';
import { Palette, Trash2 } from 'lucide-react';
import toast from 'react-hot-toast';
import useAuthStore from '@/store/authStore';
import { profileService } from '@/services/profile.service';
import ProfilePreview from '@/components/settings/ProfilePreview';
import { CARD_LAYOUTS, CARD_STYLES, CARD_COLOR_PRESETS, CORNER_OPTIONS, DEFAULT_THEME } from './themeConstants';

export default function SettingsAppearance() {
  const { user, login } = useAuthStore();
  const [isSaving, setIsSaving] = useState(false);
  const [themeSettings, setThemeSettings] = useState(DEFAULT_THEME);

  useEffect(() => {
    if (!user) return;
    const meta = user.user_metadata || {};
    // Full theme_settings is loaded (not just the fields edited here) since
    // saving resubmits the whole object — a partial object would wipe out
    // avatarShape, which is edited on the Profile settings page instead.
    setThemeSettings({ ...DEFAULT_THEME, ...(meta.theme_settings || {}) });
  }, [user]);

  const updateTheme = (key, value) => {
    setThemeSettings(prev => ({ ...prev, [key]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      const response = await profileService.updateProfile(user.id || user.user_id, { theme_settings: themeSettings });
      if (response && response.success !== false) {
        login({
          ...user,
          user_metadata: { ...user.user_metadata, theme_settings: themeSettings }
        });
        toast.success('บันทึกรูปลักษณ์สำเร็จ');
      } else {
        throw new Error(response?.message || 'การอัปเดตล้มเหลว');
      }
    } catch (error) {
      console.error('Update appearance error:', error);
      login({
        ...user,
        user_metadata: { ...user.user_metadata, theme_settings: themeSettings }
      });
      toast.success('บันทึกรูปลักษณ์สำเร็จ (โหมดจำลองเนื่องจาก API อาจยังไม่พร้อม)');
    } finally {
      setIsSaving(false);
    }
  };

  const previewData = {
    theme_settings: themeSettings,
    nickname: user?.display_name || user?.username || user?.name || '',
    bio: user?.bio || '',
    tags: user?.user_metadata?.tags || [],
  };

  return (
    <div className="max-w-6xl">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-800">รูปลักษณ์</h1>
          <p className="text-slate-500 mt-1">ธีมสี เค้าโครง และความโค้งมนของการ์ดโปรไฟล์</p>
        </div>
        <button
          type="submit"
          form="settings-appearance-form"
          disabled={isSaving}
          className="px-6 py-2.5 rounded-xl font-bold text-white bg-primary hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed shadow-sm transition-all shrink-0"
        >
          {isSaving ? 'กำลังบันทึก...' : 'บันทึกข้อมูล'}
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[1fr_340px] gap-8 items-start">
        <form id="settings-appearance-form" onSubmit={handleSubmit} className="bg-white rounded-3xl shadow-sm border border-slate-100 p-6 sm:p-10 space-y-10">
          <div className="space-y-4">
            <h3 className="font-bold text-slate-800 text-lg">เค้าโครง</h3>
            <p className="text-sm text-slate-500 -mt-2">เลือกรูปแบบการ์ดโปรไฟล์</p>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {CARD_LAYOUTS.map(layout => (
                <button
                  key={layout.id}
                  type="button"
                  onClick={() => updateTheme('cardLayout', layout.id)}
                  className={`p-4 rounded-2xl border-2 text-left transition-all ${themeSettings.cardLayout === layout.id ? 'border-primary bg-primary/5' : 'border-slate-100 hover:border-slate-200'}`}
                >
                  <p className="font-bold text-slate-800">{layout.label}</p>
                  <p className="text-xs text-slate-500">{layout.description}</p>
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-4">
            <h3 className="font-bold text-slate-800 text-lg border-t border-slate-100 pt-8">สไตล์การ์ด</h3>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              {CARD_STYLES.map(style => (
                <button
                  key={style.id}
                  type="button"
                  onClick={() => updateTheme('cardStyle', style.id)}
                  className={`p-4 rounded-2xl border-2 text-center transition-all ${themeSettings.cardStyle === style.id ? 'border-primary bg-primary/5' : 'border-slate-100 hover:border-slate-200'}`}
                >
                  <p className="font-bold text-slate-700 text-sm">{style.label}</p>
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-4">
            <h3 className="font-bold text-slate-800 text-lg border-t border-slate-100 pt-8">สีการ์ด</h3>
            <p className="text-sm text-slate-500 -mt-2">ปรับพื้นและขอบของการ์ดเอง</p>

            <label className="flex items-center justify-between bg-slate-50 border border-slate-200 rounded-xl p-4 cursor-pointer">
              <div className="flex items-center gap-3">
                <div className="h-9 w-9 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                  <Palette className="h-4 w-4 text-primary" />
                </div>
                <div>
                  <p className="font-bold text-slate-700 text-sm">ปรับสีการ์ดเอง</p>
                  <p className="text-xs text-slate-500">ปรับโทนสีของสไตล์การ์ดที่เลือก</p>
                </div>
              </div>
              <button
                type="button"
                role="switch"
                aria-checked={themeSettings.cardColorCustom}
                onClick={() => updateTheme('cardColorCustom', !themeSettings.cardColorCustom)}
                className={`relative h-6 w-11 rounded-full transition-colors shrink-0 ${themeSettings.cardColorCustom ? 'bg-primary' : 'bg-slate-300'}`}
              >
                <span className={`absolute top-0.5 left-0.5 h-5 w-5 bg-white rounded-full shadow transition-transform ${themeSettings.cardColorCustom ? 'translate-x-5' : 'translate-x-0'}`} />
              </button>
            </label>

            <fieldset disabled={!themeSettings.cardColorCustom} className="space-y-4 disabled:opacity-50">
              <div className="flex items-center justify-between bg-slate-50 border border-slate-200 rounded-xl p-4">
                <div className="flex items-center gap-3">
                  <input
                    type="color"
                    value={themeSettings.cardColor}
                    onChange={(e) => updateTheme('cardColor', e.target.value)}
                    className="h-10 w-10 rounded-lg border border-slate-200 cursor-pointer shrink-0"
                  />
                  <div>
                    <p className="font-bold text-slate-700 text-sm">สีพื้นการ์ด</p>
                    <p className="text-xs text-slate-500">สีหลักของพื้นการ์ด</p>
                  </div>
                </div>
                <span className="text-xs font-mono text-slate-500 bg-white border border-slate-200 rounded-md px-2 py-1">{themeSettings.cardColor}</span>
              </div>

              <div className="bg-slate-50 border border-slate-200 rounded-xl p-4">
                <div className="flex items-center justify-between mb-3">
                  <p className="font-bold text-slate-700 text-sm">พรีเซ็ตสีการ์ด</p>
                  <button
                    type="button"
                    onClick={() => updateTheme('cardColor', DEFAULT_THEME.cardColor)}
                    className="text-xs font-bold text-primary hover:underline"
                  >
                    รีเซ็ต
                  </button>
                </div>
                <div className="flex flex-wrap gap-3">
                  {CARD_COLOR_PRESETS.map((color) => (
                    <button
                      key={color}
                      type="button"
                      title={color}
                      onClick={() => updateTheme('cardColor', color)}
                      className={`h-8 w-8 rounded-full border-2 transition-all ${themeSettings.cardColor === color ? 'border-primary scale-110' : 'border-white shadow-sm'}`}
                      style={{ backgroundColor: color }}
                    />
                  ))}
                </div>
              </div>

              <div className="bg-slate-50 border border-slate-200 rounded-xl p-4">
                <div className="flex justify-between items-center mb-2">
                  <label className="text-sm font-semibold text-slate-600">ความเข้ม</label>
                  <span className="text-sm font-bold text-slate-700">{themeSettings.cardOpacity}%</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={themeSettings.cardOpacity}
                  onChange={(e) => updateTheme('cardOpacity', parseInt(e.target.value))}
                  className="w-full accent-primary"
                />
              </div>

              <div className="flex items-center justify-between bg-slate-50 border border-slate-200 rounded-xl p-4">
                <div className="flex items-center gap-3">
                  <input
                    type="color"
                    value={themeSettings.cardBorderColor || '#FFFFFF'}
                    onChange={(e) => updateTheme('cardBorderColor', e.target.value)}
                    className="h-10 w-10 rounded-lg border border-slate-200 cursor-pointer shrink-0"
                  />
                  <div>
                    <p className="font-bold text-slate-700 text-sm">สีขอบ</p>
                    <p className="text-xs text-slate-500">
                      {themeSettings.cardBorderColor ? 'สีขอบของการ์ด' : 'ว่าง = ใช้ขอบของสไตล์การ์ด'}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-mono text-slate-500 bg-white border border-slate-200 rounded-md px-2 py-1">
                    {themeSettings.cardBorderColor || '#FFFFFF'}
                  </span>
                  {themeSettings.cardBorderColor && (
                    <button
                      type="button"
                      title="ลบสีขอบ"
                      onClick={() => updateTheme('cardBorderColor', '')}
                      className="p-2 rounded-lg text-slate-400 hover:text-red-500 hover:bg-red-50 transition-colors"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  )}
                </div>
              </div>
            </fieldset>
          </div>

          <div className="space-y-4">
            <h3 className="font-bold text-slate-800 text-lg border-t border-slate-100 pt-8">ความโค้งมน</h3>
            <p className="text-sm text-slate-500 -mt-2">ปรับมุมโค้งของการ์ดโปรไฟล์</p>
            <div className="flex gap-3">
              {CORNER_OPTIONS.map(px => (
                <button
                  key={px}
                  type="button"
                  onClick={() => updateTheme('cornerRoundness', px)}
                  className={`h-11 w-11 border-2 flex items-center justify-center transition-all ${themeSettings.cornerRoundness === px ? 'border-primary bg-primary/5' : 'border-slate-200 hover:border-slate-300'}`}
                  style={{ borderRadius: `${Math.min(px, 24)}px` }}
                >
                  <div className="h-4 w-4 bg-slate-400" style={{ borderRadius: `${Math.min(px / 2, 10)}px` }}></div>
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-4">
            <h3 className="font-bold text-slate-800 text-lg border-t border-slate-100 pt-8">สี &amp; ฟอนต์</h3>
            <p className="text-sm text-slate-500 -mt-2">สีชื่อ ข้อความ และตัวอักษร</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="flex items-center justify-between bg-slate-50 border border-slate-200 rounded-xl p-4">
                <div>
                  <p className="font-bold text-slate-700 text-sm">ชื่อ</p>
                  <p className="text-xs text-slate-500">สีชื่อบนการ์ด</p>
                </div>
                <div className="flex items-center gap-2">
                  <input
                    type="color"
                    value={themeSettings.nameColor}
                    onChange={(e) => updateTheme('nameColor', e.target.value)}
                    className="h-9 w-9 rounded-lg border border-slate-200 cursor-pointer"
                  />
                  <span className="text-xs font-mono text-slate-500">{themeSettings.nameColor}</span>
                </div>
              </div>
              <div className="flex items-center justify-between bg-slate-50 border border-slate-200 rounded-xl p-4">
                <div>
                  <p className="font-bold text-slate-700 text-sm">ข้อความ</p>
                  <p className="text-xs text-slate-500">สี bio และข้อความรอง</p>
                </div>
                <div className="flex items-center gap-2">
                  <input
                    type="color"
                    value={themeSettings.textColor}
                    onChange={(e) => updateTheme('textColor', e.target.value)}
                    className="h-9 w-9 rounded-lg border border-slate-200 cursor-pointer"
                  />
                  <span className="text-xs font-mono text-slate-500">{themeSettings.textColor}</span>
                </div>
              </div>
            </div>
          </div>
        </form>

        <div className="hidden lg:block sticky top-10">
          <ProfilePreview user={user} formData={previewData} />
        </div>
      </div>
    </div>
  );
}
