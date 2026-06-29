import { useState } from 'react';
import { Link, useNavigate } from 'react-router';
import { Mail, Lock, User, Calendar, BookOpen, FileText } from 'lucide-react';
import toast from 'react-hot-toast';
import { authService } from '@/services/auth.service';
import useAuthStore from '@/store/authStore';
import { supabase } from '@/utils/supabase';

export default function Register() {
  const [showModal, setShowModal] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  
  // Form 1 State
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  
  // Form 2 State (Modal)
  const [username, setUsername] = useState('');
  const [age, setAge] = useState('');
  const [education_level, setEducationLevel] = useState('');
  const [bio, setBio] = useState('');

  const loginAction = useAuthStore((state) => state.login);
  const navigate = useNavigate();

  const handleRegister = async (e) => {
    e.preventDefault();
    if (password !== confirmPassword) {
      return toast.error('รหัสผ่านไม่ตรงกัน');
    }
    
    // In a real app, you might validate email/password here before showing modal
    // OR register first, then show modal for onboarding.
    setShowModal(true);
  };

  const handleCompleteRegistration = async () => {
    if (!username || !education_level) {
      return toast.error('กรุณากรอกชื่อผู้ใช้และระดับการศึกษา');
    }

    try {
      setIsLoading(true);
      
      const payload = { 
        email, 
        password, 
        confirmPassword, 
        nickname: username, // Backend uses nickname
        username, // Keeping for backward compatibility or Supabase if needed
        full_name: username, // Keeping for Supabase users table mapping
        age: age ? parseInt(age) : 0,
        education_level: education_level, 
        bio: bio || " "
      };
      console.log("Sending payload to backend:", payload);
      
      // Execute Real API Request to Backend
      const data = await authService.register(payload);
      
      // Some backends return token on register, others require manual login after
      if (data.token) {
        localStorage.setItem('access_token', data.token);
      }
      
      toast.success('สมัครสมาชิกสำเร็จ ยินดีต้อนรับสู่ SHARE-ED!');
      loginAction(data.user || { email, name: username });
      setShowModal(false);
      navigate('/explore');

    } catch (error) {
      console.error("Register Error:", error.response?.data);
      const errMsg = error.response?.data?.message || error.response?.data?.error || JSON.stringify(error.response?.data);
      toast.error(errMsg || 'เกิดข้อผิดพลาดในการสมัครสมาชิก');
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

          <button type="submit" className="w-full flex justify-center py-2.5 px-4 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-primary hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary transition-all">
            ถัดไป
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

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm">
          <div className="bg-white rounded-[24px] shadow-2xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in duration-200 border border-slate-200">
            {/* Modal Header */}
            <div className="bg-white border-b border-slate-100 px-6 py-8 text-center">
              <div className="mx-auto h-14 w-14 bg-blue-50 text-primary rounded-full flex items-center justify-center mb-4">
                <User className="h-7 w-7" />
              </div>
              <h3 className="text-2xl font-bold text-slate-900 mb-2">สร้างโปรไฟล์ของคุณ</h3>
              <p className="text-slate-500 text-sm">อีกนิดเดียว! ตั้งค่าโปรไฟล์เพื่อให้เพื่อนๆ รู้จักคุณมากขึ้น</p>
            </div>
            
            {/* Modal Body */}
            <div className="p-8 space-y-6">
              <div>
                <label className="flex items-center gap-2 text-[15px] font-semibold text-slate-800 mb-2">
                  <User className="h-5 w-5" /> ชื่อผู้ใช้ <span className="text-red-500">*</span>
                </label>
                <input 
                  type="text" 
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-colors" 
                  placeholder="ตั้งชื่อผู้ใช้ของคุณ" 
                />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="flex items-center gap-2 text-[15px] font-semibold text-slate-800 mb-2">
                    <Calendar className="h-5 w-5" /> อายุ
                  </label>
                  <input 
                    type="number" 
                    value={age}
                    onChange={(e) => setAge(e.target.value)}
                    className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-colors" 
                    placeholder="เช่น 18" 
                  />
                </div>
                <div>
                  <label className="flex items-center gap-2 text-[15px] font-semibold text-slate-800 mb-2">
                    <BookOpen className="h-5 w-5" /> ระดับชั้น <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <select 
                      value={education_level}
                      onChange={(e) => setEducationLevel(e.target.value)}
                      className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-colors appearance-none bg-white text-slate-600"
                    >
                      <option value="" disabled>เลือกระดับชั้น</option>
                      <option value="MIDDLE_SCHOOL">มัธยมศึกษาตอนต้น</option>
                      <option value="HIGH_SCHOOL">มัธยมศึกษาตอนปลาย</option>
                      <option value="UNIVERSITY">มหาวิทยาลัย</option>
                    </select>
                  </div>
                </div>
              </div>

              <div>
                <label className="flex items-center gap-2 text-[15px] font-semibold text-slate-800 mb-2">
                  <FileText className="h-5 w-5" /> แนะนำตัว (Bio)
                </label>
                <textarea 
                  rows={3} 
                  value={bio}
                  onChange={(e) => setBio(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-colors resize-none" 
                  placeholder="บอกให้คนอื่นรู้เกี่ยวกับคุณสักหน่อย..."
                ></textarea>
              </div>

              <div className="pt-2">
                <button 
                  onClick={handleCompleteRegistration}
                  disabled={isLoading}
                  type="button" 
                  className={`w-full py-3.5 rounded-xl font-bold text-white shadow-md transition-colors ${isLoading ? 'bg-blue-400 cursor-not-allowed' : 'bg-primary hover:bg-blue-600'}`}
                >
                  {isLoading ? 'กำลังสร้างบัญชี...' : 'เข้าสู่ระบบ Share ED'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
