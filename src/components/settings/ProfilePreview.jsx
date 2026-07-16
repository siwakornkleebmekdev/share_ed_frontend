import { AVATAR_SHAPES, DEFAULT_THEME } from '@/pages/settings/themeConstants';
import { hexToRgba } from '@/utils/colorUtils';

// Card-surface treatment per cardStyle — background/border come from
// cardColor+cardOpacity via inline style below, this only controls blur and
// border/shadow character (outlined has no fill at all).
const STYLE_CLASSES = {
  classic: 'shadow-xl',
  'frosted-square': 'backdrop-blur-xl border border-white/15',
  'frosted-soft': 'backdrop-blur-xl border border-white/15 shadow-2xl',
  outlined: 'border-2 shadow-none',
};

// Live phone-mockup preview of the profile hero card, reflecting the current
// (possibly unsaved) theme settings — layout, style, color, opacity, corner
// roundness, avatar shape, name/text color, and equipped frame all render
// here live. Used by the Appearance and Profile settings pages.
// Note: avatar/wallpaper here always reflect the *saved* user record unless
// the caller merges in unsaved uploads itself (SettingsProfile does this).
export default function ProfilePreview({ user, formData }) {
  const theme = formData.theme_settings;
  const avatarShape = AVATAR_SHAPES.find(s => s.id === theme.avatarShape) || AVATAR_SHAPES[3];
  const wallpaperUrl = user?.user_metadata?.wallpaper_url;
  const bannerUrl = user?.user_metadata?.banner_url;
  const avatarUrl = user?.avatar_url;
  const hasFrame = !!user?.user_metadata?.profile_frame_id;

  // "ปรับสีการ์ดเอง" off falls back to the default color/opacity instead of
  // whatever custom values are still saved but not currently in effect.
  const effectiveColor = theme.cardColorCustom ? theme.cardColor : DEFAULT_THEME.cardColor;
  const effectiveOpacity = theme.cardColorCustom ? theme.cardOpacity : DEFAULT_THEME.cardOpacity;

  const isOutlined = theme.cardStyle === 'outlined';
  const styleClass = STYLE_CLASSES[theme.cardStyle] || STYLE_CLASSES.classic;
  // A custom border color should always draw a visible border, even on the
  // "classic" style which otherwise has no border of its own.
  const needsForcedBorder = !!theme.cardBorderColor && !styleClass.includes('border');
  const cardStyle = {
    borderRadius: `${theme.cornerRoundness}px`,
    backgroundColor: isOutlined ? 'transparent' : hexToRgba(effectiveColor, effectiveOpacity),
    borderColor: theme.cardBorderColor || (isOutlined ? effectiveColor : undefined),
  };

  const avatarBlock = (size) => (
    <div className={`relative ${size} bg-slate-200 border-2 border-white/50 overflow-hidden shrink-0 ${avatarShape.className}`}>
      {avatarUrl ? (
        <img src={avatarUrl} alt="Avatar" className="w-full h-full object-cover" />
      ) : (
        <div className="w-full h-full flex items-center justify-center font-black text-xl text-slate-500">
          {(formData.nickname || 'U').charAt(0).toUpperCase()}
        </div>
      )}
      {hasFrame && (
        <div className={`absolute inset-0 border-4 border-amber-400 mix-blend-overlay pointer-events-none ${avatarShape.className}`}></div>
      )}
    </div>
  );

  const nameBlock = (align) => (
    <>
      <h3 className={`text-xl font-black ${align}`} style={{ color: theme.nameColor }}>{formData.nickname || 'ผู้ใช้งาน'}</h3>
      {formData.bio && (
        <p className={`text-sm line-clamp-2 ${align}`} style={{ color: theme.textColor }}>{formData.bio}</p>
      )}
      {formData.tags?.length > 0 && (
        <div className={`flex flex-wrap gap-1.5 ${align === 'text-left' ? 'justify-start' : 'justify-center'}`}>
          {formData.tags.map((tag, i) => (
            <span key={i} className="px-2 py-0.5 bg-white/10 backdrop-blur-md rounded-full text-[10px] font-bold text-white border border-white/10">{tag}</span>
          ))}
        </div>
      )}
    </>
  );

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
          <div className="absolute inset-0 bg-gradient-to-b from-black/10 via-black/30 to-black/60"></div>
        </div>

        {/* The actual "card" — the only element cardLayout/cardStyle/cardColor/
            cardOpacity/cornerRoundness apply to, sitting over the wallpaper. */}
        <div
          className={`absolute left-4 right-4 top-1/2 -translate-y-1/2 p-4 overflow-hidden ${styleClass} ${needsForcedBorder ? 'border-2' : ''}`}
          style={cardStyle}
        >
          {bannerUrl && (
            <div
              className="absolute inset-x-0 top-0 h-2/3 pointer-events-none"
              style={{
                maskImage: 'linear-gradient(to bottom, black 0%, black 35%, transparent 90%)',
                WebkitMaskImage: 'linear-gradient(to bottom, black 0%, black 35%, transparent 90%)',
              }}
            >
              <img src={bannerUrl} alt="" className="w-full h-full object-cover" />
            </div>
          )}

          <div className="relative">
            {theme.cardLayout === 'compact' ? (
              <div className="flex items-center gap-3">
                {avatarBlock('h-12 w-12')}
                <div className="flex-1 min-w-0 text-left space-y-0.5">
                  {nameBlock('text-left')}
                </div>
              </div>
            ) : theme.cardLayout === 'stacked' ? (
              <div className="flex flex-col items-start gap-2 text-left">
                {avatarBlock('h-16 w-16')}
                {nameBlock('text-left')}
              </div>
            ) : (
              <div className="flex flex-col items-center gap-2 text-center">
                {avatarBlock('h-16 w-16')}
                {nameBlock('text-center')}
              </div>
            )}
          </div>
        </div>
      </div>
      <div className="rounded-2xl bg-blue-50 border border-blue-100 p-4">
        <p className="text-xs font-bold text-primary mb-1">เคล็ดลับ</p>
        <p className="text-xs text-slate-600">การเปลี่ยนแปลงจะสะท้อนบนพรีวิวทันที — กดบันทึกเมื่อพร้อมเผยแพร่</p>
      </div>
    </div>
  );
}
