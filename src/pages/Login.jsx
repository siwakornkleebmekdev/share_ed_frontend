import { useState } from 'react';
import { Mail, Lock, X, Loader2 } from 'lucide-react';
import { Link, useNavigate } from 'react-router';
import toast from 'react-hot-toast';
import useAuthStore from '@/store/authStore';
import { authService } from '@/services/auth.service';
import { supabase } from '@/utils/supabase';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  // Field Errors State for Inline Validation
  const [fieldErrors, setFieldErrors] = useState({});

  // Forgot Password Modal State
  const [showForgotModal, setShowForgotModal] = useState(false);
  const [resetEmail, setResetEmail] = useState('');
  const [isSendingReset, setIsSendingReset] = useState(false);

  const loginAction = useAuthStore((state) => state.login);
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    setFieldErrors({});

    const newErrors = {};
    if (!email || !email.trim()) {
      newErrors.email = 'กรุณากรอกอีเมล';
    }
    if (!password) {
      newErrors.password = 'กรุณากรอกรหัสผ่าน';
    }

    if (Object.keys(newErrors).length > 0) {
      setFieldErrors(newErrors);
      return;
    }

    try {
      setIsLoading(true);

      // Try login via Supabase Auth first
      const { data: supData, error: supError } = await supabase.auth.signInWithPassword({
        email,
        password
      });

      if (!supError && supData?.session) {
        const meta = supData.user.user_metadata || {};
        const userObj = {
          id: supData.user.id,
          user_id: supData.user.id,
          email: supData.user.email,
          name: meta.display_name || meta.full_name || meta.name || meta.username || supData.user.email?.split('@')[0],
          avatar: meta.avatar_url,
          display_name: meta.display_name || meta.full_name || meta.name || meta.username,
          username: meta.username || meta.display_name || meta.full_name || supData.user.email?.split('@')[0],
          education_level: meta.education_level,
          age: meta.age,
          bio: meta.bio,
          user_metadata: meta
        };
        loginAction(userObj);
        toast.success('เข้าสู่ระบบสำเร็จ!');
        navigate('/explore');
        return;
      }

      // Fallback to authService login
      const data = await authService.login(email, password);
      const loggedInUser = data.user || data.data || {};
      loginAction({
        ...loggedInUser,
        id: loggedInUser.id || loggedInUser._id || loggedInUser.user_id,
        user_id: loggedInUser.id || loggedInUser._id || loggedInUser.user_id
      });

      toast.success('เข้าสู่ระบบสำเร็จ!');
      navigate('/explore');
    } catch (error) {
      const errMsg = error.response?.data?.message || error.message || 'อีเมลหรือรหัสผ่านไม่ถูกต้อง';
      setFieldErrors({ auth: typeof errMsg === 'string' ? errMsg : 'อีเมลหรือรหัสผ่านไม่ถูกต้อง' });
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/explore`
        }
      });
      if (error) throw error;
    } catch (error) {
      toast.error(error.message || 'ไม่สามารถเข้าสู่ระบบด้วย Google ได้');
    }
  };

  const handleForgotPassword = async (e) => {
    e.preventDefault();
    if (!resetEmail) {
      toast.error('กรุณากรอกอีเมลของคุณ');
      return;
    }

    try {
      setIsSendingReset(true);
      const { error } = await supabase.auth.resetPasswordForEmail(resetEmail, {
        redirectTo: `${window.location.origin}/reset-password`
      });

      if (error) throw error;

      toast.success('ส่งลิงก์รีเซ็ตรหัสผ่านไปยังอีเมลของคุณเรียบร้อยแล้ว');
      setShowForgotModal(false);
      setResetEmail('');
    } catch (error) {
      toast.error(error.message || 'เกิดข้อผิดพลาดในการส่งอีเมลรีเซ็ตรหัสผ่าน');
    } finally {
      setIsSendingReset(false);
    }
  };

  return (
    <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center bg-background py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8 bg-white p-10 rounded-2xl shadow-soft border border-slate-100">
        <div className="text-center">
          <h2 className="mt-2 text-3xl font-extrabold text-slate-900 tracking-tight">เข้าสู่ระบบ</h2>
          <p className="mt-2 text-sm text-slate-500">
            ยังไม่มีบัญชีใช่ไหม?{' '}
            <Link to="/register" className="font-medium text-primary hover:text-blue-700 transition-colors">
              สมัครสมาชิกเลย
            </Link>
          </p>
        </div>

        <form onSubmit={handleLogin} className="mt-8 space-y-6">
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1" htmlFor="email">อีเมล</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Mail className={`h-5 w-5 ${fieldErrors.email ? 'text-red-400' : 'text-slate-400'}`} />
                </div>
                <input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value);
                    if (fieldErrors.email || fieldErrors.auth) setFieldErrors({});
                  }}
                  className={`block w-full pl-10 pr-3 py-2.5 border rounded-lg text-slate-900 focus:outline-none transition-colors ${
                    fieldErrors.email || fieldErrors.auth
                      ? 'border-red-500 focus:ring-2 focus:ring-red-500/20 focus:border-red-500'
                      : 'border-slate-200 focus:ring-2 focus:ring-primary/20 focus:border-primary'
                  }`}
                  placeholder="name@example.com"
                />
              </div>
              {fieldErrors.email && (
                <p className="mt-1 text-xs text-red-500 font-medium">{fieldErrors.email}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1" htmlFor="password">รหัสผ่าน</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Lock className={`h-5 w-5 ${fieldErrors.password || fieldErrors.auth ? 'text-red-400' : 'text-slate-400'}`} />
                </div>
                <input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value);
                    if (fieldErrors.password || fieldErrors.auth) setFieldErrors({});
                  }}
                  className={`block w-full pl-10 pr-3 py-2.5 border rounded-lg text-slate-900 focus:outline-none transition-colors ${
                    fieldErrors.password || fieldErrors.auth
                      ? 'border-red-500 focus:ring-2 focus:ring-red-500/20 focus:border-red-500'
                      : 'border-slate-200 focus:ring-2 focus:ring-primary/20 focus:border-primary'
                  }`}
                  placeholder="••••••••"
                />
              </div>
              {fieldErrors.password && (
                <p className="mt-1 text-xs text-red-500 font-medium">{fieldErrors.password}</p>
              )}
              {fieldErrors.auth && (
                <p className="mt-1 text-xs text-red-500 font-medium">{fieldErrors.auth}</p>
              )}

              {/* ลิงก์ลืมรหัสผ่านอยู่ด้านซ้ายใต้ช่องกรอกรหัสผ่าน */}
              <div className="mt-2 text-left">
                <button
                  type="button"
                  onClick={() => {
                    setResetEmail(email);
                    setShowForgotModal(true);
                  }}
                  className="text-xs font-medium text-primary hover:text-blue-700 transition-colors focus:outline-none"
                >
                  ลืมรหัสผ่าน?
                </button>
              </div>
            </div>
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className={`w-full flex justify-center py-2.5 px-4 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white ${isLoading ? 'bg-blue-400 cursor-not-allowed' : 'bg-primary hover:bg-blue-600'} focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary transition-all`}
          >
            {isLoading ? 'กำลังเข้าสู่ระบบ...' : 'เข้าสู่ระบบ'}
          </button>
        </form>

        <div className="mt-6">
          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-slate-200" />
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-2 bg-white text-slate-500">หรือดำเนินการต่อด้วย</span>
            </div>
          </div>

          <div className="mt-6">
            <button
              onClick={handleGoogleLogin}
              type="button"
              className="w-full flex justify-center items-center gap-2 py-2.5 px-4 border border-slate-200 rounded-lg shadow-sm bg-white text-sm font-medium text-slate-700 hover:bg-slate-50 transition-colors"
            >
              <svg className="h-5 w-5" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
              </svg>
              เข้าสู่ระบบด้วย Google
            </button>
          </div>
        </div>
      </div>

      {/* Forgot Password Modal */}
      {showForgotModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl shadow-xl max-w-md w-full p-6 relative animate-in zoom-in-95 duration-200 border border-slate-100">
            <button
              onClick={() => setShowForgotModal(false)}
              className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 transition-colors p-1 rounded-lg"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="text-center mb-6">
              <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-blue-50 text-primary mb-3">
                <Lock className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-bold text-slate-900">ลืมรหัสผ่าน</h3>
              <p className="text-sm text-slate-500 mt-1">
                กรอกอีเมลของคุณเพื่อรับลิงก์สำหรับตั้งรหัสผ่านใหม่
              </p>
            </div>

            <form onSubmit={handleForgotPassword} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  อีเมลของคุณ <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Mail className="h-5 w-5 text-slate-400" />
                  </div>
                  <input
                    type="email"
                    value={resetEmail}
                    onChange={(e) => setResetEmail(e.target.value)}
                    required
                    placeholder="name@example.com"
                    className="block w-full pl-10 pr-3 py-2.5 border border-slate-200 rounded-lg text-slate-900 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-colors text-sm"
                  />
                </div>
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowForgotModal(false)}
                  className="w-1/2 py-2.5 px-4 border border-slate-200 rounded-lg text-sm font-medium text-slate-700 hover:bg-slate-50 transition-colors"
                >
                  ยกเลิก
                </button>
                <button
                  type="submit"
                  disabled={isSendingReset}
                  className={`w-1/2 flex justify-center items-center gap-2 py-2.5 px-4 rounded-lg text-sm font-medium text-white ${isSendingReset ? 'bg-blue-400 cursor-not-allowed' : 'bg-primary hover:bg-blue-600'} transition-colors shadow-sm`}
                >
                  {isSendingReset ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      กำลังส่ง...
                    </>
                  ) : (
                    'ส่งอีเมล'
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

