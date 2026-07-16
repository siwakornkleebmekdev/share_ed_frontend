import { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import { DEFAULT_WIDGET_OPTIONS } from '@/pages/settings/widgetConstants';
import WidgetCard from '@/components/settings/WidgetCard';

// Add/edit modal for a single platform's widget — structural clone of
// FrameDecorationModal.jsx (overlay, backdrop-click-to-close, staged local
// state, live preview pane). Serves both add (initialData: null) and edit
// (initialData: {url, options}) so there's one modal, not five.
export default function WidgetModal({ isOpen, onClose, platformConfig, initialData, cardTheme, onConfirm }) {
  const [url, setUrl] = useState('');
  const [options, setOptions] = useState(DEFAULT_WIDGET_OPTIONS);

  useEffect(() => {
    if (isOpen) {
      setUrl(initialData?.url || '');
      setOptions({ ...DEFAULT_WIDGET_OPTIONS, ...(initialData?.options || {}) });
    }
  }, [isOpen, initialData, platformConfig]);

  if (!isOpen || !platformConfig) return null;

  const Icon = platformConfig.icon;
  const isEdit = !!initialData;
  const urlError = url && !url.startsWith('http://') && !url.startsWith('https://')
    ? 'URL ต้องขึ้นต้นด้วย http:// หรือ https://'
    : '';

  const toggle = (key, label, desc) => (
    <label key={key} className="flex items-center justify-between bg-slate-50 border border-slate-200 rounded-xl p-4 cursor-pointer">
      <div>
        <p className="font-bold text-slate-700 text-sm">{label}</p>
        <p className="text-xs text-slate-500">{desc}</p>
      </div>
      <button
        type="button"
        role="switch"
        aria-checked={!!options[key]}
        onClick={() => setOptions((prev) => ({ ...prev, [key]: !prev[key] }))}
        className={`relative h-6 w-11 rounded-full transition-colors shrink-0 ${options[key] ? 'bg-primary' : 'bg-slate-300'}`}
      >
        <span className={`absolute top-0.5 left-0.5 h-5 w-5 bg-white rounded-full shadow transition-transform ${options[key] ? 'translate-x-5' : 'translate-x-0'}`} />
      </button>
    </label>
  );

  return (
    <div className="fixed inset-0 z-[120] flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm" onClick={onClose}>
      <div
        className="bg-white rounded-3xl shadow-2xl w-full max-w-2xl max-h-[85vh] overflow-hidden flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-6 py-5 border-b border-slate-100 shrink-0">
          <div className="flex items-center gap-3">
            <div className="h-9 w-9 rounded-xl flex items-center justify-center" style={{ backgroundColor: `${platformConfig.brandColor}1A` }}>
              <Icon className="h-4.5 w-4.5" color={platformConfig.brandColor} />
            </div>
            <div>
              <h2 className="font-bold text-slate-800 text-lg">
                {isEdit ? 'แก้ไข' : 'เพิ่ม'} {platformConfig.label} · วิดเจ็ต
              </h2>
              <p className="text-xs text-slate-400">วางลิงก์ แล้วดูตัวอย่างทางขวา</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-50 transition-colors">
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6 grid grid-cols-1 sm:grid-cols-[1fr_220px] gap-6">
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-semibold text-slate-600 mb-2">ลิงก์</label>
              <input
                type="text"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                placeholder={platformConfig.urlPlaceholder}
                className={`w-full px-4 py-3 bg-slate-50 border rounded-xl focus:outline-none focus:ring-4 transition-all text-slate-800 font-medium ${urlError ? 'border-red-300 focus:ring-red-500/20 focus:border-red-500' : 'border-slate-200 focus:ring-primary/10 focus:border-primary'}`}
              />
              {urlError && <p className="mt-2 text-xs font-bold text-red-500">{urlError}</p>}
            </div>

            {toggle('insideProfileCard', 'แสดงในการ์ดโปรไฟล์', 'แสดงวิดเจ็ตนี้บนหน้าโปรไฟล์ของคุณ')}
            {toggle('useCardStyle', 'ใช้พื้นตามสไตล์การ์ด', 'ใช้สีและความโค้งมนเดียวกับการ์ดโปรไฟล์')}
            {toggle(platformConfig.extraOptionKey, platformConfig.extraOptionLabel, platformConfig.extraOptionDesc)}
          </div>

          <div className="space-y-2">
            <span className="text-xs font-bold text-slate-400">ตัวอย่าง</span>
            <WidgetCard platform={platformConfig} url={url} options={options} cardTheme={cardTheme} preview />
          </div>
        </div>

        <div className="px-6 py-4 border-t border-slate-100 shrink-0">
          <button
            type="button"
            disabled={!url || !!urlError}
            onClick={() => { onConfirm(platformConfig.id, { url, options }); onClose(); }}
            className="w-full px-6 py-2.5 rounded-xl font-bold text-sm text-white bg-primary hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed shadow-sm transition-all"
          >
            {isEdit ? 'บันทึกการเปลี่ยนแปลง' : '+ เพิ่มวิดเจ็ต'}
          </button>
        </div>
      </div>
    </div>
  );
}
