import { CheckCircle2, AlertCircle, Loader2, RotateCcw, Trash2, Eye, FileText, Image as ImageIcon } from 'lucide-react';
import { formatFileSize } from '@/constants/uploadConstants';

export default function UploadWorkspaceItem({
  item,
  onRemove,
  onRetry,
  onPreview,
  isCover = false,
}) {
  if (!item) return null;

  const isUploading = ['QUEUED', 'SIGNING', 'UPLOADING', 'VERIFYING'].includes(item.status);
  const isVerified = item.status === 'VERIFIED';
  const isFailed = item.status === 'FAILED';
  const isPdf = item.assetType === 'PDF';

  return (
    <div
      role="region"
      aria-label={`ไฟล์ ${item.originalName || 'ไม่ระบุชื่อ'}`}
      className={`relative flex items-center justify-between p-3 rounded-xl border transition-all ${
        isFailed
          ? 'bg-red-50/70 border-red-200'
          : isVerified
          ? 'bg-slate-50/80 border-slate-200 hover:border-slate-300'
          : 'bg-blue-50/40 border-blue-200'
      }`}
    >
      {/* File info and thumbnail */}
      <div className="flex items-center gap-3 min-w-0 flex-1 pr-2">
        {/* Preview Thumbnail or Type Icon */}
        <div className="relative w-12 h-12 rounded-lg bg-white border border-slate-200 flex items-center justify-center shrink-0 overflow-hidden">
          {item.previewUrl && !isPdf ? (
            <img
              src={item.previewUrl}
              alt={item.originalName}
              className="w-full h-full object-cover"
            />
          ) : isPdf ? (
            <FileText className="w-6 h-6 text-red-500" aria-hidden="true" />
          ) : (
            <ImageIcon className="w-6 h-6 text-slate-400" aria-hidden="true" />
          )}

          {/* Micro-badge for type */}
          {isCover && (
            <span className="absolute bottom-0 inset-x-0 bg-primary/90 text-white text-[9px] font-bold text-center py-0.5 leading-none">
              ปก
            </span>
          )}
        </div>

        {/* Text information */}
        <div className="min-w-0 flex-1">
          <p className="text-sm font-semibold text-slate-800 truncate" title={item.originalName}>
            {item.originalName}
          </p>
          <div className="flex items-center gap-2 text-xs text-slate-500 mt-0.5">
            <span>{formatFileSize(item.size)}</span>
            <span>•</span>

            {/* Compact Status Display */}
            {isUploading && (
              <span
                role="status"
                aria-live="polite"
                className="inline-flex items-center gap-1 text-primary font-medium"
              >
                <Loader2 className="w-3.5 h-3.5 animate-spin shrink-0" aria-hidden="true" />
                <span>กำลังอัปโหลด {item.progress > 0 ? `(${item.progress}%)` : ''}</span>
              </span>
            )}

            {isVerified && (
              <span
                role="status"
                aria-live="polite"
                className="inline-flex items-center gap-1 text-emerald-600 font-medium"
              >
                <CheckCircle2 className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
                <span>พร้อมใช้งาน</span>
              </span>
            )}

            {isFailed && (
              <span
                role="alert"
                aria-live="assertive"
                className="inline-flex items-center gap-1 text-red-600 font-medium"
              >
                <AlertCircle className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
                <span title={item.error}>อัปโหลดไม่สำเร็จ</span>
              </span>
            )}
          </div>

          {/* Detailed Error message if failed */}
          {isFailed && item.error && (
            <p className="text-xs text-red-600 mt-1 line-clamp-1" title={item.error}>
              {item.error}
            </p>
          )}
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex items-center gap-1 shrink-0">
        {/* Preview Button */}
        {item.previewUrl && onPreview && (
          <button
            type="button"
            onClick={() => onPreview(item.previewUrl, isPdf ? 'pdf' : 'image')}
            className="p-1.5 text-slate-500 hover:text-slate-700 hover:bg-white rounded-lg transition-colors cursor-pointer"
            aria-label={`ดูตัวอย่าง ${item.originalName}`}
            title="ดูตัวอย่าง"
          >
            <Eye className="w-4 h-4" aria-hidden="true" />
          </button>
        )}

        {/* Retry Button for Failed uploads */}
        {isFailed && onRetry && (
          <button
            type="button"
            onClick={() => onRetry(item.clientFileId)}
            className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-semibold text-blue-700 bg-blue-100 hover:bg-blue-200 rounded-lg transition-colors cursor-pointer"
            aria-label={`ลองอัปโหลด ${item.originalName} อีกครั้ง`}
            title="ลองใหม่"
          >
            <RotateCcw className="w-3.5 h-3.5" aria-hidden="true" />
            <span>ลองใหม่</span>
          </button>
        )}

        {/* Remove / Cancel Button */}
        {onRemove && (
          <button
            type="button"
            onClick={() => onRemove(item.clientFileId)}
            className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-white rounded-lg transition-colors cursor-pointer"
            aria-label={isUploading ? `ยกเลิกการอัปโหลด ${item.originalName}` : `ลบไฟล์ ${item.originalName}`}
            title={isUploading ? 'ยกเลิก' : 'ลบไฟล์'}
          >
            <Trash2 className="w-4 h-4" aria-hidden="true" />
          </button>
        )}
      </div>
    </div>
  );
}
