import { useState, useEffect } from 'react';
import { ArrowRight, BookMarked, Users, BookOpen, Star, Clock, Heart, Eye, TrendingUp, ChevronRight } from 'lucide-react';
import { Link } from 'react-router';
import Categories from '@/components/Categories';
import { postService } from '@/services/post.service';

export default function Home() {
  const [activeTab, setActiveTab] = useState('ALL');
  const [currentPage, setCurrentPage] = useState(1);
  const [posts, setPosts] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [stats, setStats] = useState({ totalUsers: 0, totalPosts: 0 });
  const postsPerPage = 8;

  const filteredPosts = activeTab === 'ALL' 
    ? posts 
    : posts.filter(p => p.level === (
        activeTab === 'MIDDLE_SCHOOL' ? 'มัธยมศึกษาตอนต้น' :
        activeTab === 'HIGH_SCHOOL' ? 'มัธยมศึกษาตอนปลาย' : 'มหาวิทยาลัย'
      ));

  const totalPages = Math.ceil(filteredPosts.length / postsPerPage);
  const indexOfLastPost = currentPage * postsPerPage;
  const indexOfFirstPost = indexOfLastPost - postsPerPage;
  const currentPosts = filteredPosts.slice(indexOfFirstPost, indexOfLastPost);

  const handleTabChange = (tab) => {
    setActiveTab(tab);
    setCurrentPage(1);
  };

  useEffect(() => {
    const fetchPosts = async () => {
      try {
        setIsLoading(true);
        const fetchedPosts = await postService.getAllPosts();
        setPosts(fetchedPosts);
      } catch (error) {
        console.error('Error loading posts:', error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchPosts();
  }, []);

  useEffect(() => {
    if (currentPage > 1) {
      document.getElementById('latest-posts-section')?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [currentPage]);

  return (
    <main className="min-h-screen bg-background">
      
      {/* =========================================
          HERO SECTION (Clean, Premium Aesthetic)
          ========================================= */}
      <section className="relative pt-32 pb-20 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto overflow-hidden">
        {/* Subtle decorative background - aligned with slate/blue theme */}
        <div className="absolute top-0 inset-x-0 h-[40rem] bg-gradient-to-b from-blue-50/50 via-background to-background -z-10" />
        <div className="absolute -top-24 -right-24 w-96 h-96 bg-primary/5 rounded-full blur-3xl -z-10" />
        <div className="absolute top-40 -left-24 w-72 h-72 bg-blue-400/5 rounded-full blur-3xl -z-10" />

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          {/* Left Column: Text & Stats */}
          <div className="text-left">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white border border-slate-200 shadow-sm text-sm font-semibold text-slate-700 mb-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
              <span className="flex h-2 w-2 rounded-full bg-primary"></span>
              แพลตฟอร์มการเรียนรู้รูปแบบใหม่
            </div>
            
            <h1 className="text-5xl md:text-6xl lg:text-7xl font-extrabold text-slate-900 tracking-tight mb-6 leading-tight animate-in fade-in slide-in-from-bottom-8 duration-700 delay-150">
              ยินดีต้อนรับสู่ <br className="hidden lg:block"/>
              <span className="text-primary">SHARE-ED</span>
            </h1>
            
            <p className="mt-4 text-lg sm:text-xl text-slate-500 mb-10 leading-relaxed max-w-lg animate-in fade-in slide-in-from-bottom-8 duration-700 delay-300">
              พื้นที่สำหรับการแบ่งปันความรู้ อ่านสรุปเนื้อหาบทเรียน และเตรียมพร้อมสำหรับการสอบไปกับเพื่อนๆ ทั่วประเทศ
            </p>

            <div className="flex flex-col sm:flex-row items-center gap-4 animate-in fade-in slide-in-from-bottom-8 duration-700 delay-500">
              <div className="flex items-center gap-4 bg-white/80 backdrop-blur-sm px-6 py-4 rounded-2xl border border-slate-200 shadow-sm flex-1 w-full sm:w-auto">
                <div className="p-3 bg-blue-50 rounded-xl text-primary"><Users className="h-6 w-6" /></div>
                <div className="text-left">
                  <p className="text-2xl font-black text-slate-900 leading-none mb-1">{stats.totalUsers.toLocaleString()}</p>
                  <p className="text-xs text-slate-500 font-semibold uppercase tracking-wider">ผู้ใช้งานระบบ</p>
                </div>
              </div>
              <div className="flex items-center gap-4 bg-white/80 backdrop-blur-sm px-6 py-4 rounded-2xl border border-slate-200 shadow-sm flex-1 w-full sm:w-auto">
                <div className="p-3 bg-blue-50 rounded-xl text-primary"><BookMarked className="h-6 w-6" /></div>
                <div className="text-left">
                  <p className="text-2xl font-black text-slate-900 leading-none mb-1">{stats.totalPosts.toLocaleString()}</p>
                  <p className="text-xs text-slate-500 font-semibold uppercase tracking-wider">โพสต์สรุป</p>
                </div>
              </div>
            </div>
          </div>

          {/* Right Column: Promotional Image / Ad */}
          <div className="relative hidden lg:block animate-in fade-in slide-in-from-right-8 duration-1000 delay-300">
            <div className="aspect-[4/3] rounded-3xl overflow-hidden bg-slate-100 border border-slate-200 shadow-2xl shadow-primary/10 relative group">
              <div className="absolute inset-0 bg-gradient-to-tr from-primary/20 to-transparent mix-blend-multiply opacity-50 transition-opacity group-hover:opacity-30"></div>
              {/* Replace img src with real promo image when available */}
              <img 
                src="https://images.unsplash.com/photo-1522202176988-66273c2fd55f?q=80&w=1000&auto=format&fit=crop" 
                alt="Student learning" 
                className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
              />
              {/* Floating Badge */}
              <div className="absolute bottom-6 left-6 bg-white/95 backdrop-blur-sm px-4 py-3 rounded-2xl shadow-lg border border-slate-100 flex items-center gap-3">
                <div className="h-10 w-10 bg-green-100 rounded-full flex items-center justify-center text-green-600">
                  <Star className="h-5 w-5 fill-current" />
                </div>
                <div>
                  <p className="text-xs font-bold text-slate-500 uppercase tracking-wide">รีวิวจากผู้ใช้</p>
                  <p className="text-sm font-bold text-slate-900">4.9/5 คะแนน</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* =========================================
          CATEGORIES SECTION (Extracted to Component)
          ========================================= */}
      <Categories />

      {/* =========================================
          LATEST POSTS SECTION
          ========================================= */}
      <section id="latest-posts-section" className="py-20 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col lg:flex-row lg:items-end justify-between mb-10 gap-6">
          <div>
            <h2 className="text-3xl font-extrabold text-slate-900 flex items-center gap-3">
              <Clock className="h-7 w-7 text-primary" /> โพสต์อัปเดตล่าสุด
            </h2>
            <p className="text-slate-500 mt-2 text-lg">เนื้อหาใหม่ล่าสุดที่เพื่อนๆ เพิ่งแบ่งปัน</p>
          </div>
          
          {/* Minimal Tabs */}
          <div className="flex overflow-x-auto pb-2 lg:pb-0 gap-2 hide-scrollbar">
            {['ALL', 'MIDDLE_SCHOOL', 'HIGH_SCHOOL', 'UNIVERSITY'].map((tab) => (
              <button
                key={tab}
                onClick={() => handleTabChange(tab)}
                className={`px-6 py-2.5 rounded-full font-bold text-sm whitespace-nowrap transition-all ${
                  activeTab === tab 
                    ? 'bg-slate-900 text-white shadow-md' 
                    : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50 hover:text-slate-900'
                }`}
              >
                {tab === 'ALL' ? 'ทั้งหมด' : 
                 tab === 'MIDDLE_SCHOOL' ? 'มัธยมศึกษาตอนต้น' :
                 tab === 'HIGH_SCHOOL' ? 'มัธยมศึกษาตอนปลาย' : 'มหาวิทยาลัย'}
              </button>
            ))}
          </div>
        </div>

        {/* 4 Columns Grid */}
        {isLoading ? (
          <div className="flex justify-center py-20">
            <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary"></div>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {currentPosts.map(post => (
            <Link key={post.id} to={`/post/${post.id}`} className="bg-white rounded-2xl border border-slate-200 overflow-hidden hover:shadow-xl hover:shadow-primary/5 hover:border-primary/30 hover:-translate-y-1 transition-all flex flex-col group h-full">
              <div className="h-44 bg-slate-50 relative overflow-hidden flex items-center justify-center border-b border-slate-100 group">
                {post.image ? (
                  <img src={post.image} alt={post.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                ) : (
                  <BookOpen className="h-12 w-12 text-slate-300 group-hover:scale-110 group-hover:text-primary/40 transition-all duration-500" />
                )}
                <div className="absolute top-3 left-3 bg-white/90 backdrop-blur text-xs font-bold px-3 py-1.5 rounded-lg text-slate-700 shadow-sm">
                  {post.subject}
                </div>
              </div>
              <div className="p-5 flex flex-col flex-1">
                <h3 className="font-bold text-slate-900 text-lg mb-2 line-clamp-2 group-hover:text-primary transition-colors leading-snug">
                  {post.title}
                </h3>
                <p className="text-sm text-slate-500 mb-4 flex-1 font-medium flex items-center gap-1.5">
                  <span className="w-5 h-5 rounded-full bg-slate-200 flex items-center justify-center text-[10px] text-slate-500">
                    <Users className="h-3 w-3" />
                  </span>
                  {post.author}
                </p>
                <div className="flex justify-between items-center pt-4 border-t border-slate-100">
                  <div className="flex items-center gap-3 text-sm text-slate-500 font-semibold">
                    <span className="flex items-center gap-1 hover:text-primary transition-colors"><Heart className="h-4 w-4" /> {post.likes}</span>
                    <span className="flex items-center gap-1 hover:text-primary transition-colors"><Eye className="h-4 w-4" /> {post.views}</span>
                  </div>
                  <span className="text-xs text-slate-400 font-semibold">
                    {post.created_at ? new Date(post.created_at).toLocaleDateString('th-TH', { month: 'short', day: 'numeric' }) : ''}
                  </span>
                </div>
              </div>
            </Link>
          ))}
        </div>
        )}

        {/* Empty State */}
        {!isLoading && currentPosts.length === 0 && (
          <div className="text-center py-24 bg-white rounded-2xl border border-slate-200 border-dashed">
            <BookOpen className="h-12 w-12 text-slate-300 mx-auto mb-4" />
            <h3 className="text-lg font-bold text-slate-700 mb-1">ไม่มีโพสต์ในหมวดหมู่นี้</h3>
            <p className="text-slate-500">เนื้อหาใหม่กำลังจะมาในเร็วๆ นี้</p>
          </div>
        )}

        {/* Pagination Controls */}
        {totalPages > 1 && (
          <div className="mt-14 flex justify-center items-center gap-2">
            <button 
              onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
              disabled={currentPage === 1}
              className="px-4 py-2 rounded-xl border border-slate-200 bg-white font-bold text-slate-600 shadow-sm disabled:opacity-50 disabled:cursor-not-allowed hover:bg-slate-50 hover:text-primary transition-colors"
            >
              ก่อนหน้า
            </button>
            
            <div className="flex gap-1 hidden sm:flex mx-2">
              {Array.from({ length: totalPages }).map((_, i) => (
                <button
                  key={i}
                  onClick={() => setCurrentPage(i + 1)}
                  className={`w-10 h-10 rounded-xl font-bold transition-all shadow-sm ${
                    currentPage === i + 1 
                      ? 'bg-slate-900 text-white' 
                      : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50 hover:text-primary'
                  }`}
                >
                  {i + 1}
                </button>
              ))}
            </div>

            <button 
              onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
              disabled={currentPage === totalPages}
              className="px-4 py-2 rounded-xl border border-slate-200 bg-white font-bold text-slate-600 shadow-sm disabled:opacity-50 disabled:cursor-not-allowed hover:bg-slate-50 hover:text-primary transition-colors"
            >
              ถัดไป
            </button>
          </div>
        )}
      </section>
    </main>
  );
}
