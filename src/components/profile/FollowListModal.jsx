import { useState, useEffect, useMemo, useCallback } from "react";
import { useNavigate } from "react-router";
import { Users, X, Search, ChevronRight, UserCheck, Loader2 } from "lucide-react";
import { profileService } from "@/services/profile.service";

export default function FollowListModal({
  isOpen,
  onClose,
  userId,
  initialTab = "followers",
  followersCount = 0,
  followingCount = 0,
  profileUsername = "ผู้ใช้งาน",
}) {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState(initialTab);
  const [followers, setFollowers] = useState([]);
  const [following, setFollowing] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  // Sync initial tab when modal opens
  useEffect(() => {
    if (isOpen) {
      setActiveTab(initialTab);
      setSearchQuery("");
    }
  }, [isOpen, initialTab]);

  // Fetch lists for the target user
  const fetchFollowData = useCallback(async () => {
    if (!isOpen || !userId) return;
    setIsLoading(true);
    try {
      const [followersData, followingData] = await Promise.all([
        profileService.getFollowers(userId),
        profileService.getFollowing(userId),
      ]);
      setFollowers(Array.isArray(followersData) ? followersData : []);
      setFollowing(Array.isArray(followingData) ? followingData : []);
    } catch (err) {
      console.error("Error loading follow list:", err);
    } finally {
      setIsLoading(false);
    }
  }, [isOpen, userId]);

  useEffect(() => {
    fetchFollowData();
  }, [fetchFollowData]);

  // Close on Escape key
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === "Escape" && isOpen) {
        onClose();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  const currentList = activeTab === "followers" ? followers : following;

  const filteredUsers = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return currentList;
    return currentList.filter((item) =>
      item.username?.toLowerCase().includes(q)
    );
  }, [currentList, searchQuery]);

  if (!isOpen) return null;

  const handleUserClick = (targetId) => {
    if (!targetId) return;
    onClose();
    navigate(`/profile/${encodeURIComponent(targetId)}`);
  };

  return (
    <div
      className="fixed inset-0 z-[120] flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-3xl shadow-2xl w-full max-w-md max-h-[85vh] overflow-hidden flex flex-col animate-in zoom-in-95 duration-200 border border-slate-100"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4.5 border-b border-slate-100 shrink-0">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-2xl bg-primary/10 flex items-center justify-center text-primary">
              <Users className="h-5 w-5" />
            </div>
            <div>
              <h2 className="font-bold text-slate-800 text-base sm:text-lg leading-tight">
                {activeTab === "followers" ? "ผู้ติดตาม" : "กำลังติดตาม"}
              </h2>
              <p className="text-xs text-slate-400 truncate max-w-[200px] sm:max-w-[240px]">
                {profileUsername}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
            aria-label="ปิด"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Tab Switcher */}
        <div className="p-3 bg-slate-50 border-b border-slate-100 shrink-0">
          <div className="grid grid-cols-2 p-1 bg-slate-200/70 rounded-2xl gap-1">
            <button
              onClick={() => {
                setActiveTab("followers");
                setSearchQuery("");
              }}
              className={`py-2 px-3 text-xs sm:text-sm font-bold rounded-xl transition-all flex items-center justify-center gap-1.5 ${
                activeTab === "followers"
                  ? "bg-white text-primary shadow-sm"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              <span>ผู้ติดตาม</span>
              <span
                className={`text-[11px] px-1.5 py-0.5 rounded-full font-semibold ${
                  activeTab === "followers"
                    ? "bg-primary/10 text-primary"
                    : "bg-slate-300/60 text-slate-600"
                }`}
              >
                {followers.length || followersCount}
              </span>
            </button>
            <button
              onClick={() => {
                setActiveTab("following");
                setSearchQuery("");
              }}
              className={`py-2 px-3 text-xs sm:text-sm font-bold rounded-xl transition-all flex items-center justify-center gap-1.5 ${
                activeTab === "following"
                  ? "bg-white text-primary shadow-sm"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              <span>กำลังติดตาม</span>
              <span
                className={`text-[11px] px-1.5 py-0.5 rounded-full font-semibold ${
                  activeTab === "following"
                    ? "bg-primary/10 text-primary"
                    : "bg-slate-300/60 text-slate-600"
                }`}
              >
                {following.length || followingCount}
              </span>
            </button>
          </div>

          {/* Search box */}
          <div className="relative mt-2.5">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="ค้นหาชื่อผู้ใช้..."
              className="w-full pl-9 pr-8 py-2 bg-white rounded-xl border border-slate-200 text-xs sm:text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery("")}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-0.5 rounded-full"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            )}
          </div>
        </div>

        {/* User List */}
        <div className="flex-1 overflow-y-auto p-3 divide-y divide-slate-100 min-h-[220px]">
          {isLoading ? (
            <div className="flex flex-col items-center justify-center py-14 text-slate-400 gap-2">
              <Loader2 className="h-7 w-7 text-primary animate-spin" />
              <p className="text-xs sm:text-sm font-medium">กำลังโหลดรายชื่อ...</p>
            </div>
          ) : filteredUsers.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-14 text-slate-400 text-center px-4">
              <div className="w-14 h-14 bg-slate-100 rounded-full flex items-center justify-center mb-3 text-slate-400">
                <UserCheck className="h-7 w-7" />
              </div>
              <p className="text-sm font-bold text-slate-700">
                {searchQuery
                  ? "ไม่พบผู้ใช้ที่ค้นหา"
                  : activeTab === "followers"
                  ? "ยังไม่มีผู้ติดตาม"
                  : "ยังไม่ได้ติดตามใคร"}
              </p>
              <p className="text-xs text-slate-400 mt-1 max-w-xs">
                {searchQuery
                  ? "ลองเปลี่ยนคำค้นหาใหม่อีกครั้ง"
                  : activeTab === "followers"
                  ? "เมื่อมีผู้ใช้คนอื่นกดติดตาม รายชื่อจะแสดงที่นี่"
                  : "เริ่มสำรวจและติดตามเพื่อนเพื่อรับอัปเดตบทเรียนใหม่ๆ"}
              </p>
            </div>
          ) : (
            <div className="space-y-1">
              {filteredUsers.map((item) => {
                const avatar =
                  item.profile_image ||
                  item.avatar_url ||
                  item.avatar ||
                  `https://ui-avatars.com/api/?name=${encodeURIComponent(
                    item.username || "User"
                  )}&background=1e293b&color=38bdf8`;

                return (
                  <div
                    key={item.id}
                    onClick={() => handleUserClick(item.id)}
                    className="flex items-center justify-between p-2.5 rounded-2xl hover:bg-slate-50 transition-colors cursor-pointer group"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <img
                        src={avatar}
                        alt={item.username}
                        onError={(e) => {
                          e.currentTarget.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(
                            item.username || "User"
                          )}&background=1e293b&color=38bdf8`;
                        }}
                        className="h-10 w-10 rounded-full object-cover ring-1 ring-slate-200 shrink-0"
                      />
                      <div className="min-w-0">
                        <p className="font-bold text-sm text-slate-800 group-hover:text-primary transition-colors truncate">
                          {item.username || "ผู้ใช้งาน"}
                        </p>
                        <p className="text-[11px] text-slate-400 truncate">
                          แตะเพื่อดูโปรไฟล์
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-1 text-slate-400 group-hover:text-primary transition-colors shrink-0">
                      <span className="text-xs font-semibold hidden sm:inline">ดูโปรไฟล์</span>
                      <ChevronRight className="h-4 w-4" />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
