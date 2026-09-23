import { useState, useEffect, useRef } from "react";
import {
  Upload,
  Image as ImageIcon,
  Briefcase,
  MapPin,
  Tag,
  X,
  Sparkles,
  Trash2,
  RotateCcw,
} from "lucide-react";
import toast from "react-hot-toast";
import useAuthStore from "@/store/authStore";
import useAchievementStore from "@/store/achievementStore";
import { profileService } from "@/services/profile.service";
import { DEFAULT_THEME } from "./themeConstants";
import ProfilePreview from "@/components/settings/ProfilePreview";
import FrameDecorationModal from "@/components/settings/FrameDecorationModal";
import AvatarWithFrame from "@/components/profile/AvatarWithFrame";
import { supabase } from "@/utils/supabase";

const generateGradientFile = (filename, width, height, color1, color2) => {
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d");
  
  if (color1 === "transparent") {
    ctx.clearRect(0, 0, width, height);
  } else {
    const gradient = ctx.createLinearGradient(0, 0, width, height);
    gradient.addColorStop(0, color1);
    gradient.addColorStop(1, color2);
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, width, height);
  }
  
  const dataUrl = canvas.toDataURL("image/png");
  const byteString = atob(dataUrl.split(',')[1]);
  const ab = new ArrayBuffer(byteString.length);
  const ia = new Uint8Array(ab);
  for (let i = 0; i < byteString.length; i++) {
    ia[i] = byteString.charCodeAt(i);
  }
  const blob = new Blob([ab], { type: 'image/png' });
  return new File([blob], filename, { type: "image/png" });
};

export default function SettingsProfile() {
  const { user, login } = useAuthStore();
  const { milestones, fetchMilestones } = useAchievementStore();
  const [isSaving, setIsSaving] = useState(false);
  const [tagInput, setTagInput] = useState("");
  const [isFrameModalOpen, setIsFrameModalOpen] = useState(false);
  const frameRequestVersion = useRef(0);

  const [formData, setFormData] = useState({
    username: "",
    bio: "",
    education_level: "HIGH_SCHOOL",
    theme_settings: DEFAULT_THEME,
  });

  const [media, setMedia] = useState({
    avatar: null, // File object or URL
    wallpaper: null,
    banner: null,
  });

  useEffect(() => {
    fetchMilestones();
  }, [fetchMilestones]);

  const allMilestones = milestones;

  const frameMilestones = allMilestones.filter((m) => m.reward?.type === "FRAME");
  const currentUserId = user?.id || user?.user_id;
  const rawEquippedFrameId = user && 'current_frame_id' in user
    ? user.current_frame_id
    : (
    user?.current_frame_id ||
    user?.profile_frame_id ||
    user?.user_metadata?.profile_frame_id ||
    (currentUserId ? localStorage.getItem(`profile_frame_id_${currentUserId}`) : null) ||
    localStorage.getItem("profile_frame_id") ||
    null);

  const foundFrame = allMilestones.find(
    (m) =>
      m.reward_item_id === rawEquippedFrameId ||
      m.reward?.id === rawEquippedFrameId,
  );

  // Enforce: only claimed frames can be actively equipped
  const equippedFrame = foundFrame && foundFrame.status === "CLAIMED" ? foundFrame : null;
  const equippedFrameId = equippedFrame
    ? (equippedFrame.reward_item_id || equippedFrame.reward?.id)
    : (user?.current_frame?.id && String(user.current_frame.id) === String(rawEquippedFrameId) ? rawEquippedFrameId : null);

  const claimedWallpapers = allMilestones.filter(
    (m) => m.status === "CLAIMED" && m.reward?.type === "WALLPAPER",
  );
  const currentAvatarSrc =
    media.avatar?.url ||
    user?.avatar_url ||
    `https://ui-avatars.com/api/?name=${encodeURIComponent(user?.display_name || user?.username || "User")}&background=1e293b&color=38bdf8`;

  // Equipping a claimed reward applies immediately (own toast, own API call)
  // rather than going through the big form's "บันทึกข้อมูล" button — same
  // instant-apply pattern the Achievements page already uses for claiming.
  const applyFrameLocally = (frameId, frame) => {
    const userId = user?.id || user?.user_id;
    if (frameId) {
      if (userId) localStorage.setItem(`profile_frame_id_${userId}`, frameId);
      localStorage.setItem('profile_frame_id', frameId);
    } else {
      if (userId) localStorage.removeItem(`profile_frame_id_${userId}`);
      localStorage.removeItem('profile_frame_id');
    }
    login({ ...user, current_frame_id: frameId, profile_frame_id: frameId, current_frame: frame,
      user_metadata: { ...user?.user_metadata, profile_frame_id: frameId } });
  };

  const handleEquipFrame = async (frameId) => {
    try {
      const selectedMilestone = allMilestones.find(
        (m) =>
          m.reward_item_id === frameId ||
          m.reward?.id === frameId,
      );
      if (frameId && selectedMilestone?.status !== "CLAIMED") {
        throw new Error("กรอบนี้ยังไม่ได้ปลดล็อกในบัญชีของคุณ");
      }
      const previousFrameId = user?.current_frame_id || user?.profile_frame_id || user?.user_metadata?.profile_frame_id || null;
      const previousFrame = user?.current_frame || null;
      const requestVersion = ++frameRequestVersion.current;
      applyFrameLocally(frameId, frameId ? selectedMilestone?.reward_item || selectedMilestone?.reward : null);
      const toastId = toast.success(frameId ? 'เปลี่ยนกรอบโปรไฟล์แล้ว' : 'นำกรอบโปรไฟล์ออกแล้ว');
      const [authResult, equipResult] = await Promise.allSettled([
        supabase.auth.updateUser({ data: { profile_frame_id: frameId || null } }),
        profileService.equipItem(frameId || null, 'FRAME'),
      ]);
      if (requestVersion !== frameRequestVersion.current) return;
      if (equipResult.status === 'rejected' || equipResult.value?.success === false) {
        toast.dismiss(toastId);
        applyFrameLocally(previousFrameId, previousFrame);
        try {
          const rollbackResult = await supabase.auth.updateUser({ data: { profile_frame_id: previousFrameId } });
          if (rollbackResult.error) console.warn('Unable to restore frame metadata:', rollbackResult.error);
        }
        catch (rollbackError) { console.warn('Unable to restore frame metadata:', rollbackError); }
        toast.error('ไม่สามารถบันทึกกรอบได้ ระบบคืนค่ากรอบเดิมแล้ว');
        return;
      }
      if (authResult.status === 'rejected' || authResult.value?.error) console.warn('Unable to sync frame metadata:', authResult.status === 'rejected' ? authResult.reason : authResult.value.error);
    } catch (error) {
      console.error("Error equipping frame:", error);
      toast.error(error.response?.data?.message || "ไม่สามารถเปลี่ยนกรอบโปรไฟล์ได้ กรุณาลองใหม่");
    }
  };

  const handleEquipWallpaper = async (url) => {
    const userId = user?.id || user?.user_id;
    try {
      if (url) {
        if (userId) localStorage.setItem(`wallpaper_url_${userId}`, url);
        localStorage.setItem("wallpaper_url", url);
      } else {
        if (userId) localStorage.removeItem(`wallpaper_url_${userId}`);
        localStorage.removeItem("wallpaper_url");
      }

      try {
        await supabase.auth.updateUser({
          data: { wallpaper_url: url || null },
        });
      } catch (sbErr) {
        console.warn("Supabase updateUser wallpaper notice:", sbErr);
      }

      try {
        await profileService.updateProfile(userId, {
          wallpaper_url: url,
        });
      } catch (apiErr) {
        console.warn("Backend updateProfile wallpaper notice:", apiErr);
      }

      login({
        ...user,
        user_metadata: { ...user?.user_metadata, wallpaper_url: url },
      });
      toast.success("เปลี่ยนภาพพื้นหลังแล้ว");
    } catch (error) {
      console.error("Error equipping wallpaper:", error);
      toast.error("เกิดข้อผิดพลาด กรุณาลองใหม่");
    }
  };

  useEffect(() => {
    if (!user) return;
    const meta = user.user_metadata || {};
    setFormData({
      username: user.username || user.display_name || user.name || "",
      bio: user.bio || "",
      education_level: user.education_level || "HIGH_SCHOOL",
      // Preserve appearance settings while standardizing avatar shape.
      theme_settings: { ...DEFAULT_THEME, ...(meta.theme_settings || {}), avatarShape: 'circle' },
    });
  }, [user]);

  const handleFileChange = (e, type) => {
    const file = e.target.files[0];
    if (!file) return;

    const maxSize = type === "wallpaper" ? 25 * 1024 * 1024 : 8 * 1024 * 1024;
    if (file.size > maxSize) {
      toast.error(`ไฟล์ต้องมีขนาดไม่เกิน ${type === "wallpaper" ? 25 : 8} MB`);
      return;
    }

    if (type === "wallpaper") {
      const isVideo = file.type.startsWith("video/mp4");
      const isImage = file.type.startsWith("image/");
      if (!isVideo && !isImage) {
        toast.error("วอลเปเปอร์ต้องเป็นรูปภาพหรือวิดีโอ MP4 เท่านั้น");
        return;
      }
    }

    const url = URL.createObjectURL(file);
    setMedia((prev) => ({ ...prev, [type]: { file, url, type: file.type, remove: false } }));
  };

  const handleRemoveMedia = (type) => {
    let file;
    if (type === "wallpaper") {
      file = generateGradientFile("default_wallpaper.png", 1920, 1080, "#ffffff", "#ffffff");
    } else if (type === "banner") {
      file = generateGradientFile("blank_banner.png", 1, 1, "transparent", "transparent");
    } else {
      file = generateGradientFile(`default_${type}.png`, 400, 400, "#94a3b8", "#475569");
    }
    const url = URL.createObjectURL(file);

    setMedia((prev) => ({ 
      ...prev, 
      [type]: { 
        file, 
        url, 
        type: file.type, 
        remove: true 
      } 
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const trimmedUsername = (formData.username || "").trim();
    if (!trimmedUsername) {
      toast.error("กรุณากรอกชื่อผู้ใช้ (Username)");
      return;
    }
    setIsSaving(true);
    try {
      const updatePayload = {
        ...formData,
        username: trimmedUsername,
        nickname: trimmedUsername,
        avatarFile: media.avatar?.file,
        wallpaperFile: media.wallpaper?.file,
        bannerFile: media.banner?.file,
      };

      const response = await profileService.updateProfile(
        user.id || user.user_id,
        updatePayload,
      );

      if (response && response.success !== false) {
        const resData = response.data || {};
        const newAvatarUrl = resData.avatar_url || resData.profile_image || (media.avatar?.url && !media.avatar?.remove ? media.avatar.url : user?.avatar_url);

        // Sync theme_settings, username, display_name, avatar_url to Supabase auth metadata so they persist after refresh
        try {
          await supabase.auth.updateUser({
            data: {
              username: trimmedUsername,
              display_name: trimmedUsername,
              avatar_url: newAvatarUrl || null,
              theme_settings: formData.theme_settings,
            },
          });
        } catch (sbErr) {
          console.warn("Supabase updateUser metadata notice:", sbErr);
        }

        login({
          ...user,
          username: resData.username || trimmedUsername,
          display_name: trimmedUsername,
          bio: resData.bio || formData.bio,
          education_level: resData.education_level || formData.education_level,
          avatar_url: newAvatarUrl,
          avatar: newAvatarUrl,
          profile_image: newAvatarUrl,
          user_metadata: {
            ...user.user_metadata,
            username: trimmedUsername,
            display_name: trimmedUsername,
            avatar_url: newAvatarUrl,
            theme_settings: formData.theme_settings,
            profile_frame_id: equippedFrameId,
            wallpaper_url:
              resData.user_metadata?.wallpaper_url ||
              resData.wallpaper ||
              user.user_metadata?.wallpaper_url,
            banner_url:
              resData.user_metadata?.banner_url ||
              resData.profile_banner ||
              user.user_metadata?.banner_url,
          },
        });
        toast.success("บันทึกข้อมูลสำเร็จ");
      } else {
        throw new Error(response?.message || "การอัปเดตล้มเหลว");
      }
    } catch (error) {
      console.error("Update profile error:", error);
      const errMsg =
        error?.response?.data?.message ||
        error?.message ||
        "เกิดข้อผิดพลาดในการบันทึกข้อมูล";
      toast.error(errMsg);
    } finally {
      setIsSaving(false);
    }
  };

  // Merge unsaved local edits (avatar/wallpaper uploads, frame equip is
  // already live in `user` via handleEquipFrame) into the user object the
  // preview reads, so it reflects everything on this page in real time.
  const previewUser = {
    ...user,
    avatar_url: media.avatar?.url || user?.avatar_url,
    user_metadata: {
      ...user?.user_metadata,
      profile_frame_id: equippedFrameId,
      wallpaper_url: media.wallpaper?.remove
        ? null
        : (media.wallpaper?.url || user?.user_metadata?.wallpaper_url),
      banner_url: media.banner?.remove
        ? null
        : (media.banner?.url || user?.user_metadata?.banner_url),
    },
  };
  const previewFormData = {
    theme_settings: formData.theme_settings,
    username: formData.username,
    nickname: formData.username,
    bio: formData.bio,
    tags: formData.tags,
  };

  return (
    <div className="max-w-6xl">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-800">โปรไฟล์</h1>
          <p className="text-slate-500 mt-1">ข้อมูลพื้นฐานและรูปภาพของคุณ</p>
        </div>
        <button
          type="submit"
          form="settings-profile-form"
          disabled={isSaving}
          className="px-6 py-2.5 rounded-xl font-bold text-white bg-primary hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed shadow-sm transition-all shrink-0"
        >
          {isSaving ? "กำลังบันทึก..." : "บันทึกข้อมูล"}
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[1fr_340px] gap-8 items-start">
        <form
          id="settings-profile-form"
          onSubmit={handleSubmit}
          className="bg-white rounded-3xl shadow-sm border border-slate-100 p-6 sm:p-10 space-y-10"
        >
          {/* Media Section */}
          <div className="space-y-4">
            <h3 className="font-bold text-slate-800 text-lg">รูปโปรไฟล์</h3>
            <p className="text-sm text-slate-500 -mt-2">
              อัปโหลดรูป และเลือกรูปทรง avatar
            </p>
            <div className="flex items-center gap-5 pt-2">
              <AvatarWithFrame
                avatarSrc={media.avatar?.url || user?.avatar_url}
                frameSrc={equippedFrame?.reward?.previewUrl || user?.current_frame?.image_url || user?.current_frame?.previewUrl}
                frameAlt={equippedFrame?.reward?.name || ''}
                sizeClass="h-24 w-24"
                className="border-4 border-slate-50 bg-slate-100 shadow-sm"
                avatarFallback={<div className="flex h-full w-full items-center justify-center text-slate-400"><ImageIcon className="h-8 w-8" /></div>}
              />
              <div className="flex flex-col gap-2">
                <label className="cursor-pointer px-5 py-2.5 bg-primary hover:bg-blue-600 rounded-xl text-sm font-bold text-white transition-colors flex items-center gap-2 shadow-sm">
                  <Upload className="h-4 w-4" /> แก้ไขรูปโปรไฟล์
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={(e) => handleFileChange(e, "avatar")}
                  />
                </label>
                <button
                  type="button"
                  onClick={() => setIsFrameModalOpen(true)}
                  className="px-5 py-2.5 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-xl text-sm font-bold text-slate-700 transition-colors flex items-center gap-2 shadow-sm"
                >
                  <Sparkles className="h-4 w-4" /> เลือกกรอบรูปภาพ
                </button>
              </div>
            </div>

          </div>

          {/* Wallpaper / Banner */}
          <div className="space-y-4">
            <h3 className="font-bold text-slate-800 text-lg border-t border-slate-100 pt-8">
              พื้นหลัง &amp; แบนเนอร์
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-8">
              <div className="flex flex-col gap-3">
                <label className="text-sm font-semibold text-slate-600">
                  ภาพพื้นหลัง
                </label>
                <div className="relative h-32 w-full rounded-2xl bg-slate-100 overflow-hidden border border-slate-200 flex items-center justify-center group shadow-sm">
                  {!media.wallpaper?.remove &&
                  (media.wallpaper?.url ||
                  user?.user_metadata?.wallpaper_url) ? (
                    media.wallpaper?.type?.startsWith("video") ||
                    user?.user_metadata?.wallpaper_url?.endsWith(".mp4") ? (
                      <video
                        src={
                          media.wallpaper?.url ||
                          user?.user_metadata?.wallpaper_url
                        }
                        className="w-full h-full object-cover"
                        autoPlay
                        muted
                        loop
                      />
                    ) : (
                      <img
                        src={
                          media.wallpaper?.url ||
                          user?.user_metadata?.wallpaper_url
                        }
                        alt="Wallpaper"
                        className="w-full h-full object-cover"
                      />
                    )
                  ) : (
                    <div className="text-center">
                      <ImageIcon className="h-6 w-6 text-slate-400 mx-auto mb-1" />
                      <span className="text-slate-500 text-xs font-medium">
                        รูป/วิดีโอ MP4 (ไม่เกิน 25MB)
                      </span>
                    </div>
                  )}
                  <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-all flex items-center justify-center backdrop-blur-sm gap-3">
                    <label className="cursor-pointer px-4 py-2 bg-white rounded-xl text-sm font-bold text-slate-800 shadow-lg flex items-center gap-2 hover:bg-slate-50 transition-colors">
                      <Upload className="h-4 w-4" /> เปลี่ยนพื้นหลัง
                      <input
                        type="file"
                        accept="image/*,video/mp4"
                        className="hidden"
                        onChange={(e) => handleFileChange(e, "wallpaper")}
                      />
                    </label>
                    {(!media.wallpaper?.remove && (media.wallpaper?.url || user?.user_metadata?.wallpaper_url)) && (
                      <button
                        type="button"
                        onClick={() => handleRemoveMedia("wallpaper")}
                        className="px-4 py-2 bg-white/20 backdrop-blur-md rounded-xl text-sm font-bold text-white shadow-lg flex items-center gap-2 hover:bg-white/30 transition-colors border border-white/30"
                      >
                        <RotateCcw className="h-4 w-4" /> ค่าเริ่มต้น
                      </button>
                    )}
                  </div>
                </div>
                {claimedWallpapers.length > 0 && (
                  <div>
                    <p className="text-xs font-semibold text-slate-500 mb-2">
                      หรือเลือกจากรางวัลที่ปลดล็อก
                    </p>
                    <div className="flex gap-2 flex-wrap">
                      {claimedWallpapers.map((m) => {
                        const selected =
                          user?.user_metadata?.wallpaper_url ===
                          m.reward.previewUrl;
                        return (
                          <button
                            key={m.id}
                            type="button"
                            title={m.reward.name}
                            onClick={() =>
                              handleEquipWallpaper(m.reward.previewUrl)
                            }
                            className={`h-12 w-16 rounded-lg overflow-hidden border-2 shrink-0 ${selected ? "border-primary" : "border-transparent"}`}
                          >
                            <img
                              src={m.reward.previewUrl}
                              alt={m.reward.name}
                              className="w-full h-full object-cover"
                            />
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>

              <div className="flex flex-col gap-3">
                <label className="text-sm font-semibold text-slate-600">
                  แบนเนอร์
                </label>
                <div className="relative h-32 w-full rounded-2xl bg-slate-100 overflow-hidden border border-slate-200 flex items-center justify-center group shadow-sm">
                  {media.banner?.remove ? (
                    <div className="text-center">
                      <ImageIcon className="h-6 w-6 text-slate-400 mx-auto mb-1" />
                      <span className="text-slate-500 text-xs font-medium">
                        รูปภาพ (ไม่เกิน 8MB)
                      </span>
                    </div>
                  ) : media.banner?.url || user?.user_metadata?.banner_url ? (
                    <img
                      src={media.banner?.url || user?.user_metadata?.banner_url}
                      alt="Banner"
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="text-center">
                      <ImageIcon className="h-6 w-6 text-slate-400 mx-auto mb-1" />
                      <span className="text-slate-500 text-xs font-medium">
                        รูปภาพ (ไม่เกิน 8MB)
                      </span>
                    </div>
                  )}
                  <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-all flex items-center justify-center backdrop-blur-sm gap-3">
                    <label className="cursor-pointer px-4 py-2 bg-white rounded-xl text-sm font-bold text-slate-800 shadow-lg flex items-center gap-2 hover:bg-slate-50 transition-colors">
                      <Upload className="h-4 w-4" /> เปลี่ยนแบนเนอร์
                      <input
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={(e) => handleFileChange(e, "banner")}
                      />
                    </label>
                    {(!media.banner?.remove && (media.banner?.url || user?.user_metadata?.banner_url)) && (
                      <button
                        type="button"
                        onClick={() => handleRemoveMedia("banner")}
                        className="px-4 py-2 bg-red-500 rounded-xl text-sm font-bold text-white shadow-lg flex items-center gap-2 hover:bg-red-600 transition-colors"
                      >
                        <Trash2 className="h-4 w-4" /> นำออก
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* General Info */}
          <div className="space-y-5">
            <h3 className="font-bold text-slate-800 text-lg border-t border-slate-100 pt-8">
              ข้อมูลพื้นฐาน
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div>
                <label className="block text-sm font-semibold text-slate-600 mb-2">
                  ชื่อผู้ใช้ (Username)
                </label>
                <input
                  type="text"
                  value={formData.username}
                  onChange={(e) =>
                    setFormData({ ...formData, username: e.target.value })
                  }
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-4 focus:ring-primary/10 focus:border-primary transition-all text-slate-800 font-medium"
                  placeholder="กรอกชื่อผู้ใช้ของคุณ"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-600 mb-2">
                  ระดับชั้นการศึกษา
                </label>
                <select
                  value={formData.education_level}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      education_level: e.target.value,
                    })
                  }
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-4 focus:ring-primary/10 focus:border-primary transition-all text-slate-800 font-medium"
                >
                  <option value="MIDDLE_SCHOOL">มัธยมศึกษาตอนต้น</option>
                  <option value="HIGH_SCHOOL">มัธยมศึกษาตอนปลาย</option>
                  <option value="UNIVERSITY">มหาวิทยาลัย</option>
                  <option value="OTHER">อื่นๆ</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-sm font-semibold text-slate-600 mb-2">
                Bio
              </label>
              <textarea
                value={formData.bio}
                onChange={(e) =>
                  setFormData({ ...formData, bio: e.target.value })
                }
                rows={4}
                maxLength={200}
                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-4 focus:ring-primary/10 focus:border-primary transition-all text-slate-800 font-medium resize-none"
                placeholder="เขียนอะไรสักอย่างเกี่ยวกับตัวเอง..."
              />
              <p className="text-xs text-slate-400 text-right mt-1">
                {formData.bio.length}/200
              </p>
            </div>
          </div>
        </form>

        <div className="hidden lg:block sticky top-10">
          <ProfilePreview user={previewUser} formData={previewFormData} />
        </div>
      </div>

      <FrameDecorationModal
        isOpen={isFrameModalOpen}
        onClose={() => setIsFrameModalOpen(false)}
        frames={frameMilestones}
        currentFrameId={equippedFrameId ?? null}
        avatarSrc={currentAvatarSrc}
        onSelect={handleEquipFrame}
      />
    </div>
  );
}
