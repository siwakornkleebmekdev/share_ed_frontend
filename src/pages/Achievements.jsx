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
import { profileService } from '@/services/profile.service';

export default function Achievements() {
  const { milestones: storedMilestones, ownerId, isLoading, error, fetchMilestones, claimReward } = useAchievementStore();
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

  const currentUserId = user?.id || user?.user_id || null;
  const milestones = useMemo(
    () => ownerId === currentUserId ? storedMilestones : [],
    [ownerId, currentUserId, storedMilestones],
  );
  const currentEquippedFrameId = user?.current_frame_id || null;

  useEffect(() => {
    fetchMilestones({ force: true });
    const handleAchievementEvent = () => {
      fetchMilestones({ force: true });
    };
    window.addEventListener('achievement_completed', handleAchievementEvent);
    return () => window.removeEventListener('achievement_completed', handleAchievementEvent);
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
    setEquippingId(frameId);
    try {
      const equipResult = await profileService.equipItem(frameId, 'FRAME');
      if (equipResult?.success === false) {
        throw new Error(equipResult.error?.message || 'ไม่สามารถบันทึกกรอบโปรไฟล์ได้');
      }
      useAuthStore.getState().login({ ...user, ...(equipResult?.data || {}) });
      toast.success(`✨ เปลี่ยนไปใช้ "${milestone.reward.name}" เรียบร้อย!`);
    } catch (err) {
      console.error('Error equipping frame:', err);
      toast.error(err.message || 'ไม่สามารถเปลี่ยนกรอบรูปได้');
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
      <section className="mb-8 rounded-3xl border border-slate-200 bg-white p-5 shadow-sm sm:p-8">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <div className="mb-2 inline-flex items-center gap-2 rounded-full bg-amber-50 px-3 py-1.5 text-sm font-bold text-amber-800">
              <Sparkles className="h-4 w-4" /> ภารกิจและรางวัล
            </div>
            <h1 className="flex items-center gap-3 text-3xl font-black text-slate-900 sm:text-4xl">
              <Trophy className="h-9 w-9 shrink-0 text-amber-500" />
              ความสำเร็จของคุณ
            </h1>
            <p className="mt-2 max-w-2xl text-base leading-7 text-slate-600">
              ดูเงื่อนไขและความคืบหน้าของแต่ละภารกิจ เมื่อทำครบแล้วสามารถกดรับและใช้งานรางวัลได้ทันที
            </p>
          </div>
        </div>

        <div className="mt-6 grid grid-cols-2 gap-3 lg:grid-cols-4">
          {[
            { label: 'ภารกิจทั้งหมด', value: totalCount, tone: 'text-slate-900', icon: Award },
            { label: 'กำลังทำ', value: lockedCount, tone: 'text-blue-700', icon: Zap },
            { label: 'พร้อมรับรางวัล', value: readyCount, tone: 'text-amber-700', icon: Gift },
            { label: 'รับรางวัลแล้ว', value: claimedCount, tone: 'text-emerald-700', icon: CheckCircle2 },
          ].map(({ label, value, tone, icon: StatIcon }) => (
            <div key={label} className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
              <div className="flex items-center gap-2 text-sm font-bold text-slate-600">
                <StatIcon className={`h-4 w-4 ${tone}`} /> {label}
              </div>
              <div className={`mt-2 text-3xl font-black ${tone}`}>{value}</div>
            </div>
          ))}
        </div>

        <div className="mt-5 rounded-2xl border border-slate-200 p-4">
          <div className="mb-2 flex items-center justify-between gap-4 text-sm font-bold">
            <span className="text-slate-700">ความสำเร็จรวม</span>
            <span className="text-slate-900">{overallProgress}%</span>
          </div>
          <div className="h-3 overflow-hidden rounded-full bg-slate-100">
            <div className="h-full rounded-full bg-primary transition-all duration-500" style={{ width: `${overallProgress}%` }} />
          </div>
          <p className="mt-2 text-sm text-slate-600">เหลืออีก {totalCount - claimedCount} ภารกิจ</p>
        </div>

        <div className="mt-6 flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none" aria-label="กรองภารกิจตามสถานะ">
          <button
            type="button"
            onClick={() => setFilterTab('ALL')}
            className={`px-4 py-2.5 rounded-xl border text-sm font-bold transition-colors whitespace-nowrap cursor-pointer ${
              filterTab === 'ALL'
                ? 'border-primary bg-primary text-white'
                : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
            }`}
          >
            ทั้งหมด ({totalCount})
          </button>

          <button
              type="button"
              onClick={() => setFilterTab('READY')}
              className={`px-4 py-2.5 rounded-xl border text-sm font-bold transition-colors whitespace-nowrap flex items-center gap-1.5 cursor-pointer ${
                filterTab === 'READY'
                  ? 'border-primary bg-primary text-white'
                  : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
              }`}
            >
              <Zap className="h-3.5 w-3.5 fill-current" />
              พร้อมรับรางวัล ({readyCount})
          </button>

          <button
            type="button"
            onClick={() => setFilterTab('CLAIMED')}
            className={`px-4 py-2.5 rounded-xl border text-sm font-bold transition-colors whitespace-nowrap flex items-center gap-1.5 cursor-pointer ${
              filterTab === 'CLAIMED'
                ? 'border-primary bg-primary text-white'
                : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
            }`}
          >
            <CheckCircle2 className="h-3.5 w-3.5" />
            ปลดล็อกแล้ว ({claimedCount})
          </button>

          <button
            type="button"
            onClick={() => setFilterTab('LOCKED')}
            className={`px-4 py-2.5 rounded-xl border text-sm font-bold transition-colors whitespace-nowrap flex items-center gap-1.5 cursor-pointer ${
              filterTab === 'LOCKED'
                ? 'border-primary bg-primary text-white'
                : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
            }`}
          >
            <Lock className="h-3.5 w-3.5" />
            ยังไม่ปลดล็อก ({lockedCount})
          </button>
        </div>
      </section>

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

            const currentValue = Math.max(0, Number(milestone.current) || 0);
            const targetValue = Math.max(0, Number(milestone.target) || 0);
            const progress = targetValue > 0
              ? Math.min(100, (currentValue / targetValue) * 100)
              : 0;
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
                className="group relative flex flex-col rounded-3xl border border-slate-200 bg-white shadow-sm transition-shadow hover:shadow-md"
              >
                {/* Banner Header Area */}
                <div className="relative h-36 rounded-t-3xl overflow-hidden">
                  {hasImageReward ? (
                    <div className="w-full h-full relative">
                      <img
                        src={milestone.reward.previewUrl}
                        alt={milestone.reward.name}
                        className={`w-full h-full object-cover ${
                          isLocked ? 'grayscale brightness-75' : ''
                        }`}
                      />
                      <div className="absolute inset-0 bg-black/25" />
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
                      <div className="absolute inset-0 bg-radial from-white/30 to-transparent pointer-events-none" />
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
                      <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-200 bg-white px-3 py-1.5 text-sm font-bold text-emerald-700 shadow-sm">
                        <CheckCircle2 className="h-3.5 w-3.5" /> ได้รับแล้ว
                      </span>
                    )}
                    {isReady && (
                      <span className="inline-flex items-center gap-1.5 rounded-full border border-amber-200 bg-white px-3 py-1.5 text-sm font-bold text-amber-700 shadow-sm">
                        <Sparkles className="h-3.5 w-3.5" /> พร้อมรับรางวัล
                      </span>
                    )}
                    {isLocked && (
                      <span className="inline-flex items-center gap-1.5 rounded-full border border-slate-200 bg-white px-3 py-1.5 text-sm font-bold text-slate-700 shadow-sm">
                        <Lock className="h-3.5 w-3.5 text-slate-600" /> ยังไม่ปลดล็อก
                      </span>
                    )}
                  </div>
                </div>

                {/* Hero Circular Avatar & Scaled Frame Overlay (OUTSIDE the banner overflow-hidden) */}
                {hasReward && (
                  <div className="absolute left-6 top-[104px] z-20">
                    <div className="relative flex items-center justify-center">
                      {/* รูปโปรไฟล์เป็นวงกลม และซ่อนวงขอบเมื่อรางวัลเป็นกรอบตกแต่ง */}
                      <div
                        className={`relative h-20 w-20 rounded-full shadow-xl flex items-center justify-center ${isFrameReward ? '' : 'ring-4'} ${
                            isReady
                            ? 'ring-white bg-amber-50'
                            : isClaimed
                            ? 'ring-white bg-slate-900'
                            : 'ring-white bg-slate-900'
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

                        {/* ขยายกรอบเป็น 125% ให้ตรงกับหน้าที่ใช้ AvatarWithFrame และไม่ตัดส่วนที่ล้นวงกลม */}
                        {isFrameReward && milestone.reward?.previewUrl && (
                          <img
                            src={milestone.reward.previewUrl}
                            alt={milestone.reward.name}
                            className={`absolute inset-0 h-full w-full scale-125 max-w-none pointer-events-none object-contain drop-shadow-xl z-10 select-none ${
                              isLocked ? 'grayscale opacity-50' : ''
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
                          <div className="absolute -bottom-1 -right-1 h-6 w-6 rounded-full bg-amber-500 border-2 border-white shadow-md flex items-center justify-center text-white z-20">
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
                  <h3 className="text-lg font-black leading-7 text-slate-900">
                    {milestone.title}
                  </h3>
                  <p className="mt-2 text-sm leading-6 text-slate-600 break-words">
                    {milestone.description}
                  </p>

                  {/* Reward Info Pill */}
                  {hasReward && (
                    <div className="mt-4 flex w-full items-start gap-2 rounded-2xl border border-amber-200 bg-amber-50 p-3 text-sm font-bold text-amber-900">
                      <Gift className="mt-0.5 h-4 w-4 shrink-0 text-amber-700" />
                      <span className="break-words">
                        {milestone.reward.type === 'FRAME' ? 'กรอบรูป' : 'รางวัล'}
                        : {milestone.reward.name}
                      </span>
                    </div>
                  )}

                  {/* Progress Indicator */}
                  <div className="mt-4 rounded-2xl border border-slate-200 bg-slate-50 p-3.5">
                    <div className="flex items-center justify-between gap-3 text-sm font-bold">
                      <span className="text-slate-700">
                        {isClaimed ? 'ทำสำเร็จและรับรางวัลแล้ว' : isReady ? 'ทำสำเร็จแล้ว พร้อมรับรางวัล' : 'ความคืบหน้าภารกิจ'}
                      </span>
                      <span className="shrink-0 text-slate-900">{Math.round(progress)}%</span>
                    </div>
                    <div className="mt-2 h-3 w-full overflow-hidden rounded-full bg-slate-200">
                      <div
                        className={`h-full rounded-full transition-all duration-500 ${
                          isClaimed ? 'bg-emerald-500' : isReady ? 'bg-amber-500' : 'bg-primary'
                        }`}
                        style={{ width: `${isClaimed || isReady ? 100 : progress}%` }}
                      />
                    </div>
                    <div className="mt-2 flex items-center justify-between gap-3 text-sm text-slate-600">
                      <span>ทำแล้ว</span>
                      <span className="font-bold text-slate-800">
                        {isClaimed || isReady ? targetValue : currentValue} จาก {targetValue}
                      </span>
                    </div>
                  </div>

                  {/* Card Action Footer */}
                  <div className="mt-auto border-t border-slate-100 pt-5">
                    {isReady && (
                      <button
                        type="button"
                        onClick={() => handleClaim(milestone.id)}
                        disabled={claimingId === milestone.id}
                        className="flex w-full items-center justify-center gap-2 rounded-2xl bg-amber-500 py-3 text-sm font-extrabold text-white transition-colors hover:bg-amber-600 disabled:cursor-not-allowed disabled:opacity-60"
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
                          <div className="flex w-full items-center justify-center gap-2 rounded-2xl border border-blue-200 bg-blue-50 py-3 text-sm font-bold text-primary">
                            <Check className="h-4 w-4 stroke-[2.5]" /> กำลังใช้งานกรอบนี้
                          </div>
                        ) : (
                          <button
                            type="button"
                            onClick={() => handleEquipFrame(milestone)}
                            disabled={!milestoneFrameId || equippingId === milestoneFrameId}
                            className="flex w-full items-center justify-center gap-2 rounded-2xl border border-emerald-300 bg-emerald-50 py-3 text-sm font-bold text-emerald-800 transition-colors hover:bg-emerald-100 disabled:cursor-not-allowed disabled:opacity-60"
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
                        <div className="flex w-full items-center justify-center gap-2 rounded-2xl border border-emerald-300 bg-emerald-50 py-3 text-sm font-bold text-emerald-800">
                          <CheckCircle2 className="h-4 w-4 text-emerald-600" /> รับรางวัลแล้ว
                        </div>
                      )
                    )}

                    {isLocked && (
                      <button
                        type="button"
                        disabled
                        className="flex w-full cursor-not-allowed items-center justify-center gap-2 rounded-2xl border border-slate-200 bg-slate-100 py-3 text-sm font-bold text-slate-600"
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
