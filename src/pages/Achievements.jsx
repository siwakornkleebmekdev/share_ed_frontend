import { useEffect } from 'react';
import { Trophy, Gift, Lock, CheckCircle2, Loader2 } from 'lucide-react';
import toast from 'react-hot-toast';
import useAchievementStore from '@/store/achievementStore';
import useAuthStore from '@/store/authStore';

const STATUS_META = {
  LOCKED: { pill: 'bg-slate-100 text-slate-500 border border-slate-200', label: 'ยังไม่ปลดล็อก' },
  READY_TO_CLAIM: { pill: 'bg-amber-500 text-white', label: 'พร้อมรับรางวัล' },
  CLAIMED: { pill: 'bg-emerald-500 text-white', label: 'ได้รับแล้ว' },
};

export default function Achievements() {
  const { milestones, isLoading, fetchMilestones, claimReward } = useAchievementStore();
  const { user } = useAuthStore();
  const avatarSrc = user?.avatar_url || user?.user_metadata?.avatar_url || user?.avatar
    || `https://ui-avatars.com/api/?name=${encodeURIComponent(user?.display_name || user?.username || 'User')}&background=1e293b&color=38bdf8`;

  useEffect(() => {
    fetchMilestones();
  }, [fetchMilestones]);

  const handleClaim = (id) => {
    claimReward(id);
    toast.success('รับรางวัลสำเร็จ!');
  };

  const claimedCount = milestones.filter((m) => m.status === 'CLAIMED').length;

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      <div className="flex items-center justify-between mb-8 flex-wrap gap-4">
        <div className="flex items-center gap-3">
          <Trophy className="h-7 w-7 text-amber-500" />
          <div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-800">Achievements</h1>
            <p className="text-slate-500 text-sm mt-0.5">ทำภารกิจให้ครบเพื่อปลดล็อกรางวัล</p>
          </div>
        </div>
        <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-white border border-slate-100 shadow-sm text-sm font-bold text-slate-800">
          <Gift className="h-4 w-4 text-amber-500" /> {claimedCount} รางวัลที่ได้รับ
        </div>
      </div>

      {isLoading ? (
        <div className="flex flex-col items-center justify-center py-24">
          <Loader2 className="h-8 w-8 text-primary animate-spin mb-4" />
          <p className="text-slate-500 font-medium">กำลังโหลดข้อมูล...</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {milestones.map((milestone) => {
            const status = STATUS_META[milestone.status];
            const progress = Math.min(100, (milestone.current / milestone.target) * 100);
            const hasImage = milestone.reward.type === 'WALLPAPER' && milestone.reward.previewUrl;
            const locked = milestone.status === 'LOCKED';

            return (
              <div key={milestone.id} className="rounded-2xl overflow-hidden bg-white border border-slate-100 shadow-sm flex flex-col">
                <div className="relative">
                  <div className="h-32 relative overflow-hidden">
                    {hasImage ? (
                      <img
                        src={milestone.reward.previewUrl}
                        alt={milestone.reward.name}
                        className="w-full h-full object-cover"
                        style={locked ? { filter: 'grayscale(0.6) brightness(0.85)' } : undefined}
                      />
                    ) : (
                      <div className={`w-full h-full ${locked ? 'bg-slate-100' : 'bg-gradient-to-br from-amber-200 to-amber-400'}`} />
                    )}
                    <span className={`absolute top-3 right-3 px-2.5 py-1 rounded-full text-[11px] font-bold ${status.pill}`}>
                      {status.label}
                    </span>
                  </div>

                  {/* Reward icon overlapping the cover/body seam, like a
                      game logo sitting in front of its banner art. */}
                  <div className={`absolute left-5 -bottom-10 h-20 w-20 rounded-xl border-4 border-white overflow-hidden shadow-lg ${
                    milestone.reward.type === 'FRAME' ? '' : 'bg-slate-100'
                  }`}>
                    {milestone.reward.type === 'FRAME' ? (
                      <img
                        src={avatarSrc}
                        alt=""
                        className="w-full h-full object-cover"
                        style={locked ? { filter: 'grayscale(0.6) brightness(0.85)' } : undefined}
                      />
                    ) : (
                      <img
                        src={milestone.reward.previewUrl}
                        alt={milestone.reward.name}
                        className="w-full h-full object-cover"
                        style={locked ? { filter: 'grayscale(0.6) brightness(0.85)' } : undefined}
                      />
                    )}
                  </div>
                </div>

                <div className="pt-12 px-5 pb-5 flex flex-col flex-1">
                  <h3 className="font-bold text-slate-800 text-base line-clamp-1">{milestone.title}</h3>
                  <p className="text-sm text-slate-500 mt-1 line-clamp-2">{milestone.description}</p>

                  {locked && (
                    <div className="mt-3">
                      <div className="h-1.5 w-full bg-slate-100 rounded-full overflow-hidden">
                        <div className="h-full bg-primary rounded-full" style={{ width: `${progress}%` }} />
                      </div>
                      <p className="text-[11px] text-slate-400 font-medium mt-1">{milestone.current} / {milestone.target}</p>
                    </div>
                  )}

                  <div className="flex items-center gap-1.5 mt-3 text-xs font-semibold text-amber-600">
                    <Gift className="h-3.5 w-3.5" />
                    {milestone.reward.type === 'FRAME' ? 'กรอบรูป' : 'ภาพพื้นหลัง'}: {milestone.reward.name}
                  </div>

                  <div className="mt-auto pt-4 border-t border-slate-100">
                    {milestone.status === 'READY_TO_CLAIM' && (
                      <button
                        onClick={() => handleClaim(milestone.id)}
                        className="w-full py-2.5 rounded-xl font-bold text-sm bg-amber-500 text-white hover:bg-amber-600 transition-colors shadow-sm"
                      >
                        รับรางวัล
                      </button>
                    )}
                    {milestone.status === 'CLAIMED' && (
                      <div className="w-full py-2.5 rounded-xl font-bold text-sm bg-emerald-50 text-emerald-600 flex items-center justify-center gap-1.5">
                        <CheckCircle2 className="h-4 w-4" /> รับรางวัลแล้ว
                      </div>
                    )}
                    {locked && (
                      <button disabled className="w-full py-2.5 rounded-xl font-bold text-sm bg-slate-100 text-slate-400 cursor-not-allowed flex items-center justify-center gap-1.5">
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
