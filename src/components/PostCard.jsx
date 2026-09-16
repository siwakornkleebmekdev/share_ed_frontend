import { useState, useEffect } from 'react';
import { Heart, Eye, Bookmark, BookmarkPlus, BookmarkCheck, Crown, Medal } from 'lucide-react';
import { useNavigate } from 'react-router';
import toast from 'react-hot-toast';
import { postService } from '../services/post.service';
import useAuthStore from '../store/authStore';
import useHeroThemeStore from '../store/heroThemeStore';
import { getGlassColor, rgbToRgba } from '../utils/colorUtils';

export default function PostCard({ post, viewMode, rank = null, dark = false, onBookmarkChange }) {
  const [isLiked, setIsLiked] = useState(Boolean(post.isLiked || post.is_liked));
  const [isBookmarked, setIsBookmarked] = useState(Boolean(post.isBookmarked || post.is_bookmarked));
  const [likesCount, setLikesCount] = useState(post.likes);
  const [isLiking, setIsLiking] = useState(false);
  const [isBookmarking, setIsBookmarking] = useState(false);
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const navigate = useNavigate();

  useEffect(() => {
    setIsLiked(Boolean(post.isLiked || post.is_liked));
    setIsBookmarked(Boolean(post.isBookmarked || post.is_bookmarked));
    setLikesCount(post.likes);
  }, [post.id, post.isLiked, post.is_liked, post.isBookmarked, post.is_bookmarked, post.likes]);
  // `dark` cards sit on a page with a full-bleed hero background (Profile) —
  // tint their glass to match that background's color instead of a flat
  // neutral overlay.
  const isDarkHero = useHeroThemeStore((state) => state.isDarkHero);
  const heroColor = useHeroThemeStore((state) => state.heroColor);
  const cardGlassStyle = dark ? { backgroundColor: rgbToRgba(getGlassColor(heroColor, isDarkHero), 25) } : undefined;

  const authorName = typeof post.author === 'string'
    ? post.author
    : (post.author?.username || post.author?.name || 'ผู้ใช้งาน');
  const authorId = post.authorId || post.author_id || post.author?.id || post.author?.user_id || post.user_id;
  const rawAuthorAvatar = post.authorAvatar
    || post.author_avatar
    || (typeof post.author === 'object' ? (post.author?.avatar_url || post.author?.profile_image || post.author?.avatar) : null);
  const defaultAvatar = `https://ui-avatars.com/api/?name=${encodeURIComponent(authorName || 'User')}&background=1e293b&color=38bdf8`;
  const authorAvatar = rawAuthorAvatar || defaultAvatar;

  const handleAuthorClick = (e) => {
    if (authorId) {
      e.stopPropagation();
      navigate(`/profile/${authorId}`);
    }
  };

  const handleLike = async (e) => {
    e.stopPropagation();
    if (!isAuthenticated) {
      toast.error('กรุณาสมัครสมาชิกเพื่อกดถูกใจ');
      return navigate('/register');
    }
    if (isLiking || !post?.id) return;

    try {
      setIsLiking(true);
      const response = await postService.likePost(post.id);
      const resData = response?.data || response;
      const newIsLiked = resData?.isLiked !== undefined 
        ? resData.isLiked 
        : (resData?.is_liked !== undefined 
          ? resData.is_liked 
          : (resData?.liked !== undefined ? resData.liked : !isLiked));

      setIsLiked(newIsLiked);
      setLikesCount(prev => {
        const count = typeof prev === 'number' ? prev : (parseInt(prev) || 0);
        if (typeof resData?.likesCount === 'number') return resData.likesCount;
        if (typeof resData?.likes_count === 'number') return resData.likes_count;
        return newIsLiked ? count + 1 : Math.max(0, count - 1);
      });
    } catch (err) {
      console.error('Error liking post in card:', err);
      toast.error('เกิดข้อผิดพลาดในการกดถูกใจ');
    } finally {
      setIsLiking(false);
    }
  };

  const handleBookmark = async (e) => {
    e.stopPropagation();
    if (!isAuthenticated) {
      toast.error('กรุณาสมัครสมาชิกเพื่อบันทึกโพสต์');
      return navigate('/register');
    }
    if (isBookmarking || !post?.id) return;

    try {
      setIsBookmarking(true);
      const response = await postService.bookmarkPost(post.id);
      const resData = response?.data || response;
      const newIsBookmarked = resData?.isBookmarked !== undefined 
        ? resData.isBookmarked 
        : (resData?.is_bookmarked !== undefined 
          ? resData.is_bookmarked 
          : (resData?.bookmarked !== undefined ? resData.bookmarked : !isBookmarked));

      setIsBookmarked(newIsBookmarked);
      onBookmarkChange?.(post.id, newIsBookmarked);
      if (newIsBookmarked) {
        toast('เพิ่มบุ๊คมาร์กเรียบร้อย', { icon: <Bookmark className="h-5 w-5 text-amber-500 fill-amber-500" /> });
      } else {
        toast('นำบุ๊คมาร์กออกแล้ว', { icon: <Bookmark className="h-5 w-5 text-amber-500" /> });
      }
    } catch (err) {
      console.error('Error bookmarking post in card:', err);
      toast.error('เกิดข้อผิดพลาดในการบันทึกโพสต์');
    } finally {
      setIsBookmarking(false);
    }
  };

  const handlePostClick = () => {
    // Allows both guests and logged-in users to view the post
    navigate(`/post/${post.id}`);
  };

  const getRankBadge = () => {
    if (rank === 1) return <div className="absolute -top-3 -left-3 h-10 w-10 bg-gradient-to-br from-yellow-300 to-yellow-500 rounded-full flex items-center justify-center shadow-lg shadow-yellow-500/40 z-20 animate-bounce"><Crown className="h-5 w-5 text-white" /></div>;
    if (rank === 2) return <div className="absolute -top-3 -left-3 h-10 w-10 bg-gradient-to-br from-slate-300 to-slate-400 rounded-full flex items-center justify-center shadow-lg shadow-slate-500/30 z-20"><Medal className="h-5 w-5 text-white" /></div>;
    if (rank === 3) return <div className="absolute -top-3 -left-3 h-10 w-10 bg-gradient-to-br from-amber-600 to-orange-700 rounded-full flex items-center justify-center shadow-lg shadow-orange-700/30 z-20"><Medal className="h-5 w-5 text-white" /></div>;
    return null;
  };

  // Special Rank classes
  const cardRankClasses = dark
    ? "backdrop-blur-xl rounded-2xl shadow-lg shadow-black/20 border border-white/10 hover:shadow-xl hover:border-white/20 transition-all overflow-hidden group cursor-pointer flex flex-col relative"
    : rank === 1
    ? "bg-white rounded-2xl shadow-xl shadow-yellow-500/10 border-2 border-yellow-400 hover:shadow-2xl hover:shadow-yellow-500/20 transition-all overflow-visible group cursor-pointer flex flex-col relative scale-[1.02]"
    : rank === 2 || rank === 3
    ? "bg-white rounded-2xl shadow-lg border-2 border-slate-100 hover:shadow-xl transition-all overflow-visible group cursor-pointer flex flex-col relative"
    : "bg-white rounded-2xl shadow-sm border border-slate-100 hover:shadow-md hover:border-primary/20 transition-all overflow-hidden group cursor-pointer flex flex-col relative";

  if (viewMode === 'list') {
    return (
      <div
        onClick={handlePostClick}
        className={`flex flex-col sm:flex-row gap-4 p-4 rounded-2xl shadow-sm transition-all group cursor-pointer relative ${dark ? 'backdrop-blur-xl border border-white/10 hover:border-white/20' : 'bg-white border border-slate-100 hover:shadow-md hover:border-primary/20'}`}
        style={cardGlassStyle}
      >
        <div className="w-full sm:w-56 h-36 flex-shrink-0 rounded-xl overflow-hidden bg-slate-100 relative">
          <img src={post.image} alt={post.title} className="w-full h-full object-cover object-center group-hover:scale-105 transition-transform duration-300" />
          <div className={`absolute top-2 left-2 px-2.5 py-1 backdrop-blur-md rounded-lg text-[11px] font-bold shadow-sm ${dark ? 'bg-black/40 text-white border border-white/10' : 'bg-white/90 text-slate-700'}`}>
            {post.subject}
          </div>
        </div>
        <div className="flex flex-1 flex-col justify-between py-1">
          <div>
            <div className="flex items-start justify-between gap-4">
              <h3 className={`text-xl font-bold line-clamp-2 group-hover:text-primary transition-colors ${dark ? 'text-white' : 'text-slate-800'}`}>{post.title}</h3>
              <button
                onClick={handleBookmark}
                className={`p-2 rounded-lg transition-all flex-shrink-0 ${isBookmarked ? 'text-primary bg-blue-50' : dark ? 'text-slate-400 hover:text-primary hover:bg-white/10' : 'text-slate-300 hover:text-primary hover:bg-primary/5'}`}
              >
                {isBookmarked ? <BookmarkCheck className="h-6 w-6" /> : <BookmarkPlus className="h-6 w-6" />}
              </button>
            </div>
            <span className={`inline-block mt-2 px-2.5 py-1 rounded-md text-[11px] font-medium ${dark ? 'bg-white/5 border border-white/10 text-slate-300' : 'bg-slate-50 border border-slate-100 text-slate-600'}`}>
              {post.level}
            </span>
          </div>
          <div className={`flex items-center justify-between mt-4 sm:mt-0 pt-4 border-t sm:pt-0 ${dark ? 'border-white/10 sm:border-transparent' : 'border-slate-50 sm:border-transparent'}`}>
            <div
              onClick={handleAuthorClick}
              className={`flex items-center gap-2 min-w-0 ${authorId ? 'cursor-pointer hover:opacity-80 transition-opacity' : ''}`}
            >
              <div className={`h-7 w-7 rounded-full overflow-hidden flex-shrink-0 flex items-center justify-center font-bold text-xs ${dark ? 'bg-white/10 border border-white/10 text-primary' : 'bg-blue-50 border border-blue-100 text-primary'}`}>
                <img
                  src={authorAvatar}
                  alt={authorName}
                  className="h-full w-full object-cover"
                  onError={(e) => {
                    e.target.onerror = null;
                    e.target.src = defaultAvatar;
                  }}
                />
              </div>
              <span className={`text-sm font-semibold transition-colors line-clamp-1 ${dark ? 'text-slate-300 group-hover:text-white' : 'text-slate-600 group-hover:text-slate-900'}`}>{authorName}</span>
            </div>
            <div className="flex items-center gap-4 text-slate-400 text-sm font-medium">
              <div className={`flex items-center gap-1.5 transition-colors ${dark ? 'hover:text-slate-200' : 'hover:text-slate-600'}`}><Eye className="h-4 w-4" /> {post.views}</div>
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
    <div onClick={handlePostClick} className={cardRankClasses} style={cardGlassStyle}>
      {getRankBadge()}
      <div className={`w-full relative bg-slate-100 overflow-hidden ${rank ? 'h-56 rounded-t-[14px]' : 'h-48'}`}>
        <img src={post.image} alt={post.title} className="w-full h-full object-cover object-center group-hover:scale-105 transition-transform duration-300" />
        <div className={`absolute top-3 left-3 px-2.5 py-1 backdrop-blur-md rounded-lg text-[11px] font-bold shadow-sm z-10 ${dark ? 'bg-black/40 text-white border border-white/10' : 'bg-white/90 text-slate-700'}`}>
          {post.subject}
        </div>
        <button
          onClick={handleBookmark}
          className={`absolute top-3 right-3 p-2.5 backdrop-blur-md rounded-lg shadow-md transition-all duration-200 z-10 ${isBookmarked ? 'text-primary opacity-100' : dark ? 'text-slate-300 hover:text-primary opacity-0 group-hover:opacity-100 translate-y-[-10px] group-hover:translate-y-0' : 'text-slate-500 hover:text-primary opacity-0 group-hover:opacity-100 translate-y-[-10px] group-hover:translate-y-0'} ${dark ? 'bg-white/10' : 'bg-white/95'}`}
        >
          {isBookmarked ? <BookmarkCheck className="h-5 w-5" /> : <BookmarkPlus className="h-5 w-5" />}
        </button>
      </div>
      <div className="p-5 flex flex-col flex-1">
        <span className={`inline-block mb-3 px-2.5 py-1 rounded-md text-[11px] font-medium w-fit ${dark ? 'bg-white/5 border border-white/10 text-slate-300' : 'bg-slate-50 border border-slate-100 text-slate-600'}`}>
          {post.level}
        </span>
        <h3 className={`text-lg font-bold line-clamp-2 mb-4 group-hover:text-primary transition-colors flex-1 ${dark ? 'text-white' : 'text-slate-800'}`}>{post.title}</h3>
        <div className={`flex items-center justify-between pt-4 border-t mt-auto ${dark ? 'border-white/10' : 'border-slate-100'}`}>
          <div
            onClick={handleAuthorClick}
            className={`flex items-center gap-2 min-w-0 ${authorId ? 'cursor-pointer hover:opacity-80 transition-opacity' : ''}`}
          >
            <div className={`h-7 w-7 rounded-full overflow-hidden flex-shrink-0 flex items-center justify-center font-bold text-xs ${dark ? 'bg-white/10 border border-white/10 text-primary' : 'bg-blue-50 border border-blue-100 text-primary'}`}>
              <img
                src={authorAvatar}
                alt={authorName}
                className="h-full w-full object-cover"
                onError={(e) => {
                  e.target.onerror = null;
                  e.target.src = defaultAvatar;
                }}
              />
            </div>
            <span className={`text-sm font-semibold transition-colors line-clamp-1 ${dark ? 'text-slate-300 group-hover:text-white' : 'text-slate-600 group-hover:text-slate-900'}`}>{authorName}</span>
          </div>
          <div className="flex items-center gap-3 text-slate-400 text-sm font-medium flex-shrink-0">
            <div className={`flex items-center gap-1 transition-colors ${dark ? 'hover:text-slate-200' : 'hover:text-slate-600'}`}><Eye className="h-3.5 w-3.5" /> {post.views}</div>
            <button onClick={handleLike} className={`flex items-center gap-1 transition-colors ${isLiked ? 'text-rose-500' : 'hover:text-rose-500'}`}>
              <Heart className={`h-3.5 w-3.5 ${isLiked ? 'fill-rose-500' : ''}`} /> {likesCount}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
