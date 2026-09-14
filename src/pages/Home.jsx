import { useState, useEffect } from 'react';
import {
  ArrowRight,
  BookMarked,
  BookOpen,
  Clock,
  Heart,
  Eye,
  TrendingUp,
  ChevronRight,
  Sparkles,
  GraduationCap,
  Users,
  CheckCircle2
} from 'lucide-react';
import { Link } from 'react-router';
import Categories from '@/components/Categories';
import { postService } from '@/services/post.service';
import useHeroThemeStore from '@/store/heroThemeStore';

const HERO_IMAGE_URL = 'https://images.unsplash.com/photo-1523240795612-9a054b0db644?q=80&w=2000&auto=format&fit=crop';

export default function Home() {
  const [activeTab, setActiveTab] = useState('ALL');
  const [currentPage, setCurrentPage] = useState(1);
  const [posts, setPosts] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const postsPerPage = 8;

  const clearHeroImage = useHeroThemeStore((state) => state.clearHeroImage);

  useEffect(() => {
    // Reset to light mode so the navbar and background blend seamlessly with white theme
    clearHeroImage();
    return () => clearHeroImage();
  }, [clearHeroImage]);

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
          HERO BANNER (Edge-to-Edge White Theme Showcase)
          ========================================= */}
      <section className="relative w-full -mt-28 min-h-[640px] lg:min-h-[720px] flex items-center overflow-hidden bg-gradient-to-b from-slate-50/50 via-white to-white">
        {/* 1. Full Hero Background Image (Edge to Edge) */}
        <img
          src={HERO_IMAGE_URL}
          alt="SHARE-ED Hero Banner"
          className="absolute inset-0 w-full h-full object-cover object-[75%_center] opacity-35 sm:opacity-50 lg:opacity-65 transition-transform duration-1000"
        />

        {/* 2. Multi-layer White Gradient Overlays for Readability & Seamless Blending */}
        {/* Horizontal blend: solid white on the text side, fading softly into photo on the right */}
        <div className="absolute inset-0 bg-gradient-to-r from-white via-white/95 sm:via-white/90 lg:via-white/60 to-transparent pointer-events-none" />

        {/* Vertical blend: matches navbar at the top and seamlessly dissolves into white page at bottom */}
        <div className="absolute inset-0 bg-gradient-to-b from-white/70 via-transparent to-white pointer-events-none" />

        {/* Subtle Pastel Ambient Orbs */}
        <div className="absolute top-1/4 left-8 w-96 h-96 bg-blue-100/50 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-1/4 left-1/3 w-[450px] h-[450px] bg-indigo-50/60 rounded-full blur-3xl pointer-events-none" />

        {/* 3. Hero Content Container (aligned with site content grid) */}
        <div className="relative z-10 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-36 sm:pt-40 lg:pt-44 pb-16 lg:pb-20 text-left">
          <div className="max-w-3xl">
            {/* Pill Badge */}
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-blue-50/90 backdrop-blur-sm border border-blue-200/80 text-blue-700 text-xs sm:text-sm font-semibold mb-6 shadow-xs">
              <Sparkles className="h-4 w-4 text-primary animate-pulse" />
              <span>แพลตฟอร์มแบ่งปันสรุปบทเรียนสำหรับทุกคน</span>
            </div>

            {/* Main Headline */}
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black text-slate-900 tracking-tight mb-5 leading-[1.15]">
              ยินดีต้อนรับสู่ <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 via-indigo-600 to-sky-500">
                SHARE-ED
              </span>
            </h1>

            {/* Subtitle */}
            <p className="text-base sm:text-lg text-slate-600 mb-8 leading-relaxed max-w-xl font-normal">
              พื้นที่สำหรับการแบ่งปันความรู้ อ่านสรุปเนื้อหาบทเรียน และเตรียมพร้อมสำหรับการสอบไปกับเพื่อนๆ นักเรียน-นักศึกษาทั่วประเทศ
            </p>

            {/* CTA Action Buttons */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3.5 mb-8">
              <Link
                to="/explore"
                className="px-8 py-4 bg-primary text-white rounded-2xl font-bold text-base hover:bg-blue-600 hover:shadow-xl hover:shadow-primary/25 hover:-translate-y-0.5 transition-all flex items-center justify-center gap-2.5 shadow-md group"
              >
                <span>สำรวจเนื้อหาทั้งหมด</span>
                <ArrowRight className="h-5 w-5 group-hover:translate-x-1 transition-transform" />
              </Link>
              <Link
                to="/trending"
                className="px-7 py-4 bg-white/90 hover:bg-white text-slate-700 hover:text-slate-900 border border-slate-200 hover:border-slate-300 backdrop-blur-md rounded-2xl font-bold text-base hover:-translate-y-0.5 transition-all flex items-center justify-center gap-2 shadow-xs"
              >
                <TrendingUp className="h-5 w-5 text-amber-500" />
                <span>โพสต์ยอดนิยม 🔥</span>
              </Link>
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
