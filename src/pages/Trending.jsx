import { useState, useEffect } from 'react';
import { TrendingUp, Flame, Eye, Sparkles, BookOpen } from 'lucide-react';
import PostCard from '@/components/PostCard';
import { postService } from '@/services/post.service';

export default function Trending() {
  const [filterType, setFilterType] = useState('likes'); // 'likes' or 'views'
  const [posts, setPosts] = useState([]);
  const [activeLevel, setActiveLevel] = useState('MIDDLE_SCHOOL');
  const [isLoading, setIsLoading] = useState(true);

  const levels = [
    { id: 'MIDDLE_SCHOOL', label: 'มัธยมต้น', postLevel: 'มัธยมศึกษาตอนต้น' },
    { id: 'HIGH_SCHOOL', label: 'มัธยมปลาย', postLevel: 'มัธยมศึกษาตอนปลาย' },
    { id: 'UNIVERSITY', label: 'มหาวิทยาลัย', postLevel: 'มหาวิทยาลัย' },
  ];

  useEffect(() => {
    const fetchPosts = async () => {
      try {
        setIsLoading(true);
        const fetchedPosts = await postService.getAllPosts();
        setPosts(fetchedPosts);
      } catch (error) {
        console.error('Error fetching trending posts:', error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchPosts();
  }, []);

  // Helper to get the date of Monday of the current week (calendar-based)
  const getMondayOfCurrentWeek = () => {
    const today = new Date();
    const day = today.getDay(); // 0 (Sun) to 6 (Sat)
    const diff = today.getDate() - day + (day === 0 ? -6 : 1); // Adjust for Sunday
    const monday = new Date(today.setDate(diff));
    monday.setHours(0, 0, 0, 0); // Start of Monday
    return monday;
  };

  // Filter posts based on selected level
  const selectedLevelObj = levels.find(l => l.id === activeLevel);
  const postsOfLevel = posts.filter(post => post.level === selectedLevelObj?.postLevel);

  // Filter weekly posts (created on or after Monday of this week)
  const mondayOfThisWeek = getMondayOfCurrentWeek();
  const weeklyPosts = postsOfLevel.filter(post => {
    if (!post.created_at) return false;
    return new Date(post.created_at) >= mondayOfThisWeek;
  });

  // Sort helper based on likes / views
  const parseViews = (v) => {
    if (typeof v === 'number') return v;
    if (typeof v === 'string') {
      if (v.includes('k')) return parseFloat(v.replace('k', '')) * 1000;
      return parseInt(v) || 0;
    }
    return 0;
  };

  const sortPosts = (items) => {
    return [...items].sort((a, b) => {
      if (filterType === 'likes') return b.likes - a.likes;
      return parseViews(b.views) - parseViews(a.views);
    });
  };

  // Weekly Top 3 (Always sorted by views - ยอดดูสูงสุด)
  const sortedWeekly = [...weeklyPosts].sort((a, b) => parseViews(b.views) - parseViews(a.views));
  const top3 = sortedWeekly.slice(0, 3);

  // Rest of the posts: All posts of this level, sorted, excluding those in top3
  const sortedAll = sortPosts(postsOfLevel);
  const restPosts = sortedAll.filter(post => !top3.some(t => t.id === post.id));

  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-[50vh]">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-14">
      {/* Header */}
      <div className="mb-8 text-center">
        <h1 className="text-4xl sm:text-5xl font-extrabold text-slate-900 flex items-center justify-center gap-4">
          <TrendingUp className="h-10 w-10 sm:h-12 sm:w-12 text-rose-500" />
          Trending Now
        </h1>
        <p className="text-slate-500 mt-4 text-lg">สรุปเนื้อหาที่กำลังได้รับความนิยมสูงสุดในขณะนี้</p>
      </div>

      {/* Education Level Tab Buttons */}
      <div className="flex justify-center mb-12">
        <div className="flex p-1.5 bg-slate-100 rounded-2xl w-full max-w-md shadow-sm border border-slate-200/50">
          {levels.map((level) => (
            <button
              key={level.id}
              onClick={() => setActiveLevel(level.id)}
              className={`flex-1 px-4 py-3 rounded-xl text-center font-bold text-sm transition-all duration-200 cursor-pointer ${
                activeLevel === level.id
                  ? 'bg-white text-slate-900 shadow-sm scale-[1.02]'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              {level.label}
            </button>
          ))}
        </div>
      </div>

      {/* Top 3 Section */}
      <div className="mb-16">
        <div className="flex items-center justify-center gap-2 mb-8">
          <Sparkles className="h-5 w-5 text-yellow-500" />
          <h2 className="text-2xl font-extrabold text-slate-800">Top 3 ยอดวิวสูงสุดของสัปดาห์นี้</h2>
          <Sparkles className="h-5 w-5 text-yellow-500" />
        </div>

        {top3.length > 0 ? (
          /* Top 3 Grid with special styling */
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 md:gap-6 lg:gap-10 items-end px-4 sm:px-8">
            {top3[1] && (
              <div className="order-2 md:order-1 animate-in slide-in-from-bottom-10 fade-in duration-700 delay-100">
                <PostCard post={top3[1]} viewMode="grid" rank={2} />
              </div>
            )}
            {top3[0] && (
              <div className="order-1 md:order-2 z-10 animate-in slide-in-from-bottom-16 fade-in duration-700 delay-300">
                <PostCard post={top3[0]} viewMode="grid" rank={1} />
              </div>
            )}
            {top3[2] && (
              <div className="order-3 md:order-3 animate-in slide-in-from-bottom-10 fade-in duration-700 delay-500">
                <PostCard post={top3[2]} viewMode="grid" rank={3} />
              </div>
            )}
          </div>
        ) : (
          <div className="text-center py-12 bg-white rounded-2xl border border-slate-200 border-dashed">
            <Sparkles className="h-10 w-10 text-slate-300 mx-auto mb-3 animate-pulse" />
            <p className="text-slate-500 font-bold">ไม่มีโพสต์ยอดนิยมในสัปดาห์นี้</p>
          </div>
        )}
      </div>

      <div className="border-t border-slate-100 pt-12 mb-10 flex flex-col sm:flex-row justify-between items-center gap-6">
        <h2 className="text-2xl font-bold text-slate-800">สำรวจโพสต์ฮิตอื่นๆ</h2>

        {/* Filter Toggle */}
        <div className="flex p-1.5 bg-slate-100 rounded-xl w-full sm:w-auto">
          <button
            onClick={() => setFilterType('likes')}
            className={`flex-1 sm:flex-none px-6 py-2.5 rounded-lg flex items-center justify-center gap-2 font-bold transition-all ${filterType === 'likes' ? 'bg-white text-rose-500 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
          >
            <Flame className="h-5 w-5" />
            Most Liked
          </button>
          <button
            onClick={() => setFilterType('views')}
            className={`flex-1 sm:flex-none px-6 py-2.5 rounded-lg flex items-center justify-center gap-2 font-bold transition-all ${filterType === 'views' ? 'bg-white text-blue-500 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
          >
            <Eye className="h-5 w-5" />
            Most Viewed
          </button>
        </div>
      </div>

      {/* Rest of the posts */}
      {restPosts.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
          {restPosts.map(post => (
            <PostCard key={post.id} post={post} viewMode="grid" />
          ))}
        </div>
      ) : (
        <div className="text-center py-16 bg-white rounded-2xl border border-slate-200 border-dashed">
          <BookOpen className="h-10 w-10 text-slate-300 mx-auto mb-3" />
          <p className="text-slate-500 font-bold">ไม่มีโพสต์อื่นเพิ่มเติมในระดับชั้นนี้</p>
        </div>
      )}
    </div>
  );
}
