import { useState, useEffect, useMemo } from 'react';
import {
  Trophy,
  Gift,
  Lock,
  CheckCircle2,
  Loader2,
  Palette,
  Sparkles,
  Check,
  Award,
  Zap,
} from 'lucide-react';
import toast from 'react-hot-toast';
import useAchievementStore from '@/store/achievementStore';
import useAuthStore from '@/store/authStore';
import { supabase } from '@/utils/supabase';
import { profileService } from '@/services/profile.service';

export default function Achievements() {
  const { milestones, isLoading, error, fetchMilestones, claimReward } = useAchievementStore();
  const { user } = useAuthStore();
  const [filterTab, setFilterTab] = useState('ALL'); // 'ALL' | 'READY' | 'CLAIMED' | 'LOCKED'
  const [claimingId, setClaimingId] = useState(null);
  const [equippingId, setEquippingId] = useState(null);

  const avatarSrc =
    user?.avatar_url ||
    user?.user_metadata?.avatar_url ||
    user?.avatar ||
    `https://ui-avatars.com/api/?name=${encodeURIComponent(
      user?.display_name || user?.username || 'User'
    )}&background=1e293b&color=38bdf8`;

  const currentUserId = user?.id || user?.user_id;
  const currentEquippedFrameId =
    user?.current_frame_id ||
    user?.profile_frame_id ||
    user?.user_metadata?.profile_frame_id ||
    (currentUserId ? localStorage.getItem(`profile_frame_id_${currentUserId}`) : null) ||
    localStorage.getItem('profile_frame_id') ||
    null;

  useEffect(() => {
    fetchMilestones({ force: true });
  }, [fetchMilestones]);

  const handleClaim = async (id) => {
    setClaimingId(id);
    try {
      await claimReward(id);
      toast.success('🎉 รับรางวัลสำเร็จ! คุณสามารถใช้งานของรางวัลได้ทันที', {
        duration: 4000,
      });
    } catch (error) {
      toast.error(error?.response?.data?.message || 'ไม่สามารถรับรางวัลได้');
    } finally {
      setClaimingId(null);
    }
  };

  const handleEquipFrame = async (milestone) => {
    const frameId = milestone.reward_item_id || milestone.reward_item?.id || milestone.reward?.id;
    if (milestone.status !== 'CLAIMED' || !frameId) return;
    const userId = user?.id || user?.user_id;
    setEquippingId(frameId);
    const previousFrameId = user?.current_frame_id || user?.profile_frame_id || user?.user_metadata?.profile_frame_id || null;
    const previousFrame = user?.current_frame || null;
    const applyLocally = (id, frame) => {
      if (id) {
        if (userId) localStorage.setItem(`profile_frame_id_${userId}`, id);
        localStorage.setItem('profile_frame_id', id);
      } else {
        if (userId) localStorage.removeItem(`profile_frame_id_${userId}`);
        localStorage.removeItem('profile_frame_id');
      }
      useAuthStore.getState().login({ ...user, current_frame_id: id, profile_frame_id: id, current_frame: frame,
        user_metadata: { ...user?.user_metadata, profile_frame_id: id } });
    };
    try {
      applyLocally(frameId, milestone.reward_item || milestone.reward);
      const toastId = toast.success(`✨ เปลี่ยนไปใช้ "${milestone.reward.name}" เรียบร้อย!`);
      const [authResult, equipResult] = await Promise.allSettled([
        supabase.auth.updateUser({ data: { profile_frame_id: frameId } }),
        profileService.equipItem(frameId, 'FRAME'),
      ]);
      if (equipResult.status === 'rejected' || equipResult.value?.success === false) {
        toast.dismiss(toastId);
        applyLocally(previousFrameId, previousFrame);
        try {
          const restore = await supabase.auth.updateUser({ data: { profile_frame_id: previousFrameId } });
          if (restore.error) console.warn('Unable to restore frame metadata:', restore.error);
        } catch (restoreError) { console.warn('Unable to restore frame metadata:', restoreError); }
        toast.error('ไม่สามารถบันทึกกรอบได้ ระบบคืนค่ากรอบเดิมแล้ว');
      } else if (authResult.status === 'rejected' || authResult.value?.error) {
        console.warn('Unable to sync frame metadata:', authResult.status === 'rejected' ? authResult.reason : authResult.value.error);
      }
    } catch (err) {
      console.error('Error equipping frame:', err);
      toast.error('ไม่สามารถเปลี่ยนกรอบรูปได้');
    } finally {
      setEquippingId(null);
    }
  };

  // Stats
  const totalCount = milestones.length;
  const claimedCount = milestones.filter((m) => m.status === 'CLAIMED').length;
  const readyCount = milestones.filter((m) => m.status === 'READY_TO_CLAIM').length;
  const lockedCount = milestones.filter((m) => m.status === 'LOCKED').length;
  const overallProgress = totalCount > 0 ? Math.round((claimedCount / totalCount) * 100) : 0;

  // Filtered List
  const filteredMilestones = useMemo(() => {
    return milestones.filter((m) => {
      if (filterTab === 'READY') return m.status === 'READY_TO_CLAIM';
      if (filterTab === 'CLAIMED') return m.status === 'CLAIMED';
      if (filterTab === 'LOCKED') return m.status === 'LOCKED';
      return true;
    });
  }, [milestones, filterTab]);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      {/* Hero Header Section */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-slate-900 via-slate-800 to-indigo-950 p-6 sm:p-10 text-white shadow-2xl mb-10 border border-white/10">
        {/* Background glow & accents */}
        <div className="absolute -right-16 -top-16 w-80 h-80 rounded-full bg-amber-500/15 blur-3xl pointer-events-none" />
        <div className="absolute -left-16 -bottom-16 w-80 h-80 rounded-full bg-blue-500/15 blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-8">
          {/* Title & Subtitle */}
          <div>
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-amber-400/10 border border-amber-400/20 text-amber-300 text-xs font-extrabold mb-3 backdrop-blur-md">
              <Sparkles className="h-3.5 w-3.5" /> ภารกิจและรางวัลพิเศษ
            </div>
            <h1 className="text-3xl sm:text-4xl font-black tracking-tight text-white flex items-center gap-3">
              <Trophy className="h-9 w-9 text-amber-400 shrink-0 drop-shadow-[0_2px_12px_rgba(251,191,36,0.5)]" />
              Achievements
            </h1>
            <p className="text-slate-300 text-sm sm:text-base mt-2 max-w-xl leading-relaxed">
              ทำภารกิจการแบ่งปันความรู้ให้สำเร็จ เพื่อปลดล็อกกรอบรูปโปรไฟล์ระดับพรีเมียมและของรางวัลสุดพิเศษ!
            </p>
          </div>

          {/* Quick Stats Banner Card */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-4 bg-white/5 backdrop-blur-md border border-white/10 p-4 sm:p-5 rounded-2xl shrink-0">
            <div className="flex items-center gap-6 px-2">
              <div className="text-center">
                <div className="text-2xl sm:text-3xl font-black text-amber-400">
                  {claimedCount}
                  <span className="text-sm font-semibold text-slate-400">/{totalCount}</span>
                </div>
                <div className="text-[11px] font-bold text-slate-400 mt-0.5">ปลดล็อกแล้ว</div>
              </div>

              <div className="h-10 w-[1px] bg-white/15" />

              <div className="text-center">
                <div className="text-2xl sm:text-3xl font-black text-emerald-400">
                  {overallProgress}%
                </div>
                <div className="text-[11px] font-bold text-slate-400 mt-0.5">ความสำเร็จรวม</div>
              </div>

              {readyCount > 0 && (
                <>
                  <div className="h-10 w-[1px] bg-white/15" />
                  <div className="text-center">
                    <div className="text-2xl sm:text-3xl font-black text-orange-400 animate-pulse">
                      {readyCount}
                    </div>
                    <div className="text-[11px] font-bold text-orange-300 mt-0.5">พร้อมรับ</div>
                  </div>
                </>
              )}
            </div>

            {/* Mini Master Progress Bar */}
            <div className="sm:w-36 flex flex-col justify-center">
              <div className="h-2.5 w-full bg-white/10 rounded-full overflow-hidden p-0.5">
                <div
                  className="h-full bg-gradient-to-r from-amber-400 via-orange-400 to-emerald-400 rounded-full transition-all duration-700"
                  style={{ width: `${overallProgress}%` }}
                />
              </div>
              <span className="text-[10px] text-slate-400 font-medium mt-1 text-center sm:text-right">
                เหลืออีก {totalCount - claimedCount} ภารกิจ
              </span>
            </div>
          </div>
        </div>

        {/* Filter Tabs */}
        <div className="relative z-10 flex items-center gap-2 mt-8 overflow-x-auto pb-1 scrollbar-none">
          <button
            type="button"
            onClick={() => setFilterTab('ALL')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
              filterTab === 'ALL'
                ? 'bg-white text-slate-900 shadow-md'
                : 'bg-white/10 text-slate-300 hover:bg-white/15 hover:text-white'
            }`}
          >
            ทั้งหมด ({totalCount})
          </button>

          {readyCount > 0 && (
            <button
              type="button"
              onClick={() => setFilterTab('READY')}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap flex items-center gap-1.5 cursor-pointer ${
                filterTab === 'READY'
                  ? 'bg-amber-400 text-slate-950 shadow-md shadow-amber-400/20'
                  : 'bg-amber-500/20 text-amber-300 hover:bg-amber-500/30'
              }`}
            >
              <Zap className="h-3.5 w-3.5 fill-current" />
              พร้อมรับรางวัล ({readyCount})
            </button>
          )}

          <button
            type="button"
            onClick={() => setFilterTab('CLAIMED')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap flex items-center gap-1.5 cursor-pointer ${
              filterTab === 'CLAIMED'
                ? 'bg-emerald-500 text-white shadow-md'
                : 'bg-white/10 text-slate-300 hover:bg-white/15 hover:text-white'
            }`}
          >
            <CheckCircle2 className="h-3.5 w-3.5" />
            ปลดล็อกแล้ว ({claimedCount})
          </button>

          <button
            type="button"
            onClick={() => setFilterTab('LOCKED')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap flex items-center gap-1.5 cursor-pointer ${
              filterTab === 'LOCKED'
                ? 'bg-slate-700 text-white shadow-md'
                : 'bg-white/10 text-slate-300 hover:bg-white/15 hover:text-white'
            }`}
          >
            <Lock className="h-3.5 w-3.5" />
            ยังไม่ปลดล็อก ({lockedCount})
          </button>
        </div>
      </div>

      {/* Main Content Area */}
      {isLoading ? (
        <div className="flex flex-col items-center justify-center py-28">
          <div className="h-14 w-14 rounded-2xl bg-amber-500/10 flex items-center justify-center mb-4">
            <Loader2 className="h-7 w-7 text-amber-500 animate-spin" />
          </div>
          <p className="text-slate-600 font-bold text-base">กำลังโหลดข้อมูลความสำเร็จ...</p>
          <p className="text-slate-400 text-xs mt-1">โปรดรอสักครู่</p>
        </div>
      ) : error ? (
        <div className="mx-auto max-w-md rounded-3xl border border-red-100 bg-white p-10 text-center shadow-sm">
          <h3 className="font-bold text-slate-800">โหลดข้อมูลความสำเร็จไม่สำเร็จ</h3>
          <button type="button" onClick={fetchMilestones} className="mt-4 rounded-xl bg-primary px-5 py-2 text-sm font-bold text-white">ลองใหม่</button>
        </div>
      ) : filteredMilestones.length === 0 ? (
        <div className="bg-white rounded-3xl border border-slate-200/80 p-12 text-center shadow-sm max-w-md mx-auto">
          <div className="h-16 w-16 mx-auto rounded-full bg-slate-100 flex items-center justify-center text-slate-400 mb-4">
            <Award className="h-8 w-8" />
          </div>
          <h3 className="text-lg font-extrabold text-slate-800">ไม่มีภารกิจในหมวดนี้</h3>
          <p className="text-xs text-slate-500 mt-1">ลองเปลี่ยนหมวดหมู่ตัวกรองเพื่อดูภารกิจอื่น ๆ</p>
          <button
            type="button"
            onClick={() => setFilterTab('ALL')}
            className="mt-5 px-5 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition-colors cursor-pointer"
          >
            แสดงทั้งหมด
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-7">
          {filteredMilestones.map((milestone) => {
            const isClaimed = milestone.status === 'CLAIMED';
            const isReady = milestone.status === 'READY_TO_CLAIM';
            const isLocked = milestone.status === 'LOCKED';

            const progress = Math.min(100, (milestone.current / milestone.target) * 100);
            const hasReward = !!milestone.reward;
            const isFrameReward = hasReward && milestone.reward.type === 'FRAME';
            const hasImageReward =
              hasReward && milestone.reward.type !== 'FRAME' && !!milestone.reward.previewUrl;

            // Check if user currently has this frame equipped
            const milestoneFrameId = milestone.reward_item_id || milestone.reward_item?.id || milestone.reward?.id;
            const isEquipped =
              isClaimed &&
              isFrameReward &&
              (currentEquippedFrameId === milestoneFrameId ||
                currentEquippedFrameId === milestone.reward?.id);

            return (
              <div
                key={milestone.id}
                className={`group relative rounded-3xl bg-white border transition-all duration-300 flex flex-col ${
                  isReady
                    ? 'border-amber-300 ring-2 ring-amber-400/40 shadow-xl shadow-amber-500/10 hover:shadow-2xl hover:shadow-amber-500/20 hover:-translate-y-1'
                    : isClaimed
                    ? 'border-slate-200/90 shadow-sm hover:shadow-xl hover:border-emerald-200/90 hover:-translate-y-1'
                    : 'border-slate-200/70 shadow-xs hover:shadow-md hover:border-slate-300 hover:-translate-y-0.5'
                }`}
              >
                {/* Banner Header Area */}
                <div className="relative h-36 rounded-t-3xl overflow-hidden">
                  {hasImageReward ? (
                    <div className="w-full h-full relative">
                      <img
                        src={milestone.reward.previewUrl}
                        alt={milestone.reward.name}
                        className={`w-full h-full object-cover transition-transform duration-500 group-hover:scale-105 ${
                          isLocked ? 'grayscale brightness-75' : ''
                        }`}
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent" />
                    </div>
                  ) : isClaimed ? (
                    <div className="w-full h-full bg-gradient-to-br from-amber-400 via-amber-500 to-amber-600 relative overflow-hidden">
                      {/* Decorative celebratory background pattern */}
                      <div className="absolute inset-0 opacity-20 pointer-events-none">
                        <div className="absolute -right-8 -top-8 w-36 h-36 rounded-full border-8 border-white/60" />
                        <div className="absolute -left-6 -bottom-6 w-28 h-28 rounded-full border-4 border-white/60" />
                      </div>
                      <div className="absolute right-4 bottom-3 opacity-15 text-white pointer-events-none">
                        <Trophy className="h-24 w-24 -rotate-12" />
                      </div>
                    </div>
                  ) : isReady ? (
                    <div className="w-full h-full bg-gradient-to-r from-amber-500 via-orange-400 to-amber-500 relative overflow-hidden">
                      <div className="absolute inset-0 bg-radial from-white/30 to-transparent pointer-events-none animate-pulse" />
                      <div className="absolute right-4 bottom-3 opacity-20 text-white pointer-events-none">
                        <Sparkles className="h-24 w-24" />
                      </div>
                    </div>
                  ) : (
                    <div className="w-full h-full bg-gradient-to-br from-slate-700 via-slate-800 to-slate-900 relative overflow-hidden">
                      {/* Subtle futuristic / gaming locked texture */}
                      <div className="absolute inset-0 opacity-10 pointer-events-none flex items-center justify-end pr-5">
                        <Lock className="h-24 w-24 text-white -rotate-12" />
                      </div>
                      <div className="absolute inset-0 bg-[linear-gradient(45deg,transparent_25%,rgba(255,255,255,0.03)_50%,transparent_75%)] bg-[length:24px_24px]" />
                    </div>
                  )}

                  {/* Status Badge in Top Right */}
                  <div className="absolute top-3.5 right-3.5 z-10">
                    {isClaimed && (
                      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-extrabold bg-emerald-500/95 text-white shadow-md shadow-emerald-950/20 backdrop-blur-md">
                        <CheckCircle2 className="h-3.5 w-3.5" /> ได้รับแล้ว
                      </span>
                    )}
                    {isReady && (
                      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-black bg-gradient-to-r from-amber-500 to-orange-500 text-white shadow-lg shadow-amber-500/40 animate-pulse">
                        <Sparkles className="h-3.5 w-3.5" /> พร้อมรับรางวัล
                      </span>
                    )}
                    {isLocked && (
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-slate-900/60 text-slate-200 backdrop-blur-md border border-white/15">
                        <Lock className="h-3 w-3 text-slate-300" /> ยังไม่ปลดล็อก
                      </span>
                    )}
                  </div>
                </div>

                {/* Hero Circular Avatar & Scaled Frame Overlay (OUTSIDE the banner overflow-hidden) */}
                {hasReward && (
                  <div className="absolute left-6 top-[104px] z-20">
                    <div className="relative flex items-center justify-center">
                      {/* Glow effect for Ready-to-claim */}
                      {isReady && (
                        <div className="absolute -inset-3 rounded-full bg-amber-400/50 blur-lg animate-pulse -z-10" />
                      )}

                      {/* Circular Avatar Container */}
                      <div
                        className={`relative h-20 w-20 rounded-full ring-4 shadow-xl flex items-center justify-center ${
                          isReady
                            ? 'ring-amber-400 bg-amber-50 shadow-amber-500/25'
                            : isClaimed
                            ? 'ring-white bg-slate-900 shadow-slate-900/15'
                            : 'ring-white/95 bg-slate-900 shadow-slate-900/10'
                        }`}
                      >
                        {isFrameReward ? (
                          /* Strictly Circular Profile Picture */
                          <div className="w-full h-full rounded-full overflow-hidden bg-slate-200 flex items-center justify-center">
                            <img
                              src={avatarSrc}
                              alt="User Avatar"
                              className={`w-full h-full object-cover rounded-full transition-all duration-300 ${
                                isLocked ? 'grayscale brightness-75 contrast-90' : ''
                              }`}
                              onError={(e) => {
                                e.target.onerror = null;
                                e.target.src =
                                  'https://ui-avatars.com/api/?name=User&background=1e293b&color=38bdf8';
                              }}
                            />
                          </div>
                        ) : milestone.reward?.previewUrl ? (
                          <div className="w-full h-full rounded-full overflow-hidden bg-slate-100 flex items-center justify-center">
                            <img
                              src={milestone.reward.previewUrl}
                              alt={milestone.reward.name}
                              className={`w-full h-full object-cover ${
                                isLocked ? 'grayscale brightness-75' : ''
                              }`}
                            />
                          </div>
                        ) : (
                          <div className="w-full h-full rounded-full overflow-hidden bg-gradient-to-br from-amber-400 to-amber-600 flex items-center justify-center text-white">
                            <Palette className="h-7 w-7 drop-shadow" />
                          </div>
                        )}

                        {/* Profile Frame: Larger than the circle profile picture and sitting outside without overflow clipping */}
                        {isFrameReward && milestone.reward?.previewUrl && (
                          <img
                            src={milestone.reward.previewUrl}
                            alt={milestone.reward.name}
                            className={`absolute -inset-[18px] w-[calc(100%+36px)] h-[calc(100%+36px)] max-w-none pointer-events-none object-contain drop-shadow-xl z-10 select-none transition-all duration-300 ${
                              isLocked ? 'grayscale opacity-50' : isReady ? 'animate-pulse' : ''
                            }`}
                          />
                        )}

                        {/* Mini Status Corner Pin */}
                        {isClaimed && (
                          <div className="absolute -bottom-1 -right-1 h-6 w-6 rounded-full bg-emerald-500 border-2 border-white shadow-md flex items-center justify-center text-white z-20">
                            <CheckCircle2 className="h-3.5 w-3.5" />
                          </div>
                        )}
                        {isReady && (
                          <div className="absolute -bottom-1 -right-1 h-6 w-6 rounded-full bg-gradient-to-r from-amber-500 to-orange-500 border-2 border-white shadow-md flex items-center justify-center text-white z-20 animate-bounce">
                            <Sparkles className="h-3.5 w-3.5" />
                          </div>
                        )}
                        {isLocked && (
                          <div className="absolute -bottom-1 -right-1 h-6 w-6 rounded-full bg-slate-700 border-2 border-white shadow-md flex items-center justify-center text-white z-20">
                            <Lock className="h-3 w-3 text-slate-200" />
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                )}

                {/* Card Body Section */}
                <div className={`${hasReward ? 'pt-16' : 'pt-6'} px-6 pb-6 flex flex-col flex-1`}>
                  {/* Title & Description */}
                  <h3 className="font-black text-slate-800 text-base sm:text-lg group-hover:text-primary transition-colors line-clamp-1">
                    {milestone.title}
                  </h3>
                  <p className="text-xs sm:text-sm text-slate-500 mt-1.5 line-clamp-2 leading-relaxed break-words break-all">
                    {milestone.description}
                  </p>

                  {/* Reward Info Pill */}
                  {hasReward && (
                    <div className="inline-flex items-center gap-1.5 mt-3.5 px-3 py-1.5 rounded-xl bg-amber-50/90 border border-amber-200/70 text-amber-800 text-xs font-bold w-fit max-w-full shadow-2xs">
                      <Gift className="h-3.5 w-3.5 text-amber-600 shrink-0" />
                      <span className="truncate">
                        {milestone.reward.type === 'FRAME'
                          ? 'กรอบรูป'
                          : milestone.reward.type === 'THEME'
                          ? 'ธีม'
                          : 'รางวัล'}
                        : {milestone.reward.name}
                      </span>
                    </div>
                  )}

                  {/* Progress Indicator */}
                  {isLocked ? (
                    <div className="mt-4">
                      <div className="flex items-center justify-between text-xs font-semibold text-slate-500 mb-1.5">
                        <span>ความคืบหน้า</span>
                        <span className="font-extrabold text-slate-700">
                          {milestone.current} / {milestone.target} ({Math.round(progress)}%)
                        </span>
                      </div>
                      <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden p-0.5">
                        <div
                          className="h-full bg-gradient-to-r from-blue-500 to-indigo-600 rounded-full transition-all duration-500"
                          style={{ width: `${progress}%` }}
                        />
                      </div>
                    </div>
                  ) : isReady ? (
                    <div className="mt-4">
                      <div className="flex items-center justify-between text-xs font-semibold text-amber-700 mb-1.5">
                        <span className="flex items-center gap-1 font-bold">
                          <Sparkles className="h-3.5 w-3.5 text-amber-500" /> ภารกิจสำเร็จแล้ว!
                        </span>
                        <span className="font-extrabold text-amber-800">
                          {milestone.target} / {milestone.target} (100%)
                        </span>
                      </div>
                      <div className="h-2 w-full bg-amber-100 rounded-full overflow-hidden">
                        <div className="h-full bg-gradient-to-r from-amber-500 to-orange-500 rounded-full w-full shadow-xs" />
                      </div>
                    </div>
                  ) : (
                    <div className="mt-4">
                      <div className="flex items-center justify-between text-xs font-semibold text-emerald-700 mb-1.5">
                        <span className="flex items-center gap-1 font-bold">
                          <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" /> ได้รับรางวัลแล้ว
                        </span>
                        <span className="font-extrabold text-emerald-800">100%</span>
                      </div>
                      <div className="h-2 w-full bg-emerald-100 rounded-full overflow-hidden">
                        <div className="h-full bg-emerald-500 rounded-full w-full" />
                      </div>
                    </div>
                  )}

                  {/* Card Action Footer */}
                  <div className="mt-auto pt-5 border-t border-slate-100">
                    {isReady && (
                      <button
                        type="button"
                        onClick={() => handleClaim(milestone.id)}
                        disabled={claimingId === milestone.id}
                        className="w-full py-3 rounded-2xl font-extrabold text-sm bg-gradient-to-r from-amber-500 via-orange-500 to-amber-500 hover:from-amber-600 hover:to-orange-600 text-white shadow-lg shadow-amber-500/25 hover:shadow-amber-500/40 active:scale-[0.98] transition-all flex items-center justify-center gap-2 cursor-pointer"
                      >
                        {claimingId === milestone.id ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <>
                            <Gift className="h-4 w-4" /> รับรางวัล
                          </>
                        )}
                      </button>
                    )}

                    {isClaimed && (
                      isFrameReward ? (
                        isEquipped ? (
                          <div className="w-full py-2.5 rounded-2xl font-bold text-sm bg-blue-50 border border-blue-200 text-primary flex items-center justify-center gap-2 shadow-2xs">
                            <Check className="h-4 w-4 stroke-[2.5]" /> กำลังใช้งานกรอบนี้
                          </div>
                        ) : (
                          <button
                            type="button"
                            onClick={() => handleEquipFrame(milestone)}
                            disabled={!milestoneFrameId || equippingId === milestoneFrameId}
                            className="w-full py-2.5 rounded-2xl font-bold text-sm bg-emerald-50 border border-emerald-200/80 text-emerald-700 hover:bg-emerald-100/90 active:scale-[0.98] transition-all flex items-center justify-center gap-2 cursor-pointer shadow-2xs"
                          >
                            {equippingId === milestoneFrameId ? (
                              <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                              <>
                                <Sparkles className="h-4 w-4 text-emerald-600" /> ใช้งานกรอบนี้
                              </>
                            )}
                          </button>
                        )
                      ) : (
                        <div className="w-full py-2.5 rounded-2xl font-bold text-sm bg-emerald-50 border border-emerald-200/80 text-emerald-700 flex items-center justify-center gap-2 shadow-2xs">
                          <CheckCircle2 className="h-4 w-4 text-emerald-600" /> รับรางวัลแล้ว
                        </div>
                      )
                    )}

                    {isLocked && (
                      <button
                        type="button"
                        disabled
                        className="w-full py-2.5 rounded-2xl font-semibold text-sm bg-slate-100 text-slate-400 cursor-not-allowed flex items-center justify-center gap-2"
                      >
                        <Lock className="h-3.5 w-3.5" /> ยังไม่ปลดล็อก
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
