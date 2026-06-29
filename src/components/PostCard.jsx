import { useState } from 'react';
import { Heart, Eye, BookmarkPlus, BookmarkCheck, Crown, Medal } from 'lucide-react';
import { useNavigate } from 'react-router';
import toast from 'react-hot-toast';
import useAuthStore from '../store/authStore';

export default function PostCard({ post, viewMode, rank = null }) {
  const [isLiked, setIsLiked] = useState(false);
  const [isBookmarked, setIsBookmarked] = useState(false);
  const [likesCount, setLikesCount] = useState(post.likes);
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const navigate = useNavigate();

  const handleLike = (e) => {
    e.stopPropagation();
    if (!isAuthenticated) {
      toast.error('กรุณาสมัครสมาชิกเพื่อกดถูกใจ');
      return navigate('/register');
    }

    if (isLiked) {
      setIsLiked(false);
      setLikesCount(prev => prev - 1);
      toast('ยกเลิกการถูกใจ', { icon: '💔' });
    } else {
      setIsLiked(true);
      setLikesCount(prev => prev + 1);
      toast.success('ถูกใจโพสต์แล้ว');
    }
  };

  const handleBookmark = (e) => {
    e.stopPropagation();
    if (!isAuthenticated) {
      toast.error('กรุณาสมัครสมาชิกเพื่อบันทึกโพสต์');
      return navigate('/register');
    }

    if (isBookmarked) {
      setIsBookmarked(false);
      toast('นำบุ๊คมาร์กออกแล้ว', { icon: '🗑️' });
    } else {
      setIsBookmarked(true);
      toast.success('เพิ่มบุ๊คมาร์กเรียบร้อย');
    }
  };

  const handlePostClick = () => {
    if (!isAuthenticated) {
      toast.error('กรุณาสมัครสมาชิกเพื่อดูเนื้อหานี้');
      navigate('/register');
    } else {
      toast.success('กำลังเปิดเนื้อหา...', { icon: '📄' });
    }
  };

  const getRankBadge = () => {
    if (rank === 1) return <div className="absolute -top-3 -left-3 h-10 w-10 bg-gradient-to-br from-yellow-300 to-yellow-500 rounded-full flex items-center justify-center shadow-lg shadow-yellow-500/40 z-20 animate-bounce"><Crown className="h-5 w-5 text-white" /></div>;
    if (rank === 2) return <div className="absolute -top-3 -left-3 h-10 w-10 bg-gradient-to-br from-slate-300 to-slate-400 rounded-full flex items-center justify-center shadow-lg shadow-slate-500/30 z-20"><Medal className="h-5 w-5 text-white" /></div>;
    if (rank === 3) return <div className="absolute -top-3 -left-3 h-10 w-10 bg-gradient-to-br from-amber-600 to-orange-700 rounded-full flex items-center justify-center shadow-lg shadow-orange-700/30 z-20"><Medal className="h-5 w-5 text-white" /></div>;
    return null;
  };

  // Special Rank classes
  const cardRankClasses = rank === 1 
    ? "bg-white rounded-2xl shadow-xl shadow-yellow-500/10 border-2 border-yellow-400 hover:shadow-2xl hover:shadow-yellow-500/20 transition-all overflow-visible group cursor-pointer flex flex-col relative scale-[1.02]" 
    : rank === 2 || rank === 3 
    ? "bg-white rounded-2xl shadow-lg border-2 border-slate-100 hover:shadow-xl transition-all overflow-visible group cursor-pointer flex flex-col relative"
    : "bg-white rounded-2xl shadow-sm border border-slate-100 hover:shadow-md hover:border-primary/20 transition-all overflow-hidden group cursor-pointer flex flex-col relative";

  if (viewMode === 'list') {
    return (
      <div onClick={handlePostClick} className="flex flex-col sm:flex-row gap-4 bg-white p-4 rounded-2xl shadow-sm border border-slate-100 hover:shadow-md hover:border-primary/20 transition-all group cursor-pointer relative">
        <div className="w-full sm:w-56 h-36 flex-shrink-0 rounded-xl overflow-hidden bg-slate-100 relative">
          <img src={post.image} alt={post.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
          <div className="absolute top-2 left-2 px-2.5 py-1 bg-white/90 backdrop-blur-md rounded-lg text-[11px] font-bold text-slate-700 shadow-sm">
            {post.subject}
          </div>
        </div>
        <div className="flex flex-1 flex-col justify-between py-1">
          <div>
            <div className="flex items-start justify-between gap-4">
              <h3 className="text-xl font-bold text-slate-800 line-clamp-2 group-hover:text-primary transition-colors">{post.title}</h3>
              <button 
                onClick={handleBookmark}
                className={`p-2 rounded-lg transition-all flex-shrink-0 ${isBookmarked ? 'text-primary bg-blue-50' : 'text-slate-300 hover:text-primary hover:bg-primary/5'}`}
              >
                {isBookmarked ? <BookmarkCheck className="h-6 w-6" /> : <BookmarkPlus className="h-6 w-6" />}
              </button>
            </div>
            <span className="inline-block mt-2 px-2.5 py-1 bg-slate-50 border border-slate-100 text-slate-600 rounded-md text-[11px] font-medium">
              {post.level}
            </span>
          </div>
          <div className="flex items-center justify-between mt-4 sm:mt-0 pt-4 border-t border-slate-50 sm:border-transparent sm:pt-0">
            <div className="flex items-center gap-2">
              <div className="h-7 w-7 rounded-full bg-blue-50 border border-blue-100 flex items-center justify-center text-primary font-bold text-xs">
                {post.author[0]}
              </div>
              <span className="text-sm font-semibold text-slate-600 group-hover:text-slate-900 transition-colors">{post.author}</span>
            </div>
            <div className="flex items-center gap-4 text-slate-400 text-sm font-medium">
              <div className="flex items-center gap-1.5 hover:text-slate-600 transition-colors"><Eye className="h-4 w-4" /> {post.views}</div>
              <button onClick={handleLike} className={`flex items-center gap-1.5 transition-colors ${isLiked ? 'text-rose-500' : 'hover:text-rose-500'}`}>
                <Heart className={`h-4 w-4 ${isLiked ? 'fill-rose-500' : ''}`} /> {likesCount}
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Grid View (used in Top 3 and regular grid)
  return (
    <div onClick={handlePostClick} className={cardRankClasses}>
      {getRankBadge()}
      <div className={`w-full relative bg-slate-100 overflow-hidden ${rank ? 'h-56 rounded-t-[14px]' : 'h-48'}`}>
        <img src={post.image} alt={post.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
        <div className="absolute top-3 left-3 px-2.5 py-1 bg-white/90 backdrop-blur-md rounded-lg text-[11px] font-bold text-slate-700 shadow-sm z-10">
          {post.subject}
        </div>
        <button 
          onClick={handleBookmark}
          className={`absolute top-3 right-3 p-2.5 bg-white/95 backdrop-blur-md rounded-lg shadow-md transition-all duration-200 z-10 ${isBookmarked ? 'text-primary opacity-100' : 'text-slate-500 hover:text-primary opacity-0 group-hover:opacity-100 translate-y-[-10px] group-hover:translate-y-0'}`}
        >
          {isBookmarked ? <BookmarkCheck className="h-5 w-5" /> : <BookmarkPlus className="h-5 w-5" />}
        </button>
      </div>
      <div className="p-5 flex flex-col flex-1">
        <span className="inline-block mb-3 px-2.5 py-1 bg-slate-50 border border-slate-100 text-slate-600 rounded-md text-[11px] font-medium w-fit">
          {post.level}
        </span>
        <h3 className="text-lg font-bold text-slate-800 line-clamp-2 mb-4 group-hover:text-primary transition-colors flex-1">{post.title}</h3>
        <div className="flex items-center justify-between pt-4 border-t border-slate-100 mt-auto">
          <div className="flex items-center gap-2">
            <div className="h-7 w-7 rounded-full bg-blue-50 border border-blue-100 flex items-center justify-center text-primary font-bold text-xs">
              {post.author[0]}
            </div>
            <span className="text-sm font-semibold text-slate-600 group-hover:text-slate-900 transition-colors line-clamp-1">{post.author}</span>
          </div>
          <div className="flex items-center gap-3 text-slate-400 text-sm font-medium flex-shrink-0">
            <div className="flex items-center gap-1 hover:text-slate-600 transition-colors"><Eye className="h-3.5 w-3.5" /> {post.views}</div>
            <button onClick={handleLike} className={`flex items-center gap-1 transition-colors ${isLiked ? 'text-rose-500' : 'hover:text-rose-500'}`}>
              <Heart className={`h-3.5 w-3.5 ${isLiked ? 'fill-rose-500' : ''}`} /> {likesCount}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
