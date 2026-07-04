import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router';
import { Image as ImageIcon, MapPin, Link as LinkIcon, BookOpen, Star, FileText, GraduationCap, Clock, Edit, Briefcase, DoorOpen, Trophy, CheckCircle2, Gift } from 'lucide-react';
import toast from 'react-hot-toast';
import PostCard from '@/components/PostCard';

import useAuthStore from '@/store/authStore';
import useHeroThemeStore from '@/store/heroThemeStore';
import useAchievementStore from '@/store/achievementStore';
import { profileService, normalizeFollowCounts } from '@/services/profile.service';
import { Loader2 } from 'lucide-react';
import { getPlatformConfig } from '@/pages/settings/widgetConstants';
import { getGlassColor, rgbToRgba } from '@/utils/colorUtils';

const ACHIEVEMENT_STATUS_META = {
  READY_TO_CLAIM: { label: 'พร้อมรับรางวัล', badgeClass: 'bg-amber-100 text-amber-700' },
  CLAIMED: { label: 'ได้รับรางวัลแล้ว', badgeClass: 'bg-emerald-100 text-emerald-700' },
};

const AVATAR_SHAPE_CLASS = {
  square: 'rounded-none',
  soft: 'rounded-2xl',
  rounded: 'rounded-3xl',
  circle: 'rounded-full',
};

export default function Profile() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { user } = useAuthStore();
  const [activeTab, setActiveTab] = useState('posts'); // posts, drafts, bookmarks, achievements
  const theme = user?.user_metadata?.theme_settings || {};
  const avatarShapeClass = AVATAR_SHAPE_CLASS[theme.avatarShape] || AVATAR_SHAPE_CLASS.circle;
  const enterScreenEnabled = !!user?.user_metadata?.enter_screen_enabled;
  const [hasEntered, setHasEntered] = useState(!enterScreenEnabled);

  useEffect(() => {
    setHasEntered(!enterScreenEnabled);
  }, [enterScreenEnabled]);

  // Profile has a full-bleed hero background (the user's wallpaper, or a
  // dark fallback photo) — the navbar reads its light/dark style from the
  // actual image brightness instead of a hardcoded route. Reset on unmount
  // so other pages aren't left stuck on Profile's theme.
  const setHeroImage = useHeroThemeStore((state) => state.setHeroImage);
  const clearHeroImage = useHeroThemeStore((state) => state.clearHeroImage);
  const isDarkHero = useHeroThemeStore((state) => state.isDarkHero);
  const heroColor = useHeroThemeStore((state) => state.heroColor);
  useEffect(() => {
    // No wallpaper set → the profile defaults to the same plain light theme
    // as every other page (fallbackDark: false), instead of always forcing
    // a dark hero. Once the user sets a wallpaper, isDarkHero/heroColor
    // adapt to that image's actual brightness/color as before.
    setHeroImage(user?.user_metadata?.wallpaper_url, { fallbackDark: false });
    return () => clearHeroImage();
  }, [user?.user_metadata?.wallpaper_url, setHeroImage, clearHeroImage]);

  // Tint the profile card's frosted glass to match the wallpaper's color.
  const cardGlassColor = rgbToRgba(getGlassColor(heroColor, isDarkHero), 22);

  // Themed tokens — light (default, no wallpaper) mirrors every other page's
  // white/slate-50 look; dark activates automatically once isDarkHero flips
  // (i.e. the user set a dark-ish wallpaper).
  const pageBg = isDarkHero ? 'bg-slate-900' : 'bg-slate-50';
  const cardBorderClass = isDarkHero ? 'border-white/10 border-t-white/20' : 'border-slate-100';
  const dividerClass = isDarkHero ? 'border-white/10' : 'border-slate-100';
  const headingClass = isDarkHero ? 'text-white' : 'text-slate-800';
  const subTextClass = isDarkHero ? 'text-slate-400' : 'text-slate-500';
  const mutedTextClass = isDarkHero ? 'text-slate-300' : 'text-slate-600';
  const tagPillClass = isDarkHero ? 'bg-white/10 border-white/10 text-slate-200' : 'bg-slate-100 border-slate-200 text-slate-600';
  const editButtonClass = isDarkHero
    ? 'bg-white/10 hover:bg-white/20 text-white border-white/10'
    : 'bg-slate-100 hover:bg-slate-200 text-slate-700 border-slate-200';
  const avatarBorderClass = isDarkHero ? 'border-slate-800 bg-slate-800' : 'border-white bg-slate-100 shadow-md';
  const tabInactiveClass = isDarkHero
    ? 'bg-white/5 text-slate-300 hover:bg-white/15 hover:text-white border border-white/10 backdrop-blur-xl'
    : 'bg-white text-slate-600 hover:bg-slate-100 hover:text-slate-900 border border-slate-100 shadow-sm';
  const emptyCardClass = isDarkHero
    ? 'bg-white/10 backdrop-blur-xl border-white/10'
    : 'bg-white border-slate-100 shadow-sm';
  const emptyIconWrapClass = isDarkHero ? 'bg-white/10 text-slate-400' : 'bg-slate-100 text-slate-400';

  useEffect(() => {
    const tab = searchParams.get('tab');
    if (tab && ['posts', 'drafts', 'bookmarks', 'achievements'].includes(tab)) {
      setActiveTab(tab);
    }
  }, [searchParams]);
  const [myPosts, setMyPosts] = useState([]);
  const [drafts, setDrafts] = useState([]);
  const [bookmarks, setBookmarks] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [followCounts, setFollowCounts] = useState({ followersCount: 0, followingCount: 0 });

  // View-only — no claim button here. Just shows what's already done
  // (READY_TO_CLAIM or CLAIMED both mean the underlying task is finished;
  // LOCKED items are hidden entirely since this tab isn't about progress).
  const { milestones, fetchMilestones } = useAchievementStore();
  useEffect(() => {
    fetchMilestones();
  }, [fetchMilestones]);
  const completedAchievements = milestones.filter((m) => m.status !== 'LOCKED');
  const avatarSrc = user?.avatar_url
    || `https://ui-avatars.com/api/?name=${encodeURIComponent(user?.display_name || user?.username || 'User')}&background=1e293b&color=38bdf8`;

  useEffect(() => {
    if (!user) return;

    const loadProfileData = async () => {
      setIsLoading(true);
      try {
        const userId = user?.user_id || user?.id;
        if (!userId) {
          console.error("ไม่พบ User ID");
          return;
        }

        const [fetchedPosts, fetchedDrafts, fetchedBookmarks, ownProfile] = await Promise.all([
          profileService.getMyPosts(userId),
          profileService.getDrafts(userId),
          profileService.getBookmarks(userId),
          profileService.getUserProfile(userId).catch(() => null),
        ]);

        setMyPosts(fetchedPosts);
        setDrafts(fetchedDrafts);
        setBookmarks(fetchedBookmarks);
        if (ownProfile) {
          setFollowCounts(normalizeFollowCounts(ownProfile));
        }
      } catch (error) {
        toast.error('เกิดข้อผิดพลาดในการโหลดข้อมูลโปรไฟล์');
        console.error(error);
      } finally {
        setIsLoading(false);
      }
    };

    loadProfileData();
  }, [user]);

  if (!hasEntered) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center p-6 relative overflow-hidden">
        {user?.user_metadata?.wallpaper_url && (
          <img src={user.user_metadata.wallpaper_url} alt="" className="absolute inset-0 w-full h-full object-cover opacity-30" />
        )}
        <div className="relative z-10 max-w-md w-full text-center bg-slate-900/70 backdrop-blur-xl border border-white/10 rounded-3xl p-10 shadow-2xl">
          <DoorOpen className="h-10 w-10 text-primary mx-auto mb-4" />
          <h2 className="text-2xl font-extrabold text-white mb-3">{user?.display_name || user?.username || 'ผู้ใช้งาน'}</h2>
          <p className="text-slate-300 mb-8">{user?.user_metadata?.enter_screen_message || 'ยินดีต้อนรับเข้าสู่โปรไฟล์'}</p>
          <button
            onClick={() => setHasEntered(true)}
            className="px-8 py-3 bg-primary hover:bg-blue-600 text-white rounded-xl font-bold shadow-lg transition-all"
          >
            เข้าสู่โปรไฟล์
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className={`min-h-screen ${pageBg} pb-20 relative transition-colors duration-500`}>
      {/* Full Screen Background — fixed so it fills the entire viewport and
          stays put behind all scrolling content (and behind the fixed
          navbar). No wallpaper set → nothing renders here, just the plain
          page bg. */}
      <div className="fixed inset-0 z-0 overflow-hidden">
        {user?.user_metadata?.wallpaper_url && (
          user.user_metadata.wallpaper_url.endsWith('.mp4') ? (
            <video src={user.user_metadata.wallpaper_url} className="w-full h-full object-cover" autoPlay muted loop playsInline />
          ) : (
            <img src={user.user_metadata.wallpaper_url} alt="Wallpaper" className="w-full h-full object-cover" />
          )
        )}
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-24 sm:pt-40 relative z-10">
        <div
          className={`backdrop-blur-2xl shadow-2xl border p-6 sm:p-10 mb-8 overflow-hidden transition-colors duration-500 ${cardBorderClass}`}
          style={{
            borderRadius: theme.cornerRoundness != null ? `${theme.cornerRoundness}px` : '32px',
            backgroundColor: cardGlassColor,
          }}
        >
          {user?.user_metadata?.banner_url && (
            <div
              className="-mx-6 sm:-mx-10 -mt-6 sm:-mt-10 mb-6 h-48 sm:h-64 pointer-events-none"
              style={{
                maskImage: 'linear-gradient(to bottom, black 0%, black 40%, transparent 95%)',
                WebkitMaskImage: 'linear-gradient(to bottom, black 0%, black 40%, transparent 95%)',
              }}
            >
              <img src={user.user_metadata.banner_url} alt="Banner" className="w-full h-full object-cover" />
            </div>
          )}
          <div className="flex flex-col sm:flex-row gap-8 items-start sm:items-end">
            <div className="relative">
              <div className={`h-32 w-32 sm:h-40 sm:w-40 border-4 overflow-hidden shadow-2xl relative ${avatarBorderClass} ${avatarShapeClass}`}>
                <img src={user?.avatar_url || "https://ui-avatars.com/api/?name=Somchai&background=1e293b&color=38bdf8&size=200"} alt="Avatar" className="w-full h-full object-cover" />

                {/* Render Frame if selected */}
                {user?.user_metadata?.profile_frame_id && (
                  <div className={`absolute inset-0 border-4 border-amber-400 mix-blend-overlay pointer-events-none ${avatarShapeClass}`}></div>
                )}
              </div>
            </div>

            <div className="flex-1 pb-2">
              <h1 className="text-3xl font-extrabold" style={{ color: theme.nameColor || (isDarkHero ? '#ffffff' : '#1e293b') }}>{user?.display_name || user?.username || user?.user_metadata?.full_name || user?.name || 'ผู้ใช้งาน'}</h1>
              <p className={`font-medium text-lg mt-1 ${subTextClass}`}>{user?.email}</p>

              <div className="flex items-center gap-7 mt-3 mb-3">
                <div className="flex items-baseline gap-2">
                  <span className={`text-xl font-extrabold ${headingClass}`}>{myPosts.length}</span>
                  <span className={`text-sm font-medium ${mutedTextClass}`}>โพสต์</span>
                </div>
                <div className="flex items-baseline gap-2">
                  <span className={`text-xl font-extrabold ${headingClass}`}>{followCounts.followersCount}</span>
                  <span className={`text-sm font-medium ${mutedTextClass}`}>ผู้ติดตาม</span>
                </div>
                <div className="flex items-baseline gap-2">
                  <span className={`text-xl font-extrabold ${headingClass}`}>{followCounts.followingCount}</span>
                  <span className={`text-sm font-medium ${mutedTextClass}`}>กำลังติดตาม</span>
                </div>
              </div>

              <div className={`flex flex-wrap gap-4 text-sm font-semibold ${mutedTextClass}`}>
                <div className="flex items-center gap-1.5"><GraduationCap className="h-4 w-4 text-primary" /> {user?.education_level || 'มัธยมศึกษาตอนปลาย'}</div>

                {user?.user_metadata?.occupation && (
                  <div className="flex items-center gap-1.5"><Briefcase className="h-4 w-4 text-primary" /> {user.user_metadata.occupation}</div>
                )}
                {user?.user_metadata?.location && (
                  <div className="flex items-center gap-1.5"><MapPin className="h-4 w-4 text-primary" /> {user.user_metadata.location}</div>
                )}

                {user?.user_metadata?.instagram_url && (
                  <a href={user.user_metadata.instagram_url} target="_blank" rel="noreferrer" className="flex items-center gap-1.5 text-pink-400 hover:text-pink-300 transition-colors">
                    <LinkIcon className="h-4 w-4" /> Instagram
                  </a>
                )}
                {user?.user_metadata?.facebook_url && (
                  <a href={user.user_metadata.facebook_url} target="_blank" rel="noreferrer" className="flex items-center gap-1.5 text-blue-400 hover:text-blue-300 transition-colors">
                    <LinkIcon className="h-4 w-4" /> Facebook
                  </a>
                )}
              </div>

              {(() => {
                const profileWidgets = (user?.user_metadata?.widgets || []).filter((w) => w.options?.insideProfileCard !== false);
                if (profileWidgets.length === 0) return null;
                return (
                  <div className="flex flex-wrap gap-2 mt-3">
                    {profileWidgets.map((w) => {
                      const platform = getPlatformConfig(w.platformId);
                      if (!platform) return null;
                      const Icon = platform.icon;
                      return (
                        <a
                          key={w.id}
                          href={w.url}
                          target="_blank"
                          rel="noreferrer"
                          title={platform.label}
                          className="h-9 w-9 rounded-full flex items-center justify-center shrink-0 shadow-sm hover:opacity-90 hover:scale-105 transition-all"
                          style={{ backgroundColor: platform.brandColor }}
                        >
                          <Icon className="h-4 w-4" color="#ffffff" />
                        </a>
                      );
                    })}
                  </div>
                );
              })()}

              {user?.user_metadata?.tags?.length > 0 && (
                <div className="flex flex-wrap gap-2 mt-4">
                  {user.user_metadata.tags.map((tag, i) => (
                    <span key={i} className={`px-2.5 py-1 border rounded-full text-xs font-bold ${tagPillClass}`}>{tag}</span>
                  ))}
                </div>
              )}
            </div>

            <div className="flex gap-4 w-full sm:w-auto pb-2">
              <button
                onClick={() => navigate('/settings/profile')}
                className={`flex-1 sm:flex-none px-6 py-3 rounded-xl font-bold transition-all border backdrop-blur-md flex items-center justify-center gap-2 ${editButtonClass}`}
              >
                <Edit className="h-4 w-4" /> แก้ไขโปรไฟล์
              </button>
            </div>
          </div>

          <div className={`mt-8 pt-8 border-t ${dividerClass}`}>
            <h3 className={`font-bold mb-2 ${headingClass}`}>เกี่ยวกับฉัน (Bio)</h3>
            <p className="leading-relaxed max-w-3xl" style={{ color: theme.textColor || (isDarkHero ? '#cbd5e1' : '#475569') }}>
              {user?.bio || 'ยังไม่มีคำอธิบายตัวเอง...'}
            </p>
          </div>

          {(() => {
            const profileWidgets = (user?.user_metadata?.widgets || []).filter((w) => w.options?.insideProfileCard !== false);
            if (profileWidgets.length === 0) return null;
            const widgetCardTheme = { ...DEFAULT_THEME, ...theme };
            return (
              <div className="mt-8 pt-8 border-t border-white/10">
                <h3 className="font-bold text-white mb-3">วิดเจ็ต</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                  {profileWidgets.map((w) => {
                    const platform = getPlatformConfig(w.platformId);
                    if (!platform) return null;
                    return <WidgetCard key={w.id} platform={platform} url={w.url} options={w.options} cardTheme={widgetCardTheme} />;
                  })}
                </div>
              </div>
            );
          })()}
        </div>

        {/* Tabs */}
        <div className="flex gap-2 mb-8 overflow-x-auto pb-2 scrollbar-hide">
          <button onClick={() => setActiveTab('posts')} className={`flex items-center gap-2 px-6 py-3.5 rounded-xl font-bold whitespace-nowrap transition-all ${activeTab === 'posts' ? 'bg-primary text-white shadow-lg shadow-primary/20' : tabInactiveClass}`}>
            <BookOpen className="h-5 w-5" /> โพสต์ของฉัน
          </button>
          <button onClick={() => setActiveTab('drafts')} className={`flex items-center gap-2 px-6 py-3.5 rounded-xl font-bold whitespace-nowrap transition-all ${activeTab === 'drafts' ? 'bg-primary text-white shadow-lg shadow-primary/20' : tabInactiveClass}`}>
            <FileText className="h-5 w-5" /> แบบร่าง
          </button>
          <button onClick={() => setActiveTab('bookmarks')} className={`flex items-center gap-2 px-6 py-3.5 rounded-xl font-bold whitespace-nowrap transition-all ${activeTab === 'bookmarks' ? 'bg-primary text-white shadow-lg shadow-primary/20' : tabInactiveClass}`}>
            <Star className="h-5 w-5" /> บุ๊คมาร์ก
          </button>
          <button onClick={() => setActiveTab('achievements')} className={`flex items-center gap-2 px-6 py-3.5 rounded-xl font-bold whitespace-nowrap transition-all ${activeTab === 'achievements' ? 'bg-primary text-white shadow-lg shadow-primary/20' : tabInactiveClass}`}>
            <Trophy className="h-5 w-5" /> ความสำเร็จ
          </button>
        </div>

        {/* Tab Content */}
        <div className="min-h-[400px]">
          {isLoading ? (
            <div className="flex flex-col items-center justify-center py-20">
              <Loader2 className="h-10 w-10 text-primary animate-spin mb-4" />
              <p className={`font-medium ${subTextClass}`}>กำลังโหลดข้อมูลโปรไฟล์...</p>
            </div>
          ) : (
            <>
              {activeTab === 'posts' && (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                  {myPosts.length > 0 ? myPosts.map(post => (
                    <PostCard key={post.id} post={post} viewMode="grid" dark={isDarkHero} />
                  )) : (
                    <div className={`col-span-full py-10 text-center ${subTextClass}`}>ยังไม่มีโพสต์ที่เผยแพร่</div>
                  )}
                </div>
              )}

              {activeTab === 'drafts' && (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                  {drafts.length > 0 ? drafts.map(draft => (
                    <div
                      key={draft.id}
                      className={`backdrop-blur-xl rounded-3xl border shadow-lg shadow-black/10 hover:shadow-xl transition-all flex flex-col overflow-hidden group ${emptyCardClass}`}
                    >
                      {/* Cover Image & Category */}
                      <div className="h-44 bg-slate-100 overflow-hidden relative">
                        <img
                          src={draft.image}
                          alt={draft.title}
                          className="w-full h-full object-cover group-hover:scale-103 transition-transform duration-500"
                        />
                        <div className="absolute top-3 left-3 px-2.5 py-1 bg-amber-500/90 text-white backdrop-blur-md rounded-lg text-[10px] font-bold shadow-sm z-10">
                          แบบร่าง
                        </div>
                        <div className="absolute top-3 right-3 px-2.5 py-1 bg-black/40 border border-white/10 text-white backdrop-blur-md rounded-lg text-[10px] font-bold shadow-sm z-10">
                          {draft.subject}
                        </div>
                      </div>

                      {/* Card Body */}
                      <div className="p-5 flex-1 flex flex-col justify-between">
                        <div>
                          <div className="flex items-center gap-2 mb-3">
                            <span className={`px-2 py-0.5 border rounded-md text-[10px] font-bold ${tagPillClass}`}>
                              {draft.level}
                            </span>
                            <span className={`text-[10px] font-bold flex items-center gap-1 ${subTextClass}`}>
                              <Clock className="h-3 w-3" /> แบบร่าง
                            </span>
                          </div>

                          <h3 className={`text-lg font-bold line-clamp-2 mb-2 group-hover:text-primary transition-colors ${headingClass}`}>
                            {draft.title}
                          </h3>

                          <p className={`text-xs font-medium line-clamp-2 mb-4 leading-relaxed ${subTextClass}`}>
                            {draft.description}
                          </p>
                        </div>

                        {/* Card Actions */}
                        <div className={`pt-3 border-t flex items-center justify-between gap-3 mt-auto ${dividerClass}`}>
                          <span className={`text-[10px] font-medium ${subTextClass}`}>
                            แก้ไขล่าสุด: {draft.created_at ? new Date(draft.created_at).toLocaleDateString('th-TH') : 'ไม่ระบุ'}
                          </span>

                          <button
                            onClick={() => navigate(`/post/edit/${draft.id}`)}
                            className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold shadow-sm transition-all cursor-pointer border text-primary ${isDarkHero ? 'bg-white/10 hover:bg-white/20 border-white/10' : 'bg-blue-50 hover:bg-blue-100 border-blue-100'}`}
                          >
                            <Edit className="h-3.5 w-3.5" /> แก้ไขโพสต์
                          </button>
                        </div>
                      </div>
                    </div>
                  )) : (
                    <div className={`col-span-full flex flex-col items-center justify-center py-20 text-center backdrop-blur-xl rounded-3xl border ${emptyCardClass}`}>
                      <div className={`h-24 w-24 rounded-full flex items-center justify-center mb-4 ${emptyIconWrapClass}`}>
                        <FileText className="h-10 w-10" />
                      </div>
                      <h3 className={`text-xl font-bold mb-2 ${headingClass}`}>ยังไม่มีแบบร่าง</h3>
                      <p className={subTextClass}>คุณสามารถบันทึกสรุปความรู้เป็นแบบร่างเพื่อมาเขียนต่อได้ตลอดเวลา</p>
                    </div>
                  )}
                </div>
              )}

              {activeTab === 'bookmarks' && (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                  {bookmarks.length > 0 ? bookmarks.map(post => (
                    <PostCard key={post.id} post={post} viewMode="grid" dark={isDarkHero} />
                  )) : (
                    <div className={`col-span-full flex flex-col items-center justify-center py-20 text-center backdrop-blur-xl rounded-3xl border ${emptyCardClass}`}>
                      <div className={`h-24 w-24 rounded-full flex items-center justify-center mb-4 ${emptyIconWrapClass}`}>
                        <Star className="h-10 w-10" />
                      </div>
                      <h3 className={`text-xl font-bold mb-2 ${headingClass}`}>ยังไม่มีบุ๊คมาร์ก</h3>
                      <p className={subTextClass}>ไปที่หน้า Explore หรือ Trending เพื่อค้นหาโพสต์ที่คุณสนใจ</p>
                    </div>
                  )}
                </div>
              )}

              {activeTab === 'achievements' && (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                  {completedAchievements.length > 0 ? completedAchievements.map((m) => {
                    const statusMeta = ACHIEVEMENT_STATUS_META[m.status];
                    const hasImage = m.reward.type === 'WALLPAPER' && m.reward.previewUrl;
                    return (
                      <div
                        key={m.id}
                        className={`backdrop-blur-xl rounded-3xl border shadow-lg shadow-black/10 p-5 flex flex-col gap-3 ${emptyCardClass}`}
                      >
                        <div className="flex items-center justify-between gap-3">
                          <div className={`h-12 w-12 rounded-full overflow-hidden border-2 shrink-0 ${m.status === 'CLAIMED' ? 'border-emerald-400' : 'border-amber-400'}`}>
                            {hasImage ? (
                              <img src={m.reward.previewUrl} alt={m.reward.name} className="w-full h-full object-cover" />
                            ) : (
                              <img src={avatarSrc} alt="" className="w-full h-full object-cover" />
                            )}
                          </div>
                          <span className={`px-2.5 py-1 rounded-full text-[11px] font-bold whitespace-nowrap ${statusMeta.badgeClass}`}>
                            {statusMeta.label}
                          </span>
                        </div>
                        <div>
                          <h3 className={`font-bold ${headingClass}`}>{m.title}</h3>
                          <p className={`text-sm mt-0.5 ${subTextClass}`}>{m.description}</p>
                        </div>
                        <div className={`flex items-center gap-1.5 text-xs font-semibold ${mutedTextClass}`}>
                          <Gift className="h-3.5 w-3.5" />
                          {m.reward.type === 'FRAME' ? 'กรอบรูป' : 'ภาพพื้นหลัง'}: {m.reward.name}
                        </div>
                      </div>
                    );
                  }) : (
                    <div className={`col-span-full flex flex-col items-center justify-center py-20 text-center backdrop-blur-xl rounded-3xl border ${emptyCardClass}`}>
                      <div className={`h-24 w-24 rounded-full flex items-center justify-center mb-4 ${emptyIconWrapClass}`}>
                        <CheckCircle2 className="h-10 w-10" />
                      </div>
                      <h3 className={`text-xl font-bold mb-2 ${headingClass}`}>ยังไม่มีความสำเร็จที่ทำเสร็จ</h3>
                      <p className={subTextClass}>ไปทำภารกิจในหน้า Achievements เพื่อปลดล็อกรางวัลแรกของคุณ</p>
                    </div>
                  )}
                </div>
              )}

            </>
          )}
        </div>
      </div>
    </div>
  );
}
