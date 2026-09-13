import { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router';
import { Sparkles, X, Lock, Check, ChevronRight } from 'lucide-react';
import { DEFAULT_FRAMES } from '@/services/profile.service';

// Modal grid picker for equipping a profile-picture frame, styled after the
// "Change Avatar Decoration" pattern (grid of tiles + live preview + Clear /
// Confirm) — selection is staged locally and only committed on Confirm, so
// browsing the grid doesn't equip anything until the user commits to it.
export default function FrameDecorationModal({ isOpen, onClose, frames = [], currentFrameId, avatarSrc, avatarShapeClass, onConfirm }) {
  const [selected, setSelected] = useState(currentFrameId ?? null);
  const [filterTab, setFilterTab] = useState('ALL'); // 'ALL' | 'UNLOCKED' | 'LOCKED'

  useEffect(() => {
    if (isOpen) setSelected(currentFrameId ?? null);
  }, [isOpen, currentFrameId]);

  const allFrames = useMemo(() => {
    const list = Array.isArray(frames) && frames.length > 0 ? [...frames] : [];
    DEFAULT_FRAMES.forEach((df) => {
      if (
        !list.some(
          (f) =>
            f.id === df.id ||
            f.reward_item_id === df.id ||
            f.reward?.previewUrl === df.reward?.previewUrl,
        )
      ) {
        list.push(df);
      }
    });

    // Check localStorage claimed milestones
    try {
      const claimedLocal = JSON.parse(localStorage.getItem("claimed_milestones") || "[]");
      list.forEach((f) => {
        if (
          claimedLocal.includes(f.id) ||
          claimedLocal.includes(f.reward_item_id) ||
          claimedLocal.includes(f.reward?.id)
        ) {
          f.status = "CLAIMED";
        }
      });
    } catch (_) {}

    return list;
  }, [frames]);

  if (!isOpen) return null;

  const unlockedCount = allFrames.filter((f) => f.status === 'CLAIMED').length;
  const lockedCount = allFrames.filter((f) => f.status !== 'CLAIMED').length;

  const displayedFrames = allFrames.filter((frame) => {
    if (filterTab === 'UNLOCKED') return frame.status === 'CLAIMED';
    if (filterTab === 'LOCKED') return frame.status !== 'CLAIMED';
    return true;
  });

  const selectedFrame = allFrames.find(
    (f) =>
      f.id === selected ||
      f.reward_item_id === selected ||
      f.reward?.id === selected,
  );

  const isSelectedLocked = selectedFrame ? selectedFrame.status !== 'CLAIMED' : false;

  return (
    <div className="fixed inset-0 z-[120] flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm" onClick={onClose}>
      <div
        className="bg-white rounded-3xl shadow-2xl w-full max-w-3xl max-h-[88vh] overflow-hidden flex flex-col"
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
        <div className="flex-1 overflow-y-auto p-6 grid grid-cols-1 sm:grid-cols-[1fr_210px] gap-6">
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
                    onClick={() => setSelected(null)}
                    className={`flex flex-col items-center gap-1.5 p-3 rounded-2xl border-2 transition-all ${
                      selected === null ? 'border-primary bg-primary/5' : 'border-slate-100 hover:border-slate-200'
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
                    selected === frame.id ||
                    (frame.reward_item_id && selected === frame.reward_item_id) ||
                    (frame.reward?.id && selected === frame.reward?.id);

                  return (
                    <button
                      key={frame.id}
                      type="button"
                      onClick={() => setSelected(frame.id)}
                      className={`relative flex flex-col items-center gap-1.5 p-2.5 rounded-2xl border-2 transition-all ${
                        isSelected
                          ? 'border-primary bg-primary/5 shadow-xs'
                          : locked
                          ? 'border-slate-100 bg-slate-50/50 hover:border-slate-200'
                          : 'border-slate-100 hover:border-slate-200 hover:bg-slate-50/30'
                      }`}
                    >
                      <div
                        className={`relative h-14 w-14 rounded-full overflow-hidden border-2 ${
                          isSelected ? 'border-primary ring-2 ring-primary/20' : 'border-slate-200'
                        }`}
                      >
                        <img
                          src={avatarSrc}
                          alt=""
                          className="w-full h-full object-cover"
                          style={locked ? { filter: 'grayscale(0.6) brightness(0.85)' } : undefined}
                        />
                        {frame.reward?.previewUrl ? (
                          <img
                            src={frame.reward.previewUrl}
                            alt={frame.reward.name}
                            className={`absolute inset-0 w-full h-full object-cover pointer-events-none ${
                              locked ? 'grayscale opacity-50' : ''
                            }`}
                          />
                        ) : (
                          <div className="absolute inset-0 border-2 border-amber-400 pointer-events-none rounded-full" />
                        )}

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
                        {frame.reward.name}
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

          {/* Right Preview Column */}
          <div className="flex flex-col items-center gap-3 border-t sm:border-t-0 sm:border-l border-slate-100 pt-6 sm:pt-0 sm:pl-6">
            <span className="text-xs font-bold text-slate-400 self-start sm:self-center">ตัวอย่างการแสดงผล</span>

            <div className={`relative h-28 w-28 border-2 overflow-hidden shrink-0 shadow-sm ${selected ? 'border-primary/40' : 'border-slate-200'} ${avatarShapeClass}`}>
              <img src={avatarSrc} alt="" className="w-full h-full object-cover" />
              {selectedFrame && selectedFrame.reward?.previewUrl && (
                <img
                  src={selectedFrame.reward.previewUrl}
                  alt={selectedFrame.reward.name}
                  className={`absolute inset-0 w-full h-full object-cover pointer-events-none z-10 ${
                    isSelectedLocked ? 'grayscale opacity-75' : ''
                  }`}
                />
              )}
            </div>

            {/* Frame Info & Requirement Card */}
            {selectedFrame ? (
              <div className="w-full text-center">
                <p className="text-xs font-bold text-slate-800 line-clamp-1">{selectedFrame.reward.name}</p>

                {isSelectedLocked ? (
                  <div className="mt-3 p-3 bg-amber-50/90 border border-amber-200/80 rounded-2xl text-left">
                    <div className="flex items-center gap-1.5 text-amber-800 text-[11px] font-bold mb-1">
                      <Lock className="h-3.5 w-3.5 text-amber-600" /> ต้องปลดล็อกจากภารกิจ
                    </div>
                    <p className="text-xs font-bold text-slate-800 line-clamp-1">{selectedFrame.title}</p>
                    <p className="text-[11px] text-slate-600 mt-0.5 leading-relaxed">{selectedFrame.description}</p>
                    <div className="mt-2.5 pt-2 border-t border-amber-200/60 flex items-center justify-between text-[11px]">
                      <span className="font-bold text-amber-900">
                        {selectedFrame.current ?? 0} / {selectedFrame.target ?? 1}
                      </span>
                      <Link
                        to="/achievements"
                        onClick={onClose}
                        className="text-primary font-bold hover:underline inline-flex items-center text-[11px]"
                      >
                        ไปทำภารกิจ &rarr;
                      </Link>
                    </div>
                  </div>
                ) : (
                  <div className="mt-2 inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-50 text-emerald-600">
                    <Check className="h-3 w-3" /> ปลดล็อกแล้ว พร้อมใช้งาน
                  </div>
                )}
              </div>
            ) : (
              <p className="text-xs font-semibold text-slate-400 text-center">ไม่ใช้กรอบรูป</p>
            )}
          </div>
        </div>

        {/* Modal Footer */}
        <div className="flex items-center justify-between px-6 py-4 border-t border-slate-100 shrink-0 bg-slate-50/50">
          <button
            type="button"
            onClick={() => setSelected(null)}
            className="px-4 py-2.5 rounded-xl font-bold text-sm text-slate-600 hover:bg-slate-100 transition-colors"
          >
            ไม่ใช้กรอบ
          </button>

          {isSelectedLocked ? (
            <button
              type="button"
              disabled
              className="px-6 py-2.5 rounded-xl font-bold text-sm text-slate-400 bg-slate-100 cursor-not-allowed flex items-center gap-1.5 shadow-none"
            >
              <Lock className="h-4 w-4" /> ยังไม่ปลดล็อกกรอบนี้
            </button>
          ) : (
            <button
              type="button"
              onClick={() => {
                onConfirm(selected);
                onClose();
              }}
              className="px-6 py-2.5 rounded-xl font-bold text-sm text-white bg-primary hover:bg-blue-600 shadow-sm transition-all"
            >
              ใช้งานกรอบนี้
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
