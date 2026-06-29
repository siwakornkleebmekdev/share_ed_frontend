import { useState, useEffect } from 'react';
import { Image as ImageIcon, MapPin, Link as LinkIcon, BookOpen, Star, Award, FileText, CheckCircle2, Gift, GraduationCap } from 'lucide-react';
import toast from 'react-hot-toast';
import PostCard from '@/components/PostCard';

import useAuthStore from '@/store/authStore';
import { profileService } from '@/services/profile.service';
import { Loader2 } from 'lucide-react';

export default function Profile() {
  const { user } = useAuthStore();
  const [activeTab, setActiveTab] = useState('posts'); // posts, drafts, bookmarks, milestones
  const [milestones, setMilestones] = useState([]);
  const [myPosts, setMyPosts] = useState([]);
  const [drafts, setDrafts] = useState([]);
  const [bookmarks, setBookmarks] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    
    const loadProfileData = async () => {
      setIsLoading(true);
      try {
        const userId = user?.user_id || user?.id;
        if (!userId) {
          console.error("ไม่พบ User ID");
          return;
        }

        const [fetchedPosts, fetchedDrafts, fetchedBookmarks, fetchedMilestones] = await Promise.all([
          profileService.getMyPosts(userId),
          profileService.getDrafts(userId),
          profileService.getBookmarks(userId),
          profileService.getMilestones(userId)
        ]);
        
        setMyPosts(fetchedPosts);
        setDrafts(fetchedDrafts);
        setBookmarks(fetchedBookmarks);
        setMilestones(fetchedMilestones);
      } catch (error) {
        toast.error('เกิดข้อผิดพลาดในการโหลดข้อมูลโปรไฟล์');
        console.error(error);
      } finally {
        setIsLoading(false);
      }
    };

    loadProfileData();
  }, [user]);
  
  // Simulate realtime notification for milestones (Trigger when mounted)
  useEffect(() => {
    const unnotifiedReady = milestones.filter(m => m.status === 'READY_TO_CLAIM');
    if (unnotifiedReady.length > 0) {
      const timer = setTimeout(() => {
        toast.success(`เป้าหมายสำเร็จ: ${unnotifiedReady[0].description} พร้อมรับรางวัลแล้ว!`, {
          icon: '🎉',
          duration: 5000,
        });
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [milestones]);

  const handleClaimReward = (id) => {
    setMilestones(prev => prev.map(m => m.id === id ? { ...m, status: 'CLAIMED' } : m));
    toast.success('รับรางวัลสำเร็จแล้ว ไอเท็มถูกเก็บเข้าคลัง', { icon: '🎁' });
  };

  return (
    <div className="min-h-screen bg-slate-50 pb-20">
      {/* Profile Header & Banner */}
      <div className="h-64 sm:h-80 w-full bg-gradient-to-r from-blue-500 to-indigo-600 relative overflow-hidden">
        <div className="absolute inset-0 opacity-20 bg-[url('https://images.unsplash.com/photo-1519681393784-d120267933ba?w=1200&q=80')] bg-cover bg-center"></div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 -mt-24 sm:-mt-32 relative z-10">
        <div className="bg-white rounded-[32px] shadow-sm border border-slate-100 p-6 sm:p-10 mb-8">
          <div className="flex flex-col sm:flex-row gap-8 items-start sm:items-end">
            <div className="relative">
              <div className="h-32 w-32 sm:h-40 sm:w-40 rounded-full border-4 border-white bg-slate-200 overflow-hidden shadow-lg">
                <img src="https://ui-avatars.com/api/?name=Somchai&background=e0f2fe&color=0284c7&size=200" alt="Avatar" className="w-full h-full object-cover" />
              </div>
              <button className="absolute bottom-2 right-2 p-2.5 bg-white rounded-full shadow-md text-slate-500 hover:text-primary transition-colors border border-slate-100">
                <ImageIcon className="h-5 w-5" />
              </button>
            </div>
            
            <div className="flex-1 pb-2">
              <h1 className="text-3xl font-extrabold text-slate-900">{user?.user_metadata?.full_name || user?.name || 'ผู้ใช้งาน'}</h1>
              <p className="text-slate-500 font-medium text-lg mb-4">{user?.email}</p>
              
              <div className="flex flex-wrap gap-4 text-sm font-semibold text-slate-600">
                <div className="flex items-center gap-1.5"><GraduationCap className="h-4 w-4" /> มัธยมศึกษาตอนปลาย</div>
                <div className="flex items-center gap-1.5"><MapPin className="h-4 w-4" /> Bangkok, TH</div>
                <div className="flex items-center gap-1.5 text-blue-500 hover:underline cursor-pointer"><LinkIcon className="h-4 w-4" /> myportfolio.com</div>
              </div>
            </div>
            
            <div className="flex gap-4 w-full sm:w-auto pb-2">
              <button className="flex-1 sm:flex-none px-6 py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-bold transition-colors">
                แก้ไขโปรไฟล์
              </button>
            </div>
          </div>
          
          <div className="mt-8 pt-8 border-t border-slate-100">
            <h3 className="font-bold text-slate-800 mb-2">เกี่ยวกับฉัน (Bio)</h3>
            <p className="text-slate-600 leading-relaxed">
              ชอบเรียนฟิสิกส์และคณิตศาสตร์เป็นชีวิตจิตใจ กำลังเตรียมตัวสอบเข้าวิศวะ มาร่วมแชร์สรุปเนื้อหากันได้นะครับ!
            </p>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-2 mb-8 overflow-x-auto pb-2 scrollbar-hide">
          <button onClick={() => setActiveTab('posts')} className={`flex items-center gap-2 px-6 py-3.5 rounded-xl font-bold whitespace-nowrap transition-colors ${activeTab === 'posts' ? 'bg-primary text-white shadow-md' : 'bg-white text-slate-500 hover:bg-slate-100'}`}>
            <BookOpen className="h-5 w-5" /> โพสต์ของฉัน
          </button>
          <button onClick={() => setActiveTab('drafts')} className={`flex items-center gap-2 px-6 py-3.5 rounded-xl font-bold whitespace-nowrap transition-colors ${activeTab === 'drafts' ? 'bg-primary text-white shadow-md' : 'bg-white text-slate-500 hover:bg-slate-100'}`}>
            <FileText className="h-5 w-5" /> แบบร่าง
          </button>
          <button onClick={() => setActiveTab('bookmarks')} className={`flex items-center gap-2 px-6 py-3.5 rounded-xl font-bold whitespace-nowrap transition-colors ${activeTab === 'bookmarks' ? 'bg-primary text-white shadow-md' : 'bg-white text-slate-500 hover:bg-slate-100'}`}>
            <Star className="h-5 w-5" /> บุ๊คมาร์ก
          </button>
          <button onClick={() => setActiveTab('milestones')} className={`flex items-center gap-2 px-6 py-3.5 rounded-xl font-bold whitespace-nowrap transition-colors ${activeTab === 'milestones' ? 'bg-primary text-white shadow-md' : 'bg-white text-slate-500 hover:bg-slate-100'}`}>
            <Award className="h-5 w-5" /> ความสำเร็จ
          </button>
        </div>

        {/* Tab Content */}
        <div className="min-h-[400px]">
          {isLoading ? (
            <div className="flex flex-col items-center justify-center py-20">
              <Loader2 className="h-10 w-10 text-primary animate-spin mb-4" />
              <p className="text-slate-500 font-medium">กำลังโหลดข้อมูลโปรไฟล์...</p>
            </div>
          ) : (
            <>
              {activeTab === 'posts' && (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                  {myPosts.length > 0 ? myPosts.map(post => (
                    <PostCard key={post.id} post={post} viewMode="grid" />
                  )) : (
                    <div className="col-span-full py-10 text-center text-slate-500">ยังไม่มีโพสต์ที่เผยแพร่</div>
                  )}
                </div>
              )}

              {activeTab === 'drafts' && (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                  {drafts.length > 0 ? drafts.map(post => (
                    <div key={post.id} className="relative group">
                      <PostCard post={post} viewMode="grid" />
                      <div className="absolute top-3 left-3 px-3 py-1 bg-yellow-500/90 text-white backdrop-blur-md rounded-lg text-xs font-bold shadow-sm flex items-center gap-1 z-10">
                        <FileText className="h-3.5 w-3.5" /> DRAFT
                      </div>
                    </div>
                  )) : (
                    <div className="col-span-full py-10 text-center text-slate-500">ยังไม่มีแบบร่าง</div>
                  )}
                </div>
              )}

              {activeTab === 'bookmarks' && (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                  {bookmarks.length > 0 ? bookmarks.map(post => (
                    <PostCard key={post.id} post={post} viewMode="grid" />
                  )) : (
                    <div className="col-span-full flex flex-col items-center justify-center py-20 text-center bg-white rounded-3xl border border-slate-100">
                      <div className="h-24 w-24 bg-slate-100 rounded-full flex items-center justify-center text-slate-400 mb-4">
                        <Star className="h-10 w-10" />
                      </div>
                      <h3 className="text-xl font-bold text-slate-800 mb-2">ยังไม่มีบุ๊คมาร์ก</h3>
                      <p className="text-slate-500">ไปที่หน้า Explore หรือ Trending เพื่อค้นหาโพสต์ที่คุณสนใจ</p>
                    </div>
                  )}
                </div>
              )}

              {activeTab === 'milestones' && (
                <div className="space-y-6">
                  {milestones.length > 0 ? milestones.map(m => (
                    <div key={m.id} className="bg-white p-6 rounded-[24px] shadow-sm border border-slate-100 flex flex-col md:flex-row items-center gap-6 justify-between transition-all hover:shadow-md">
                      <div className="flex items-center gap-6 w-full md:w-auto">
                        <div className={`h-20 w-20 rounded-2xl flex items-center justify-center shrink-0 shadow-sm transition-colors duration-300 ${m.status === 'READY_TO_CLAIM' ? 'bg-amber-100 text-amber-500 ring-4 ring-amber-50' : m.status === 'CLAIMED' ? 'bg-emerald-100 text-emerald-500' : 'bg-slate-100 text-slate-400'}`}>
                          {m.status === 'CLAIMED' ? <CheckCircle2 className="h-10 w-10" /> : <Gift className="h-10 w-10" />}
                        </div>
                        <div>
                          <h3 className="text-xl font-extrabold text-slate-800 mb-1">{m.title}</h3>
                          
                          <div className="flex items-center flex-wrap gap-2">
                            <p className={`font-medium ${m.status === 'READY_TO_CLAIM' || m.status === 'CLAIMED' ? 'text-amber-600' : 'text-slate-600'}`}>
                              {m.description}
                            </p>
                            {(m.status === 'READY_TO_CLAIM' || m.status === 'CLAIMED') && (
                              <span className="bg-amber-100 text-amber-700 text-xs px-2 py-1 rounded-md font-bold">
                                พร้อมรับรางวัลแล้ว
                              </span>
                            )}
                          </div>
                          
                          {/* Subtitle Progress info for Locked items */}
                          {m.status === 'LOCKED' && (
                            <p className="text-sm font-bold text-blue-500 mt-3 bg-blue-50 px-3 py-1 rounded-full inline-block">
                              ความคืบหน้า: {m.current} / {m.target}
                            </p>
                          )}
                        </div>
                      </div>
                      
                      <div className="w-full md:w-auto shrink-0 mt-4 md:mt-0">
                        {m.status === 'LOCKED' && (
                          <button disabled className="w-full md:w-auto px-8 py-3.5 bg-slate-100 text-slate-400 font-bold rounded-xl cursor-not-allowed">
                            ยังไม่สำเร็จ
                          </button>
                        )}
                        {m.status === 'READY_TO_CLAIM' && (
                          <button onClick={() => handleClaimReward(m.id)} className="w-full md:w-auto px-8 py-3.5 bg-primary hover:bg-blue-600 text-white font-bold rounded-xl shadow-md hover:shadow-lg hover:-translate-y-0.5 transition-all animate-pulse">
                            รับรางวัลเลย!
                          </button>
                        )}
                        {m.status === 'CLAIMED' && (
                          <button disabled className="w-full md:w-auto px-8 py-3.5 bg-emerald-50 text-emerald-600 font-bold rounded-xl flex items-center justify-center gap-2">
                            <CheckCircle2 className="h-5 w-5" /> รับรางวัลแล้ว
                          </button>
                        )}
                      </div>
                    </div>
                  )) : (
                    <div className="text-center py-10 text-slate-500">
                      ยังไม่มีความสำเร็จ
                    </div>
                  )}
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
