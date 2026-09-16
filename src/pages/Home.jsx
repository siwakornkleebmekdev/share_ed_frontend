import { useState, useEffect } from 'react';
import { ArrowRight, BookOpen, Clock, Heart, Eye, TrendingUp, ChevronRight } from 'lucide-react';
import { Link } from 'react-router';
import Categories from '@/components/Categories';
import { postService } from '@/services/post.service';
import heroImage from '@/assets/home-hero.webp';

export default function Home() {
  const [activeTab, setActiveTab] = useState('ALL');
  const [currentPage, setCurrentPage] = useState(1);
  const [posts, setPosts] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
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
        let fetchedPosts = [];
        try {
          fetchedPosts = await postService.getAllPosts();
        } catch (e) {
          console.error('Error fetching home posts:', e);
        }

        setPosts(fetchedPosts || []);
      } catch (error) {
        console.error('Error loading home data:', error);
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
      <section className="relative isolate min-h-[680px] lg:min-h-[740px] overflow-hidden flex items-center bg-background">
        <img
          src={heroImage}
          alt="นักศึกษากำลังแบ่งปันความรู้และเรียนรู้ร่วมกัน"
          className="absolute inset-0 -z-20 h-full w-full object-cover object-[68%_center] opacity-35 sm:object-[62%_center] sm:opacity-55 lg:object-center lg:opacity-70"
        />
        <div className="absolute inset-0 -z-10 bg-background/65 sm:bg-gradient-to-r sm:from-background sm:via-background/90 sm:to-background/10" />
        <div className="absolute inset-x-0 bottom-0 h-40 -z-10 bg-gradient-to-t from-background via-background/80 to-transparent" />

        <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-28 pb-16 lg:pt-36 lg:pb-24">
          <div className="max-w-2xl text-left">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/75 border border-slate-200/80 backdrop-blur-md shadow-sm text-sm font-semibold text-slate-700 mb-7 animate-in fade-in slide-in-from-bottom-4 duration-700">
              <span className="flex h-2 w-2 rounded-full bg-primary shadow-[0_0_12px_rgba(59,130,246,0.55)]"></span>
              แพลตฟอร์มการเรียนรู้รูปแบบใหม่
            </div>

            <h1 className="text-5xl sm:text-6xl lg:text-7xl font-extrabold text-slate-900 tracking-tight mb-6 leading-[1.08] animate-in fade-in slide-in-from-bottom-8 duration-700 delay-150">
              ยินดีต้อนรับสู่ <br className="hidden lg:block" />
              <span className="text-primary">SHARE-ED</span>
            </h1>

            <p className="mt-4 text-lg sm:text-xl text-slate-600 mb-8 leading-relaxed max-w-xl animate-in fade-in slide-in-from-bottom-8 duration-700 delay-300">
              พื้นที่สำหรับการแบ่งปันความรู้ อ่านสรุปเนื้อหาบทเรียน และเตรียมพร้อมสำหรับการสอบไปกับเพื่อนๆ ทั่วประเทศ
            </p>

            <Link
              to="/explore"
              className="inline-flex items-center gap-2 rounded-full bg-primary px-6 py-3.5 font-bold text-white shadow-lg shadow-blue-500/20 transition-all hover:-translate-y-0.5 hover:bg-primary-dark focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40"
            >
              สำรวจเนื้อหา <ArrowRight className="h-5 w-5" />
            </Link>
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
                className={`px-6 py-2.5 rounded-full font-bold text-sm whitespace-nowrap transition-all ${activeTab === tab
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
                  <div className="flex items-center gap-2 mb-4 flex-1 min-w-0">
                    <div className="w-5 h-5 rounded-full overflow-hidden shrink-0 bg-slate-100 border border-slate-200 flex items-center justify-center text-[10px] text-slate-500 font-bold">
                      <img
                        src={post.authorAvatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(post.author || 'User')}&background=1e293b&color=38bdf8`}
                        alt={post.author}
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          e.target.onerror = null;
                          e.target.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(post.author || 'User')}&background=1e293b&color=38bdf8`;
                        }}
                      />
                    </div>
                    <span className="text-sm text-slate-600 font-semibold line-clamp-1">{post.author}</span>
                  </div>
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
                  className={`w-10 h-10 rounded-xl font-bold transition-all shadow-sm ${currentPage === i + 1
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
