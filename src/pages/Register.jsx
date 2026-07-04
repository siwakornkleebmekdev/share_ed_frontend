import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router';
import { Mail, Lock, User, Loader2 } from 'lucide-react';
import toast from 'react-hot-toast';
import { authService } from '@/services/auth.service';
import useAuthStore from '@/store/authStore';
import { supabase } from '@/utils/supabase';

export default function Register() {
  const [isLoading, setIsLoading] = useState(false);
  
  // Form State
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const { isAuthenticated, user, login: loginAction } = useAuthStore();
  const navigate = useNavigate();

  useEffect(() => {
    // ถ้าผู้ใช้งานมีบัญชีในระบบและข้อมูลโปรไฟล์ครบถ้วนแล้ว ไม่ให้แสดงหน้า Register
    const isProfileComplete = user?.education_level || user?.user_metadata?.education_level;
    if (isAuthenticated && isProfileComplete) {
      toast.success('คุณมีบัญชีผู้ใช้ในระบบแล้ว');
      navigate('/explore');
    }
  }, [isAuthenticated, user, navigate]);

  const handleRegister = async (e) => {
    e.preventDefault();
    if (!username || !email || !password || !confirmPassword) {
      return toast.error('กรุณากรอกข้อมูลให้ครบถ้วนทุกช่อง');
    }

    if (password !== confirmPassword) {
      return toast.error('รหัสผ่านไม่ตรงกัน');
    }

    if (isAuthenticated || user) {
      return toast.error('คุณมีบัญชีผู้ใช้นี้ในระบบแล้ว');
    }

    try {
      setIsLoading(true);

      // สมัครสมาชิกเข้าสู่ระบบหลังบ้านทันที (Backend Registration) - ระบบหลังบ้านจะเช็คอีเมลซ้ำให้อัตโนมัติโดยไม่ติด 403 RLS ของ Supabase
      const payload = {
        email,
        password,
        confirmPassword,
        username,
        nickname: username,
        full_name: username,
        education_level: "MIDDLE_SCHOOL", // ค่าเริ่มต้นเพื่อให้ผ่าน validation ของ Backend
        age: 0, // ค่าเริ่มต้น
        bio: "ยังไม่ได้ระบุ" // ค่าเริ่มต้นชั่วคราวเพื่อให้ผ่าน validation ของ Backend
      };

      const data = await authService.register(payload);
      
      let token = data?.token || data?.access_token || data?.data?.token || data?.data?.access_token;
      if (!token) {
        try {
          const loginRes = await authService.login(email, password);
          token = loginRes?.token || loginRes?.access_token || loginRes?.data?.token || loginRes?.data?.access_token;
        } catch (e) {
          console.log("Auto login after register info:", e);
        }
      }
      if (token) {
        localStorage.setItem('access_token', token);
      }

      // เข้าสู่ระบบใน state ทันที
      const registeredUser = data?.user || data?.data || {};
      loginAction({
        ...registeredUser,
        id: registeredUser.id || registeredUser._id || registeredUser.user_id || 'new_user',
        user_id: registeredUser.id || registeredUser._id || registeredUser.user_id || 'new_user',
        email,
        name: username,
        display_name: username,
        username,
        education_level: "MIDDLE_SCHOOL",
        age: 0,
        bio: "ยังไม่ได้ระบุ"
      });

      toast.success('สมัครสมาชิกสำเร็จ ยินดีต้อนรับสู่ SHARE-ED!');
      navigate('/explore');
    } catch (error) {
      console.error("Register Error:", error.response?.data || error);
      const errMsg = error.response?.data?.message || error.response?.data?.error || JSON.stringify(error.response?.data || error.message);
      if (typeof errMsg === 'string' && (errMsg.includes('ใช้งานแล้ว') || errMsg.includes('ซ้ำ') || errMsg.includes('มีผู้ใช้งาน') || errMsg.includes('already') || errMsg.includes('exist') || errMsg.includes('in use') || errMsg.includes('duplicate'))) {
        toast.error('อีเมลหรือชื่อผู้ใช้นี้เคยถูกใช้งานแล้ว กรุณาเข้าสู่ระบบหรือเปลี่ยนชื่อผู้ใช้');
        navigate('/login');
      } else {
        toast.error(typeof errMsg === 'string' ? errMsg : 'เกิดข้อผิดพลาดในการสมัครสมาชิก');
      }
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
      toast.error(error.message || 'ไม่สามารถสมัครสมาชิกด้วย Google ได้');
    }
  };

  return (
    <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center bg-background py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8 bg-white p-10 rounded-2xl shadow-soft border border-slate-100">
        <div className="text-center">
          <h2 className="mt-2 text-3xl font-extrabold text-slate-900 tracking-tight">สร้างบัญชีผู้ใช้</h2>
          <p className="mt-2 text-sm text-slate-500">
            มีบัญชีผู้ใช้แล้วใช่ไหม?{' '}
            <Link to="/login" className="font-medium text-primary hover:text-blue-700 transition-colors">
              เข้าสู่ระบบที่นี่
            </Link>
          </p>
        </div>
        
        <form className="mt-8 space-y-6" onSubmit={handleRegister}>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">ชื่อผู้ใช้ (Username) <span className="text-red-500">*</span></label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <User className="h-5 w-5 text-slate-400" />
                </div>
                <input 
                  type="text" 
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  required 
                  className="block w-full pl-10 pr-3 py-2.5 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-colors" 
                  placeholder="ตั้งชื่อผู้ใช้ของคุณ (เช่น JohnDoe)" 
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">อีเมล <span className="text-red-500">*</span></label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Mail className="h-5 w-5 text-slate-400" />
                </div>
                <input 
                  type="email" 
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required 
                  className="block w-full pl-10 pr-3 py-2.5 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-colors" 
                  placeholder="กรอกอีเมลของคุณ (เช่น name@example.com)" 
                />
              </div>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">รหัสผ่าน <span className="text-red-500">*</span></label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Lock className="h-5 w-5 text-slate-400" />
                </div>
                <input 
                  type="password" 
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required 
                  minLength={8} 
                  className="block w-full pl-10 pr-3 py-2.5 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-colors" 
                  placeholder="ตั้งรหัสผ่านอย่างน้อย 8 ตัวอักษร" 
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">ยืนยันรหัสผ่าน <span className="text-red-500">*</span></label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Lock className="h-5 w-5 text-slate-400" />
                </div>
                <input 
                  type="password" 
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required 
                  minLength={8} 
                  className="block w-full pl-10 pr-3 py-2.5 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-colors" 
                  placeholder="กรอกรหัสผ่านอีกครั้งเพื่อยืนยัน" 
                />
              </div>
            </div>
          </div>

          <button 
            type="submit" 
            disabled={isLoading}
            className={`w-full flex justify-center items-center gap-2 py-2.5 px-4 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white transition-all ${isLoading ? 'bg-slate-400 cursor-not-allowed' : 'bg-primary hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary'}`}
          >
            {isLoading ? (
              <>
                <Loader2 className="animate-spin h-5 w-5" />
                กำลังสมัครสมาชิก...
              </>
            ) : (
              'สมัครสมาชิก'
            )}
          </button>
        </form>

        <div className="mt-6">
          <div className="relative">
            <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-slate-200" /></div>
            <div className="relative flex justify-center text-sm"><span className="px-2 bg-white text-slate-500">หรือสมัครผ่านระบบ Google</span></div>
          </div>
          <div className="mt-6">
            <button 
              onClick={handleGoogleLogin}
              type="button"
              className="w-full flex justify-center items-center gap-2 py-2.5 px-4 border border-slate-200 rounded-lg shadow-sm bg-white text-sm font-medium text-slate-700 hover:bg-slate-50 transition-colors"
            >
              <svg className="h-5 w-5" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
              </svg>
              สมัครด้วย Google
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
