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

  // Filter posts based on selected level
  const selectedLevelObj = levels.find(l => l.id === activeLevel);
  const postsOfLevel = posts.filter(post => post.level === selectedLevelObj?.postLevel);

  // Sort helper based on likes / views
  const parseViews = (v) => {
    if (typeof v === 'number') return v;
    if (typeof v === 'string') {
      if (v.includes('k')) return parseFloat(v.replace('k', '')) * 1000;
      return parseInt(v) || 0;
    }
    return 0;
  };

  // Keep the ranking rule in one place: highest views first, then newest post.
  // `view_count` is the raw API value; `views` is only the display fallback.
  const compareByViewsThenCreatedAt = (a, b) => {
    const viewDifference = parseViews(b.view_count ?? b.views) - parseViews(a.view_count ?? a.views);
    if (viewDifference !== 0) return viewDifference;

    const createdAtDifference = new Date(b.created_at || 0).getTime() - new Date(a.created_at || 0).getTime();
    if (createdAtDifference !== 0) return createdAtDifference;

    return String(a.id).localeCompare(String(b.id));
  };

  const sortPosts = (items) => {
    return [...items].sort((a, b) => {
      if (filterType === 'likes') return b.likes - a.likes;
      return compareByViewsThenCreatedAt(a, b);
    });
  };

  const top3 = [...postsOfLevel]
    .sort(compareByViewsThenCreatedAt)
    .slice(0, 3);

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
    <div className="max-w-7xl mx-auto px-3 min-[414px]:px-4 sm:px-6 lg:px-8 py-8 sm:py-14">
      {/* Header */}
      <div className="mb-8 text-center">
        <h1 className="text-3xl min-[414px]:text-4xl sm:text-5xl font-extrabold text-slate-900 flex items-center justify-center gap-2 sm:gap-4">
          <TrendingUp className="h-8 w-8 shrink-0 min-[414px]:h-10 min-[414px]:w-10 sm:h-12 sm:w-12 text-rose-500" />
          Trending Now
        </h1>
        <p className="mx-auto mt-4 max-w-2xl break-words text-base leading-relaxed text-slate-500 sm:text-lg">สรุปเนื้อหาที่กำลังได้รับความนิยมสูงสุดในขณะนี้</p>
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
        <div className="mx-auto mb-8 flex max-w-full items-center justify-center gap-1 px-1 text-center sm:gap-2">
          <Sparkles className="h-4 w-4 shrink-0 text-yellow-500 sm:h-5 sm:w-5" />
          <h2 className="min-w-0 break-words text-lg font-extrabold leading-snug text-slate-800 sm:text-2xl">Top 3 ยอดวิวสูงสุดของสัปดาห์นี้</h2>
          <Sparkles className="h-4 w-4 shrink-0 text-yellow-500 sm:h-5 sm:w-5" />
        </div>

        {top3.length > 0 ? (
          /* Top 3 Grid with special styling */
          <div className="grid grid-cols-3 items-stretch gap-2 px-0 min-[414px]:gap-3 sm:px-4 md:gap-6 md:px-8 lg:gap-10">
            {top3.map((post, index) => (
              <div
                key={post.id}
                className="h-full min-w-0 [&>div]:h-full animate-in slide-in-from-bottom-10 fade-in duration-700"
              >
                <PostCard post={post} viewMode="grid" rank={index + 1} />
              </div>
            ))}
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
