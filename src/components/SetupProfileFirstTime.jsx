import { useState, useEffect } from 'react';
import { Calendar, BookOpen, FileText, Loader2, Sparkles, CheckCircle2 } from 'lucide-react';
import { supabase } from '@/utils/supabase';
import useAuthStore from '@/store/authStore';
import toast from 'react-hot-toast';
import { useNavigate } from 'react-router';
import api from '@/utils/api';
import { authService } from '@/services/auth.service';

export default function SetupProfileFirstTime() {
  const { user, login, isAuthenticated } = useAuthStore();
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const navigate = useNavigate();

  // Form State - only Age, Education Level, and Bio!
  const [age, setAge] = useState('');
  const [education_level, setEducation] = useState('');
  const [bio, setBio] = useState('');

  // Determine effective username to display
  const getEffectiveUsername = () => {
    if (!user) return 'User';
    const meta = user.user_metadata || {};
    return user.display_name || user.username || user.name || meta.display_name || meta.username || meta.full_name || user.email?.split('@')[0] || 'User';
  };

  const effectiveUsername = getEffectiveUsername();
  const effectiveEmail = user?.email || user?.user_metadata?.email || '';

  useEffect(() => {
    const checkProfileNeeded = async () => {
      if (!isAuthenticated || !user) {
        setIsOpen(false);
        return;
      }

      try {
        setIsLoading(true);
        const { data: { session } } = await supabase.auth.getSession();

        // 2. ตรวจสอบจาก session และ metadata ใน store
        if (session) {
          const meta = session.user?.user_metadata || {};
          const edu = user?.education_level || meta.education_level;
          const uage = user?.age || meta.age;
          const ubio = user?.bio || meta.bio;

          if (!edu || !uage || uage === 0 || !ubio || !ubio.trim() || ubio === 'ยังไม่ได้ระบุ' || ubio === '-') {
            setIsOpen(true);
          } else {
            setIsOpen(false);
          }
          return;
        }

        const edu = user?.education_level;
        const uage = user?.age;
        const ubio = user?.bio;

        if (!edu || !uage || uage === 0 || !ubio || !ubio.trim() || ubio === 'ยังไม่ได้ระบุ' || ubio === '-') {
          setIsOpen(true);
        } else {
          setIsOpen(false);
        }
      } catch (error) {
        console.error("Error checking profile in SetupProfileFirstTime modal:", error);
      } finally {
        setIsLoading(false);
      }
    };

    checkProfileNeeded();
  }, [user, isAuthenticated]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!age || !education_level || !bio || !bio.trim()) {
      toast.error('กรุณากรอกข้อมูลให้ครบถ้วนทุกช่อง (อายุ, ระดับการศึกษา, แนะนำตัว)');
      return;
    }

    try {
      setIsSubmitting(true);
      const userId = user?.user_id || user?.id || user?._id;
      
      const payload = {
        username: effectiveUsername,
        nickname: effectiveUsername,
        full_name: effectiveUsername,
        education_level: education_level,
        age: parseInt(age) || 0,
        bio: bio || " "
      };

      // อัปเดตข้อมูลระบบหลังบ้าน (ถ้ายังไม่มีบัญชีในระบบหลังบ้าน เช่น สมัครผ่าน Google ครั้งแรก ให้ทำการลงทะเบียนเข้าสู่ระบบหลังบ้านด้วย)
      try {
        await api.put('/users/profile', payload);
      } catch (err) {
        console.log("put /users/profile failed, attempting backend registration/login recovery:", err?.response?.data || err.message);
        let fallbackSuccess = false;
        if (effectiveEmail) {
          try {
            const fixedPassword = "Google_OAuth_" + effectiveEmail + "_Secret#2024!";
            const regData = await authService.register({
              email: effectiveEmail,
              password: fixedPassword,
              confirmPassword: fixedPassword,
              ...payload
            });
            const token = regData?.token || regData?.access_token || regData?.data?.token || regData?.data?.access_token;
            if (token) {
              localStorage.setItem('access_token', token);
              fallbackSuccess = true;
            }
          } catch (regErr) {
            console.log("Backend register recovery info:", regErr?.response?.data || regErr.message);
            try {
              const fixedPassword = "Google_OAuth_" + effectiveEmail + "_Secret#2024!";
              const loginRes = await authService.login(effectiveEmail, fixedPassword);
              const lToken = loginRes?.token || loginRes?.access_token || loginRes?.data?.token || loginRes?.data?.access_token;
              if (lToken) {
                localStorage.setItem('access_token', lToken);
                fallbackSuccess = true;
              }
            } catch (loginErr) {
              console.log("Fallback login recovery info:", loginErr?.response?.data || loginErr.message);
            }
            if (!fallbackSuccess) {
              try {
                const res = await authService.getMe();
                if (res && (res.data || res.user)) {
                  fallbackSuccess = true;
                }
              } catch (meErr) {}
            }
          }
        }

        if (fallbackSuccess) {
          try {
            await api.put('/users/profile', payload);
          } catch (retryErr) {
            console.log("Retry put /users/profile notice:", retryErr?.response?.data || retryErr.message);
          }
        }
      }

      // อัปเดตข้อมูล Supabase ทั้งในตาราง users และใน auth metadata
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (session && session.user) {
          const supId = session.user.id;
          
          await supabase
            .from('users')
            .update({
              education_level: education_level,
              age: parseInt(age) || null,
              bio: bio || null,
              updated_at: new Date()
            })
            .eq('id', supId);

          await supabase.auth.updateUser({
            data: {
              education_level: education_level,
              age: parseInt(age) || 0,
              bio: bio || " "
            }
          });
        }
      } catch (e) {
        console.log("Supabase update info:", e);
      }

      // อัปเดตสถานะใน Auth Store
      login({ 
        ...user, 
        education_level: education_level, 
        age: parseInt(age) || 0,
        bio: bio,
        user_metadata: { 
          ...user?.user_metadata, 
          education_level: education_level, 
          age: parseInt(age) || 0,
          bio: bio 
        }
      });
      
      toast.success('ตั้งค่าโปรไฟล์เรียบร้อยแล้ว!');
      setIsOpen(false);
    } catch (error) {
      console.error("Profile Update Error:", error.response?.data || error);
      const errMsg = error.response?.data?.message || error.response?.data?.error || error.message || 'เกิดข้อผิดพลาดในการตั้งค่าโปรไฟล์';
      toast.error(typeof errMsg === 'string' ? errMsg : JSON.stringify(errMsg));
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen || isLoading) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/70 backdrop-blur-sm animate-in fade-in duration-300">
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-lg overflow-hidden animate-in zoom-in-95 duration-300 border border-white/20">
        
        {/* Header Banner */}
        <div className="bg-gradient-to-r from-[#1a2b4c] to-[#253f6f] text-white px-8 py-8 text-center relative overflow-hidden">
          <div className="absolute -right-10 -top-10 w-40 h-40 bg-blue-500/10 rounded-full blur-2xl pointer-events-none"></div>
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-white/10 backdrop-blur-md mb-3 shadow-inner border border-white/20">
            <Sparkles className="w-6 h-6 text-amber-300 animate-pulse" />
          </div>
          <h3 className="text-2xl font-black mb-1.5 tracking-tight">ตั้งค่าโปรไฟล์ครั้งแรก</h3>
          <p className="text-blue-100/90 text-sm max-w-sm mx-auto">
            ยินดีต้อนรับสู่ SHARE-ED กรุณากรอกข้อมูลการศึกษาและอายุเพิ่มเติมเพื่อความสมบูรณ์ของบัญชี
          </p>
        </div>
        
        {/* Modal Body */}
        <div className="p-6 sm:p-8">
          <form onSubmit={handleSubmit} className="space-y-5">
            
            {/* Read-only Username/Email Badge */}
            <div className="bg-slate-50 p-3.5 rounded-2xl border border-slate-200/80 flex items-center justify-between">
              <div>
                <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block mb-0.5">บัญชีผู้ใช้งาน</span>
                <div className="font-bold text-slate-800 text-sm">{effectiveUsername}</div>
                {effectiveEmail && <div className="text-xs text-slate-500">{effectiveEmail}</div>}
              </div>
              <div className="flex items-center gap-1 bg-emerald-100 text-emerald-800 px-2.5 py-1 rounded-full text-[11px] font-semibold">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                เข้าสู่ระบบแล้ว
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Age */}
              <div>
                <label className="flex items-center gap-1.5 text-sm font-bold text-slate-800 mb-1.5">
                  <Calendar className="h-4 w-4 text-primary" /> อายุ <span className="text-red-500">*</span>
                </label>
                <input 
                  type="number" 
                  value={age}
                  onChange={(e) => setAge(e.target.value)}
                  className="w-full px-3.5 py-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all text-sm bg-slate-50/50 focus:bg-white" 
                  placeholder="เช่น 18"
                  min="5"
                  max="90" 
                  required
                />
              </div>
              
              {/* Education Level */}
              <div>
                <label className="flex items-center gap-1.5 text-sm font-bold text-slate-800 mb-1.5">
                  <BookOpen className="h-4 w-4 text-primary" /> ระดับการศึกษา <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <select 
                    value={education_level}
                    onChange={(e) => setEducation(e.target.value)}
                    className={`w-full px-3.5 py-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all appearance-none bg-slate-50/50 focus:bg-white text-sm ${!education_level ? 'text-slate-400' : 'text-slate-900'}`}
                    required
                  >
                    <option value="" disabled>เลือกระดับการศึกษา</option>
                    <option value="MIDDLE_SCHOOL">มัธยมศึกษาตอนต้น</option>
                    <option value="HIGH_SCHOOL">มัธยมศึกษาตอนปลาย</option>
                    <option value="UNIVERSITY">มหาวิทยาลัย</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Bio */}
            <div>
              <label className="flex items-center gap-1.5 text-sm font-bold text-slate-800 mb-1.5">
                <FileText className="h-4 w-4 text-primary" /> แนะนำตัวเบื้องต้น (Bio) <span className="text-red-500">*</span>
              </label>
              <textarea 
                rows={3} 
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                className="w-full px-3.5 py-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all resize-none text-sm bg-slate-50/50 focus:bg-white" 
                placeholder="บอกเพื่อนๆ ใน Share-ED ให้รู้จักคุณมากขึ้นอีกนิด..."
                required
              ></textarea>
            </div>

            {/* Submit Button */}
            <div className="pt-2">
              <button 
                type="submit" 
                disabled={isSubmitting}
                className={`w-full py-3.5 rounded-xl font-bold text-white text-sm shadow-md transition-all flex items-center justify-center gap-2 ${isSubmitting ? 'bg-slate-400 cursor-not-allowed shadow-none' : 'bg-gradient-to-r from-[#1a2b4c] to-[#253f6f] hover:from-[#111e36] hover:to-[#1a2b4c] hover:shadow-lg hover:-translate-y-0.5'}`}
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="animate-spin h-4 w-4" />
                    กำลังบันทึกข้อมูล...
                  </>
                ) : (
                  'บันทึกข้อมูลและเริ่มใช้งาน'
                )}
              </button>
            </div>
            
          </form>
        </div>
        
      </div>
    </div>
  );
}
