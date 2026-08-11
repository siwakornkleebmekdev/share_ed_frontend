import { useState } from 'react';
import { Lock, Loader2, KeyRound } from 'lucide-react';
import { useNavigate } from 'react-router';
import toast from 'react-hot-toast';
import { supabase } from '@/utils/supabase';

export default function ResetPassword() {
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [fieldErrors, setFieldErrors] = useState({});
  const navigate = useNavigate();

  const handleResetPassword = async (e) => {
    e.preventDefault();
    setFieldErrors({});

    const newErrors = {};
    if (!password) {
      newErrors.password = 'กรุณากรอกรหัสผ่านใหม่';
    } else if (password.length < 8) {
      newErrors.password = 'รหัสผ่านต้องมีความยาวอย่างน้อย 8 ตัวอักษร';
    }

    if (!confirmPassword) {
      newErrors.confirmPassword = 'กรุณายืนยันรหัสผ่านใหม่';
    } else if (password && confirmPassword && password !== confirmPassword) {
      newErrors.confirmPassword = 'รหัสผ่านทั้งสองช่องไม่ตรงกัน';
    }

    if (Object.keys(newErrors).length > 0) {
      setFieldErrors(newErrors);
      const firstErrorKey = Object.keys(newErrors)[0];
      toast.error(newErrors[firstErrorKey] || 'กรุณากรอกข้อมูลให้ถูกต้อง');
      return;
    }

    try {
      setIsLoading(true);

      const { error } = await supabase.auth.updateUser({
        password: password
      });

      if (error) throw error;

      toast.success('ตั้งรหัสผ่านใหม่เรียบร้อยแล้ว! กรุณาเข้าสู่ระบบด้วยรหัสผ่านใหม่');
      navigate('/login');
    } catch (error) {
      console.error('Reset Password Error:', error);
      const errMsg = error.message || 'เกิดข้อผิดพลาดในการตั้งรหัสผ่านใหม่ กรุณาลองใหม่อีกครั้ง';
      setFieldErrors({ general: errMsg });
      toast.error(errMsg);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center bg-background py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8 bg-white p-10 rounded-2xl shadow-soft border border-slate-100">
        <div className="text-center">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-blue-50 text-primary mb-3 shadow-inner">
            <KeyRound className="w-7 h-7" />
          </div>
          <h2 className="text-3xl font-extrabold text-slate-900 tracking-tight">ตั้งรหัสผ่านใหม่</h2>
          <p className="mt-2 text-sm text-slate-500">
            กรุณากรอกรหัสผ่านใหม่ที่คุณต้องการใช้งานสำหรับเข้าสู่ระบบ
          </p>
        </div>

        {fieldErrors.general && (
          <div className="p-3.5 rounded-xl bg-red-50 text-red-600 text-sm font-medium border border-red-100 text-center">
            {fieldErrors.general}
          </div>
        )}

        <form onSubmit={handleResetPassword} className="mt-8 space-y-6" noValidate>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1" htmlFor="password">
                รหัสผ่านใหม่ <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Lock className={`h-5 w-5 ${fieldErrors.password ? 'text-red-400' : 'text-slate-400'}`} />
                </div>
                <input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value);
                    if (fieldErrors.password) setFieldErrors(prev => ({ ...prev, password: null }));
                  }}
                  className={`block w-full pl-10 pr-3 py-2.5 border rounded-lg text-slate-900 focus:outline-none transition-colors text-sm ${fieldErrors.password
                    ? 'border-red-500 focus:ring-2 focus:ring-red-500/20 focus:border-red-500'
                    : 'border-slate-200 focus:ring-2 focus:ring-primary/20 focus:border-primary'
                    }`}
                  placeholder="ตั้งรหัสผ่านอย่างน้อย 8 ตัวอักษร"
                />
              </div>
              {fieldErrors.password && (
                <p className="mt-1 text-xs text-red-500 font-medium">{fieldErrors.password}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1" htmlFor="confirmPassword">
                ยืนยันรหัสผ่านใหม่ <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Lock className={`h-5 w-5 ${fieldErrors.confirmPassword ? 'text-red-400' : 'text-slate-400'}`} />
                </div>
                <input
                  id="confirmPassword"
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => {
                    setConfirmPassword(e.target.value);
                    if (fieldErrors.confirmPassword) setFieldErrors(prev => ({ ...prev, confirmPassword: null }));
                  }}
                  className={`block w-full pl-10 pr-3 py-2.5 border rounded-lg text-slate-900 focus:outline-none transition-colors text-sm ${fieldErrors.confirmPassword
                    ? 'border-red-500 focus:ring-2 focus:ring-red-500/20 focus:border-red-500'
                    : 'border-slate-200 focus:ring-2 focus:ring-primary/20 focus:border-primary'
                    }`}
                  placeholder="กรอกรหัสผ่านใหม่อีกครั้งเพื่อยืนยัน"
                />
              </div>
              {fieldErrors.confirmPassword && (
                <p className="mt-1 text-xs text-red-500 font-medium">{fieldErrors.confirmPassword}</p>
              )}
            </div>
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className={`w-full flex justify-center items-center gap-2 py-2.5 px-4 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white ${isLoading ? 'bg-blue-400 cursor-not-allowed' : 'bg-primary hover:bg-blue-600'
              } focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary transition-all`}
          >
            {isLoading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                กำลังบันทึกรหัสผ่าน...
              </>
            ) : (
              'บันทึกรหัสผ่านใหม่'
            )}
          </button>
        </form>
      </div>
    </div>
  );
}
