import { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router';
import { FileText, Download, Heart, Share2, Tag, ChevronLeft, ChevronRight, Calendar, Eye, EyeOff, Bookmark, X, Edit3, Trash2, Send, MessageSquare, AlignLeft, ImageIcon, Flag } from 'lucide-react';
import { postService } from '@/services/post.service';
import { profileService, DEFAULT_FRAMES } from '@/services/profile.service';
import useAuthStore from '@/store/authStore';
import useAchievementStore from '@/store/achievementStore';
import toast from 'react-hot-toast';
import Swal from 'sweetalert2';
import { supabase } from '@/utils/supabase';
import { sanitizePostContent } from '@/utils/sanitizePostContent';
import { resolveProfileFrame } from '@/utils/profileFrame';

const COMMENTS_PER_PAGE = 5;
const REPORT_REASONS = [
  'เนื้อหาไม่เหมาะสม',
  'สแปม',
  'คัดลอกผลงานผู้อื่น',
  'เนื้อหามีความหยาบคาย',
];

export default function PostDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { isAuthenticated, user } = useAuthStore();
  const { milestones, fetchMilestones } = useAchievementStore();
  const [isLiked, setIsLiked] = useState(false);
  const [isBookmarked, setIsBookmarked] = useState(false);

  const [previewImage, setPreviewImage] = useState(null);
  const [showPdfPreview, setShowPdfPreview] = useState(false);

  // Comments state
  const [comments, setComments] = useState([]);
  const [commentPage, setCommentPage] = useState(1);
  const [newCommentText, setNewCommentText] = useState('');
  const [isSubmittingComment, setIsSubmittingComment] = useState(false);

  // Loading states for actions to prevent spamming
  const [isLiking, setIsLiking] = useState(false);
  const [isBookmarking, setIsBookmarking] = useState(false);
  const [showReportModal, setShowReportModal] = useState(false);
  const [reportReason, setReportReason] = useState('');
  const [isReporting, setIsReporting] = useState(false);

  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  useEffect(() => {
    if (isAuthenticated) fetchMilestones();
  }, [fetchMilestones, isAuthenticated]);

  const [post, setPost] = useState(null);
  const [authorProfile, setAuthorProfile] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isDeletedPost, setIsDeletedPost] = useState(false);
  const [isDeletedPostOwner, setIsDeletedPostOwner] = useState(false);

  useEffect(() => {
    if (!isDeletedPost) return undefined;

    const redirectTimer = window.setTimeout(() => {
      navigate('/home', { replace: true });
    }, 2000);

    return () => window.clearTimeout(redirectTimer);
  }, [isDeletedPost, navigate]);

  useEffect(() => {
    const fetchPost = async () => {
      try {
        setIsDeletedPost(false);
        setIsDeletedPostOwner(false);
        if (!post || String(post.id) !== String(id)) {
          setIsLoading(true);
        }
        const data = await postService.getPostById(id);

        if (String(data?.postStatus || data?.post_status).toUpperCase() === 'DELETED') {
          const viewerId = user?.id || user?.user_id;
          const deletedPostAuthorId = data?.authorId || data?.author_id || data?.user_id || data?.author?.id;

          setPost(null);
          setIsDeletedPostOwner(Boolean(
            viewerId &&
            deletedPostAuthorId &&
            String(viewerId) === String(deletedPostAuthorId)
          ));
          setIsDeletedPost(true);
          return;
        }

        setPost(data);
        if (data) {
          setComments(data.comments || []);
          setCommentPage(1);
          const curUserId = user?.id || user?.user_id;
          const userLiked = Boolean(
            data.isLiked ||
            (Array.isArray(data.rawLikes) && curUserId && data.rawLikes.some(l => {
              if (typeof l === 'string') return String(l) === String(curUserId);
              return String(l.user_id || l.userId || l.user?.id || l.id) === String(curUserId);
            }))
          );
          setIsLiked(userLiked);
          // For signed-in users, checkUserStatuses is the source of truth.
          // The generic post response defaults this field to false and could
          // otherwise race with (and overwrite) the persisted bookmark state.
          if (!isAuthenticated) {
            setIsBookmarked(false);
          }
          const targetAuthorId = data.authorId || data.author_id || data.author?.id;
          if (targetAuthorId) {
            profileService.getUserProfile(targetAuthorId).then(prof => {
              if (prof) setAuthorProfile(prof);
            }).catch(err => console.log('Notice fetching author profile:', err?.message));
          }
        }
      } catch (error) {
        console.error('Error loading post details:', error);
        const errorMessage = error?.response?.data?.message || error?.message || '';
        const deletedResponse = error?.response?.status === 410 || /ถูกลบ|deleted/i.test(errorMessage);

        setPost(null);
        // Other members receive a 404 for a deleted post, without its author
        // data, so this branch must use the non-owner wording.
        setIsDeletedPostOwner(false);
        setIsDeletedPost(deletedResponse);
      } finally {
        setIsLoading(false);
      }
    };

    const checkUserStatuses = async () => {
      try {
        const [likeRes, bookmarkRes] = await Promise.allSettled([
          postService.getLikeStatus(id),
          postService.getBookmarks()
        ]);
        if (likeRes.status === 'fulfilled' && likeRes.value?.success) {
          setIsLiked(Boolean(likeRes.value.isLiked));
        }
        if (bookmarkRes.status === 'fulfilled' && bookmarkRes.value?.success && Array.isArray(bookmarkRes.value.data)) {
          const bookmarked = bookmarkRes.value.data.some(b =>
            String(b.post_id || b.postId || b.post?.id || b.id) === String(id)
          );
          setIsBookmarked(bookmarked);
        }
      } catch (err) {
        console.error('Error checking user statuses:', err);
      }
    };

    if (id) {
      setIsBookmarked(false);
      fetchPost();
      if (isAuthenticated) {
        checkUserStatuses();
      }
    }
  }, [id, user?.id, user?.user_id, isAuthenticated]);

  // Subscribe to Supabase Realtime Broadcast for comments
  useEffect(() => {
    if (!id || !isAuthenticated) return;

    const channel = supabase.channel(`post-comments:${id}`);

    channel
      .on('broadcast', { event: 'new-comment' }, ({ payload }) => {
        console.log('Received real-time comment:', payload);
        setComments(prev => {
          if (prev.some(c => c.id === payload.id)) return prev;
          return [payload, ...prev];
        });
      })
      .subscribe((status) => {
        if (status === 'SUBSCRIBED') {
          console.log(`Subscribed to real-time comments broadcast channel for post ${id}`);
        }
      });

    return () => {
      channel.unsubscribe();
    };
  }, [id, isAuthenticated]);

  const commentPageCount = Math.max(1, Math.ceil(comments.length / COMMENTS_PER_PAGE));
  const visibleComments = comments.slice(
    (commentPage - 1) * COMMENTS_PER_PAGE,
    commentPage * COMMENTS_PER_PAGE
  );
  const firstVisibleCommentPage = Math.max(
    1,
    Math.min(commentPage - 2, commentPageCount - 4)
  );
  const visibleCommentPages = Array.from(
    { length: Math.min(5, commentPageCount) },
    (_, index) => firstVisibleCommentPage + index
  );

  useEffect(() => {
    setCommentPage(currentPage => Math.min(currentPage, commentPageCount));
  }, [commentPageCount]);

  const currentUserId = user?.id || user?.user_id;
  const postAuthorId = post?.author?.id || post?.author?.user_id || post?.user_id || post?.author_id;
  const isAuthor = Boolean(
    isAuthenticated &&
    currentUserId &&
    postAuthorId &&
    String(currentUserId) === String(postAuthorId)
  );

  const authorUsername = isAuthor
    ? (user?.username || authorProfile?.username || post?.author?.username || 'ผู้ใช้งาน')
    : (authorProfile?.username || post?.author?.username || 'ผู้ใช้งาน');

  const authorAvatar = isAuthor
    ? (user?.avatar_url || user?.profile_image || user?.avatar || authorProfile?.profile_image || authorProfile?.avatar_url || post?.author?.avatar)
    : (authorProfile?.profile_image || authorProfile?.avatar_url || post?.author?.avatar);

  const authorRole = authorProfile?.role === 'ADMIN'
    ? 'แอดมิน'
    : (authorProfile?.role === 'MODERATOR' ? 'ผู้ดูแลระบบ' : (post?.author?.role || 'Contributor'));

  const authorFrameProfile = {
    ...post?.author,
    ...(isAuthor ? user : {}),
    ...authorProfile,
    current_frame_id: authorProfile?.current_frame_id
      || (isAuthor ? user?.current_frame_id || user?.user_metadata?.profile_frame_id : null)
      || post?.author_frame_id
      || post?.authorFrameId
      || post?.author?.current_frame_id,
    current_frame: authorProfile?.current_frame
      || (isAuthor ? user?.current_frame : null)
      || post?.authorFrame
      || post?.author_frame
      || post?.author?.current_frame,
  };
  const authorFrame = resolveProfileFrame(authorFrameProfile, [...milestones, ...DEFAULT_FRAMES]);
  const authorFrameUrl = authorFrame?.previewUrl;

  const handleOpenReport = () => {
    if (!isAuthenticated) {
      toast.error('กรุณาเข้าสู่ระบบก่อนรายงานโพสต์');
      navigate('/login');
      return;
    }
    setShowReportModal(true);
  };

  const handleSubmitReport = async (event) => {
    event.preventDefault();
    if (!reportReason || isReporting || !post) return;

    try {
      setIsReporting(true);
      await postService.reportPost(post.id, reportReason);
      toast.success('ส่งรายงานโพสต์เรียบร้อยแล้ว');
      setShowReportModal(false);
      setReportReason('');
    } catch (error) {
      console.error('Error reporting post:', error);
      const alreadyReported = error.response?.status === 400
        && /already reported/i.test(error.response?.data?.message || '');
      const message = alreadyReported
        ? 'คุณเคยรายงานโพสต์นี้แล้ว'
        : (error.response?.data?.message || 'ไม่สามารถส่งรายงานได้ กรุณาลองใหม่อีกครั้ง');
      toast.error(message);
    } finally {
      setIsReporting(false);
    }
  };

  const handleLike = async () => {
    if (!isAuthenticated) {
      toast.error('กรุณาสมัครสมาชิกเพื่อกดถูกใจ');
      navigate('/register');
      return;
    }
    if (isLiking || !post) return;
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
      setPost(prev => {
        if (!prev) return prev;
        const currentLikes = typeof prev.likes === 'number' ? prev.likes : (parseInt(prev.likes) || 0);
        let updatedLikes = newIsLiked ? currentLikes + 1 : Math.max(0, currentLikes - 1);
        if (typeof resData?.likesCount === 'number') updatedLikes = resData.likesCount;
        else if (typeof resData?.likes_count === 'number') updatedLikes = resData.likes_count;
        return {
          ...prev,
          likes: updatedLikes
        };
      });
    } catch (error) {
      console.error('Error liking post:', error);
      toast.error('เกิดข้อผิดพลาดในการกดถูกใจ');
    } finally {
      setIsLiking(false);
    }
  };

  const handleBookmark = async () => {
    if (!isAuthenticated) {
      toast.error('กรุณาสมัครสมาชิกเพื่อบันทึกโพสต์');
      navigate('/register');
      return;
    }
    if (isBookmarking || !post) return;
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
      if (newIsBookmarked) {
        toast('เพิ่มบุ๊คมาร์กเรียบร้อย', { icon: <Bookmark className="h-5 w-5 text-amber-500 fill-amber-500" /> });
      } else {
        toast('นำบุ๊คมาร์กออกแล้ว', { icon: <Bookmark className="h-5 w-5 text-amber-500" /> });
      }
    } catch (error) {
      console.error('Error bookmarking post:', error);
      toast.error('เกิดข้อผิดพลาดในการบันทึกโพสต์');
    } finally {
      setIsBookmarking(false);
    }
  };

  const handleDelete = async () => {
    const result = await Swal.fire({
      title: `คุณต้องการลบโพสต์ "${post?.title}" ใช่หรือไม่?`,
      text: 'การดำเนินการนี้จะทำการลบโพสต์แบบ Soft Delete (ซ่อนโพสต์ชั่วคราว)',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#ef4444',
      cancelButtonColor: '#64748b',
      confirmButtonText: 'ใช่, ลบเลย',
      cancelButtonText: 'ยกเลิก'
    });

    if (result.isConfirmed) {
      try {
        Swal.fire({
          title: 'กำลังลบโพสต์...',
          allowOutsideClick: false,
          didOpen: () => {
            Swal.showLoading();
          }
        });

        const response = await postService.deletePost(id);
        Swal.close();

        if (response && (response.success || response.status === 200)) {
          await Swal.fire({
            icon: 'success',
            title: 'ลบสำเร็จ!',
            text: 'โพสต์ของคุณถูกลบเรียบร้อยแล้ว',
            confirmButtonColor: '#3b82f6'
          });
          navigate('/explore');
        } else {
          throw new Error(response?.message || 'เกิดข้อผิดพลาดในการลบโพสต์');
        }
      } catch (error) {
        Swal.close();
        console.error('Error deleting post:', error);
        Swal.fire({
          icon: 'error',
          title: 'เกิดข้อผิดพลาด',
          text: error.response?.data?.message || error.message || 'ไม่สามารถเชื่อมต่อกับเซิร์ฟเวอร์ได้',
          confirmButtonColor: '#3b82f6'
        });
      }
    }
  };

  const handleSubmitComment = async (e) => {
    e.preventDefault();
    if (!isAuthenticated) {
      toast.error('กรุณาสมัครสมาชิกเพื่อแสดงความคิดเห็น');
      navigate('/register');
      return;
    }
    if (!newCommentText.trim()) {
      toast.error('กรุณากรอกความคิดเห็น');
      return;
    }
    if (!post) return;

    try {
      setIsSubmittingComment(true);
      const response = await postService.createComment(post.id, newCommentText.trim());

      if (response && (response.success || response.status === 200 || response.data)) {
        const commentData = response.data || response;
        const createdDate = commentData.created_at || commentData.createdAt || new Date();
        const newComment = {
          id: commentData.id || commentData._id || `c_${Date.now()}`,
          content: commentData.content || commentData.text || newCommentText.trim(),
          createdAt: new Date(createdDate).toLocaleDateString('th-TH', { hour: '2-digit', minute: '2-digit' }) + ' - ' + new Date(createdDate).toLocaleDateString('th-TH', { year: 'numeric', month: 'short', day: 'numeric' }),
          user: {
            id: user?.id || user?.user_id,
            username: user?.username || 'ผู้ใช้งาน',
            avatar: user?.avatar_url || user?.profile_image || user?.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(user?.username || 'User')}&background=1e293b&color=38bdf8`
          }
        };

        // Update local state
        setComments(prev => [newComment, ...prev]);
        setCommentPage(1);
        setNewCommentText('');
        toast.success('ส่งความคิดเห็นเรียบร้อยแล้ว');

        // Broadcast to other clients in real-time
        try {
          const channel = supabase.channel(`post-comments:${id}`);
          channel.send({
            type: 'broadcast',
            event: 'new-comment',
            payload: newComment
          });
        } catch (e) {
          console.log('Realtime broadcast notice:', e);
        }
      } else {
        toast.error(response?.message || 'เกิดข้อผิดพลาดในการส่งความคิดเห็น');
      }
    } catch (error) {
      console.error('Error submitting comment:', error);
      const errMsg = error.response?.data?.message || error.message || 'ไม่สามารถส่งความคิดเห็นได้ในขณะนี้';
      toast.error(errMsg);
    } finally {
      setIsSubmittingComment(false);
    }
  };

  const handleDeleteComment = async (commentId) => {
    const result = await Swal.fire({
      title: 'ต้องการลบความคิดเห็น?',
      text: 'ความคิดเห็นนี้จะถูกลบออกอย่างถาวร',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#ef4444',
      cancelButtonColor: '#64748b',
      confirmButtonText: 'ลบ',
      cancelButtonText: 'ยกเลิก'
    });

    if (result.isConfirmed) {
      try {
        await postService.deleteComment(commentId);
        setComments(prev => prev.filter(c => String(c.id) !== String(commentId)));
        toast.success('ลบความคิดเห็นเรียบร้อยแล้ว');
      } catch (error) {
        console.error('Error deleting comment:', error);
        toast.error(error.response?.data?.message || 'ไม่สามารถลบความคิดเห็นได้');
      }
    }
  };

  if (isLoading) {
    return <div className="text-center py-20 text-slate-500 font-medium">กำลังโหลดข้อมูล...</div>;
  }

  if (isDeletedPost) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center px-4 py-16" role="status" aria-live="polite">
        <div className="w-full max-w-lg rounded-3xl border border-red-100 bg-white p-8 sm:p-10 text-center shadow-xl shadow-red-100/50">
          <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-full bg-red-50 text-red-500">
            <Trash2 className="h-8 w-8" aria-hidden="true" />
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold text-slate-800">
            {isDeletedPostOwner ? 'โพสต์ของคุณถูกลบไปแล้ว' : 'โพสต์นี้ถูกลบไปแล้ว'}
          </h1>
          <p className="mt-3 text-slate-500">กำลังพาคุณกลับไปหน้า Home ภายใน 2 วินาที...</p>
          <Link
            to="/home"
            replace
            className="mt-6 inline-flex items-center justify-center rounded-xl bg-primary px-5 py-2.5 font-semibold text-white transition-opacity hover:opacity-90"
          >
            กลับหน้า Home
          </Link>
        </div>
      </div>
    );
  }

  if (!post) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center px-4 py-16" role="status" aria-live="polite">
        <div className="w-full max-w-lg rounded-3xl border border-slate-200 bg-white p-8 sm:p-10 text-center shadow-xl shadow-slate-200/50">
          <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-full bg-slate-100 text-slate-500">
            <FileText className="h-8 w-8" aria-hidden="true" />
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold text-slate-800">ไม่พบโพสต์ที่คุณต้องการ</h1>
          <p className="mt-3 text-slate-500">โพสต์นี้อาจไม่มีอยู่ หรือ URL ที่เปิดไม่ถูกต้อง</p>
          <Link
            to="/home"
            replace
            className="mt-6 inline-flex items-center justify-center rounded-xl bg-primary px-5 py-2.5 font-semibold text-white transition-opacity hover:opacity-90"
          >
            กลับหน้า Home
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">

      {/* Header Actions */}
      <div className="flex items-center justify-between mb-6">
        <Link to="/home" className="inline-flex items-center gap-2 text-slate-500 hover:text-primary transition-colors font-medium">
          <ChevronLeft className="h-5 w-5" /> กลับไปหน้าหลัก
        </Link>
        <div className="flex items-center gap-2">
          {!isAuthor && (
            <button
              type="button"
              onClick={handleOpenReport}
              disabled={isReporting}
              className="inline-flex items-center gap-2 px-3 sm:px-4 py-2 bg-white hover:bg-rose-50 text-slate-500 hover:text-rose-600 border border-slate-200 hover:border-rose-200 rounded-xl text-sm font-bold shadow-sm transition-all disabled:cursor-not-allowed disabled:opacity-50"
              title="รายงานโพสต์"
            >
              <Flag className="h-4 w-4" />
              <span className="hidden sm:inline">รายงานโพสต์</span>
            </button>
          )}
          {isAuthor && (
            <>
              <Link to={`/post/edit/${post.id}`} className="inline-flex items-center gap-2 px-4 py-2 bg-blue-50 hover:bg-blue-100 text-primary border border-blue-100 rounded-xl text-sm font-bold shadow-sm transition-all">
                <Edit3 className="h-4 w-4" /> แก้ไขโพสต์
              </Link>
              <button
                onClick={handleDelete}
                className="inline-flex items-center gap-2 px-4 py-2 bg-rose-50 hover:bg-rose-100 text-rose-600 border border-rose-100 rounded-xl text-sm font-bold shadow-sm transition-all cursor-pointer"
                title="ลบโพสต์"
              >
                <Trash2 className="h-4 w-4" /> ลบโพสต์
              </button>
            </>
          )}
        </div>
      </div>

      <div className="bg-white rounded-[24px] shadow-sm border border-slate-100 overflow-hidden">

        {/* Cover Image */}
        <div className="w-full aspect-video sm:aspect-[2.4/1] bg-slate-100 relative overflow-hidden">
          <img src={post.coverImage} alt={post.title} className="w-full h-full object-cover object-center" />
          <div className="absolute top-4 left-4 flex gap-2">
            <span className="px-3 py-1.5 bg-white/90 backdrop-blur-sm text-primary rounded-full text-xs font-bold shadow-sm">
              {post.category}
            </span>
            <span className="px-3 py-1.5 bg-slate-900/80 backdrop-blur-sm text-white rounded-full text-xs font-bold shadow-sm">
              {post.level}
            </span>
          </div>
        </div>

        <div className="p-6 sm:p-10">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold text-slate-900 leading-tight mb-4">{post.title}</h1>

            <div className="flex flex-wrap items-center justify-between gap-4 py-4 border-y border-slate-100">
              <div className="flex items-center gap-3">
                <Link to={postAuthorId ? `/profile/${encodeURIComponent(postAuthorId)}` : '#'} className="relative h-14 w-14 shrink-0 block group cursor-pointer" aria-label={`ดูโปรไฟล์ของ ${authorUsername}`}>
                  <div className="absolute inset-1 z-0 rounded-full overflow-hidden border-2 border-white shadow-sm bg-slate-100 flex items-center justify-center">
                    <img
                      src={authorAvatar}
                      alt={authorUsername}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                      onError={(e) => {
                        e.target.onerror = null;
                        e.target.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(authorUsername || 'User')}&background=1e293b&color=38bdf8`;
                      }}
                    />
                  </div>
                  {authorFrameUrl && (
                    <img
                      src={authorFrameUrl}
                      alt=""
                      aria-hidden="true"
                      className="absolute inset-0 z-10 h-full w-full object-contain pointer-events-none"
                    />
                  )}
                </Link>
                <div>
                  <Link to={postAuthorId ? `/profile/${encodeURIComponent(postAuthorId)}` : '#'} className="font-bold text-slate-900 hover:text-primary transition-colors block">
                    {authorUsername}
                  </Link>
                  <p className="text-xs font-medium text-slate-500">{authorRole}</p>
                </div>
              </div>

              <div className="flex items-center gap-6 text-sm font-medium text-slate-500">
                <span className="flex items-center gap-1.5"><Calendar className="h-4 w-4" /> {post.createdAt}</span>
                <span className="flex items-center gap-1.5"><Eye className="h-4 w-4" /> {post.views} ครั้ง</span>
              </div>
            </div>
          </div>


          {/* Summary */}
          {post.description && (
            <div className="mb-8">
              <h3 className="text-xl font-bold text-slate-800 flex items-center gap-2 mb-3">
                <FileText className="h-5 w-5 text-primary" /> บทสรุปย่อ
              </h3>
              <div className="p-5 bg-slate-50 border border-slate-100 rounded-2xl text-slate-700 leading-relaxed shadow-sm font-medium">
                {post.description}
              </div>
            </div>
          )}

          {/* Details (Rich Text) */}
          <div className="mb-10">
            <h3 className="text-xl font-bold text-slate-800 flex items-center gap-2 mb-4">
              <AlignLeft className="h-5 w-5 text-primary" /> รายละเอียดเพิ่มเติม
            </h3>
            <div className="prose prose-slate max-w-none prose-p:text-slate-600 prose-headings:text-slate-900 prose-a:text-primary p-6 bg-white border border-slate-100 shadow-sm rounded-2xl">
              <div className="post-details-content" dangerouslySetInnerHTML={{ __html: sanitizePostContent(post.details || post.content || '<p>ไม่มีรายละเอียดเพิ่มเติม</p>') }} />
            </div>
          </div>

          {/* Image Gallery */}
          {post.images && post.images.length > 0 && (
            <div className="mb-10">
              <h3 className="text-xl font-bold text-slate-800 flex items-center gap-2 mb-4">
                <ImageIcon className="h-5 w-5 text-primary" /> รูปภาพประกอบ ({post.images.length})
              </h3>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                {post.images.map((img, idx) => (
                  <div key={idx} className="relative aspect-square rounded-2xl overflow-hidden group cursor-pointer border border-slate-200" onClick={() => setPreviewImage(img)}>
                    <img src={img} alt={`gallery-${idx}`} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                    <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                      <Eye className="h-8 w-8 text-white" />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* PDF Section */}
          {post.pdf && (
            <div className="mb-10">
              <h3 className="text-xl font-bold text-slate-800 flex items-center gap-2 mb-4">
                <FileText className="h-5 w-5 text-primary" /> ไฟล์เอกสาร PDF
              </h3>
              <div className="p-6 bg-slate-50 border border-slate-200 rounded-2xl">
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="p-3 bg-red-100 text-rose-600 rounded-xl shrink-0">
                      <FileText className="h-6 w-6" />
                    </div>
                    <div className="min-w-0">
                      <h3 className="text-base font-bold text-slate-900 truncate">
                        {post.pdf.name || 'เอกสารแนบ'}
                      </h3>
                      <p className="text-xs text-slate-500 font-medium">
                        {post.pdf.size || 'ไฟล์ PDF'}
                      </p>
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto shrink-0">
                    <button
                      type="button"
                      onClick={() => setShowPdfPreview(!showPdfPreview)}
                      className="flex-1 sm:flex-none px-4 py-2.5 bg-white text-slate-700 border border-slate-200 rounded-xl font-bold shadow-sm hover:bg-slate-100 transition-all flex items-center justify-center gap-2 text-sm cursor-pointer"
                    >
                      {showPdfPreview ? (
                        <>
                          <EyeOff className="h-4 w-4 text-slate-500" /> ซ่อนตัวอย่าง
                        </>
                      ) : (
                        <>
                          <Eye className="h-4 w-4 text-primary" /> ดูตัวอย่างเอกสาร
                        </>
                      )}
                    </button>

                    <a
                      href={post.pdf.url}
                      download={post.pdf.name || 'เอกสารประกอบการเรียน.pdf'}
                      target="_blank"
                      rel="noreferrer"
                      className="flex-1 sm:flex-none px-4 py-2.5 bg-primary text-white rounded-xl font-bold shadow-sm hover:bg-blue-600 transition-all flex items-center justify-center gap-2 text-sm"
                    >
                      <Download className="h-4 w-4" /> ดาวน์โหลด
                    </a>
                  </div>
                </div>

                {/* Embedded PDF Viewer (Google Docs Viewer / Native Fallback) */}
                {showPdfPreview && (
                  <div className="mt-6 w-full h-[600px] sm:h-[800px] rounded-xl border border-slate-200 overflow-hidden bg-white shadow-inner relative animate-in fade-in duration-200">
                    <iframe
                      src={
                        post.pdf.url.startsWith('http') && !post.pdf.url.includes('localhost') && !post.pdf.url.includes('127.0.0.1')
                          ? `https://docs.google.com/gview?url=${encodeURIComponent(post.pdf.url)}&embedded=true`
                          : `${post.pdf.url}#toolbar=0`
                      }
                      className="w-full h-full border-0"
                      title="PDF Document Viewer"
                    />
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Hashtags */}
          <div className="flex flex-wrap gap-2 mb-8">
            {(post.hashtags || []).map(tag => (
              <span key={tag} className="px-3 py-1 bg-blue-50 text-primary rounded-full text-sm font-semibold flex items-center gap-1">
                <Tag className="h-3.5 w-3.5" /> {tag}
              </span>
            ))}
          </div>

          {/* Comments Section */}
          <div className="border-t border-slate-100 my-8 pt-8">
            <h3 className="text-xl font-bold text-slate-900 flex items-center gap-2 mb-6">
              <MessageSquare className="h-5 w-5 text-primary" /> ความคิดเห็น ({comments.length})
            </h3>

            {/* Comment Form */}
            <form onSubmit={handleSubmitComment} className="flex gap-4 items-start mb-8">
              <img
                src={user?.avatar_url || user?.profile_image || user?.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(user?.username || 'User')}&background=1e293b&color=38bdf8`}
                alt={user?.username || 'User'}
                className="w-10 h-10 rounded-full border border-slate-200 object-cover"
                onError={(e) => {
                  e.target.onerror = null;
                  e.target.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(user?.username || 'User')}&background=1e293b&color=38bdf8`;
                }}
              />
              <div className="flex-1">
                <textarea
                  value={newCommentText}
                  onChange={(e) => setNewCommentText(e.target.value)}
                  placeholder={isAuthenticated ? "เขียนความคิดเห็นที่เป็นประโยชน์..." : "กรุณาเข้าสู่ระบบเพื่อแสดงความคิดเห็น"}
                  rows={3}
                  disabled={!isAuthenticated}
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-colors text-sm resize-none disabled:bg-slate-50 disabled:cursor-not-allowed"
                />
                <div className="flex justify-end mt-2">
                  <button
                    type="submit"
                    disabled={isSubmittingComment || !isAuthenticated}
                    className={`px-5 py-2.5 rounded-xl font-bold text-white transition-all flex items-center gap-2 text-sm shadow-sm ${!isAuthenticated ? 'bg-slate-300 cursor-not-allowed' : 'bg-primary hover:bg-blue-600 hover:shadow'}`}
                  >
                    <Send className="h-4 w-4" />
                    {isSubmittingComment ? 'กำลังส่ง...' : 'ส่งความคิดเห็น'}
                  </button>
                </div>
              </div>
            </form>

            {/* Comments List */}
            <div className="space-y-6">
              {comments.length === 0 ? (
                <div className="text-center py-10 bg-slate-50/50 rounded-2xl border border-slate-100/50 text-slate-400 text-sm font-medium">
                  ยังไม่มีความคิดเห็น มาร่วมเป็นคนแรกที่แบ่งปันความคิดเห็นกัน!
                </div>
              ) : (
                visibleComments.map((comment) => (
                  <div key={comment.id} className="flex gap-4 items-start pb-6 border-b border-slate-50 last:border-b-0 last:pb-0 group">
                    <img
                      src={comment.user?.avatar_url || comment.user?.avatar || comment.user?.profile_image || `https://ui-avatars.com/api/?name=${encodeURIComponent(comment.user?.username || 'User')}&background=1e293b&color=38bdf8`}
                      alt={comment.user?.username || 'User'}
                      className="w-10 h-10 rounded-full border border-slate-100 flex-shrink-0 object-cover"
                      onError={(e) => {
                        e.target.onerror = null;
                        e.target.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(comment.user?.username || 'User')}&background=1e293b&color=38bdf8`;
                      }}
                    />
                    <div className="flex-1 bg-slate-50/50 hover:bg-slate-50 rounded-2xl p-4 transition-colors">
                      <div className="flex items-center justify-between mb-2">
                        <span className="font-bold text-slate-900 text-sm">{comment.user?.username || 'ผู้ใช้งาน'}</span>
                        <div className="flex items-center gap-2">
                          <span className="text-xs text-slate-400 font-medium">{comment.createdAt}</span>
                          {(isAuthenticated && currentUserId && (String(comment.user?.id) === String(currentUserId) || String(comment.user_id) === String(currentUserId))) && (
                            <button
                              type="button"
                              onClick={() => handleDeleteComment(comment.id)}
                              className="text-slate-400 hover:text-rose-500 p-1 rounded-lg hover:bg-rose-50 transition-colors opacity-0 group-hover:opacity-100 cursor-pointer"
                              title="ลบความคิดเห็น"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </button>
                          )}
                        </div>
                      </div>
                      <p className="text-slate-600 text-sm whitespace-pre-line leading-relaxed">{comment.content}</p>
                    </div>
                  </div>
                ))
              )}
            </div>

            {comments.length > 0 && (
              <nav
                className="mt-6 flex justify-center"
                aria-label="การแบ่งหน้าความคิดเห็น"
              >
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setCommentPage(page => Math.max(1, page - 1))}
                    disabled={commentPage === 1}
                    className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-bold text-slate-600 shadow-sm transition-colors hover:border-primary/30 hover:bg-blue-50 hover:text-primary disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:border-slate-200 disabled:hover:bg-white disabled:hover:text-slate-600"
                    aria-label="ไปยังหน้าความคิดเห็นก่อนหน้า"
                  >
                    <ChevronLeft className="h-4 w-4" />
                    ย้อนกลับ
                  </button>
                  <div className="hidden items-center gap-1 sm:flex">
                    {visibleCommentPages.map(page => (
                      <button
                        key={page}
                        type="button"
                        onClick={() => setCommentPage(page)}
                        aria-label={`ไปยังหน้าความคิดเห็น ${page}`}
                        aria-current={commentPage === page ? 'page' : undefined}
                        className={`h-9 min-w-9 rounded-lg px-2 text-sm font-bold transition-colors ${
                          commentPage === page
                            ? 'bg-primary text-white shadow-sm'
                            : 'text-slate-500 hover:bg-white hover:text-primary'
                        }`}
                      >
                        {page}
                      </button>
                    ))}
                  </div>
                  <button
                    type="button"
                    onClick={() => setCommentPage(page => Math.min(commentPageCount, page + 1))}
                    disabled={commentPage === commentPageCount}
                    className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-bold text-slate-600 shadow-sm transition-colors hover:border-primary/30 hover:bg-blue-50 hover:text-primary disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:border-slate-200 disabled:hover:bg-white disabled:hover:text-slate-600"
                    aria-label="ไปยังหน้าความคิดเห็นถัดไป"
                  >
                    ถัดไป
                    <ChevronRight className="h-4 w-4" />
                  </button>
                </div>
              </nav>
            )}
          </div>

        </div>

        {/* Action Footer */}
        <div className="bg-slate-50 border-t border-slate-100 p-6 sm:px-10 sm:py-6 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3 w-full sm:w-auto">
            <button
              onClick={handleLike}
              disabled={isLiking}
              className={`flex-1 sm:flex-none flex items-center justify-center gap-2 px-6 py-3 rounded-xl font-bold transition-colors shadow-sm border ${isLiked ? 'bg-rose-50 text-rose-500 border-rose-100' : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-100'} ${isLiking ? 'opacity-50 cursor-not-allowed' : ''}`}
            >
              <Heart className={`h-5 w-5 ${isLiked ? 'fill-rose-500' : ''}`} /> {post ? post.likes : 0}
            </button>
          </div>

          <div className="flex items-center gap-3 w-full sm:w-auto">
            <button
              onClick={handleBookmark}
              disabled={isBookmarking}
              className={`flex items-center justify-center p-3 rounded-xl font-bold transition-colors shadow-sm border ${isBookmarked ? 'bg-amber-50 text-amber-500 border-amber-100' : 'bg-white text-slate-400 border-slate-200 hover:bg-slate-100'} ${isBookmarking ? 'opacity-50 cursor-not-allowed' : ''}`}
              title="บันทึก"
            >
              <Bookmark className={`h-5 w-5 ${isBookmarked ? 'fill-amber-500' : ''}`} />
            </button>
            <button className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-6 py-3 bg-slate-900 text-white rounded-xl font-bold hover:bg-slate-800 transition-colors shadow-sm">
              <Share2 className="h-5 w-5" /> แชร์โพสต์
            </button>
          </div>
        </div>

      </div>

      {showReportModal && (
        <div
          className="fixed inset-0 z-[120] flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-sm"
          role="presentation"
          onClick={() => !isReporting && setShowReportModal(false)}
        >
          <div
            className="w-full max-w-lg rounded-3xl bg-white p-6 shadow-2xl sm:p-8"
            role="dialog"
            aria-modal="true"
            aria-labelledby="report-post-title"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="mb-6 flex items-start justify-between gap-4">
              <div>
                <h2 id="report-post-title" className="text-xl font-extrabold text-slate-900">รายงานโพสต์</h2>
                <p className="mt-1 text-sm text-slate-500">เลือกเหตุผลเพื่อส่งให้ทีมงานตรวจสอบ</p>
              </div>
              <button
                type="button"
                onClick={() => setShowReportModal(false)}
                disabled={isReporting}
                className="rounded-full p-2 text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-700 disabled:opacity-50"
                aria-label="ปิดหน้าต่างรายงาน"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleSubmitReport} className="space-y-5">
              <div>
                <label htmlFor="report-reason" className="mb-2 block text-sm font-bold text-slate-700">เหตุผลที่รายงาน</label>
                <select
                  id="report-reason"
                  value={reportReason}
                  onChange={(event) => setReportReason(event.target.value)}
                  required
                  className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-slate-700 outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/15"
                >
                  <option value="">เลือกเหตุผล</option>
                  {REPORT_REASONS.map((reason) => (
                    <option key={reason} value={reason}>{reason}</option>
                  ))}
                </select>
              </div>

              <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
                <button
                  type="button"
                  onClick={() => setShowReportModal(false)}
                  disabled={isReporting}
                  className="rounded-xl border border-slate-200 px-5 py-2.5 font-bold text-slate-600 transition-colors hover:bg-slate-50 disabled:opacity-50"
                >
                  ยกเลิก
                </button>
                <button
                  type="submit"
                  disabled={!reportReason || isReporting}
                  className="inline-flex items-center justify-center gap-2 rounded-xl bg-rose-600 px-5 py-2.5 font-bold text-white transition-colors hover:bg-rose-700 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  <Flag className="h-4 w-4" />
                  {isReporting ? 'กำลังส่งรายงาน...' : 'ส่งรายงาน'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Image Preview Modal */}
      {previewImage && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 sm:p-8 bg-slate-900/90 backdrop-blur-sm animate-in fade-in duration-200" onClick={() => setPreviewImage(null)}>
          <button onClick={() => setPreviewImage(null)} className="absolute top-6 right-6 p-2 text-white/70 hover:text-white bg-black/20 hover:bg-black/40 rounded-full transition-colors z-10">
            <X className="h-8 w-8" />
          </button>
          <img src={previewImage} alt="Preview" className="max-w-full max-h-full object-contain rounded-lg shadow-2xl" onClick={(e) => e.stopPropagation()} />
        </div>
      )}
    </div>
  );
}
