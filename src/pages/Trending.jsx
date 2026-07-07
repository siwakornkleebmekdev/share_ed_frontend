import { useState, useEffect } from 'react';
import { TrendingUp, Flame, Eye, Sparkles, Loader2 } from 'lucide-react';
import PostCard from '@/components/PostCard';
import { postService } from '@/services/post.service';

export default function Trending() {
  const [filterType, setFilterType] = useState('likes'); // 'likes' or 'views'
  const [posts, setPosts] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchTrendingPosts = async () => {
      try {
        setIsLoading(true);
        setError(null);
        const fetchedPosts = await postService.getAllPosts();
        setPosts(fetchedPosts);
      } catch (err) {
        console.error('Error fetching trending posts:', err);
        setError('ไม่สามารถโหลดข้อมูลโพสต์ยอดนิยมได้ กรุณาลองใหม่อีกครั้ง');
      } finally {
        setIsLoading(false);
      }
    };
    fetchTrendingPosts();
  }, []);

  const parseViews = (v) => {
    if (typeof v === 'number') return v;
    const strVal = String(v || '0');
    return strVal.includes('k') ? parseFloat(strVal.replace('k', '')) * 1000 : parseInt(strVal) || 0;
  };

  // The top 3 remains constant (showing all-time most viewed posts) and is not affected by clicking the filter toggle (unlinked)
  const top3 = [...posts]
    .sort((a, b) => parseViews(b.views) - parseViews(a.views))
    .slice(0, 3);

  // Sort other posts based on selected filter type (likes or views)
  const sortedPosts = [...posts].sort((a, b) => {
    if (filterType === 'likes') {
      return (b.likes || 0) - (a.likes || 0);
    }
    return parseViews(b.views) - parseViews(a.views);
  });

  // Filter out the top 3 posts to avoid duplication below
  const top3Ids = new Set(top3.map(p => p.id));
  const restPosts = sortedPosts.filter(p => !top3Ids.has(p.id));

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

      {/* Loading State */}
      {isLoading && (
        <div className="flex flex-col items-center justify-center py-20">
          <Loader2 className="h-10 w-10 text-primary animate-spin mb-4" />
          <p className="text-slate-500 font-medium">กำลังโหลดโพสต์ยอดนิยม...</p>
        </div>
      )}

      {/* Error State */}
      {!isLoading && error && (
        <div className="text-center py-16 bg-rose-50/50 rounded-2xl border border-rose-100 max-w-xl mx-auto">
          <p className="text-rose-600 font-semibold mb-4">{error}</p>
          <button
            onClick={async () => {
              try {
                setIsLoading(true);
                setError(null);
                const fetchedPosts = await postService.getAllPosts();
                setPosts(fetchedPosts);
              } catch (err) {
                setError('ไม่สามารถโหลดข้อมูลโพสต์ยอดนิยมได้ กรุณาลองใหม่อีกครั้ง');
              } finally {
                setIsLoading(false);
              }
            }}
            className="px-6 py-2.5 bg-primary text-white rounded-xl font-bold hover:bg-blue-600 shadow-sm transition-all"
          >
            ลองอีกครั้ง
          </button>
        </div>
      )}

      {/* Empty State */}
      {!isLoading && !error && posts.length === 0 && (
        <div className="text-center py-24 bg-white rounded-2xl border border-slate-200 border-dashed max-w-xl mx-auto">
          <TrendingUp className="h-12 w-12 text-slate-300 mx-auto mb-4" />
          <h3 className="text-lg font-bold text-slate-700 mb-1">ยังไม่มีโพสต์ยอดนิยมในขณะนี้</h3>
          <p className="text-slate-500">โพสต์ยอดนิยมจะแสดงขึ้นเมื่อมีการแชร์และมีผู้เข้าชมเนื้อหา</p>
        </div>
      )}

      {/* Content Section */}
      {!isLoading && !error && posts.length > 0 && (
        <>
          {/* Top 3 Section */}
          {top3.length > 0 && (
            <div className="mb-16">
              <div className="flex items-center justify-center gap-2 mb-8">
                <Sparkles className="h-5 w-5 text-yellow-500" />
                <h2 className="text-2xl font-extrabold text-slate-800">Top 3 Most Viewed Posts</h2>
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
          {restPosts.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
              {restPosts.map(post => (
                <PostCard key={post.id} post={post} viewMode="grid" />
              ))}
            </div>
          ) : (
            <div className="text-center py-12 text-slate-500">
              ไม่มีโพสต์ยอดนิยมอื่นๆ เพิ่มเติม
            </div>
          )}
        </>
      )}
    </div>
  );
}
