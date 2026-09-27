import { Eye, EyeOff } from 'lucide-react';

export default function PasswordVisibilityButton({ visible, onToggle, disabled = false }) {
  const label = visible ? 'ซ่อนรหัสผ่าน' : 'แสดงรหัสผ่าน';

  return (
    <button
      type="button"
      onClick={onToggle}
      disabled={disabled}
      className="absolute inset-y-0 right-0 z-10 flex items-center justify-center px-3 text-slate-400 transition-colors hover:text-slate-600 focus:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-primary disabled:cursor-not-allowed disabled:opacity-50"
      aria-label={label}
      aria-pressed={visible}
      title={label}
    >
      {visible ? <EyeOff className="h-5 w-5" aria-hidden="true" /> : <Eye className="h-5 w-5" aria-hidden="true" />}
    </button>
  );
}
