import { useEffect } from 'react';
import { Trophy, Gift, Lock, CheckCircle2, Loader2, Palette } from 'lucide-react';
import toast from 'react-hot-toast';
import useAchievementStore from '@/store/achievementStore';
import useAuthStore from '@/store/authStore';

/**
 * =========================================================================
 * ตำแหน่งบนหน้าเว็บ: ป้ายกำกับสถานะ (Badge Pill) มุมขวาบนของแบนเนอร์ในการ์ดภารกิจแต่ละใบ
 * หน้าที่: กำหนดสีสไตล์และข้อความภาษาไทยตามสถานะของภารกิจ:
 *   - LOCKED: สีเทา "ยังไม่ปลดล็อก"
 *   - READY_TO_CLAIM: สีส้ม "พร้อมรับรางวัล"
 *   - CLAIMED: สีเขียว "ได้รับแล้ว"
 * =========================================================================
 */
const STATUS_META = {
  LOCKED: { pill: 'bg-slate-100 text-slate-500 border border-slate-200', label: 'ยังไม่ปลดล็อก' },
  READY_TO_CLAIM: { pill: 'bg-amber-500 text-white', label: 'พร้อมรับรางวัล' },
  CLAIMED: { pill: 'bg-emerald-500 text-white', label: 'ได้รับแล้ว' },
};

/**
 * =========================================================================
 * ตำแหน่งบนหน้าเว็บ: หน้าความสำเร็จและภารกิจ (/achievements)
 *   - เข้าถึงได้จากเมนู "ความสำเร็จ" ใน Navbar หรือคลิกจากหน้าโปรไฟล์
 * 
 * หน้าที่: แสดงรายการภารกิจและความสำเร็จทั้งหมด (Milestones) ในรูปแบบการ์ด Grid
 *         แสดงเปอร์เซ็นต์ความคืบหน้า (Progress bar), ตัวอย่างของรางวัล (กรอบรูป/ไอเทม)
 *         และปุ่มสำหรับกดรับรางวัลเมื่อทำภารกิจสำเร็จ
 * =========================================================================
 */
export default function Achievements() {
  const { milestones, isLoading, fetchMilestones, claimReward } = useAchievementStore();
  const { user } = useAuthStore();
  const avatarSrc = user?.avatar_url || user?.user_metadata?.avatar_url || user?.avatar
    || `https://ui-avatars.com/api/?name=${encodeURIComponent(user?.display_name || user?.username || 'User')}&background=1e293b&color=38bdf8`;

  /**
   * ตำแหน่งบนหน้าเว็บ: ทำงานอัตโนมัติเมื่อเปิดเข้าสู่หน้า /achievements
   * หน้าที่: เรียกใช้งาน Store เพื่อยิง API ดึงรายการภารกิจทั้งหมดและความคืบหน้าของผู้ใช้มาแสดง
   */
  useEffect(() => {
    fetchMilestones();
  }, [fetchMilestones]);

  /**
   * ตำแหน่งบนหน้าเว็บ: ปุ่มสีส้ม "รับรางวัล" ด้านล่างของการ์ดภารกิจที่ทำสำเร็จแล้ว (สถานะ READY_TO_CLAIM)
   * หน้าที่: ส่งคำขอ API เพื่อยืนยันการรับรางวัลของภารกิจนั้น และแสดงข้อความแจ้งเตือน (Toast) สำเร็จ/ล้มเหลว
   */
  const handleClaim = async (id) => {
    try {
      await claimReward(id);
      toast.success('รับรางวัลสำเร็จ!');
    } catch (error) {
      toast.error(error?.response?.data?.message || 'ไม่สามารถรับรางวัลได้');
    }
  };

  /**
   * ตำแหน่งบนหน้าเว็บ: ป้ายแคปซูลสีขาวมุมขวาบนของหัวข้อหน้าเว็บ (ข้างรูปกล่องของขวัญ Gift)
   * หน้าที่: คำนวณนับจำนวนภารกิจที่ผู้ใช้เคยกดรับรางวัลสำเร็จไปแล้วทั้งหมด
   */
  const claimedCount = milestones.filter((m) => m.status === 'CLAIMED').length;

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      {/* ==================== ส่วนหัวของหน้า (Header) ==================== */}
      {/* แสดงหัวข้อ Achievements, คำอธิบาย, และป้ายสรุปจำนวนรางวัลที่ได้รับแล้ว */}
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

      {/* ==================== สถานะกำลังโหลดข้อมูล (Loading State) ==================== */}
      {isLoading ? (
        <div className="flex flex-col items-center justify-center py-24">
          <Loader2 className="h-8 w-8 text-primary animate-spin mb-4" />
          <p className="text-slate-500 font-medium">กำลังโหลดข้อมูล...</p>
        </div>
      ) : (
        /* ==================== ตารางแสดงการ์ดภารกิจทั้งหมด (Milestones Grid) ==================== */
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {milestones.map((milestone) => {
            const status = STATUS_META[milestone.status];
            const progress = Math.min(100, (milestone.current / milestone.target) * 100);
            const hasReward = !!milestone.reward;
            const hasImage = hasReward && milestone.reward.type !== 'FRAME' && !!milestone.reward.previewUrl;
            const locked = milestone.status === 'LOCKED';

            return (
              <div key={milestone.id} className="rounded-2xl overflow-hidden bg-white border border-slate-100 shadow-sm flex flex-col">
                {/* 1. ส่วนภาพปกแบนเนอร์ด้านบน และป้ายสถานะภารกิจ */}
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
                    {/* ป้ายแสดงสถานะ (ยังไม่ปลดล็อก / พร้อมรับรางวัล / ได้รับแล้ว) */}
                    <span className={`absolute top-3 right-3 px-2.5 py-1 rounded-full text-[11px] font-bold ${status.pill}`}>
                      {status.label}
                    </span>
                  </div>

                  {/* 2. กล่องตัวอย่างของรางวัล (Preview Box) ซ้อนขอบล่างของภาพปก */}
                  {/* หากเป็นกรอบรูป (FRAME) จะแสดงรูป Avatar ของผู้ใช้สวมกรอบรูปให้เห็นล่วงหน้า */}
                  {hasReward && (
                    <div className="absolute left-5 -bottom-10 h-20 w-20 rounded-xl border-4 border-white overflow-hidden shadow-lg bg-slate-100 flex items-center justify-center">
                      {milestone.reward.type === 'FRAME' ? (
                        <div className="relative w-full h-full">
                          <img
                            src={avatarSrc}
                            alt=""
                            className="w-full h-full object-cover"
                            style={locked ? { filter: 'grayscale(0.6) brightness(0.85)' } : undefined}
                          />
                          {milestone.reward.previewUrl && (
                            <img
                              src={milestone.reward.previewUrl}
                              alt={milestone.reward.name}
                              className={`absolute inset-0 w-full h-full object-cover pointer-events-none ${locked ? 'grayscale opacity-40' : ''}`}
                            />
                          )}
                        </div>
                      ) : milestone.reward.previewUrl ? (
                        <img
                          src={milestone.reward.previewUrl}
                          alt={milestone.reward.name}
                          className="w-full h-full object-cover"
                          style={locked ? { filter: 'grayscale(0.6) brightness(0.85)' } : undefined}
                        />
                      ) : (
                        <Palette className="h-8 w-8 text-slate-400" />
                      )}
                    </div>
                  )}
                </div>

                {/* 3. ส่วนเนื้อหาภารกิจ ความคืบหน้า และประเภทของรางวัล */}
                <div className={`${hasReward ? 'pt-12' : 'pt-5'} px-5 pb-5 flex flex-col flex-1`}>
                  {/* ชื่อภารกิจและคำอธิบาย */}
                  <h3 className="font-bold text-slate-800 text-base line-clamp-1">{milestone.title}</h3>
                  <p className="text-sm text-slate-500 mt-1 line-clamp-2">{milestone.description}</p>

                  {/* หลอดแสดงความคืบหน้า (Progress Bar) และตัวเลขเป้าหมาย (แสดงเฉพาะเมื่อยังไม่ปลดล็อก) */}
                  {locked && (
                    <div className="mt-3">
                      <div className="h-1.5 w-full bg-slate-100 rounded-full overflow-hidden">
                        <div className="h-full bg-primary rounded-full" style={{ width: `${progress}%` }} />
                      </div>
                      <p className="text-[11px] text-slate-400 font-medium mt-1">{milestone.current} / {milestone.target}</p>
                    </div>
                  )}

                  {/* ป้ายแสดงชื่อและประเภทของรางวัลที่จะได้รับ */}
                  {hasReward && (
                    <div className="flex items-center gap-1.5 mt-3 text-xs font-semibold text-amber-600">
                      <Gift className="h-3.5 w-3.5" />
                      {milestone.reward.type === 'FRAME' ? 'กรอบรูป' : milestone.reward.type === 'THEME' ? 'ธีม' : 'รางวัล'}: {milestone.reward.name}
                    </div>
                  )}

                  {/* 4. ส่วนปุ่มดำเนินการด้านล่างสุด (สลับตามสถานะ) */}
                  <div className="mt-auto pt-4 border-t border-slate-100">
                    {/* ปุ่ม "รับรางวัล" เมื่อทำภารกิจสำเร็จแล้ว */}
                    {milestone.status === 'READY_TO_CLAIM' && (
                      <button
                        onClick={() => handleClaim(milestone.id)}
                        className="w-full py-2.5 rounded-xl font-bold text-sm bg-amber-500 text-white hover:bg-amber-600 transition-colors shadow-sm"
                      >
                        รับรางวัล
                      </button>
                    )}
                    {/* แถบสีเขียวแสดงว่า "รับรางวัลแล้ว" */}
                    {milestone.status === 'CLAIMED' && (
                      <div className="w-full py-2.5 rounded-xl font-bold text-sm bg-emerald-50 text-emerald-600 flex items-center justify-center gap-1.5">
                        <CheckCircle2 className="h-4 w-4" /> รับรางวัลแล้ว
                      </div>
                    )}
                    {/* ปุ่มสีเทา "ยังไม่ปลดล็อก" เมื่อยังทำภารกิจไม่ครบ */}
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
