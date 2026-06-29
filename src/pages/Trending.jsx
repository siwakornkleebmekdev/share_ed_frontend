import { useState } from 'react';
import { TrendingUp, Flame, Eye, Sparkles } from 'lucide-react';
import PostCard from '@/components/PostCard';
export default function Trending() {
  const [filterType, setFilterType] = useState('likes'); // 'likes' or 'views'
  const [posts, setPosts] = useState([]);

  // Sort mock data based on filter type
  const sortedPosts = [...posts].sort((a, b) => {
    if (filterType === 'likes') return b.likes - a.likes;
    const parseViews = (v) => v.includes('k') ? parseFloat(v.replace('k', '')) * 1000 : parseInt(v);
    return parseViews(b.views) - parseViews(a.views);
  });

  const top3 = sortedPosts.slice(0, 3);
  const restPosts = sortedPosts.slice(3);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-14">
      {/* Header */}
      <div className="mb-12 text-center">
        <h1 className="text-4xl sm:text-5xl font-extrabold text-slate-900 flex items-center justify-center gap-4">
          <TrendingUp className="h-10 w-10 sm:h-12 sm:w-12 text-rose-500" />
          Trending Now
        </h1>
        <p className="text-slate-500 mt-4 text-lg">สรุปเนื้อหาที่กำลังได้รับความนิยมสูงสุดในขณะนี้</p>
      </div>

      {/* Top 3 Section */}
      {top3.length > 0 && (
        <div className="mb-16">
          <div className="flex items-center justify-center gap-2 mb-8">
            <Sparkles className="h-5 w-5 text-yellow-500" />
            <h2 className="text-2xl font-extrabold text-slate-800">Top 3 Creators</h2>
            <Sparkles className="h-5 w-5 text-yellow-500" />
          </div>
          
          {/* Top 3 Grid with special styling */}
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
        </div>
      )}

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
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
        {restPosts.map(post => (
          <PostCard key={post.id} post={post} viewMode="grid" />
        ))}
      </div>
    </div>
  );
}
