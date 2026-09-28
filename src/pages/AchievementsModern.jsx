import { useEffect, useMemo, useRef, useState } from 'react';
import {
  Award,
  Check,
  CheckCircle2,
  Gift,
  Loader2,
  LockKeyhole,
  Sparkles,
  Trophy,
  Zap,
} from 'lucide-react';
import toast from 'react-hot-toast';
import useAchievementStore from '@/store/achievementStore';
import useAuthStore from '@/store/authStore';
import { profileService } from '@/services/profile.service';
import { getMilestoneTypeInfo } from '@/services/achievement.service';
import Pagination from '@/components/Pagination';

const ACHIEVEMENTS_PER_PAGE = 6;

const FILTERS = [
  { id: 'ALL', label: 'ทั้งหมด', icon: Award },
  { id: 'READY', label: 'พร้อมรับ', icon: Gift },
  { id: 'LOCKED', label: 'กำลังทำ', icon: Zap },
  { id: 'CLAIMED', label: 'สำเร็จแล้ว', icon: CheckCircle2 },
];

const STATUS_CONFIG = {
  CLAIMED: {
    label: 'สำเร็จแล้ว',
    Icon: CheckCircle2,
    badge: 'bg-emerald-50 text-emerald-700 ring-emerald-600/15',
    progress: 'bg-emerald-500',
  },
  READY_TO_CLAIM: {
    label: 'พร้อมรับรางวัล',
    Icon: Gift,
    badge: 'bg-amber-50 text-amber-700 ring-amber-600/15',
    progress: 'bg-amber-500',
  },
  LOCKED: {
    label: 'กำลังทำ',
    Icon: Zap,
    badge: 'bg-blue-50 text-primary-dark ring-blue-600/15',
    progress: 'bg-primary',
  },
};

function useLoadWhenVisible() {
  const targetRef = useRef(null);
  const [shouldLoad, setShouldLoad] = useState(false);

  useEffect(() => {
    if (shouldLoad) return undefined;
    const target = targetRef.current;
    if (!target) return undefined;

    if (!('IntersectionObserver' in window)) {
      setShouldLoad(true);
      return undefined;
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setShouldLoad(true);
          observer.disconnect();
        }
      },
      { rootMargin: '0px', threshold: 0.01 },
    );

    observer.observe(target);
    return () => observer.disconnect();
  }, [shouldLoad]);

  return { targetRef, shouldLoad };
}

function AchievementCard({
  milestone,
  avatarSrc,
  currentEquippedFrameId,
  claimingId,
  equippingId,
  onClaim,
  onEquipFrame,
}) {
  const isClaimed = milestone.status === 'CLAIMED';
  const isReady = milestone.status === 'READY_TO_CLAIM';
  const status = STATUS_CONFIG[milestone.status] || STATUS_CONFIG.LOCKED;
  const StatusIcon = status.Icon;
  const currentValue = Math.max(0, Number(milestone.current) || 0);
  const targetValue = Math.max(0, Number(milestone.target) || 0);
  const typeInfo = getMilestoneTypeInfo(milestone.achievement_type || milestone.milestone_type);
  const goalLabel = typeInfo?.achievementDescription || milestone.description || milestone.title;
  const goalUnit = typeInfo?.unit || 'ครั้ง';
  const calculatedProgress = targetValue > 0 ? Math.min(100, (currentValue / targetValue) * 100) : 0;
  const progress = isClaimed || isReady ? 100 : calculatedProgress;
  const isFrameReward = milestone.reward?.type === 'FRAME';
  const frameId = milestone.reward_item_id || milestone.reward_item?.id || milestone.reward?.id;
  const isEquipped = isClaimed && isFrameReward && currentEquippedFrameId === frameId;
  const { targetRef: previewRef, shouldLoad: shouldLoadPreview } = useLoadWhenVisible();

  return (
    <article className="group flex h-full flex-col overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm transition-[border-color,box-shadow,transform] duration-200 hover:-translate-y-1 hover:border-blue-200 hover:shadow-xl hover:shadow-blue-100/70">
      <div ref={previewRef} className="relative flex h-52 items-center justify-center overflow-hidden bg-gradient-to-br from-blue-50 via-white to-indigo-50">
        <div className="absolute left-5 top-5 z-20">
          <span className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-bold ring-1 ring-inset ${status.badge}`}>
            <StatusIcon className="h-3.5 w-3.5" />
            {status.label}
          </span>
        </div>

        <div className="pointer-events-none absolute -right-14 -top-14 h-40 w-40 rounded-full bg-primary/5" />
        <div className="pointer-events-none absolute -bottom-14 -left-14 h-40 w-40 rounded-full bg-indigo-500/5" />

        <div className="relative mt-5 flex h-40 w-40 items-center justify-center">
          <div className={`${isFrameReward ? 'h-28 w-28' : 'h-32 w-32'} flex items-center justify-center overflow-hidden rounded-full bg-white ring-4 ring-white shadow-[0_14px_35px_rgba(59,130,246,0.22)]`}>
            {shouldLoadPreview ? (
              <img
                src={isFrameReward ? avatarSrc : milestone.reward?.previewUrl || avatarSrc}
                alt={isFrameReward ? 'ตัวอย่างกรอบโปรไฟล์' : milestone.reward?.name || 'รางวัล'}
                loading="lazy"
                decoding="async"
                className={`h-full w-full object-cover ${!isClaimed && !isReady ? 'saturate-[0.75]' : ''}`}
              />
            ) : (
              <Award className="h-8 w-8 text-blue-200" aria-hidden="true" />
            )}
          </div>
          {shouldLoadPreview && isFrameReward && milestone.reward?.previewUrl && (
            <img
              src={milestone.reward.previewUrl}
              alt=""
              aria-hidden="true"
              loading="lazy"
              decoding="async"
              fetchPriority="low"
              className={`pointer-events-none absolute left-1/2 top-1/2 h-36 w-36 -translate-x-1/2 -translate-y-1/2 object-contain drop-shadow-[0_10px_14px_rgba(30,64,175,0.2)] ${
                !isClaimed && !isReady ? 'opacity-75 saturate-[0.75]' : ''
              }`}
            />
          )}
          <span
            className={`absolute bottom-1 right-1 flex h-10 w-10 items-center justify-center rounded-full border-[3px] border-white shadow-lg ${
              isClaimed
                ? 'bg-emerald-500 text-white'
                : isReady
                  ? 'bg-amber-400 text-amber-950'
                  : 'bg-white text-slate-500 ring-1 ring-slate-200'
            }`}
          >
            {isClaimed ? (
              <Check className="h-5 w-5" strokeWidth={3} />
            ) : isReady ? (
              <Gift className="h-5 w-5" strokeWidth={2.5} />
            ) : (
              <LockKeyhole className="h-4 w-4" />
            )}
          </span>
        </div>
      </div>

      <div className="flex flex-1 flex-col p-5 sm:p-6">
        <div>
          <h2 className="line-clamp-2 text-xl font-extrabold leading-7 text-slate-900">{milestone.title}</h2>
          <p className="mt-2 text-sm font-semibold leading-6 text-slate-700">
            {goalLabel} <span className="font-extrabold text-primary-dark">{targetValue} {goalUnit}</span>
          </p>
          {milestone.description && milestone.description !== goalLabel && (
            <p className="mt-1 line-clamp-2 text-sm leading-6 text-slate-500">{milestone.description}</p>
          )}
        </div>

        <div className="mt-4 rounded-2xl bg-slate-50 p-4">
          <div className="flex items-center justify-between gap-3 text-sm">
            <span className="font-semibold text-slate-600">ความคืบหน้า</span>
            <span className="font-extrabold text-slate-900">{Math.round(progress)}%</span>
          </div>
          <div className="mt-2.5 h-2.5 overflow-hidden rounded-full bg-slate-200">
            <div className={`h-full rounded-full transition-[width] duration-500 ${status.progress}`} style={{ width: `${progress}%` }} />
          </div>
          <p className="mt-2 text-xs font-medium text-slate-500">
            ทำแล้ว <span className="font-bold text-slate-700">{isClaimed || isReady ? targetValue : currentValue}</span> จาก{' '}
            <span className="font-bold text-slate-700">{targetValue}</span>
          </p>
        </div>

        <div className="mt-4 flex items-start gap-2 text-sm">
          <Gift className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
          <div className="min-w-0">
            <p className="text-xs font-semibold text-slate-400">รางวัล</p>
            <p className="truncate font-bold text-slate-700">{milestone.reward?.name || 'รางวัลความสำเร็จ'}</p>
          </div>
        </div>

        <div className="mt-auto pt-5">
          {isReady && (
            <button
              type="button"
              onClick={() => onClaim(milestone.id)}
              disabled={claimingId === milestone.id}
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-primary px-4 py-3 text-sm font-bold text-white shadow-sm transition-colors hover:bg-primary-dark disabled:cursor-not-allowed disabled:opacity-60"
            >
              {claimingId === milestone.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <Gift className="h-4 w-4" />}
              รับรางวัล
            </button>
          )}

          {isClaimed && isFrameReward && !isEquipped && (
            <button
              type="button"
              onClick={() => onEquipFrame(milestone)}
              disabled={!frameId || equippingId === frameId}
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-primary px-4 py-3 text-sm font-bold text-white shadow-sm transition-colors hover:bg-primary-dark disabled:cursor-not-allowed disabled:opacity-60"
            >
              {equippingId === frameId ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
              ใช้กรอบนี้
            </button>
          )}

          {isClaimed && (!isFrameReward || isEquipped) && (
            <div className="flex w-full items-center justify-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-bold text-emerald-700">
              <Check className="h-4 w-4" /> {isEquipped ? 'กำลังใช้งาน' : 'รับรางวัลแล้ว'}
            </div>
          )}

          {!isClaimed && !isReady && (
            <div className="flex w-full items-center justify-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-bold text-slate-500">
              <LockKeyhole className="h-4 w-4" /> ทำภารกิจต่อเพื่อปลดล็อก
            </div>
          )}
        </div>
      </div>
    </article>
  );
}

export default function AchievementsModern() {
  const {
    milestones: storedMilestones,
    ownerId,
    isLoading,
    error,
    fetchMilestones,
    claimReward,
  } = useAchievementStore();
  const { user } = useAuthStore();
  const [filterTab, setFilterTab] = useState('ALL');
  const [claimingId, setClaimingId] = useState(null);
  const [equippingId, setEquippingId] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);

  const currentUserId = user?.id || user?.user_id || null;
  const milestones = useMemo(
    () => (ownerId === currentUserId ? storedMilestones : []),
    [ownerId, currentUserId, storedMilestones],
  );
  const currentEquippedFrameId = user?.current_frame_id || null;
  const avatarSrc =
    user?.avatar_url ||
    user?.user_metadata?.avatar_url ||
    user?.avatar ||
    `https://ui-avatars.com/api/?name=${encodeURIComponent(
      user?.display_name || user?.username || 'User',
    )}&background=3b82f6&color=ffffff`;

  useEffect(() => {
    fetchMilestones({ force: true });
    const refreshMilestones = () => fetchMilestones({ force: true });
    window.addEventListener('achievement_completed', refreshMilestones);
    return () => window.removeEventListener('achievement_completed', refreshMilestones);
  }, [fetchMilestones]);

  const counts = useMemo(
    () => ({
      ALL: milestones.length,
      READY: milestones.filter((item) => item.status === 'READY_TO_CLAIM').length,
      LOCKED: milestones.filter((item) => item.status === 'LOCKED').length,
      CLAIMED: milestones.filter((item) => item.status === 'CLAIMED').length,
    }),
    [milestones],
  );

  const filteredMilestones = useMemo(
    () => milestones.filter((item) => {
      if (filterTab === 'READY') return item.status === 'READY_TO_CLAIM';
      if (filterTab === 'LOCKED') return item.status === 'LOCKED';
      if (filterTab === 'CLAIMED') return item.status === 'CLAIMED';
      return true;
    }),
    [filterTab, milestones],
  );

  const totalPages = Math.ceil(filteredMilestones.length / ACHIEVEMENTS_PER_PAGE);
  const paginatedMilestones = filteredMilestones.slice(
    (currentPage - 1) * ACHIEVEMENTS_PER_PAGE,
    currentPage * ACHIEVEMENTS_PER_PAGE,
  );

  useEffect(() => {
    setCurrentPage(1);
  }, [filterTab]);

  useEffect(() => {
    setCurrentPage(page => Math.min(page, Math.max(totalPages, 1)));
  }, [totalPages]);

  const overallProgress = counts.ALL > 0 ? Math.round((counts.CLAIMED / counts.ALL) * 100) : 0;

  const handleClaim = async (milestoneId) => {
    setClaimingId(milestoneId);
    try {
      await claimReward(milestoneId);
      toast.success('รับรางวัลแล้ว สามารถใช้งานได้ทันที');
    } catch (claimError) {
      toast.error(claimError?.response?.data?.message || 'ไม่สามารถรับรางวัลได้');
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
      toast.success(`ใช้กรอบ “${milestone.reward.name}” แล้ว`);
    } catch (equipError) {
      toast.error(equipError.message || 'ไม่สามารถเปลี่ยนกรอบรูปได้');
    } finally {
      setEquippingId(null);
    }
  };

  return (
    <main className="min-h-screen bg-background">
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 sm:py-10 lg:px-8">
        <section className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-primary to-primary-dark px-6 py-8 text-white shadow-lg shadow-blue-500/15 sm:px-9 sm:py-10">
          <div className="pointer-events-none absolute -right-20 -top-24 h-72 w-72 rounded-full bg-white/10" />
          <div className="relative flex flex-col gap-7 lg:flex-row lg:items-center lg:justify-between">
            <div className="flex items-start gap-4 sm:gap-5">
              <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-white/15 backdrop-blur-sm sm:h-16 sm:w-16">
                <Trophy className="h-7 w-7 sm:h-8 sm:w-8" />
              </div>
              <div>
                <h1 className="text-3xl font-extrabold tracking-tight sm:text-4xl">ความสำเร็จของคุณ</h1>
                <p className="mt-2 max-w-2xl text-sm leading-7 text-blue-100 sm:text-base">
                  ทำภารกิจให้สำเร็จ สะสมรางวัล และเลือกใช้กรอบโปรไฟล์ที่เป็นสไตล์ของคุณ
                </p>
              </div>
            </div>

            <div className="min-w-64 rounded-2xl bg-white/12 p-4 backdrop-blur-sm">
              <div className="flex items-center justify-between text-sm font-semibold text-blue-100">
                <span>สำเร็จแล้ว {counts.CLAIMED} จาก {counts.ALL}</span>
                <span className="text-lg font-extrabold text-white">{overallProgress}%</span>
              </div>
              <div className="mt-3 h-2.5 overflow-hidden rounded-full bg-white/20">
                <div className="h-full rounded-full bg-white transition-[width] duration-500" style={{ width: `${overallProgress}%` }} />
              </div>
            </div>
          </div>
        </section>

        <nav className="mt-7 flex gap-2 overflow-x-auto pb-2" aria-label="กรองภารกิจตามสถานะ">
          {FILTERS.map(({ id, label, icon: FilterIcon }) => {
            const isActive = filterTab === id;
            return (
              <button
                key={id}
                type="button"
                aria-pressed={isActive}
                onClick={() => setFilterTab(id)}
                className={`flex shrink-0 items-center gap-2 rounded-full px-4 py-2.5 text-sm font-bold transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 ${
                  isActive
                    ? 'bg-primary text-white shadow-sm'
                    : 'border border-slate-200 bg-white text-slate-600 hover:border-blue-200 hover:bg-blue-50 hover:text-primary-dark'
                }`}
              >
                <FilterIcon className="h-4 w-4" />
                {label}
                <span className={`rounded-full px-2 py-0.5 text-xs ${isActive ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-600'}`}>
                  {counts[id]}
                </span>
              </button>
            );
          })}
        </nav>

        <section className="mt-5" aria-live="polite">
          {isLoading ? (
            <div className="flex min-h-72 flex-col items-center justify-center rounded-3xl border border-slate-200 bg-white text-center shadow-sm">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
              <p className="mt-4 font-bold text-slate-800">กำลังโหลดความสำเร็จ...</p>
            </div>
          ) : error ? (
            <div className="rounded-3xl border border-red-200 bg-red-50 px-6 py-12 text-center">
              <p className="text-lg font-bold text-red-900">โหลดภารกิจไม่สำเร็จ</p>
              <p className="mt-1 text-sm text-red-700">ตรวจสอบการเชื่อมต่อ แล้วลองใหม่อีกครั้ง</p>
              <button type="button" onClick={() => fetchMilestones({ force: true })} className="mt-5 rounded-xl bg-primary px-5 py-3 text-sm font-bold text-white hover:bg-primary-dark">
                ลองใหม่
              </button>
            </div>
          ) : filteredMilestones.length === 0 ? (
            <div className="rounded-3xl border border-dashed border-slate-300 bg-white px-6 py-14 text-center">
              <Award className="mx-auto h-10 w-10 text-slate-400" />
              <h2 className="mt-4 text-xl font-bold text-slate-900">ยังไม่มีภารกิจในหมวดนี้</h2>
              <button type="button" onClick={() => setFilterTab('ALL')} className="mt-5 rounded-xl bg-primary px-5 py-3 text-sm font-bold text-white hover:bg-primary-dark">
                ดูภารกิจทั้งหมด
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-3">
              {paginatedMilestones.map((milestone) => (
                <AchievementCard
                  key={milestone.id}
                  milestone={milestone}
                  avatarSrc={avatarSrc}
                  currentEquippedFrameId={currentEquippedFrameId}
                  claimingId={claimingId}
                  equippingId={equippingId}
                  onClaim={handleClaim}
                  onEquipFrame={handleEquipFrame}
                />
              ))}
            </div>
          )}
          {!isLoading && !error && (
            <Pagination
              currentPage={currentPage}
              totalPages={totalPages}
              onPageChange={setCurrentPage}
              className="mt-8"
            />
          )}
        </section>
      </div>
    </main>
  );
}
