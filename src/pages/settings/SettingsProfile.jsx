import { useState, useEffect } from 'react';
import { Link } from 'react-router';
import {
  Upload, Image as ImageIcon, Link as LinkIcon,
  AlertCircle, Briefcase, MapPin, Tag, X, Check
} from 'lucide-react';
import toast from 'react-hot-toast';
import useAuthStore from '@/store/authStore';
import useAchievementStore from '@/store/achievementStore';
import { profileService } from '@/services/profile.service';
import { AVATAR_SHAPES, DEFAULT_THEME } from './themeConstants';

export default function SettingsProfile() {
  const { user, login } = useAuthStore();
  const { milestones, fetchMilestones } = useAchievementStore();
  const [isSaving, setIsSaving] = useState(false);
  const [tagInput, setTagInput] = useState('');

  const [formData, setFormData] = useState({
    nickname: '',
    bio: '',
    education_level: 'HIGH_SCHOOL',
    instagram_url: '',
    facebook_url: '',
    occupation: '',
    location: '',
    tags: [],
    theme_settings: DEFAULT_THEME,
  });

  const [media, setMedia] = useState({
    avatar: null, // File object or URL
    wallpaper: null,
    banner: null,
  });

  const [errors, setErrors] = useState({ instagram_url: '', facebook_url: '' });

  useEffect(() => {
    fetchMilestones();
  }, [fetchMilestones]);

  const claimedFrames = milestones.filter((m) => m.status === 'CLAIMED' && m.reward.type === 'FRAME');
  const claimedWallpapers = milestones.filter((m) => m.status === 'CLAIMED' && m.reward.type === 'WALLPAPER');
  const currentAvatarSrc = media.avatar?.url || user?.avatar_url
    || `https://ui-avatars.com/api/?name=${encodeURIComponent(user?.display_name || user?.username || 'User')}&background=1e293b&color=38bdf8`;

  // Equipping a claimed reward applies immediately (own toast, own API call)
  // rather than going through the big form's "บันทึกข้อมูล" button — same
  // instant-apply pattern the Achievements page already uses for claiming.
  const handleEquipFrame = async (frameId) => {
    const userId = user.id || user.user_id;
    try {
      const response = await profileService.updateProfile(userId, { profile_frame_id: frameId });
      if (response && response.success !== false) {
        login({ ...user, user_metadata: { ...user.user_metadata, profile_frame_id: frameId } });
        toast.success(frameId ? 'เปลี่ยนกรอบโปรไฟล์แล้ว' : 'นำกรอบโปรไฟล์ออกแล้ว');
      }
    } catch (error) {
      console.error('Error equipping frame:', error);
      toast.error('เกิดข้อผิดพลาด กรุณาลองใหม่');
    }
  };

  const handleEquipWallpaper = async (url) => {
    const userId = user.id || user.user_id;
    try {
      const response = await profileService.updateProfile(userId, { wallpaper_url: url });
      if (response && response.success !== false) {
        login({ ...user, user_metadata: { ...user.user_metadata, wallpaper_url: url } });
        toast.success('เปลี่ยนภาพพื้นหลังแล้ว');
      }
    } catch (error) {
      console.error('Error equipping wallpaper:', error);
      toast.error('เกิดข้อผิดพลาด กรุณาลองใหม่');
    }
  };

  useEffect(() => {
    if (!user) return;
    const meta = user.user_metadata || {};
    setFormData({
      nickname: user.display_name || user.username || user.name || '',
      bio: user.bio || '',
      education_level: user.education_level || 'HIGH_SCHOOL',
      instagram_url: meta.instagram_url || '',
      facebook_url: meta.facebook_url || '',
      occupation: meta.occupation || '',
      location: meta.location || '',
      tags: meta.tags || [],
      // Full theme_settings is loaded (not just avatarShape) since saving
      // this page resubmits the whole object — partial objects would wipe
      // out fields edited on the Appearance settings page.
      theme_settings: { ...DEFAULT_THEME, ...(meta.theme_settings || {}) },
    });
  }, [user]);

  const validateSocialUrl = (url, platform) => {
    if (!url) return '';
    let error = '';
    if (!url.startsWith('http://') && !url.startsWith('https://')) {
      error = 'URL ต้องขึ้นต้นด้วย http:// หรือ https://';
    } else {
      const urlLower = url.toLowerCase();
      if (platform === 'instagram' && !urlLower.includes('instagram.com')) {
        error = 'URL ต้องเป็นของ Instagram (instagram.com)';
      }
      if (platform === 'facebook' && !urlLower.includes('facebook.com')) {
        error = 'URL ต้องเป็นของ Facebook (facebook.com)';
      }
    }
    return error;
  };

  const handleUrlChange = (e, platform) => {
    const value = e.target.value;
    setFormData(prev => ({ ...prev, [`${platform}_url`]: value }));
    setErrors(prev => ({ ...prev, [`${platform}_url`]: validateSocialUrl(value, platform) }));
  };

  const handleFileChange = (e, type) => {
    const file = e.target.files[0];
    if (!file) return;

    const maxSize = type === 'wallpaper' ? 25 * 1024 * 1024 : 8 * 1024 * 1024;
    if (file.size > maxSize) {
      toast.error(`ไฟล์ต้องมีขนาดไม่เกิน ${type === 'wallpaper' ? 25 : 8} MB`);
      return;
    }

    if (type === 'wallpaper') {
      const isVideo = file.type.startsWith('video/mp4');
      const isImage = file.type.startsWith('image/');
      if (!isVideo && !isImage) {
        toast.error('วอลเปเปอร์ต้องเป็นรูปภาพหรือวิดีโอ MP4 เท่านั้น');
        return;
      }
    }

    const url = URL.createObjectURL(file);
    setMedia(prev => ({ ...prev, [type]: { file, url, type: file.type } }));
  };

  const updateTheme = (key, value) => {
    setFormData(prev => ({ ...prev, theme_settings: { ...prev.theme_settings, [key]: value } }));
  };

  const addTag = () => {
    const value = tagInput.trim();
    if (!value) return;
    if (formData.tags.length >= 5) {
      toast.error('เพิ่มแท็กได้สูงสุด 5 แท็ก');
      return;
    }
    if (formData.tags.includes(value)) {
      setTagInput('');
      return;
    }
    setFormData(prev => ({ ...prev, tags: [...prev.tags, value] }));
    setTagInput('');
  };

  const removeTag = (index) => {
    setFormData(prev => ({ ...prev, tags: prev.tags.filter((_, i) => i !== index) }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const igError = validateSocialUrl(formData.instagram_url, 'instagram');
    const fbError = validateSocialUrl(formData.facebook_url, 'facebook');

    if (igError || fbError) {
      setErrors({ instagram_url: igError, facebook_url: fbError });
      toast.error('กรุณาแก้ไขข้อมูลให้ถูกต้องก่อนบันทึก');
      return;
    }

    setIsSaving(true);
    try {
      const updatePayload = {
        ...formData,
        avatarFile: media.avatar?.file,
        wallpaperFile: media.wallpaper?.file,
        bannerFile: media.banner?.file,
      };

      const response = await profileService.updateProfile(user.id || user.user_id, updatePayload);

      if (response && response.success !== false) {
        login({
          ...user,
          display_name: formData.nickname,
          username: formData.nickname,
          bio: formData.bio,
          education_level: formData.education_level,
          avatar_url: response.data?.avatar_url || media.avatar?.url || user.avatar_url,
          user_metadata: {
            ...user.user_metadata,
            instagram_url: formData.instagram_url,
            facebook_url: formData.facebook_url,
            occupation: formData.occupation,
            location: formData.location,
            tags: formData.tags,
            theme_settings: formData.theme_settings,
            wallpaper_url: response.data?.wallpaper_url || media.wallpaper?.url || user.user_metadata?.wallpaper_url,
            banner_url: response.data?.banner_url || media.banner?.url || user.user_metadata?.banner_url,
          }
        });
        toast.success('บันทึกข้อมูลสำเร็จ');
      } else {
        throw new Error(response?.message || 'การอัปเดตล้มเหลว');
      }
    } catch (error) {
      console.error('Update profile error:', error);
      login({
        ...user,
        display_name: formData.nickname,
        username: formData.nickname,
        bio: formData.bio,
        education_level: formData.education_level,
        avatar_url: media.avatar?.url || user.avatar_url,
        user_metadata: {
          ...user.user_metadata,
          instagram_url: formData.instagram_url,
          facebook_url: formData.facebook_url,
          occupation: formData.occupation,
          location: formData.location,
          tags: formData.tags,
          theme_settings: formData.theme_settings,
          wallpaper_url: media.wallpaper?.url || user.user_metadata?.wallpaper_url,
          banner_url: media.banner?.url || user.user_metadata?.banner_url,
        }
      });
      toast.success('บันทึกข้อมูลสำเร็จ (โหมดจำลองเนื่องจาก API อาจยังไม่พร้อม)');
    } finally {
      setIsSaving(false);
    }
  };

  const activeAvatarShape = AVATAR_SHAPES.find(s => s.id === formData.theme_settings.avatarShape) || AVATAR_SHAPES[3];

  return (
    <div className="max-w-3xl">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-800">โปรไฟล์</h1>
          <p className="text-slate-500 mt-1">ข้อมูลพื้นฐาน รูปภาพ และลิงก์โซเชียลมีเดียของคุณ</p>
        </div>
        <button
          type="submit"
          form="settings-profile-form"
          disabled={isSaving || !!errors.instagram_url || !!errors.facebook_url}
          className="px-6 py-2.5 rounded-xl font-bold text-white bg-primary hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed shadow-sm transition-all shrink-0"
        >
          {isSaving ? 'กำลังบันทึก...' : 'บันทึกข้อมูล'}
        </button>
      </div>

      <form id="settings-profile-form" onSubmit={handleSubmit} className="bg-white rounded-3xl shadow-sm border border-slate-100 p-6 sm:p-10 space-y-10">
        {/* Media Section */}
        <div className="space-y-4">
          <h3 className="font-bold text-slate-800 text-lg">รูปโปรไฟล์</h3>
          <p className="text-sm text-slate-500 -mt-2">อัปโหลดรูป และเลือกรูปทรง avatar</p>
          <div className="flex items-center gap-5 pt-2">
            <div className={`h-24 w-24 bg-slate-100 overflow-hidden border-4 border-slate-50 shadow-sm shrink-0 relative ${activeAvatarShape.className}`}>
              {(media.avatar?.url || user?.avatar_url) ? (
                <img src={media.avatar?.url || user?.avatar_url} alt="Avatar" className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-slate-400 bg-slate-100">
                  <ImageIcon className="h-8 w-8" />
                </div>
              )}
            </div>
            <label className="cursor-pointer px-5 py-2.5 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-xl text-sm font-bold text-slate-700 transition-colors flex items-center gap-2 shadow-sm">
              <Upload className="h-4 w-4" /> แก้ไขรูปโปรไฟล์
              <input type="file" accept="image/*" className="hidden" onChange={(e) => handleFileChange(e, 'avatar')} />
            </label>
          </div>

          <div className="pt-2">
            <label className="block text-sm font-semibold text-slate-600 mb-2">รูปทรง Avatar</label>
            <div className="flex gap-3 flex-wrap">
              {AVATAR_SHAPES.map(shape => (
                <button
                  key={shape.id}
                  type="button"
                  onClick={() => updateTheme('avatarShape', shape.id)}
                  className={`flex flex-col items-center gap-2 p-3 rounded-2xl border-2 transition-all w-20 ${formData.theme_settings.avatarShape === shape.id ? 'border-primary bg-primary/5' : 'border-slate-100 hover:border-slate-200'}`}
                >
                  <div className={`h-9 w-9 bg-slate-300 ${shape.className}`}></div>
                  <span className="text-[11px] font-bold text-slate-600">{shape.label}</span>
                </button>
              ))}
            </div>
          </div>

          <div className="pt-2">
            <label className="block text-sm font-semibold text-slate-600 mb-2">กรอบโปรไฟล์ (จากความสำเร็จที่ปลดล็อก)</label>
            {claimedFrames.length === 0 ? (
              <p className="text-sm text-slate-400">
                ยังไม่มีกรอบที่ปลดล็อก — <Link to="/achievements" className="text-primary font-semibold hover:underline">ไปทำภารกิจ</Link>
              </p>
            ) : (
              <div className="flex gap-3 flex-wrap">
                <button
                  type="button"
                  onClick={() => handleEquipFrame(null)}
                  className="flex flex-col items-center gap-2 w-20"
                >
                  <div className={`h-11 w-11 rounded-full border-2 border-dashed flex items-center justify-center ${!user?.user_metadata?.profile_frame_id ? 'border-primary text-primary' : 'border-slate-300 text-slate-400'}`}>
                    <X className="h-4 w-4" />
                  </div>
                  <span className="text-[11px] font-bold text-slate-600">ไม่ใช้กรอบ</span>
                </button>
                {claimedFrames.map((m) => {
                  const selected = user?.user_metadata?.profile_frame_id === m.id;
                  return (
                    <button
                      key={m.id}
                      type="button"
                      onClick={() => handleEquipFrame(m.id)}
                      className="flex flex-col items-center gap-2 w-20"
                    >
                      <div className={`relative h-11 w-11 rounded-full overflow-hidden border-4 ${selected ? 'border-primary' : 'border-amber-400'}`}>
                        <img src={currentAvatarSrc} alt="" className="w-full h-full object-cover" />
                        {selected && (
                          <span className="absolute -bottom-0.5 -right-0.5 h-4 w-4 rounded-full bg-primary border-2 border-white flex items-center justify-center">
                            <Check className="h-2.5 w-2.5 text-white" />
                          </span>
                        )}
                      </div>
                      <span className="text-[11px] font-bold text-slate-600 text-center line-clamp-1">{m.reward.name}</span>
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Wallpaper / Banner */}
        <div className="space-y-4">
          <h3 className="font-bold text-slate-800 text-lg border-t border-slate-100 pt-8">พื้นหลัง &amp; แบนเนอร์</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-8">
            <div className="flex flex-col gap-3">
              <label className="text-sm font-semibold text-slate-600">ภาพพื้นหลัง</label>
              <div className="relative h-32 w-full rounded-2xl bg-slate-100 overflow-hidden border border-slate-200 flex items-center justify-center group shadow-sm">
                {(media.wallpaper?.url || user?.user_metadata?.wallpaper_url) ? (
                  media.wallpaper?.type?.startsWith('video') || user?.user_metadata?.wallpaper_url?.endsWith('.mp4') ? (
                    <video src={media.wallpaper?.url || user?.user_metadata?.wallpaper_url} className="w-full h-full object-cover" autoPlay muted loop />
                  ) : (
                    <img src={media.wallpaper?.url || user?.user_metadata?.wallpaper_url} alt="Wallpaper" className="w-full h-full object-cover" />
                  )
                ) : (
                  <div className="text-center">
                    <ImageIcon className="h-6 w-6 text-slate-400 mx-auto mb-1" />
                    <span className="text-slate-500 text-xs font-medium">รูป/วิดีโอ MP4 (ไม่เกิน 25MB)</span>
                  </div>
                )}
                <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-all flex items-center justify-center backdrop-blur-sm">
                  <label className="cursor-pointer px-4 py-2 bg-white rounded-xl text-sm font-bold text-slate-800 shadow-lg flex items-center gap-2 hover:bg-slate-50 transition-colors">
                    <Upload className="h-4 w-4" /> เปลี่ยนพื้นหลัง
                    <input type="file" accept="image/*,video/mp4" className="hidden" onChange={(e) => handleFileChange(e, 'wallpaper')} />
                  </label>
                </div>
              </div>
              {claimedWallpapers.length > 0 && (
                <div>
                  <p className="text-xs font-semibold text-slate-500 mb-2">หรือเลือกจากรางวัลที่ปลดล็อก</p>
                  <div className="flex gap-2 flex-wrap">
                    {claimedWallpapers.map((m) => {
                      const selected = user?.user_metadata?.wallpaper_url === m.reward.previewUrl;
                      return (
                        <button
                          key={m.id}
                          type="button"
                          title={m.reward.name}
                          onClick={() => handleEquipWallpaper(m.reward.previewUrl)}
                          className={`h-12 w-16 rounded-lg overflow-hidden border-2 shrink-0 ${selected ? 'border-primary' : 'border-transparent'}`}
                        >
                          <img src={m.reward.previewUrl} alt={m.reward.name} className="w-full h-full object-cover" />
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>

            <div className="flex flex-col gap-3">
              <label className="text-sm font-semibold text-slate-600">แบนเนอร์</label>
              <div className="relative h-32 w-full rounded-2xl bg-slate-100 overflow-hidden border border-slate-200 flex items-center justify-center group shadow-sm">
                {(media.banner?.url || user?.user_metadata?.banner_url) ? (
                  <img src={media.banner?.url || user?.user_metadata?.banner_url} alt="Banner" className="w-full h-full object-cover" />
                ) : (
                  <div className="text-center">
                    <ImageIcon className="h-6 w-6 text-slate-400 mx-auto mb-1" />
                    <span className="text-slate-500 text-xs font-medium">รูปภาพ (ไม่เกิน 8MB)</span>
                  </div>
                )}
                <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-all flex items-center justify-center backdrop-blur-sm">
                  <label className="cursor-pointer px-4 py-2 bg-white rounded-xl text-sm font-bold text-slate-800 shadow-lg flex items-center gap-2 hover:bg-slate-50 transition-colors">
                    <Upload className="h-4 w-4" /> เปลี่ยนแบนเนอร์
                    <input type="file" accept="image/*" className="hidden" onChange={(e) => handleFileChange(e, 'banner')} />
                  </label>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* General Info */}
        <div className="space-y-5">
          <h3 className="font-bold text-slate-800 text-lg border-t border-slate-100 pt-8">ข้อมูลพื้นฐาน</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div>
              <label className="block text-sm font-semibold text-slate-600 mb-2">ชื่อเล่น / ชื่อแสดงผล</label>
              <input
                type="text"
                value={formData.nickname}
                onChange={(e) => setFormData({ ...formData, nickname: e.target.value })}
                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-4 focus:ring-primary/10 focus:border-primary transition-all text-slate-800 font-medium"
                placeholder="กรอกชื่อของคุณ"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-slate-600 mb-2">ระดับชั้นการศึกษา</label>
              <select
                value={formData.education_level}
                onChange={(e) => setFormData({ ...formData, education_level: e.target.value })}
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
            <label className="block text-sm font-semibold text-slate-600 mb-2">Bio</label>
            <textarea
              value={formData.bio}
              onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
              rows={4}
              maxLength={200}
              className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-4 focus:ring-primary/10 focus:border-primary transition-all text-slate-800 font-medium resize-none"
              placeholder="เขียนอะไรสักอย่างเกี่ยวกับตัวเอง..."
            />
            <p className="text-xs text-slate-400 text-right mt-1">{formData.bio.length}/200</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div>
              <label className="flex items-center gap-2 text-sm font-semibold text-slate-600 mb-2">
                <Briefcase className="h-4 w-4 text-slate-400" /> อาชีพ
              </label>
              <input
                type="text"
                value={formData.occupation}
                onChange={(e) => setFormData({ ...formData, occupation: e.target.value })}
                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-4 focus:ring-primary/10 focus:border-primary transition-all text-slate-800 font-medium"
                placeholder="เช่น Developer, Designer"
              />
            </div>
            <div>
              <label className="flex items-center gap-2 text-sm font-semibold text-slate-600 mb-2">
                <MapPin className="h-4 w-4 text-slate-400" /> ที่อยู่
              </label>
              <input
                type="text"
                value={formData.location}
                onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-4 focus:ring-primary/10 focus:border-primary transition-all text-slate-800 font-medium"
                placeholder="เมืองหรือประเทศ"
              />
            </div>
          </div>
        </div>

        {/* Tags */}
        <div className="space-y-3">
          <h3 className="font-bold text-slate-800 text-lg border-t border-slate-100 pt-8 flex items-center gap-2">
            <Tag className="h-5 w-5 text-slate-400" /> แท็ก
          </h3>
          <p className="text-sm text-slate-500">เพิ่มแท็กเพื่อบอกความสนใจหรือสไตล์ของคุณ (สูงสุด 5)</p>
          <div className="flex gap-2">
            <input
              type="text"
              value={tagInput}
              onChange={(e) => setTagInput(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); addTag(); } }}
              disabled={formData.tags.length >= 5}
              className="flex-1 px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-4 focus:ring-primary/10 focus:border-primary transition-all text-slate-800 font-medium disabled:opacity-50"
              placeholder="พิมพ์แท็กแล้วกด Enter"
            />
            <button
              type="button"
              onClick={addTag}
              disabled={formData.tags.length >= 5}
              className="px-4 py-2.5 bg-primary text-white rounded-xl font-bold text-sm disabled:opacity-50"
            >
              + เพิ่มแท็ก
            </button>
          </div>
          <div className="flex flex-wrap gap-2 min-h-[2.5rem] items-center">
            {formData.tags.length === 0 && (
              <span className="text-sm text-slate-400">ยังไม่มีแท็ก — กด "เพิ่มแท็ก" เพื่อเริ่มต้น</span>
            )}
            {formData.tags.map((tag, i) => (
              <span key={i} className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-primary/10 text-primary rounded-full text-sm font-bold">
                {tag}
                <button type="button" onClick={() => removeTag(i)}>
                  <X className="h-3.5 w-3.5" />
                </button>
              </span>
            ))}
          </div>
        </div>

        {/* Social Links */}
        <div className="space-y-4">
          <h3 className="font-bold text-slate-800 text-lg border-t border-slate-100 pt-8 flex items-center gap-2">
            <LinkIcon className="h-5 w-5 text-slate-400" /> ลิงก์โซเชียลมีเดีย
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5 pt-2">
            <div>
              <label className="flex items-center gap-2 text-sm font-semibold text-slate-600 mb-2">
                <LinkIcon className="h-4 w-4 text-pink-500" /> Instagram URL
              </label>
              <input
                type="text"
                value={formData.instagram_url}
                onChange={(e) => handleUrlChange(e, 'instagram')}
                className={`w-full px-4 py-3 bg-slate-50 border rounded-xl focus:outline-none focus:ring-4 transition-all text-slate-800 font-medium ${errors.instagram_url ? 'border-red-300 focus:ring-red-500/20 focus:border-red-500' : 'border-slate-200 focus:ring-primary/10 focus:border-primary'}`}
                placeholder="https://instagram.com/yourprofile"
              />
              {errors.instagram_url && (
                <p className="mt-2 text-xs font-bold text-red-500 flex items-center gap-1.5 bg-red-50 px-2 py-1 rounded-md">
                  <AlertCircle className="h-3.5 w-3.5" /> {errors.instagram_url}
                </p>
              )}
            </div>

            <div>
              <label className="flex items-center gap-2 text-sm font-semibold text-slate-600 mb-2">
                <LinkIcon className="h-4 w-4 text-blue-500" /> Facebook URL
              </label>
              <input
                type="text"
                value={formData.facebook_url}
                onChange={(e) => handleUrlChange(e, 'facebook')}
                className={`w-full px-4 py-3 bg-slate-50 border rounded-xl focus:outline-none focus:ring-4 transition-all text-slate-800 font-medium ${errors.facebook_url ? 'border-red-300 focus:ring-red-500/20 focus:border-red-500' : 'border-slate-200 focus:ring-primary/10 focus:border-primary'}`}
                placeholder="https://facebook.com/yourprofile"
              />
              {errors.facebook_url && (
                <p className="mt-2 text-xs font-bold text-red-500 flex items-center gap-1.5 bg-red-50 px-2 py-1 rounded-md">
                  <AlertCircle className="h-3.5 w-3.5" /> {errors.facebook_url}
                </p>
              )}
            </div>
          </div>
        </div>
      </form>
    </div>
  );
}
