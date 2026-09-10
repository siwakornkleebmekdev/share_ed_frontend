import { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router';
import { Sparkles, X, Lock, Check } from 'lucide-react';
import { DEFAULT_FRAMES } from '@/services/profile.service';

// Modal grid picker for equipping a profile-picture frame, styled after the
// "Change Avatar Decoration" pattern (grid of tiles + live preview + Clear /
// Confirm) — selection is staged locally and only committed on Confirm, so
// browsing the grid doesn't equip anything until the user commits to it.
export default function FrameDecorationModal({ isOpen, onClose, frames = [], currentFrameId, avatarSrc, avatarShapeClass, onConfirm }) {
  const [selected, setSelected] = useState(currentFrameId ?? null);

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
        list.unshift(df);
      }
    });
    return list;
  }, [frames]);

  if (!isOpen) return null;

  const selectedFrame = allFrames.find(
    (f) =>
      f.id === selected ||
      f.reward_item_id === selected ||
      f.reward?.id === selected,
  );

  return (
    <div className="fixed inset-0 z-[120] flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm" onClick={onClose}>
      <div
        className="bg-white rounded-3xl shadow-2xl w-full max-w-3xl max-h-[85vh] overflow-hidden flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-6 py-5 border-b border-slate-100 shrink-0">
          <div className="flex items-center gap-3">
            <div className="h-9 w-9 rounded-xl bg-primary/10 flex items-center justify-center">
              <Sparkles className="h-4.5 w-4.5 text-primary" />
            </div>
            <h2 className="font-bold text-slate-800 text-lg">เลือกกรอบรูปโปรไฟล์</h2>
          </div>
          <button onClick={onClose} className="p-2 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-50 transition-colors">
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6 grid grid-cols-1 sm:grid-cols-[1fr_180px] gap-6">
          <div>
            {allFrames.length === 0 ? (
              <p className="text-sm text-slate-400 py-10 text-center">
                ยังไม่มีกรอบให้เลือก — <Link to="/achievements" className="text-primary font-semibold hover:underline">ไปทำภารกิจเพื่อปลดล็อกกรอบ</Link>
              </p>
            ) : (
              <div className="grid grid-cols-3 sm:grid-cols-4 gap-3">
                <button
                  type="button"
                  onClick={() => setSelected(null)}
                  className={`flex flex-col items-center gap-2 p-3 rounded-2xl border-2 transition-all ${selected === null ? 'border-primary bg-primary/5' : 'border-slate-100 hover:border-slate-200'}`}
                >
                  <div className="h-12 w-12 rounded-full border-2 border-dashed border-slate-300 flex items-center justify-center text-slate-400">
                    <X className="h-4 w-4" />
                  </div>
                  <span className="text-[11px] font-bold text-slate-600">ไม่ใช้กรอบ</span>
                </button>

                {allFrames.map((frame) => {
                  const locked = frame.status !== 'CLAIMED';
                  const isSelected =
                    selected === frame.id ||
                    (frame.reward_item_id && selected === frame.reward_item_id) ||
                    (frame.reward?.id && selected === frame.reward?.id);
                  return (
                    <button
                      key={frame.id}
                      type="button"
                      disabled={locked}
                      title={locked ? 'ต้องปลดล็อกจากภารกิจก่อน' : frame.reward.name}
                      onClick={() => setSelected(frame.id)}
                      className={`flex flex-col items-center gap-2 p-3 rounded-2xl border-2 transition-all ${
                        locked ? 'border-slate-100 opacity-50 cursor-not-allowed' : isSelected ? 'border-primary bg-primary/5' : 'border-slate-100 hover:border-slate-200'
                      }`}
                    >
                      <div className={`relative h-14 w-14 rounded-full overflow-hidden border-2 ${isSelected ? 'border-primary ring-2 ring-primary/20' : 'border-slate-200'}`}>
                        <img src={avatarSrc} alt="" className="w-full h-full object-cover" style={locked ? { filter: 'grayscale(1)' } : undefined} />
                        {frame.reward?.previewUrl ? (
                          <img
                            src={frame.reward.previewUrl}
                            alt={frame.reward.name}
                            className={`absolute inset-0 w-full h-full object-cover pointer-events-none ${locked ? 'grayscale opacity-40' : ''}`}
                          />
                        ) : (
                          <div className="absolute inset-0 border-2 border-amber-400 pointer-events-none rounded-full" />
                        )}
                        {locked && (
                          <span className="absolute inset-0 bg-slate-900/40 flex items-center justify-center z-10">
                            <Lock className="h-3.5 w-3.5 text-white" />
                          </span>
                        )}
                        {isSelected && !locked && (
                          <span className="absolute bottom-0 right-0 h-4 w-4 rounded-full bg-primary border-2 border-white flex items-center justify-center z-10">
                            <Check className="h-2.5 w-2.5 text-white" />
                          </span>
                        )}
                      </div>
                      <span className="text-[11px] font-bold text-slate-600 text-center line-clamp-1">{frame.reward.name}</span>
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          <div className="flex flex-col items-center gap-3 border-t sm:border-t-0 sm:border-l border-slate-100 pt-6 sm:pt-0 sm:pl-6">
            <span className="text-xs font-bold text-slate-400 self-start sm:self-center">พรีวิว</span>
            <div className={`relative h-28 w-28 border-2 overflow-hidden shrink-0 ${selected ? 'border-primary/40' : 'border-slate-200'} ${avatarShapeClass}`}>
              <img src={avatarSrc} alt="" className="w-full h-full object-cover" />
              {selectedFrame && (
                selectedFrame.reward?.previewUrl ? (
                  <img
                    src={selectedFrame.reward.previewUrl}
                    alt={selectedFrame.reward.name}
                    className="absolute inset-0 w-full h-full object-cover pointer-events-none z-10"
                  />
                ) : (
                  <div className={`absolute inset-0 border-4 border-amber-400 mix-blend-overlay pointer-events-none ${avatarShapeClass}`} />
                )
              )}
            </div>
            <p className="text-xs font-semibold text-slate-500 text-center">{selectedFrame ? selectedFrame.reward.name : 'ไม่ใช้กรอบ'}</p>
          </div>
        </div>

        <div className="flex items-center justify-between px-6 py-4 border-t border-slate-100 shrink-0">
          <button type="button" onClick={() => setSelected(null)} className="px-4 py-2.5 rounded-xl font-bold text-sm text-slate-600 hover:bg-slate-50 transition-colors">
            ล้างค่า
          </button>
          <button
            type="button"
            onClick={() => { onConfirm(selected); onClose(); }}
            className="px-6 py-2.5 rounded-xl font-bold text-sm text-white bg-primary hover:bg-blue-600 shadow-sm transition-all"
          >
            ยืนยัน
          </button>
        </div>
      </div>
    </div>
  );
}
