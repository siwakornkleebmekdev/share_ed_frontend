import { Link, useNavigate } from "react-router";
import {
  BookOpen,
  Search,
  Bell,
  User,
  Heart,
  MessageSquare,
  Info,
  LogOut,
  Settings,
  FileText,
  Trophy,
  ShieldCheck,
  ShieldAlert,
  RotateCcw,
  PenTool,
  Bookmark,
  UserPlus,
  Newspaper,
  X,
} from "lucide-react";
import { useState, useEffect, useRef } from "react";
import useNotificationStore from "@/store/notificationStore";
import useAuthStore from "@/store/authStore";
import useHeroThemeStore from "@/store/heroThemeStore";
import useAchievementStore from "@/store/achievementStore";
import { supabase } from "@/utils/supabase";
import { authService } from "@/services/auth.service";
import { DEFAULT_FRAMES } from "@/services/profile.service";
import { resolveProfileFrame } from "@/utils/profileFrame";
import { getGlassColor, rgbToRgba } from "@/utils/colorUtils";
import toast from "react-hot-toast";

export default function Navbar() {
  const [isScrolled, setIsScrolled] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const notifRef = useRef(null);
  const profileRef = useRef(null);
  const navigate = useNavigate();
  // Set by whichever page is currently mounted (see useHeroThemeStore) based
  // on the actual brightness of its background image, not the route.
  const isDarkHero = useHeroThemeStore((state) => state.isDarkHero);
  // Average color sampled from that same background — used to tint the
  // navbar's frosted glass so it visibly matches the page behind it.
  const heroColor = useHeroThemeStore((state) => state.heroColor);
  const glassColor = getGlassColor(heroColor, isDarkHero);

  const { notifications, unreadCount, fetchNotifications, markAsRead, markAllAsRead, deleteNotification, error, isLoading, isMutating } =
    useNotificationStore();
  const { isAuthenticated, user, logout } = useAuthStore();
  const { milestones, readyToClaimCount, fetchMilestones } = useAchievementStore();

  const avatarSrc =
    user?.avatar_url ||
    user?.user_metadata?.avatar_url ||
    user?.avatar ||
    user?.profile_image ||
    user?.user_metadata?.picture;

  const { previewUrl: equippedFrameUrl } = resolveProfileFrame(user, [
    ...milestones,
    ...DEFAULT_FRAMES,
  ]);

  // Relative time formatter
  const formatRelativeTime = (iso) => {
    if (!iso) return '';
    const diff = Date.now() - new Date(iso).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return 'เมื่อสักครู่';
    if (mins < 60) return `${mins} นาทีที่แล้ว`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return `${hrs} ชั่วโมงที่แล้ว`;
    const days = Math.floor(hrs / 24);
    if (days < 7) return `${days} วันที่แล้ว`;
    return new Date(iso).toLocaleDateString('th-TH', { day: 'numeric', month: 'short' });
  };

  const handleLogout = async () => {
    try {
      await authService.logout();
      logout();
      setShowProfileMenu(false);
      navigate("/login", { replace: true });
      toast.success("ออกจากระบบสำเร็จ");
    } catch (error) {
      toast.error("เกิดข้อผิดพลาดในการออกจากระบบ");
    }
  };

  useEffect(() => {
    if (isAuthenticated) {

      fetchMilestones();

    }
  }, [isAuthenticated, fetchNotifications, fetchMilestones]);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // Click outside to close notifications and profile popup
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (notifRef.current && !notifRef.current.contains(event.target)) {
        setShowNotifications(false);
      }
      if (profileRef.current && !profileRef.current.contains(event.target)) {
        setShowProfileMenu(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const getNotificationIcon = (type) => {
    switch (type) {
      case "LIKE":
      case "NEW_LIKE":
        return <Heart className="h-4 w-4 text-pink-500" />;
      case "COMMENT":
      case "NEW_COMMENT":
        return <MessageSquare className="h-4 w-4 text-blue-500" />;
      case "FOLLOW":
      case "NEW_FOLLOWER":
        return <UserPlus className="h-4 w-4 text-green-500" />;
      case "NEW_POST":
        return <Newspaper className="h-4 w-4 text-purple-500" />;
      case "BOOKMARK":
      case "BOOKMARK_REMOVED":
        return <Bookmark className="h-4 w-4 text-amber-500" />;
      case "SYSTEM":
        return <Info className="h-4 w-4 text-indigo-500" />;
      case "POST_SUSPENDED":
      case "POST_REPORTED":
        return <ShieldAlert className="h-4 w-4 text-rose-500" />;
      case "POST_RESTORED":
        return <FileText className="h-4 w-4 text-emerald-500" />;
      case "POST_REMOVED":
        return <FileText className="h-4 w-4 text-slate-500" />;
      default:
        return <Bell className="h-4 w-4 text-slate-500" />;
    }
  };

  const getNotificationActionLabel = (type) => {
    if (type === "POST_SUSPENDED") return "ดูโพสต์ที่ถูกระงับ →";
    if (type === "POST_RESTORED") return "ดูโพสต์ที่คืนสถานะ →";
    if (type === "POST_REMOVED") return "ดูโพสต์ที่ถูกลบ →";
    if (type === "POST_REPORTED") return "ดูโพสต์ที่ถูกรายงาน →";
    return "ดูรายละเอียด →";
  };

  return (
    <div
      className={`fixed top-0 left-0 w-full z-50 transition-all duration-500 ease-out px-4 ${isScrolled ? "pt-2" : "pt-4"}`}
    >
      <nav
        className={`mx-auto backdrop-blur-md transition-all duration-500 ease-out overflow-visible rounded-full border ${isDarkHero ? "border-white/10" : "border-slate-200/50"
          } ${isScrolled
            ? "w-[92%] max-w-5xl shadow-[0_8px_30px_rgb(0,0,0,0.12)] py-2 px-6"
            : "w-[98%] max-w-7xl shadow-sm py-2.5 px-8"
          }`}
        style={{
          backgroundColor: rgbToRgba(glassColor, isScrolled ? 85 : 65),
          transition: "background-color 500ms ease-out",
        }}
      >
        <div
          className={`w-full flex justify-between items-center transition-all duration-500 ${isScrolled ? "h-12" : "h-14"}`}
        >
          <Link to="/" className="flex items-center gap-2 group flex-shrink-0">
            <BookOpen className="text-primary transition-transform duration-300 group-hover:scale-110 h-7 w-7 sm:h-8 sm:w-8" />
            <span
              className={`font-bold tracking-tight text-lg sm:text-xl ${isDarkHero ? "text-white" : "text-slate-800"}`}
            >
              SHARE-ED
            </span>
          </Link>

          <div className="hidden md:flex items-center justify-center gap-4 sm:gap-6 transition-all duration-500">
            <div className="flex items-center gap-3 sm:gap-4 flex-shrink-0">
              <Link
                to="/home"
                className={`font-bold transition-colors text-sm whitespace-nowrap ${isDarkHero ? "text-slate-300 hover:text-white" : "text-slate-600 hover:text-primary"}`}
              >
                หน้าหลัก
              </Link>
              <Link
                to="/explore"
                className={`font-bold transition-colors text-sm whitespace-nowrap ${isDarkHero ? "text-slate-300 hover:text-white" : "text-slate-600 hover:text-primary"}`}
              >
                สำรวจเนื้อหา
              </Link>
              <Link
                to="/trending"
                className={`font-bold transition-colors text-sm whitespace-nowrap ${isDarkHero ? "text-slate-300 hover:text-white" : "text-slate-600 hover:text-primary"}`}
              >
                โพสต์ยอดนิยม
              </Link>
            </div>
          </div>

          <div className="flex items-center gap-2 sm:gap-3 flex-shrink-0">
            {isAuthenticated ? (
              <>
                <Link
                  to="/create"
                  id="create-post-btn"
                  name="create-post-btn"
                  data-testid="create-post-btn"
                  role="button"
                  aria-label="สร้างโพสต์"
                  className="flex items-center gap-1.5 bg-primary text-white hover:bg-blue-600 rounded-full font-bold px-3 py-1.5 sm:px-4 sm:py-2 text-xs sm:text-sm shadow-sm hover:shadow-md transition-all duration-200 cursor-pointer"
                >
                  <PenTool className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                  <span>สร้างโพสต์</span>
                </Link>

                <div className="relative" ref={notifRef}>
                  <button
                    aria-label={`การแจ้งเตือน ${unreadCount()} รายการที่ยังไม่อ่าน`}
                    aria-expanded={showNotifications}
                    onClick={() => { setShowNotifications(!showNotifications); if (!showNotifications) fetchNotifications(); }}
                    className={`relative p-2.5 rounded-full transition-colors shadow-sm ${isDarkHero ? "text-slate-300 hover:text-white bg-white/10 hover:bg-white/20" : "text-slate-500 hover:text-primary bg-slate-100 hover:bg-slate-200"}`}
                  >
                    <Bell className="h-4 w-4 sm:h-5 sm:w-5" />
                    {unreadCount() > 0 && (
                      <span className="absolute top-0 right-0 h-3 w-3 bg-red-500 border-2 border-white rounded-full"></span>
                    )}
                  </button>

                  {/* Notification Dropdown */}
                  {showNotifications && (
                    <div className="absolute right-0 mt-3 w-80 max-w-[calc(100vw-2rem)] bg-white rounded-2xl shadow-xl border border-slate-100 overflow-hidden z-50 animate-in fade-in slide-in-from-top-2">
                      <div className="p-4 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
                        <h3 className="font-bold text-slate-800 text-base">
                          การแจ้งเตือน
                        </h3>
                        {unreadCount() > 0 && (
                          <span className="bg-red-100 text-red-600 text-xs font-bold px-2 py-0.5 rounded-full">
                            {unreadCount()} ใหม่
                          </span>
                        )}
                      </div>

                      <div className="max-h-[360px] overflow-y-auto">
                        {error ? (<div role="alert" className="p-4 text-sm text-red-600">{error}<button className="block underline mt-2" onClick={fetchNotifications}>ลองอีกครั้ง</button></div>) : isLoading && notifications.length === 0 ? (<p className="p-6 text-center">กำลังโหลดข้อมูล...</p>) : notifications.length === 0 ? (
                          <div className="p-8 text-center text-slate-500 flex flex-col items-center gap-2">
                            <Bell className="h-8 w-8 text-slate-300" />
                            <p className="text-sm font-medium">
                              ยังไม่ได้รับการแจ้งเตือนใดๆ
                            </p>
                          </div>
                        ) : (
                          <div className="divide-y divide-slate-100">
                            {notifications.slice(0, 6).map((notif) => (
                              <div
                                key={notif.id}
                                role={notif.link ? "link" : undefined}
                                tabIndex={notif.link ? 0 : undefined}
                                onClick={() => {
                                  if (!notif.isRead) markAsRead(notif.id);
                                  if (notif.link) {
                                    setShowNotifications(false);
                                    navigate(notif.link);
                                  }
                                }}
                                onKeyDown={(event) => {
                                  if (notif.link && (event.key === "Enter" || event.key === " ")) {
                                    event.preventDefault();
                                    event.currentTarget.click();
                                  }
                                }}
                                className={`group relative p-3.5 flex gap-3 hover:bg-slate-50 transition-colors ${notif.link ? "cursor-pointer" : ""} ${
                                  !notif.isRead ? "bg-blue-50/40" : ""
                                }`}
                              >
                                {/* Icon */}
                                <div
                                  className={`mt-0.5 p-2 rounded-full h-fit flex-shrink-0 cursor-pointer ${
                                    !notif.isRead ? "bg-white shadow-sm" : "bg-slate-100"
                                  }`}
                                >
                                  {getNotificationIcon(notif.type)}
                                </div>

                                {/* Text */}
                                <div className="flex-1 min-w-0 text-left">
                                  <p className={`text-sm mb-0.5 truncate ${
                                    !notif.isRead ? "font-bold text-slate-800" : "font-medium text-slate-700"
                                  }`}>
                                    {notif.title}
                                  </p>
                                  <p className="text-xs text-slate-500 line-clamp-2 leading-relaxed">
                                    {notif.message}
                                  </p>
                                  {notif.link && (
                                    <span className="mt-1 inline-flex text-[11px] font-bold text-primary group-hover:text-blue-700">
                                      {getNotificationActionLabel(notif.type)}
                                    </span>
                                  )}
                                  <p className="text-[10px] text-slate-400 mt-0.5">
                                    {formatRelativeTime(notif.createdAt)}
                                  </p>
                                </div>

                                {/* Unread dot + delete */}
                                <div className="flex flex-col items-center gap-1 flex-shrink-0 ml-1">
                                  {!notif.isRead && (
                                    <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                                  )}
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      deleteNotification(notif.id);
                                    }}
                                    className="opacity-100 sm:opacity-0 sm:group-hover:opacity-100 focus:opacity-100 transition-opacity p-0.5 rounded hover:bg-red-50 text-slate-400 hover:text-red-500"
                                    disabled={isMutating} aria-label="ลบการแจ้งเตือน" title="ลบการแจ้งเตือน"
                                  >
                                    <X className="h-3 w-3" />
                                  </button>
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>

                      {notifications.length > 0 && (
                        <div className="p-3 border-t border-slate-100 bg-slate-50 flex items-center justify-between">
                          <button
                            disabled={isMutating} onClick={() => markAllAsRead()}
                            className="text-xs font-semibold text-slate-500 hover:text-primary transition-colors"
                          >
                            อ่านทั้งหมด
                          </button>
                          <Link
                            to="/notifications"
                            onClick={() => setShowNotifications(false)}
                            className="text-sm font-bold text-primary hover:text-blue-700 transition-colors"
                          >
                            ดูทั้งหมด →
                          </Link>
                        </div>
                      )}
                    </div>
                  )}
                </div>

                <Link
                  to="/achievements"
                  title="ความสำเร็จ"
                  className={`relative p-2.5 rounded-full transition-colors shadow-sm ${isDarkHero ? "text-slate-300 hover:text-white bg-white/10 hover:bg-white/20" : "text-slate-500 hover:text-primary bg-slate-100 hover:bg-slate-200"}`}
                >
                  <Trophy className="h-4 w-4 sm:h-5 sm:w-5" />
                  {readyToClaimCount() > 0 && (
                    <span className="absolute -top-1 -right-1 h-4 w-4 flex items-center justify-center bg-amber-500 border-2 border-white rounded-full text-[9px] font-bold text-white">
                      {readyToClaimCount()}
                    </span>
                  )}
                </Link>

                <div className="relative" ref={profileRef}>
                  <button
                    onClick={() => {
                      const willOpen = !showProfileMenu;
                      setShowProfileMenu(willOpen);
                      if (willOpen && isReviewer) fetchReports({ force: true }).catch(() => {});
                    }}
                    className={`relative flex items-center justify-center w-9 h-9 sm:w-10 sm:h-10 rounded-full transition-all shadow-sm focus:outline-none focus:ring-2 focus:ring-primary/30 ${
                      avatarSrc
                        ? "p-0 ring-1 ring-slate-200/80 hover:ring-primary/50"
                        : isDarkHero
                        ? "p-2.5 text-slate-300 hover:text-white bg-white/10 hover:bg-white/20"
                        : "p-2.5 text-slate-500 hover:text-primary bg-slate-100 hover:bg-slate-200"
                    }`}
                    title="เมนูผู้ใช้"
                  >
                    {avatarSrc ? (
                      <div className="w-full h-full rounded-full overflow-hidden flex items-center justify-center">
                        <img
                          src={avatarSrc}
                          alt="Profile"
                          className="w-full h-full rounded-full object-cover"
                        />
                      </div>
                    ) : (
                      <User className="h-4 w-4 sm:h-5 sm:w-5" />
                    )}
                    {equippedFrameUrl && (
                      <img
                        src={equippedFrameUrl}
                        alt="Frame"
                        className="absolute inset-0 w-full h-full pointer-events-none scale-125 z-10"
                      />
                    )}
                  </button>

                  {/* Profile Dropdown */}
                  {showProfileMenu && (
                    <div className="absolute right-0 mt-3 w-64 bg-white rounded-2xl shadow-xl border border-slate-100 overflow-hidden z-50 animate-in fade-in slide-in-from-top-2">
                      <div className="p-4 border-b border-slate-100 bg-slate-50/50 flex items-center gap-3">
                        <div className="relative w-10 h-10 rounded-full flex-shrink-0">
                          {avatarSrc ? (
                            <img
                              src={avatarSrc}
                              alt="Profile"
                              className="w-full h-full rounded-full object-cover border border-slate-200"
                            />
                          ) : (
                            <div className="w-full h-full rounded-full bg-slate-200 flex items-center justify-center text-slate-500">
                              <User className="h-5 w-5" />
                            </div>
                          )}
                          {equippedFrameUrl && (
                            <img
                              src={equippedFrameUrl}
                              alt="Frame"
                              className="absolute inset-0 w-full h-full pointer-events-none scale-125 z-10"
                            />
                          )}
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="font-bold text-slate-800 truncate text-sm">
                            {user?.display_name ||
                              user?.username ||
                              user?.user_metadata?.full_name ||
                              user?.name ||
                              "ผู้ใช้งาน"}
                          </p>
                          <p className="text-xs text-slate-500 truncate mt-0.5">
                            {user?.email || "ไม่มีอีเมล"}
                          </p>
                        </div>
                      </div>

                      <div className="p-2">
                        <Link
                          to={`/profile/${encodeURIComponent(user?.user_id || user?.id || "")}`}
                          onClick={() => setShowProfileMenu(false)}
                          className="flex items-center gap-3 w-full p-2 text-left text-sm font-medium text-slate-700 hover:bg-slate-50 hover:text-primary rounded-xl transition-colors"
                        >
                          <User className="h-4 w-4" />
                          โปรไฟล์ของฉัน
                        </Link>
                        {user?.role === "ADMIN" ? (
                          <Link
                            to="/admin"
                            onClick={() => setShowProfileMenu(false)}
                            className="flex items-center gap-3 w-full p-2 text-left text-sm font-medium text-slate-700 hover:bg-slate-50 hover:text-primary rounded-xl transition-colors"
                          >
                            <ShieldCheck className="h-4 w-4" />
                            Admin Console
                          </Link>
                        ) : (
                          <Link
                            to={`/profile/${encodeURIComponent(user?.user_id || user?.id || "")}?tab=drafts`}
                            onClick={() => setShowProfileMenu(false)}
                            className="flex items-center gap-3 w-full p-2 text-left text-sm font-medium text-slate-700 hover:bg-slate-50 hover:text-primary rounded-xl transition-colors"
                          >
                            <FileText className="h-4 w-4" />
                            แบบร่างของฉัน
                          </Link>
                        )}
                        {["ADMIN", "MODERATOR"].includes(String(user?.role || "").toUpperCase()) && (
                          <Link
                            to="/admin/posts"
                            onClick={() => setShowProfileMenu(false)}
                            className="flex items-center gap-3 w-full p-2 text-left text-sm font-medium text-slate-700 hover:bg-sky-50 hover:text-sky-700 rounded-xl transition-colors"
                          >
                            <RotateCcw className="h-4 w-4" />
                            กู้คืนโพสต์
                          </Link>
                        )}
                        <Link
                          to="/settings/profile"
                          onClick={() => setShowProfileMenu(false)}
                          className="flex items-center gap-3 w-full p-2 text-left text-sm font-medium text-slate-700 hover:bg-slate-50 hover:text-primary rounded-xl transition-colors"
                        >
                          <Settings className="h-4 w-4" />
                          ตั้งค่าบัญชี
                        </Link>
                      </div>

                      <div className="p-2 border-t border-slate-100">
                        <button
                          onClick={handleLogout}
                          className="flex items-center gap-3 w-full p-2 text-left text-sm font-medium text-red-600 hover:bg-red-50 rounded-xl transition-colors"
                        >
                          <LogOut className="h-4 w-4" />
                          ออกจากระบบ
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </>
            ) : (
              <Link
                to="/login"
                className="flex items-center justify-center gap-2 bg-primary text-white rounded-full font-bold hover:bg-blue-600 shadow-sm hover:shadow-md transition-all px-3 py-2 sm:px-5 sm:py-2.5 text-sm"
              >
                <User className="h-4 w-4 sm:hidden" />
                <span className="hidden sm:inline">เข้าสู่ระบบ</span>
              </Link>
            )}
          </div>
        </div>
      </nav>
    </div>
  );
}
