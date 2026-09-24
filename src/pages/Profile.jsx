import { useState, useEffect, useMemo } from "react";
import { useNavigate, useSearchParams, useParams } from "react-router";
import {
  Image as ImageIcon,
  MapPin,
  Link as LinkIcon,
  BookOpen,
  Star,
  FileText,
  GraduationCap,
  Clock,
  Edit,
  Briefcase,
  DoorOpen,
  Trophy,
  CheckCircle2,
  Gift,
  UserPlus,
  UserCheck,
  UserX,
  Loader2,
  Eye,
  Heart,
} from "lucide-react";
import toast from "react-hot-toast";
import PostCard from "@/components/PostCard";
import FollowListModal from "@/components/profile/FollowListModal";

import useAuthStore from "@/store/authStore";
import useHeroThemeStore from "@/store/heroThemeStore";
import useAchievementStore from "@/store/achievementStore";
import {
  profileService,
  normalizeFollowCounts,
} from "@/services/profile.service";
import { resolveProfileFrame } from "@/utils/profileFrame";
import AvatarWithFrame from "@/components/profile/AvatarWithFrame";
import { getPlatformConfig } from "@/pages/settings/widgetConstants";
import { getWidgetUrlError } from "@/utils/widgetUrl";
import { getGlassColor, rgbToRgba } from "@/utils/colorUtils";

const ACHIEVEMENT_STATUS_META = {
  READY_TO_CLAIM: {
    label: "พร้อมรับรางวัล",
    badgeClass: "bg-amber-100 text-amber-700",
  },
  CLAIMED: {
    label: "ได้รับรางวัลแล้ว",
    badgeClass: "bg-emerald-100 text-emerald-700",
  },
};

const getEducationLevelLabel = (level) => {
  switch (level) {
    case "MIDDLE_SCHOOL":
      return "มัธยมศึกษาตอนต้น";
    case "HIGH_SCHOOL":
      return "มัธยมศึกษาตอนปลาย";
    case "UNIVERSITY":
      return "มหาวิทยาลัย";
    default:
      return level || "ไม่ระบุ";
  }
};

function ProfilePostsSkeleton({ dark = false }) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
      {[1, 2, 3, 4, 5, 6].map((i) => (
        <div
          key={i}
          className={`rounded-[2rem] border overflow-hidden shadow-sm animate-pulse ${
            dark
              ? "bg-slate-900/60 border-white/10"
              : "bg-white/80 border-slate-200"
          }`}
        >
          <div className={`aspect-video w-full ${dark ? "bg-slate-800" : "bg-slate-200"}`} />
          <div className="p-5 space-y-4">
            <div className={`h-5 w-20 rounded-full ${dark ? "bg-slate-800" : "bg-slate-200"}`} />
            <div className={`h-6 w-3/4 rounded-lg ${dark ? "bg-slate-800" : "bg-slate-200"}`} />
            <div className="flex items-center justify-between pt-2">
              <div className="flex items-center gap-2.5">
                <div className={`h-9 w-9 rounded-full ${dark ? "bg-slate-800" : "bg-slate-200"}`} />
                <div className={`h-4 w-24 rounded ${dark ? "bg-slate-800" : "bg-slate-200"}`} />
              </div>
              <div className="flex items-center gap-3">
                <div className={`h-4 w-10 rounded ${dark ? "bg-slate-800" : "bg-slate-200"}`} />
                <div className={`h-4 w-10 rounded ${dark ? "bg-slate-800" : "bg-slate-200"}`} />
              </div>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

function ProfileSkeleton({ dark = false }) {
  return (
    <div className={`min-h-screen ${dark ? "bg-slate-950 text-white" : "bg-slate-50 text-slate-900"} pb-20`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-24 sm:pt-40 animate-pulse">
        <div
          className={`rounded-[32px] border p-6 sm:p-10 mb-8 overflow-hidden shadow-2xl ${
            dark
              ? "bg-slate-900/60 border-white/10"
              : "bg-white/80 border-slate-200"
          }`}
        >
          <div className="flex flex-col items-center gap-6 text-center sm:flex-row sm:items-end sm:gap-8 sm:text-left">
            <div className="relative shrink-0">
              <div className={`h-32 w-32 sm:h-40 sm:w-40 rounded-full border-4 shadow-2xl ${
                dark ? "border-slate-800 bg-slate-800" : "border-white bg-slate-200"
              }`} />
            </div>

            <div className="w-full flex-1 pb-2 space-y-4">
              <div className={`h-9 w-56 rounded-xl mx-auto sm:mx-0 ${dark ? "bg-slate-800" : "bg-slate-200"}`} />

              <div className="flex flex-wrap items-center justify-center gap-x-7 gap-y-2 sm:justify-start">
                {[1, 2, 3, 4, 5].map((i) => (
                  <div key={i} className="flex items-baseline gap-2">
                    <div className={`h-6 w-12 rounded ${dark ? "bg-slate-800" : "bg-slate-200"}`} />
                    <div className={`h-4 w-12 rounded ${dark ? "bg-slate-800/60" : "bg-slate-100"}`} />
                  </div>
                ))}
              </div>

              <div className="flex flex-wrap justify-center gap-3 sm:justify-start">
                <div className={`h-6 w-32 rounded-lg ${dark ? "bg-slate-800" : "bg-slate-100"}`} />
                <div className={`h-6 w-24 rounded-lg ${dark ? "bg-slate-800" : "bg-slate-100"}`} />
                <div className={`h-6 w-28 rounded-lg ${dark ? "bg-slate-800" : "bg-slate-100"}`} />
              </div>
            </div>

            <div className="shrink-0">
              <div className={`h-11 w-32 rounded-2xl ${dark ? "bg-slate-800" : "bg-slate-200"}`} />
            </div>
          </div>
        </div>

        <div className="flex gap-2 sm:gap-3 mb-8 overflow-x-auto pb-2">
          {[1, 2, 3, 4].map((i) => (
            <div
              key={i}
              className={`h-12 w-32 rounded-xl shrink-0 ${
                dark ? "bg-slate-800/80" : "bg-slate-200"
              }`}
            />
          ))}
        </div>

        <ProfilePostsSkeleton dark={dark} />
      </div>
    </div>
  );
}

export default function Profile() {
  const navigate = useNavigate();
  const { userId } = useParams();
  const [searchParams, setSearchParams] = useSearchParams();
  const { user, isAuthenticated } = useAuthStore();

  const currentUserId = user?.user_id || user?.id;
  // ตรวจสอบว่าเป็นการดูโปรไฟล์ของผู้อื่นหรือไม่
  const isOtherUser = Boolean(
    userId &&
      userId !== "edit" &&
      (!currentUserId || String(userId) !== String(currentUserId))
  );

  const [activeTab, setActiveTab] = useState("posts");
  const [otherProfile, setOtherProfile] = useState(null);
  const [ownProfile, setOwnProfile] = useState(null);
  const [isFollowing, setIsFollowing] = useState(false);
  const [isFollowLoading, setIsFollowLoading] = useState(false);
  const [userNotFound, setUserNotFound] = useState(false);

  const [myPosts, setMyPosts] = useState([]);
  const [drafts, setDrafts] = useState([]);
  const [bookmarks, setBookmarks] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [followCounts, setFollowCounts] = useState({
    followersCount: 0,
    followingCount: 0,
  });
  const [isFollowModalOpen, setIsFollowModalOpen] = useState(false);
  const [followModalTab, setFollowModalTab] = useState("followers");

  const openFollowModal = (tab = "followers") => {
    setFollowModalTab(tab);
    setIsFollowModalOpen(true);
  };

  const handleBookmarkChange = (postId, isBookmarked) => {
    setMyPosts((posts) =>
      posts.map((post) =>
        String(post.id) === String(postId) ? { ...post, isBookmarked } : post,
      ),
    );
    setBookmarks((posts) =>
      isBookmarked
        ? posts.map((post) =>
            String(post.id) === String(postId) ? { ...post, isBookmarked: true } : post,
          )
        : posts.filter((post) => String(post.id) !== String(postId)),
    );
  };

  const theme = isOtherUser
    ? otherProfile?.current_theme?.settings || {}
    : user?.user_metadata?.theme_settings || {};

  const enterScreenEnabled = !isOtherUser && !!user?.user_metadata?.enter_screen_enabled;
  const [hasEntered, setHasEntered] = useState(!enterScreenEnabled);
  const [isBannerBlank, setIsBannerBlank] = useState(false);

  const selectTab = (tab) => {
    setActiveTab(tab);
    setSearchParams((current) => {
      current.set("tab", tab);
      return current;
    });
  };

  useEffect(() => {
    setHasEntered(!enterScreenEnabled);
  }, [enterScreenEnabled]);

  // Keep the current user's profile on the stable id-based public URL.
  useEffect(() => {
    if (!userId && currentUserId) {
      navigate(`/profile/${encodeURIComponent(currentUserId)}`, { replace: true });
    }
  }, [userId, currentUserId, navigate]);

  // วอลเปเปอร์และธีมพื้นหลัง
  const setHeroImage = useHeroThemeStore((state) => state.setHeroImage);
  const clearHeroImage = useHeroThemeStore((state) => state.clearHeroImage);
  const isDarkHero = useHeroThemeStore((state) => state.isDarkHero);
  const heroColor = useHeroThemeStore((state) => state.heroColor);

  const wallpaperUrl = isOtherUser
    ? otherProfile?.wallpaper || otherProfile?.profile_banner
    : user?.user_metadata?.wallpaper_url;

  useEffect(() => {
    setHeroImage(wallpaperUrl, { fallbackDark: false });
    return () => clearHeroImage();
  }, [wallpaperUrl, setHeroImage, clearHeroImage]);

  // ปรับสีกระจกฝ้าของการ์ดโปรไฟล์ให้เข้ากับโทนสีของวอลเปเปอร์
  const cardGlassColor = rgbToRgba(getGlassColor(heroColor, isDarkHero), 22);

  const pageBg = isDarkHero ? "bg-slate-900" : "bg-slate-50";
  const cardBorderClass = isDarkHero
    ? "border-white/10 border-t-white/20"
    : "border-slate-100";
  const dividerClass = isDarkHero ? "border-white/10" : "border-slate-100";
  const headingClass = isDarkHero ? "text-white" : "text-slate-800";
  const subTextClass = isDarkHero ? "text-slate-400" : "text-slate-500";
  const mutedTextClass = isDarkHero ? "text-slate-300" : "text-slate-600";
  const tagPillClass = isDarkHero
    ? "bg-white/10 border-white/10 text-slate-200"
    : "bg-slate-100 border-slate-200 text-slate-600";
  const editButtonClass = isDarkHero
    ? "bg-white/10 hover:bg-white/20 text-white border-white/10"
    : "bg-slate-100 hover:bg-slate-200 text-slate-700 border-slate-200";
  const avatarBorderClass = isDarkHero
    ? "border-slate-800 bg-slate-800"
    : "border-white bg-slate-100 shadow-md";
  const tabInactiveClass = isDarkHero
    ? "bg-white/5 text-slate-300 hover:bg-white/15 hover:text-white border border-white/10 backdrop-blur-xl"
    : "bg-white text-slate-600 hover:bg-slate-100 hover:text-slate-900 border border-slate-100 shadow-sm";
  const emptyCardClass = isDarkHero
    ? "bg-white/10 backdrop-blur-xl border-white/10"
    : "bg-white border-slate-100 shadow-sm";
  const emptyIconWrapClass = isDarkHero
    ? "bg-white/10 text-slate-400"
    : "bg-slate-100 text-slate-400";

  useEffect(() => {
    const tab = searchParams.get("tab");
    if (tab && ["posts", "drafts", "bookmarks", "achievements"].includes(tab)) {
      if (isOtherUser && (tab === "drafts" || tab === "bookmarks")) {
        setActiveTab("posts");
      } else {
        setActiveTab(tab);
      }
    }
  }, [searchParams, isOtherUser]);

  // โหลดรายการ Milestones / Frames สำหรับคำนวณกรอบรูป
  const { milestones, fetchMilestones } = useAchievementStore();
  useEffect(() => {
    fetchMilestones();
  }, [fetchMilestones]);

  const allMilestones = milestones;

  const completedAchievements = allMilestones.filter(
    (m) => m.status !== "LOCKED",
  );

  // ดึงข้อมูลโปรไฟล์ (แยกเคส: ตัวเอง vs คนอื่น)
  useEffect(() => {
    if (isOtherUser) {
      const loadOtherUser = async () => {
        setIsLoading(true);
        setUserNotFound(false);
        try {
          const profileData = await profileService.getUserProfile(userId);

          if (!profileData) {
            setUserNotFound(true);
            return;
          }

          const profileUserId = profileData.id || profileData.user_id || profileData._id;
          const userPosts = profileUserId
            ? await profileService.getUserPosts(profileUserId)
            : [];

          setOtherProfile(profileData);
          setIsFollowing(Boolean(profileData.isFollowing));
          setFollowCounts(normalizeFollowCounts(profileData));
          setMyPosts(userPosts);
        } catch (err) {
          console.error("Error loading other user profile:", err);
          setUserNotFound(true);
        } finally {
          setIsLoading(false);
        }
      };
      loadOtherUser();
    } else {
      if (!user) {
        setIsLoading(false);
        return;
      }

      const loadMyProfileData = async () => {
        setIsLoading(true);
        try {
          const targetId = user?.user_id || user?.id;
          if (!targetId) return;

          const [fetchedPosts, fetchedDrafts, fetchedBookmarks, fetchedOwnProfile] =
            await Promise.all([
              profileService.getMyPosts(targetId),
              profileService.getDrafts(targetId),
              profileService.getBookmarks(targetId),
              profileService.getUserProfile(targetId).catch(() => null),
            ]);

          setMyPosts(fetchedPosts);
          setDrafts(fetchedDrafts);
          setBookmarks(fetchedBookmarks);
          if (fetchedOwnProfile) {
            setOwnProfile(fetchedOwnProfile);
            setFollowCounts(normalizeFollowCounts(fetchedOwnProfile));
          }
        } catch (error) {
          toast.error("เกิดข้อผิดพลาดในการโหลดข้อมูลโปรไฟล์");
          console.error(error);
        } finally {
          setIsLoading(false);
        }
      };
      loadMyProfileData();
    }
  }, [userId, isOtherUser, user, navigate]);

  // ฟังก์ชัน Follow / Unfollow ผู้ใช้อื่น
  const handleToggleFollow = async () => {
    if (!isAuthenticated) {
      toast.error("กรุณาเข้าสู่ระบบเพื่อติดตาม");
      navigate("/login");
      return;
    }
    const targetUserId =
      otherProfile?.id || otherProfile?.user_id || otherProfile?._id;
    if (isFollowLoading || !targetUserId) return;

    try {
      setIsFollowLoading(true);
      if (isFollowing) {
        await profileService.unfollowUser(targetUserId);
        setIsFollowing(false);
        setFollowCounts((prev) => ({
          ...prev,
          followersCount: Math.max(0, prev.followersCount - 1),
        }));
        toast.success("เลิกติดตามแล้ว");
      } else {
        await profileService.followUser(targetUserId);
        setIsFollowing(true);
        setFollowCounts((prev) => ({
          ...prev,
          followersCount: prev.followersCount + 1,
        }));
        toast.success("ติดตามเรียบร้อยแล้ว");
      }
    } catch (error) {
      console.error("Error toggling follow:", error);
      toast.error(error.response?.data?.message || "เกิดข้อผิดพลาดในการติดตาม");
    } finally {
      setIsFollowLoading(false);
    }
  };

  // ข้อมูลที่ใช้แสดงผลใน UI (กรองอีเมลออกอย่างเด็ดขาด)
  const sanitizeProfileName = (name) => {
    if (!name || typeof name !== "string") return "";
    const trimmed = name.trim();
    return trimmed.includes("@") ? trimmed.split("@")[0] : trimmed;
  };

  const rawUsername = isOtherUser
    ? otherProfile?.username
    : ownProfile?.username || user?.username;
  const profileUsername = sanitizeProfileName(rawUsername);

  const rawDisplayName = isOtherUser
    ? otherProfile?.nickname || profileUsername
    : ownProfile?.nickname ||
      user?.nickname ||
      user?.display_name ||
      profileUsername ||
      user?.user_metadata?.full_name ||
      user?.name;

  const displayName = sanitizeProfileName(rawDisplayName) || "ผู้ใช้งาน";

  // Public profile headers must never expose an account email address.
  // Username displayed without '@'
  const displaySubtitle = profileUsername ? `${profileUsername}` : "";

  // คำนวณยอดวิวรวม และถูกใจรวมจากโพสต์ทั้งหมดของผู้ใช้งาน
  const totalViews = useMemo(() => {
    if (isOtherUser && typeof otherProfile?.totalViews === "number") return otherProfile.totalViews;
    if (!isOtherUser && typeof ownProfile?.totalViews === "number") return ownProfile.totalViews;
    return myPosts.reduce((sum, p) => sum + (Number(p.views ?? p.view_count ?? p.views_count ?? p.viewsCount ?? 0) || 0), 0);
  }, [isOtherUser, otherProfile, ownProfile, myPosts]);

  const totalLikes = useMemo(() => {
    if (isOtherUser && typeof otherProfile?.totalLikes === "number") return otherProfile.totalLikes;
    if (!isOtherUser && typeof ownProfile?.totalLikes === "number") return ownProfile.totalLikes;
    return myPosts.reduce((sum, p) => {
      const count = Array.isArray(p.likes)
        ? p.likes.length
        : (p.likes_count ?? p.like_count ?? p.likesCount ?? p._count?.likes ?? 0);
      return sum + (Number(count) || 0);
    }, 0);
  }, [isOtherUser, otherProfile, ownProfile, myPosts]);

  const displayAvatar = isOtherUser
    ? otherProfile?.profile_image ||
      `https://ui-avatars.com/api/?name=${encodeURIComponent(displayName)}&background=1e293b&color=38bdf8&size=200`
    : ownProfile?.profile_image || user?.avatar_url ||
      `https://ui-avatars.com/api/?name=${encodeURIComponent(displayName)}&background=1e293b&color=38bdf8&size=200`;

  const bannerUrl = isOtherUser
    ? otherProfile?.profile_banner || otherProfile?.banner_url
    : ownProfile?.profile_banner || user?.user_metadata?.banner_url;

  const displayEducationLevel = isOtherUser
    ? otherProfile?.education_level
    : ownProfile?.education_level || user?.education_level;

  const displayOccupation = isOtherUser
    ? otherProfile?.occupation
    : ownProfile?.occupation || user?.user_metadata?.occupation;

  const displayLocation = isOtherUser
    ? otherProfile?.location
    : ownProfile?.location || user?.user_metadata?.location;

  const displayInstagram = isOtherUser
    ? otherProfile?.social_links?.instagram || otherProfile?.instagram_url
    : ownProfile?.social_links?.instagram || user?.user_metadata?.instagram_url;

  const displayFacebook = isOtherUser
    ? otherProfile?.social_links?.facebook || otherProfile?.facebook_url
    : ownProfile?.social_links?.facebook || user?.user_metadata?.facebook_url;

  const displayBio = isOtherUser
    ? otherProfile?.bio || "ยังไม่มีคำอธิบายตัวเอง..."
    : ownProfile?.bio || user?.bio || "ยังไม่มีคำอธิบายตัวเอง...";

  // กรอบรูป
  const ownProfileWithCachedFrame = isOtherUser
    ? null
    : {
        ...user,
        ...ownProfile,
        current_frame_id: user && 'current_frame_id' in user ? user.current_frame_id : ownProfile?.current_frame_id ?? null,
        current_frame: user?.current_frame_id == null ? null : (user?.current_frame || ownProfile?.current_frame),
        user_metadata: user?.user_metadata,
      };
  const {
    previewUrl: framePreviewUrl,
  } = resolveProfileFrame(
    isOtherUser ? otherProfile : ownProfileWithCachedFrame,
    allMilestones,
  );

  // กรณีไม่พบผู้ใช้งาน
  if (userNotFound) {
    return (
      <div className={`min-h-screen ${pageBg} flex items-center justify-center p-6 relative`}>
        <div className={`max-w-md w-full text-center p-8 backdrop-blur-xl rounded-3xl border shadow-xl ${emptyCardClass}`}>
          <div className="h-20 w-20 mx-auto rounded-full bg-slate-100 flex items-center justify-center text-slate-400 mb-4">
            <UserX className="h-10 w-10" />
          </div>
          <h2 className={`text-2xl font-bold mb-2 ${headingClass}`}>ไม่พบผู้ใช้งานนี้</h2>
          <p className={`${subTextClass} mb-6`}>ผู้ใช้งานนี้อาจไม่มีอยู่ในระบบ หรือบัญชีถูกลบไปแล้ว</p>
          <button
            onClick={() => navigate("/home")}
            className="px-6 py-2.5 bg-primary hover:bg-blue-600 text-white font-bold rounded-xl shadow-md transition-all cursor-pointer"
          >
            กลับหน้าหลัก
          </button>
        </div>
      </div>
    );
  }

  // หน้า Welcome Enter Screen (เฉพาะเจ้าของโปรไฟล์ที่เปิดใช้งานไว้)
  if (!isOtherUser && !hasEntered) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center p-6 relative overflow-hidden">
        {user?.user_metadata?.wallpaper_url && (
          <img
            src={user.user_metadata.wallpaper_url}
            alt=""
            className="absolute inset-0 w-full h-full object-cover opacity-30"
          />
        )}
        <div className="relative z-10 max-w-md w-full text-center bg-slate-900/70 backdrop-blur-xl border border-white/10 rounded-3xl p-10 shadow-2xl">
          <DoorOpen className="h-10 w-10 text-primary mx-auto mb-4" />
          <h2 className="text-2xl font-extrabold text-white mb-3">
            {displayName}
          </h2>
          <p className="text-slate-300 mb-8">
            {user?.user_metadata?.enter_screen_message ||
              "ยินดีต้อนรับเข้าสู่โปรไฟล์"}
          </p>
          <button
            onClick={() => setHasEntered(true)}
            className="px-8 py-3 bg-primary hover:bg-blue-600 text-white rounded-xl font-bold shadow-lg transition-all cursor-pointer"
          >
            เข้าสู่โปรไฟล์
          </button>
        </div>
      </div>
    );
  }

  // แสดง Skeleton หากกำลังโหลดข้อมูลโปรไฟล์เริ่มต้น
  if (isLoading && !otherProfile && !ownProfile && myPosts.length === 0) {
    return <ProfileSkeleton dark={isDarkHero} />;
  }

  return (
    <div
      className={`min-h-screen ${pageBg} pb-20 relative transition-colors duration-500`}
    >
      {/* พื้นหลังเต็มจอ */}
      <div className="fixed inset-0 z-0 overflow-hidden">
        {wallpaperUrl &&
          (wallpaperUrl.endsWith(".mp4") ? (
            <video
              src={wallpaperUrl}
              className="w-full h-full object-cover"
              autoPlay
              muted
              loop
              playsInline
            />
          ) : (
            <img
              src={wallpaperUrl}
              alt="Wallpaper"
              className="w-full h-full object-cover"
            />
          ))}
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-24 sm:pt-40 relative z-10">
        <div
          className={`backdrop-blur-2xl shadow-2xl border p-6 sm:p-10 mb-8 overflow-hidden transition-colors duration-500 ${cardBorderClass}`}
          style={{
            borderRadius:
              theme.cornerRoundness != null
                ? `${theme.cornerRoundness}px`
                : "32px",
            backgroundColor: cardGlassColor,
          }}
        >
          {bannerUrl && !isBannerBlank && (
            <div
              className="-mx-6 sm:-mx-10 -mt-6 sm:-mt-10 mb-6 h-48 sm:h-64 pointer-events-none"
              style={{
                maskImage:
                  "linear-gradient(to bottom, black 0%, black 40%, transparent 95%)",
                WebkitMaskImage:
                  "linear-gradient(to bottom, black 0%, black 40%, transparent 95%)",
              }}
            >
              <img
                src={bannerUrl}
                alt="Banner"
                className="w-full h-full object-cover opacity-0 transition-opacity duration-300"
                onLoad={(e) => {
                  if (e.target.naturalWidth === 1 && e.target.naturalHeight === 1) {
                    setIsBannerBlank(true);
                  } else {
                    e.target.classList.remove("opacity-0");
                  }
                }}
              />
            </div>
          )}
          <div className="flex flex-col items-center gap-6 text-center sm:flex-row sm:items-end sm:gap-8 sm:text-left">
            <div className="relative shrink-0">
              {/* เมื่อสวมกรอบตกแต่ง ให้ซ่อนขอบขาวของรูปโปรไฟล์ที่อาจโผล่ผ่านช่องว่างของกรอบ */}
              <AvatarWithFrame avatarSrc={displayAvatar} frameSrc={framePreviewUrl} avatarAlt="Avatar" sizeClass="h-32 w-32 sm:h-40 sm:w-40" className={framePreviewUrl ? "shadow-2xl" : `border-4 shadow-2xl ${avatarBorderClass}`} />
            </div>

            <div className="w-full flex-1 pb-2">
              <h1
                className="text-3xl font-extrabold text-black"
                style={{
                  color:
                    theme.nameColor || "#000000",
                }}
              >
                {displayName}
              </h1>

              <div className="mt-4 mb-4 flex flex-wrap items-center justify-center gap-x-7 gap-y-2 sm:justify-start">
                <div className="flex items-baseline gap-2">
                  <span className={`text-xl font-extrabold ${headingClass}`}>
                    {myPosts.length}
                  </span>
                  <span className={`text-sm font-medium ${mutedTextClass}`}>
                    โพสต์
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => openFollowModal("followers")}
                  className="flex items-baseline gap-2 group cursor-pointer hover:opacity-80 transition-all text-left focus:outline-none"
                  title="ดูรายชื่อผู้ติดตาม"
                >
                  <span className={`text-xl font-extrabold ${headingClass} group-hover:text-primary transition-colors`}>
                    {followCounts.followersCount}
                  </span>
                  <span className={`text-sm font-medium ${mutedTextClass} group-hover:text-primary transition-colors group-hover:underline underline-offset-4`}>
                    ผู้ติดตาม
                  </span>
                </button>
                <button
                  type="button"
                  onClick={() => openFollowModal("following")}
                  className="flex items-baseline gap-2 group cursor-pointer hover:opacity-80 transition-all text-left focus:outline-none"
                  title="ดูรายชื่อกำลังติดตาม"
                >
                  <span className={`text-xl font-extrabold ${headingClass} group-hover:text-primary transition-colors`}>
                    {followCounts.followingCount}
                  </span>
                  <span className={`text-sm font-medium ${mutedTextClass} group-hover:text-primary transition-colors group-hover:underline underline-offset-4`}>
                    กำลังติดตาม
                  </span>
                </button>
                <div className="flex items-baseline gap-2" title="ยอดวิวรวมทั้งหมด">
                  <span className={`text-xl font-extrabold ${headingClass}`}>
                    {totalViews.toLocaleString()}
                  </span>
                  <span className={`text-sm font-medium flex items-center gap-1 ${mutedTextClass}`}>
                    <Eye className="h-3.5 w-3.5 text-blue-500" />
                    ยอดวิวรวม
                  </span>
                </div>
                <div className="flex items-baseline gap-2" title="ถูกใจรวมทั้งหมด">
                  <span className={`text-xl font-extrabold ${headingClass}`}>
                    {totalLikes.toLocaleString()}
                  </span>
                  <span className={`text-sm font-medium flex items-center gap-1 ${mutedTextClass}`}>
                    <Heart className="h-3.5 w-3.5 text-rose-500 fill-rose-500/20" />
                    ถูกใจรวม
                  </span>
                </div>
              </div>

              <div
                className={`flex flex-wrap justify-center gap-3 text-sm font-semibold sm:justify-start ${mutedTextClass}`}
              >
                <div className="flex items-center gap-1.5">
                  <GraduationCap className="h-4 w-4 text-primary" />{" "}
                  {getEducationLevelLabel(displayEducationLevel)}
                </div>

                {displayOccupation && (
                  <div className="flex items-center gap-1.5">
                    <Briefcase className="h-4 w-4 text-primary" />{" "}
                    {displayOccupation}
                  </div>
                )}
                {displayLocation && (
                  <div className="flex items-center gap-1.5">
                    <MapPin className="h-4 w-4 text-primary" />{" "}
                    {displayLocation}
                  </div>
                )}

                {displayInstagram && (
                  <a
                    href={displayInstagram}
                    target="_blank"
                    rel="noreferrer"
                    className="flex items-center gap-1.5 text-pink-400 hover:text-pink-300 transition-colors"
                  >
                    <LinkIcon className="h-4 w-4" /> Instagram
                  </a>
                )}
                {displayFacebook && (
                  <a
                    href={displayFacebook}
                    target="_blank"
                    rel="noreferrer"
                    className="flex items-center gap-1.5 text-blue-400 hover:text-blue-300 transition-colors"
                  >
                    <LinkIcon className="h-4 w-4" /> Facebook
                  </a>
                )}
              </div>

              {/* Widgets */}
              {(() => {
                const widgetsList = isOtherUser
                  ? otherProfile?.widgets || otherProfile?.user_metadata?.widgets || []
                  : ownProfile?.widgets || ownProfile?.user_metadata?.widgets || user?.user_metadata?.widgets || [];
                // ซ่อนลิงก์เก่าที่ไม่ผ่านกฎ URL ทั้งโปรไฟล์ตนเองและผู้อื่น
                const profileWidgets = widgetsList.filter((w) =>
                  w.options?.insideProfileCard !== false &&
                  !getWidgetUrlError(w.platformId, w.url)
                );
                if (profileWidgets.length === 0) return null;
                return (
                  <div className="flex flex-wrap gap-2 mt-3 justify-center sm:justify-start">
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

              {(() => {
                const tagsList = isOtherUser
                  ? otherProfile?.tags || otherProfile?.user_metadata?.tags || []
                  : ownProfile?.tags || ownProfile?.user_metadata?.tags || user?.user_metadata?.tags || [];
                if (!tagsList.length) return null;
                return (
                  <div className="flex flex-wrap gap-2 mt-4 justify-center sm:justify-start">
                    {tagsList.map((tag, i) => (
                      <span
                        key={i}
                        className={`px-2.5 py-1 border rounded-full text-xs font-bold ${tagPillClass}`}
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                );
              })()}
            </div>

            {/* Action Buttons: ติดตาม (คนอื่น) หรือ แก้ไขโปรไฟล์ (ตัวเอง) */}
            <div className="flex w-full gap-4 pb-2 sm:w-auto">
              {isOtherUser ? (
                <button
                  onClick={handleToggleFollow}
                  disabled={isFollowLoading}
                  className={`flex-1 sm:flex-none px-6 py-3 rounded-xl font-bold transition-all border backdrop-blur-md flex items-center justify-center gap-2 cursor-pointer ${
                    isFollowing
                      ? "bg-slate-200/80 hover:bg-rose-50 hover:text-rose-600 hover:border-rose-200 text-slate-700 border-slate-300"
                      : "bg-primary hover:bg-blue-600 text-white border-primary shadow-lg shadow-primary/25"
                  }`}
                >
                  {isFollowLoading ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : isFollowing ? (
                    <>
                      <UserCheck className="h-4 w-4" /> กำลังติดตาม
                    </>
                  ) : (
                    <>
                      <UserPlus className="h-4 w-4" /> ติดตาม
                    </>
                  )}
                </button>
              ) : (
                <button
                  onClick={() => navigate("/settings/profile")}
                  className={`flex-1 sm:flex-none px-6 py-3 rounded-xl font-bold transition-all border backdrop-blur-md flex items-center justify-center gap-2 cursor-pointer ${editButtonClass}`}
                >
                  <Edit className="h-4 w-4" /> แก้ไขโปรไฟล์
                </button>
              )}
            </div>
          </div>

          <div className={`mt-8 pt-8 border-t ${dividerClass}`}>
            <h3 className={`font-bold mb-2 ${headingClass}`}>
              เกี่ยวกับฉัน (Bio)
            </h3>
            <p
              className="leading-relaxed max-w-3xl"
              style={{
                color: theme.textColor || (isDarkHero ? "#cbd5e1" : "#475569"),
              }}
            >
              {displayBio}
            </p>
          </div>
        </div>

        {/* แถบแท็บ */}
        <div className="flex gap-2 mb-8 overflow-x-auto pb-2 scrollbar-hide">
          <button
            onClick={() => selectTab("posts")}
            className={`flex items-center gap-2 px-6 py-3.5 rounded-xl font-bold whitespace-nowrap transition-all cursor-pointer ${activeTab === "posts" ? "bg-primary text-white shadow-lg shadow-primary/20" : tabInactiveClass}`}
          >
            <BookOpen className="h-5 w-5" /> {isOtherUser ? "โพสต์ทั้งหมด" : "โพสต์ของฉัน"}
          </button>

          {!isOtherUser && (
            <>
              <button
                onClick={() => selectTab("drafts")}
                className={`flex items-center gap-2 px-6 py-3.5 rounded-xl font-bold whitespace-nowrap transition-all cursor-pointer ${activeTab === "drafts" ? "bg-primary text-white shadow-lg shadow-primary/20" : tabInactiveClass}`}
              >
                <FileText className="h-5 w-5" /> แบบร่าง
              </button>
              <button
                onClick={() => selectTab("bookmarks")}
                className={`flex items-center gap-2 px-6 py-3.5 rounded-xl font-bold whitespace-nowrap transition-all cursor-pointer ${activeTab === "bookmarks" ? "bg-primary text-white shadow-lg shadow-primary/20" : tabInactiveClass}`}
              >
                <Star className="h-5 w-5" /> บุ๊คมาร์ก
              </button>
            </>
          )}

          <button
            onClick={() => selectTab("achievements")}
            className={`flex items-center gap-2 px-6 py-3.5 rounded-xl font-bold whitespace-nowrap transition-all cursor-pointer ${activeTab === "achievements" ? "bg-primary text-white shadow-lg shadow-primary/20" : tabInactiveClass}`}
          >
            <Trophy className="h-5 w-5" /> ความสำเร็จ
          </button>
        </div>

        {/* เนื้อหาของแต่ละแท็บ */}
        <div className="min-h-[400px]">
          {isLoading ? (
            <ProfilePostsSkeleton dark={isDarkHero} />
          ) : (
            <>
              {activeTab === "posts" && (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                  {myPosts.length > 0 ? (
                    myPosts.map((post) => (
                      <PostCard
                        key={post.id}
                        post={post}
                        viewMode="grid"
                        dark={isDarkHero}
                        onBookmarkChange={handleBookmarkChange}
                        authorOverride={isOtherUser ? null : user}
                      />
                    ))
                  ) : (
                    <div
                      className={`col-span-full py-10 text-center ${subTextClass}`}
                    >
                      {isOtherUser
                        ? "ผู้ใช้งานนี้ยังไม่มีโพสต์ที่เผยแพร่"
                        : "ยังไม่มีโพสต์ที่เผยแพร่"}
                    </div>
                  )}
                </div>
              )}

              {!isOtherUser && activeTab === "drafts" && (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                  {drafts.length > 0 ? (
                    drafts.map((draft) => (
                      <div
                        key={draft.id}
                        className={`backdrop-blur-xl rounded-3xl border shadow-lg shadow-black/10 hover:shadow-xl transition-all flex flex-col overflow-hidden group ${emptyCardClass}`}
                      >
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

                        <div className="p-5 flex-1 flex flex-col justify-between">
                          <div>
                            <div className="flex items-center gap-2 mb-3">
                              <span
                                className={`px-2 py-0.5 border rounded-md text-[10px] font-bold ${tagPillClass}`}
                              >
                                {draft.level}
                              </span>
                              <span
                                className={`text-[10px] font-bold flex items-center gap-1 ${subTextClass}`}
                              >
                                <Clock className="h-3 w-3" /> แบบร่าง
                              </span>
                            </div>

                            <h3
                              className={`text-lg font-bold line-clamp-2 mb-2 group-hover:text-primary transition-colors ${headingClass}`}
                            >
                              {draft.title}
                            </h3>

                            <p
                              className={`text-xs font-medium line-clamp-2 mb-4 leading-relaxed ${subTextClass}`}
                            >
                              {draft.description}
                            </p>
                          </div>

                          <div
                            className={`pt-3 border-t flex items-center justify-between gap-3 mt-auto ${dividerClass}`}
                          >
                            <span
                              className={`text-[10px] font-medium ${subTextClass}`}
                            >
                              แก้ไขล่าสุด:{" "}
                              {draft.created_at
                                ? new Date(draft.created_at).toLocaleDateString(
                                    "th-TH",
                                  )
                                : "ไม่ระบุ"}
                            </span>

                            <button
                              onClick={() => navigate(`/post/edit/${draft.id}`)}
                              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold shadow-sm transition-all cursor-pointer border text-primary ${isDarkHero ? "bg-white/10 hover:bg-white/20 border-white/10" : "bg-blue-50 hover:bg-blue-100 border-blue-100"}`}
                            >
                              <Edit className="h-3.5 w-3.5" /> แก้ไขโพสต์
                            </button>
                          </div>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div
                      className={`col-span-full flex flex-col items-center justify-center py-20 text-center backdrop-blur-xl rounded-3xl border ${emptyCardClass}`}
                    >
                      <div
                        className={`h-24 w-24 rounded-full flex items-center justify-center mb-4 ${emptyIconWrapClass}`}
                      >
                        <FileText className="h-10 w-10" />
                      </div>
                      <h3 className={`text-xl font-bold mb-2 ${headingClass}`}>
                        ยังไม่มีแบบร่าง
                      </h3>
                      <p className={subTextClass}>
                        คุณสามารถบันทึกสรุปความรู้เป็นแบบร่างเพื่อมาเขียนต่อได้ตลอดเวลา
                      </p>
                    </div>
                  )}
                </div>
              )}

              {!isOtherUser && activeTab === "bookmarks" && (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                  {bookmarks.length > 0 ? (
                    bookmarks.map((post) => (
                      <PostCard
                        key={post.id}
                        post={post}
                        viewMode="grid"
                        dark={isDarkHero}
                        onBookmarkChange={handleBookmarkChange}
                      />
                    ))
                  ) : (
                    <div
                      className={`col-span-full flex flex-col items-center justify-center py-20 text-center backdrop-blur-xl rounded-3xl border ${emptyCardClass}`}
                    >
                      <div
                        className={`h-24 w-24 rounded-full flex items-center justify-center mb-4 ${emptyIconWrapClass}`}
                      >
                        <Star className="h-10 w-10" />
                      </div>
                      <h3 className={`text-xl font-bold mb-2 ${headingClass}`}>
                        ยังไม่มีบุ๊คมาร์ก
                      </h3>
                      <p className={subTextClass}>
                        ไปที่หน้า Explore หรือ Trending
                        เพื่อค้นหาโพสต์ที่คุณสนใจ
                      </p>
                    </div>
                  )}
                </div>
              )}

              {activeTab === "achievements" && (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                  {completedAchievements.length > 0 ? (
                    completedAchievements.map((m) => {
                      const statusMeta = ACHIEVEMENT_STATUS_META[m.status];
                      const hasImage =
                        m.reward?.type === "WALLPAPER" && m.reward.previewUrl;
                      return (
                        <div
                          key={m.id}
                          className={`backdrop-blur-xl rounded-3xl border shadow-lg shadow-black/10 p-5 flex flex-col gap-3 ${emptyCardClass}`}
                        >
                          <div className="flex items-center justify-between gap-3">
                            <div className="relative h-14 w-14 flex items-center justify-center shrink-0">
                              <div
                                className={`h-11 w-11 rounded-full overflow-hidden border-2 shrink-0 ${m.status === "CLAIMED" ? "border-emerald-400" : "border-amber-400"}`}
                              >
                                {hasImage ? (
                                  <img
                                    src={m.reward.previewUrl}
                                    alt={m.reward.name}
                                    className="w-full h-full object-cover"
                                  />
                                ) : (
                                  <img
                                    src={displayAvatar}
                                    alt=""
                                    className="w-full h-full object-cover"
                                  />
                                )}
                              </div>
                              {m.reward?.type === "FRAME" && m.reward.previewUrl && (
                                <img
                                  src={m.reward.previewUrl}
                                  alt={m.reward.name}
                                  className="absolute -inset-1 w-[calc(100%+8px)] h-[calc(100%+8px)] pointer-events-none object-contain drop-shadow-sm z-10 scale-110"
                                />
                              )}
                            </div>
                            <span
                              className={`px-2.5 py-1 rounded-full text-[11px] font-bold whitespace-nowrap ${statusMeta?.badgeClass || "bg-slate-100 text-slate-700"}`}
                            >
                              {statusMeta?.label || "สำเร็จ"}
                            </span>
                          </div>
                          <div>
                            <h3 className={`font-bold ${headingClass}`}>
                              {m.title}
                            </h3>
                            <p className={`text-sm mt-0.5 ${subTextClass}`}>
                              {m.description}
                            </p>
                          </div>
                          {m.reward && (
                            <div
                              className={`flex items-center gap-1.5 text-xs font-semibold ${mutedTextClass}`}
                            >
                              <Gift className="h-3.5 w-3.5" />
                              {m.reward.type === "FRAME"
                                ? "กรอบรูป"
                                : "ภาพพื้นหลัง"}
                              : {m.reward.name}
                            </div>
                          )}
                        </div>
                      );
                    })
                  ) : (
                    <div
                      className={`col-span-full flex flex-col items-center justify-center py-20 text-center backdrop-blur-xl rounded-3xl border ${emptyCardClass}`}
                    >
                      <div
                        className={`h-24 w-24 rounded-full flex items-center justify-center mb-4 ${emptyIconWrapClass}`}
                      >
                        <CheckCircle2 className="h-10 w-10" />
                      </div>
                      <h3 className={`text-xl font-bold mb-2 ${headingClass}`}>
                        {isOtherUser
                          ? "ยังไม่มีความสำเร็จที่เปิดเผย"
                          : "ยังไม่มีความสำเร็จที่ทำเสร็จ"}
                      </h3>
                      <p className={subTextClass}>
                        {isOtherUser
                          ? "ผู้ใช้งานนี้ยังไม่มีรายการความสำเร็จที่เสร็จสมบูรณ์"
                          : "ไปทำภารกิจในหน้า Achievements เพื่อปลดล็อกรางวัลแรกของคุณ"}
                      </p>
                    </div>
                  )}
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {/* Follow List Modal (Followers & Following) */}
      <FollowListModal
        isOpen={isFollowModalOpen}
        onClose={() => setIsFollowModalOpen(false)}
        userId={isOtherUser ? userId : (user?.user_id || user?.id)}
        initialTab={followModalTab}
        followersCount={followCounts.followersCount}
        followingCount={followCounts.followingCount}
        profileUsername={displayName}
      />
    </div>
  );
}
