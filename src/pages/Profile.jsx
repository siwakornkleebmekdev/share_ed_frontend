import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router';
import { Image as ImageIcon, MapPin, Link as LinkIcon, BookOpen, Star, FileText, GraduationCap, Clock, Edit, Briefcase, DoorOpen } from 'lucide-react';
import toast from 'react-hot-toast';
import PostCard from '@/components/PostCard';

import useAuthStore from '@/store/authStore';
import useHeroThemeStore from '@/store/heroThemeStore';
import { profileService } from '@/services/profile.service';
import { Loader2 } from 'lucide-react';
import WidgetCard from '@/components/settings/WidgetCard';
import { getPlatformConfig } from '@/pages/settings/widgetConstants';
import { DEFAULT_THEME } from '@/pages/settings/themeConstants';

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
  const [activeTab, setActiveTab] = useState('posts'); // posts, drafts, bookmarks
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
  useEffect(() => {
    setHeroImage(user?.user_metadata?.wallpaper_url, { fallbackDark: true });
    return () => clearHeroImage();
  }, [user?.user_metadata?.wallpaper_url, setHeroImage, clearHeroImage]);

  useEffect(() => {
    const tab = searchParams.get('tab');
    if (tab && ['posts', 'drafts', 'bookmarks'].includes(tab)) {
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

        const [fetchedPosts, fetchedDrafts, fetchedBookmarks] = await Promise.all([
          profileService.getMyPosts(userId),
          profileService.getDrafts(userId),
          profileService.getBookmarks(userId),
        ]);

        setMyPosts(fetchedPosts);
        setDrafts(fetchedDrafts);
        setBookmarks(fetchedBookmarks);
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
    <div className="min-h-screen bg-slate-950 pb-20 relative">
      {/* Dynamic Full Screen Background — extends up behind the fixed navbar's
          reserved top spacing (MainLayout's pt-28) so the image itself, not
          just a matching flat color, is continuous behind the navbar. */}
      <div className="absolute -top-28 left-0 right-0 z-0 overflow-hidden h-[calc(60vh+7rem)] sm:h-[calc(70vh+7rem)]">
        {user?.user_metadata?.wallpaper_url ? (
          user.user_metadata.wallpaper_url.endsWith('.mp4') ? (
            <video src={user.user_metadata.wallpaper_url} className="w-full h-full object-cover opacity-60" autoPlay muted loop playsInline />
          ) : (
            <img src={user.user_metadata.wallpaper_url} alt="Wallpaper" className="w-full h-full object-cover opacity-50" />
          )
        ) : (
          <div className="w-full h-full bg-[url('https://images.unsplash.com/photo-1519681393784-d120267933ba?w=1200&q=80')] bg-cover bg-center opacity-30 mix-blend-overlay"></div>
        )}
        <div className="absolute inset-0 bg-gradient-to-b from-slate-950/10 via-slate-950/60 to-slate-950"></div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-24 sm:pt-40 relative z-10">
        <div
          className="bg-slate-900/30 backdrop-blur-2xl shadow-2xl border border-white/10 border-t-white/20 p-6 sm:p-10 mb-8 overflow-hidden"
          style={{ borderRadius: theme.cornerRoundness != null ? `${theme.cornerRoundness}px` : '32px' }}
        >
          {user?.user_metadata?.banner_url && (
            <div className="-mx-6 sm:-mx-10 -mt-6 sm:-mt-10 mb-6 h-32 sm:h-40">
              <img src={user.user_metadata.banner_url} alt="Banner" className="w-full h-full object-cover" />
            </div>
          )}
          <div className="flex flex-col sm:flex-row gap-8 items-start sm:items-end">
            <div className="relative">
              <div className={`h-32 w-32 sm:h-40 sm:w-40 border-4 border-slate-800 bg-slate-800 overflow-hidden shadow-2xl relative ${avatarShapeClass}`}>
                <img src={user?.avatar_url || "https://ui-avatars.com/api/?name=Somchai&background=1e293b&color=38bdf8&size=200"} alt="Avatar" className="w-full h-full object-cover" />

                {/* Render Frame if selected */}
                {user?.user_metadata?.profile_frame_id && (
                  <div className={`absolute inset-0 border-4 border-amber-400 mix-blend-overlay pointer-events-none ${avatarShapeClass}`}></div>
                )}
              </div>
            </div>

            <div className="flex-1 pb-2">
              <h1 className="text-3xl font-extrabold" style={{ color: theme.nameColor || '#ffffff' }}>{user?.display_name || user?.username || user?.user_metadata?.full_name || user?.name || 'ผู้ใช้งาน'}</h1>
              <p className="text-slate-400 font-medium text-lg mb-3">{user?.email}</p>

              <div className="flex flex-wrap gap-4 text-sm font-semibold text-slate-300">
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

              {user?.user_metadata?.tags?.length > 0 && (
                <div className="flex flex-wrap gap-2 mt-4">
                  {user.user_metadata.tags.map((tag, i) => (
                    <span key={i} className="px-2.5 py-1 bg-white/10 border border-white/10 rounded-full text-xs font-bold text-slate-200">{tag}</span>
                  ))}
                </div>
              )}
            </div>

            <div className="flex gap-4 w-full sm:w-auto pb-2">
              <button
                onClick={() => navigate('/settings/profile')}
                className="flex-1 sm:flex-none px-6 py-3 bg-white/10 hover:bg-white/20 text-white rounded-xl font-bold transition-all border border-white/10 backdrop-blur-md flex items-center justify-center gap-2"
              >
                <Edit className="h-4 w-4" /> แก้ไขโปรไฟล์
              </button>
            </div>
          </div>

          <div className="mt-8 pt-8 border-t border-white/10">
            <h3 className="font-bold text-white mb-2">เกี่ยวกับฉัน (Bio)</h3>
            <p className="leading-relaxed max-w-3xl" style={{ color: theme.textColor || '#cbd5e1' }}>
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
          <button onClick={() => setActiveTab('posts')} className={`flex items-center gap-2 px-6 py-3.5 rounded-xl font-bold whitespace-nowrap transition-all ${activeTab === 'posts' ? 'bg-primary text-white shadow-lg shadow-primary/20' : 'bg-white/5 text-slate-300 hover:bg-white/15 hover:text-white border border-white/10 backdrop-blur-xl'}`}>
            <BookOpen className="h-5 w-5" /> โพสต์ของฉัน
          </button>
          <button onClick={() => setActiveTab('drafts')} className={`flex items-center gap-2 px-6 py-3.5 rounded-xl font-bold whitespace-nowrap transition-all ${activeTab === 'drafts' ? 'bg-primary text-white shadow-lg shadow-primary/20' : 'bg-white/5 text-slate-300 hover:bg-white/15 hover:text-white border border-white/10 backdrop-blur-xl'}`}>
            <FileText className="h-5 w-5" /> แบบร่าง
          </button>
          <button onClick={() => setActiveTab('bookmarks')} className={`flex items-center gap-2 px-6 py-3.5 rounded-xl font-bold whitespace-nowrap transition-all ${activeTab === 'bookmarks' ? 'bg-primary text-white shadow-lg shadow-primary/20' : 'bg-white/5 text-slate-300 hover:bg-white/15 hover:text-white border border-white/10 backdrop-blur-xl'}`}>
            <Star className="h-5 w-5" /> บุ๊คมาร์ก
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
                    <PostCard key={post.id} post={post} viewMode="grid" dark />
                  )) : (
                    <div className="col-span-full py-10 text-center text-slate-400">ยังไม่มีโพสต์ที่เผยแพร่</div>
                  )}
                </div>
              )}

              {activeTab === 'drafts' && (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                  {drafts.length > 0 ? drafts.map(draft => (
                    <div
                      key={draft.id}
                      className="bg-white/10 backdrop-blur-xl rounded-3xl border border-white/10 shadow-lg shadow-black/20 hover:shadow-xl hover:border-white/20 transition-all flex flex-col overflow-hidden group"
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
                            <span className="px-2 py-0.5 bg-white/5 border border-white/10 text-slate-300 rounded-md text-[10px] font-bold">
                              {draft.level}
                            </span>
                            <span className={`text-[10px] font-bold flex items-center gap-1 ${subTextClass}`}>
                              <Clock className="h-3 w-3" /> แบบร่าง
                            </span>
                          </div>

                          <h3 className="text-lg font-bold text-white line-clamp-2 mb-2 group-hover:text-primary transition-colors">
                            {draft.title}
                          </h3>

                          <p className="text-slate-400 text-xs font-medium line-clamp-2 mb-4 leading-relaxed">
                            {draft.description}
                          </p>
                        </div>

                        {/* Card Actions */}
                        <div className="pt-3 border-t border-white/10 flex items-center justify-between gap-3 mt-auto">
                          <span className="text-[10px] text-slate-400 font-medium">
                            แก้ไขล่าสุด: {draft.created_at ? new Date(draft.created_at).toLocaleDateString('th-TH') : 'ไม่ระบุ'}
                          </span>

                          <button
                            onClick={() => navigate(`/post/edit/${draft.id}`)}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white/10 hover:bg-white/20 text-primary border border-white/10 rounded-lg text-xs font-bold shadow-sm transition-all cursor-pointer"
                          >
                            <Edit className="h-3.5 w-3.5" /> แก้ไขโพสต์
                          </button>
                        </div>
                      </div>
                    </div>
                  )) : (
                    <div className="col-span-full flex flex-col items-center justify-center py-20 text-center bg-white/10 backdrop-blur-xl rounded-3xl border border-white/10">
                      <div className="h-24 w-24 bg-white/10 rounded-full flex items-center justify-center text-slate-400 mb-4">
                        <FileText className="h-10 w-10" />
                      </div>
                      <h3 className="text-xl font-bold text-white mb-2">ยังไม่มีแบบร่าง</h3>
                      <p className="text-slate-400">คุณสามารถบันทึกสรุปความรู้เป็นแบบร่างเพื่อมาเขียนต่อได้ตลอดเวลา</p>
                    </div>
                  )}
                </div>
              )}

              {activeTab === 'bookmarks' && (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                  {bookmarks.length > 0 ? bookmarks.map(post => (
                    <PostCard key={post.id} post={post} viewMode="grid" dark />
                  )) : (
                    <div className="col-span-full flex flex-col items-center justify-center py-20 text-center bg-white/10 backdrop-blur-xl rounded-3xl border border-white/10">
                      <div className="h-24 w-24 bg-white/10 rounded-full flex items-center justify-center text-slate-400 mb-4">
                        <Star className="h-10 w-10" />
                      </div>
                      <h3 className="text-xl font-bold text-white mb-2">ยังไม่มีบุ๊คมาร์ก</h3>
                      <p className="text-slate-400">ไปที่หน้า Explore หรือ Trending เพื่อค้นหาโพสต์ที่คุณสนใจ</p>
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
