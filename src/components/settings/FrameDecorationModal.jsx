import { useState } from 'react';
import { Link } from 'react-router';
import { Sparkles, X, Lock, Check, ChevronRight } from 'lucide-react';
import AvatarWithFrame from '@/components/profile/AvatarWithFrame';

// Selecting an owned reward applies it immediately.
export default function FrameDecorationModal({ isOpen, onClose, frames = [], currentFrameId, avatarSrc, onSelect }) {
  const [filterTab, setFilterTab] = useState('ALL'); // 'ALL' | 'UNLOCKED' | 'LOCKED'


  const allFrames = Array.isArray(frames) ? frames : [];

  if (!isOpen) return null;

  const unlockedCount = allFrames.filter((f) => f.status === 'CLAIMED').length;
  const lockedCount = allFrames.filter((f) => f.status !== 'CLAIMED').length;

  const displayedFrames = allFrames.filter((frame) => {
    if (filterTab === 'UNLOCKED') return frame.status === 'CLAIMED';
    if (filterTab === 'LOCKED') return frame.status !== 'CLAIMED';
    return true;
  });

  const selectFrame = (frame) => {
    if (frame.status !== 'CLAIMED') return;
    const rewardItemId = frame.reward_item_id || frame.reward_item?.id || frame.reward?.id;
    if (!rewardItemId) return;
    onSelect(rewardItemId);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-[120] flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm" onClick={onClose}>
      <div
        className="bg-white rounded-3xl shadow-2xl w-full max-w-2xl max-h-[88vh] overflow-hidden flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-slate-100 shrink-0">
          <div className="flex items-center gap-3">
            <div className="h-9 w-9 rounded-xl bg-primary/10 flex items-center justify-center">
              <Sparkles className="h-4.5 w-4.5 text-primary" />
            </div>
            <div>
              <h2 className="font-bold text-slate-800 text-lg">เลือกกรอบรูปโปรไฟล์</h2>
              <p className="text-xs text-slate-400">ปลดล็อกกรอบรูปพิเศษจากการทำภารกิจความสำเร็จ</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-50 transition-colors">
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-6">
          <div>
            {/* Filter Tabs */}
            <div className="flex items-center gap-1.5 mb-4 bg-slate-100/80 p-1 rounded-xl w-fit">
              <button
                type="button"
                onClick={() => setFilterTab('ALL')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                  filterTab === 'ALL' ? 'bg-white text-slate-800 shadow-xs' : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                ทั้งหมด ({allFrames.length})
              </button>
              <button
                type="button"
                onClick={() => setFilterTab('UNLOCKED')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                  filterTab === 'UNLOCKED' ? 'bg-white text-emerald-700 shadow-xs' : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                ปลดล็อกแล้ว ({unlockedCount})
              </button>
              <button
                type="button"
                onClick={() => setFilterTab('LOCKED')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                  filterTab === 'LOCKED' ? 'bg-white text-amber-700 shadow-xs' : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                ยังไม่ปลดล็อก ({lockedCount})
              </button>
            </div>

            {displayedFrames.length === 0 ? (
              <div className="text-center py-12">
                <p className="text-sm text-slate-400">ไม่มีกรอบรูปในหมวดนี้</p>
                <Link to="/achievements" onClick={onClose} className="inline-flex items-center gap-1 mt-2 text-xs font-bold text-primary hover:underline">
                  ไปดูภารกิจความสำเร็จ <ChevronRight className="h-3.5 w-3.5" />
                </Link>
              </div>
            ) : (
              <div className="grid grid-cols-3 sm:grid-cols-4 gap-3">
                {/* No Frame Option */}
                {filterTab !== 'LOCKED' && (
                  <button
                    type="button"
                    onClick={() => { onSelect(null); onClose(); }}
                    className={`flex flex-col items-center gap-1.5 p-3 rounded-2xl border-2 transition-all ${
                      currentFrameId === null ? 'border-primary bg-primary/5' : 'border-slate-100 hover:border-slate-200'
                    }`}
                  >
                    <div className="h-14 w-14 rounded-full border-2 border-dashed border-slate-300 flex items-center justify-center text-slate-400">
                      <X className="h-4 w-4" />
                    </div>
                    <span className="text-[11px] font-bold text-slate-600">ไม่ใช้กรอบ</span>
                    <span className="text-[9px] font-bold text-slate-400">เริ่มต้น</span>
                  </button>
                )}

                {displayedFrames.map((frame) => {
                  const locked = frame.status !== 'CLAIMED';
                  const isSelected =
                    currentFrameId === (frame.reward_item_id || frame.reward_item?.id || frame.reward?.id);

                  return (
                    <button
                      key={frame.id}
                      type="button"
                      disabled={locked || !(frame.reward_item_id || frame.reward_item?.id || frame.reward?.id)}
                      onClick={() => selectFrame(frame)}
                      className={`relative flex flex-col items-center gap-1.5 p-2.5 rounded-2xl border-2 transition-all ${
                        isSelected
                          ? 'border-primary bg-primary/5 shadow-xs'
                          : locked
                          ? 'border-slate-100 bg-slate-50/50 cursor-not-allowed'
                          : 'border-slate-100 hover:border-slate-200 hover:bg-slate-50/30'
                      }`}
                    >
                      <div className="relative">
                        <AvatarWithFrame avatarSrc={avatarSrc} avatarAlt="" frameSrc={frame.reward?.previewUrl} frameAlt={frame.reward?.name || ''} sizeClass="h-14 w-14" className={locked ? 'opacity-60' : ''} />

                        {/* Lock overlay icon on card */}
                        {locked && (
                          <span className="absolute inset-0 bg-slate-900/40 flex items-center justify-center z-10">
                            <Lock className="h-4 w-4 text-white drop-shadow" />
                          </span>
                        )}

                        {/* Active checkmark */}
                        {isSelected && !locked && (
                          <span className="absolute bottom-0 right-0 h-4 w-4 rounded-full bg-primary border-2 border-white flex items-center justify-center z-10">
                            <Check className="h-2.5 w-2.5 text-white" />
                          </span>
                        )}
                      </div>

                      <span className="text-[11px] font-bold text-slate-700 text-center line-clamp-1 w-full px-0.5">
                        {frame.reward?.name || frame.title}
                      </span>

                      {/* Status Tag */}
                      {locked ? (
                        <span className="inline-flex items-center gap-0.5 text-[9px] font-extrabold px-1.5 py-0.5 rounded-full bg-slate-200/80 text-slate-600">
                          <Lock className="h-2.5 w-2.5" /> ล็อก
                        </span>
                      ) : (
                        <span className="text-[9px] font-extrabold px-1.5 py-0.5 rounded-full bg-emerald-50 text-emerald-600">
                          พร้อมใช้
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            )}
          </div>

        </div>

      </div>
    </div>
  );
}
