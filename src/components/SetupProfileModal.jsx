import { useState, useEffect } from 'react';
import { User, Calendar, BookOpen, FileText, Loader2 } from 'lucide-react';
import { supabase } from '@/utils/supabase';
import useAuthStore from '@/store/authStore';
import toast from 'react-hot-toast';
import { useNavigate } from 'react-router';
import { authService } from '@/services/auth.service';

export default function SetupProfileModal() {
  const { user, login, isAuthenticated } = useAuthStore();
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const navigate = useNavigate();

  // Form State
  const [username, setUsername] = useState('');
  const [age, setAge] = useState('');
  const [education, setEducation] = useState('');
  const [bio, setBio] = useState('');

  useEffect(() => {
    const checkProfile = async () => {
      if (!isAuthenticated || !user) {
        setIsOpen(false);
        return;
      }
      
      const userId = user?.user_id || user?.id;
      if (!userId) return;

      try {
        setIsLoading(true);
        // Fetch user profile from custom backend
        const response = await authService.getMe();
        const data = response.data || response;

        if (!data) {
          console.error('No data received from getMe');
          return;
        }

        // Check if profile needs completion. Backend uses 'username' not 'full_name'.
        if (!data.username || !data.education_level) {
          setIsOpen(true);
        } else {
          setIsOpen(false);
        }
      } catch (error) {
        console.error(error);
      } finally {
        setIsLoading(false);
      }
    };

    checkProfile();
  }, [user, isAuthenticated]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!username || !education) {
      toast.error('กรุณากรอกชื่อผู้ใช้และระดับการศึกษา');
      return;
    }

    try {
      setIsSubmitting(true);
      const userId = user?.user_id || user?.id;
      const userEmail = user?.email || user?.user_metadata?.email || '';
      
      // Ideally, this should call your backend API (e.g., api.put('/auth/profile', ...))
      // Since we don't know your backend update endpoint yet, we'll try Supabase 
      // using 'username' since 'full_name' column does not exist.
      const { error } = await supabase
        .from('users')
        .update({
          username: username,
          education_level: education,
          age: age ? parseInt(age) : null,
          bio: bio || null,
          updated_at: new Date()
        })
        .eq('id', userId);

      if (error) throw error;

      // Update local store with new full_name
      login({ 
        ...user, 
        name: username, 
        user_metadata: { ...user?.user_metadata, full_name: username }
      });
      
      toast.success('ตั้งค่าโปรไฟล์สำเร็จ!');
      setIsOpen(false);
      
      // If we are currently on login/register, navigate to explore
      if (window.location.pathname === '/login' || window.location.pathname === '/register') {
        navigate('/explore');
      }
    } catch (error) {
      toast.error(error.message || 'เกิดข้อผิดพลาดในการตั้งค่าโปรไฟล์');
      console.error(error);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;
  if (isLoading) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
      <div className="bg-white rounded-[24px] shadow-2xl w-full max-w-lg overflow-hidden animate-in fade-in zoom-in duration-300">
        
        {/* Modal Header */}
        <div className="bg-[#1a2b4c] text-white px-8 py-10 text-center">
          <h3 className="text-3xl font-extrabold mb-2 tracking-tight">สร้างโปรไฟล์ของคุณ</h3>
          <p className="text-blue-100/80 text-[15px]">กรอกข้อมูลเบื้องต้นเพื่อเริ่มต้นใช้งาน Share-ED</p>
        </div>
        
        {/* Modal Body */}
        <div className="p-8">
          <form onSubmit={handleSubmit} className="space-y-6">
            
            {/* Username */}
            <div>
              <label className="flex items-center gap-2 text-[15px] font-bold text-slate-800 mb-2">
                <User className="h-5 w-5 text-slate-600" /> ชื่อผู้ใช้
              </label>
              <input 
                type="text" 
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="w-full px-4 py-3.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-colors text-[15px]" 
                placeholder="ตั้งชื่อผู้ใช้ของคุณ" 
              />
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Age */}
              <div>
                <label className="flex items-center gap-2 text-[15px] font-bold text-slate-800 mb-2">
                  <Calendar className="h-5 w-5 text-slate-600" /> อายุ
                </label>
                <input 
                  type="number" 
                  value={age}
                  onChange={(e) => setAge(e.target.value)}
                  className="w-full px-4 py-3.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-colors text-[15px]" 
                  placeholder="อายุของคุณ" 
                />
              </div>
              
              {/* Education Level */}
              <div>
                <label className="flex items-center gap-2 text-[15px] font-bold text-slate-800 mb-2">
                  <BookOpen className="h-5 w-5 text-slate-600" /> ระดับการศึกษา
                </label>
                <div className="relative">
                  <select 
                    value={education}
                    onChange={(e) => setEducation(e.target.value)}
                    className={`w-full px-4 py-3.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-colors appearance-none bg-white text-[15px] ${!education ? 'text-slate-400' : 'text-slate-900'}`}
                  >
                    <option value="" disabled>ระดับการศึกษาของคุณ</option>
                    <option value="มัธยมศึกษาตอนต้น">มัธยมศึกษาตอนต้น</option>
                    <option value="มัธยมศึกษาตอนปลาย">มัธยมศึกษาตอนปลาย</option>
                    <option value="มหาวิทยาลัย">มหาวิทยาลัย</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Bio */}
            <div>
              <label className="flex items-center gap-2 text-[15px] font-bold text-slate-800 mb-2">
                <FileText className="h-5 w-5 text-slate-600" /> แนะนำตัว (Bio)
              </label>
              <textarea 
                rows={3} 
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                className="w-full px-4 py-3.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-colors resize-none text-[15px]" 
                placeholder="บอกให้คนอื่นรู้เกี่ยวกับคุณสักหน่อย..."
              ></textarea>
            </div>

            {/* Submit Button */}
            <div className="pt-4">
              <button 
                type="submit" 
                disabled={isSubmitting}
                className={`w-full py-4 rounded-xl font-bold text-white text-[16px] shadow-md transition-colors flex items-center justify-center gap-2 ${isSubmitting ? 'bg-slate-400 cursor-not-allowed' : 'bg-[#1a2b4c] hover:bg-[#111e36]'}`}
              >
                {isSubmitting ? <Loader2 className="h-5 w-5 animate-spin" /> : null}
                {isSubmitting ? 'กำลังบันทึกข้อมูล...' : 'เข้าสู่ระบบ SHARE ED'}
              </button>
            </div>
            
          </form>
        </div>
      </div>
    </div>
  );
}
