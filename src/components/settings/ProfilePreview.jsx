import { AVATAR_SHAPES } from '@/pages/settings/themeConstants';

// Live phone-mockup preview of the profile hero card, reflecting the current
// (possibly unsaved) theme settings. Used by the Appearance settings page.
// Note: avatar/wallpaper here always reflect the *saved* user record — those
// are edited on a different settings route, so unsaved uploads there won't
// show up live here (only theme colors/layout/shape do).
export default function ProfilePreview({ user, formData }) {
  const theme = formData.theme_settings;
  const avatarShape = AVATAR_SHAPES.find(s => s.id === theme.avatarShape) || AVATAR_SHAPES[3];
  const wallpaperUrl = user?.user_metadata?.wallpaper_url;
  const avatarUrl = user?.avatar_url;

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between px-1">
        <span className="text-xs font-bold text-slate-400">พรีวิวสด</span>
        <span className="flex items-center gap-1 text-xs font-bold text-emerald-500">
          <span className="h-1.5 w-1.5 bg-emerald-500 rounded-full"></span> LIVE
        </span>
      </div>
      <div className="rounded-[32px] border-8 border-slate-800 bg-slate-900 shadow-xl overflow-hidden aspect-[9/16] relative">
        <div className="absolute inset-0">
          {wallpaperUrl ? (
            wallpaperUrl.endsWith?.('.mp4') ? (
              <video src={wallpaperUrl} className="w-full h-full object-cover" autoPlay muted loop />
            ) : (
              <img src={wallpaperUrl} alt="Wallpaper" className="w-full h-full object-cover" />
            )
          ) : (
            <div className="w-full h-full bg-gradient-to-b from-slate-800 to-slate-950"></div>
          )}
          <div className="absolute inset-0 bg-gradient-to-b from-black/10 via-black/40 to-black/80"></div>
        </div>

        <div className="absolute inset-0 flex flex-col items-center justify-center px-6 text-center gap-4">
          <div className={`h-20 w-20 bg-slate-200 border-2 border-white/50 overflow-hidden ${avatarShape.className}`}>
            {avatarUrl ? (
              <img src={avatarUrl} alt="Avatar" className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full flex items-center justify-center font-black text-2xl text-slate-500">
                {(formData.nickname || 'U').charAt(0).toUpperCase()}
              </div>
            )}
          </div>
          <h3 className="text-2xl font-black" style={{ color: theme.nameColor }}>{formData.nickname || 'ผู้ใช้งาน'}</h3>
          {formData.bio && (
            <p className="text-sm line-clamp-3" style={{ color: theme.textColor }}>{formData.bio}</p>
          )}
          {formData.tags?.length > 0 && (
            <div className="flex flex-wrap gap-1.5 justify-center">
              {formData.tags.map((tag, i) => (
                <span key={i} className="px-2 py-0.5 bg-white/10 backdrop-blur-md rounded-full text-[10px] font-bold text-white border border-white/10">{tag}</span>
              ))}
            </div>
          )}
        </div>
      </div>
      <div className="rounded-2xl bg-blue-50 border border-blue-100 p-4">
        <p className="text-xs font-bold text-primary mb-1">เคล็ดลับ</p>
        <p className="text-xs text-slate-600">การเปลี่ยนแปลงจะสะท้อนบนพรีวิวทันที — กดบันทึกเมื่อพร้อมเผยแพร่</p>
      </div>
    </div>
  );
}
