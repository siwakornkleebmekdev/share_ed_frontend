import { useEffect } from 'react';
import { Image as ImageIcon } from 'lucide-react';
import useAchievementStore from '@/store/achievementStore';
import useAuthStore from '@/store/authStore';

export default function SettingsAchievements() {
  const { milestones, isLoading, fetchMilestones } = useAchievementStore();
  const { user } = useAuthStore();
  const avatarSrc = user?.avatar_url || user?.user_metadata?.avatar_url || user?.avatar
    || `https://ui-avatars.com/api/?name=${encodeURIComponent(user?.display_name || user?.username || 'User')}&background=1e293b&color=38bdf8`;

  useEffect(() => {
    fetchMilestones();
  }, [fetchMilestones]);

  const doneCount = milestones.filter((m) => m.status !== 'LOCKED').length;
  const totalCount = milestones.length;
  const percent = totalCount > 0 ? Math.round((doneCount / totalCount) * 100) : 0;

  const formatCompletedAt = (isoString) => {
    if (!isoString) return null;
    const date = new Date(isoString);
    const datePart = date.toLocaleDateString('th-TH', { day: 'numeric', month: 'short', year: 'numeric' });
    const timePart = date.toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' });
    return `${datePart} ${timePart} น.`;
  };

  return (
    <div className="max-w-3xl space-y-6">
      <div>
        <h1 className="text-2xl font-extrabold text-slate-800">Achievements</h1>
        <p className="text-slate-500 mt-1">รายการความสำเร็จทั้งหมดและสถานะของคุณ</p>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-16 text-slate-400">กำลังโหลด...</div>
      ) : (
        <>
          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6">
            <div className="flex items-center justify-between mb-3">
              <p className="font-bold text-slate-800">{doneCount} จาก {totalCount} ความสำเร็จที่ทำได้</p>
              <p className="font-bold text-slate-500 text-sm">({percent}%)</p>
            </div>
            <div className="h-2.5 w-full bg-slate-100 rounded-full overflow-hidden">
              <div className="h-full bg-primary rounded-full transition-all" style={{ width: `${percent}%` }} />
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm divide-y divide-slate-100">
            {milestones.map((milestone) => {
              const done = milestone.status !== 'LOCKED';
              const hasImageReward = milestone.reward.type === 'WALLPAPER' && milestone.reward.previewUrl;

              return (
                <div key={milestone.id} className="flex items-center gap-4 p-5">
                  {hasImageReward ? (
                    <div className="h-14 w-14 rounded-xl shrink-0 overflow-hidden bg-slate-100">
                      <img
                        src={milestone.reward.previewUrl}
                        alt={milestone.reward.name}
                        className="w-full h-full object-cover"
                        style={!done ? { filter: 'grayscale(1)', opacity: 0.5 } : undefined}
                      />
                    </div>
                  ) : milestone.reward.type === 'FRAME' ? (
                    <div className={`h-14 w-14 rounded-full shrink-0 overflow-hidden border-4 ${done ? 'border-amber-400' : 'border-slate-200 opacity-50'}`}>
                      <img
                        src={avatarSrc}
                        alt=""
                        className="w-full h-full object-cover"
                        style={!done ? { filter: 'grayscale(1)' } : undefined}
                      />
                    </div>
                  ) : (
                    <div className="h-14 w-14 rounded-xl shrink-0 flex items-center justify-center bg-slate-100">
                      <ImageIcon className="h-6 w-6 text-slate-300" />
                    </div>
                  )}

                  <div className="flex-1 min-w-0">
                    <p className="font-bold text-slate-800">{milestone.title}</p>
                    <p className="text-sm text-slate-500 mt-0.5">{milestone.description}</p>
                    <p className={`text-xs font-semibold mt-1 ${done ? 'text-primary' : 'text-slate-400'}`}>
                      {done ? 'ได้รับ' : 'รางวัล'}: {milestone.reward.type === 'FRAME' ? 'กรอบรูป' : 'ภาพพื้นหลัง'} {milestone.reward.name}
                    </p>
                  </div>

                  <div className="w-40 shrink-0 text-right">
                    <p className={`text-xs font-bold whitespace-nowrap ${done ? 'text-primary' : 'text-slate-400'}`}>
                      {done ? 'ทำสำเร็จแล้ว' : 'ยังไม่ได้ทำ'}
                    </p>
                    {done && milestone.completedAt && (
                      <p className="text-[11px] text-slate-400 whitespace-nowrap mt-0.5">
                        {formatCompletedAt(milestone.completedAt)}
                      </p>
                    )}
                    <div className="h-1.5 w-full bg-slate-100 rounded-full overflow-hidden mt-1.5">
                      <div className={`h-full rounded-full ${done ? 'bg-primary w-full' : 'w-0'}`} />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
}
