import { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router';
import { FileText, Download, Heart, Share2, Tag, ChevronLeft, Calendar, Eye, EyeOff, ExternalLink, Bookmark, X, Edit3, Trash2, Send, MessageSquare } from 'lucide-react';
import { postService } from '@/services/post.service';
import useAuthStore from '@/store/authStore';
import api from '@/utils/api';
import toast from 'react-hot-toast';
import Swal from 'sweetalert2';
import { supabase } from '@/utils/supabase';

export default function PostDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { isAuthenticated, user } = useAuthStore();
  const [isLiked, setIsLiked] = useState(false);
  const [isBookmarked, setIsBookmarked] = useState(false);

  const [previewImage, setPreviewImage] = useState(null);
  const [showPdfPreview, setShowPdfPreview] = useState(false);

  // Comments state
  const [comments, setComments] = useState([]);
  const [newCommentText, setNewCommentText] = useState('');
  const [isSubmittingComment, setIsSubmittingComment] = useState(false);

  // Loading states for actions to prevent spamming
  const [isLiking, setIsLiking] = useState(false);
  const [isBookmarking, setIsBookmarking] = useState(false);

  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  const [post, setPost] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchPost = async () => {
      try {
        if (!post || String(post.id) !== String(id)) {
          setIsLoading(true);
        }
        const data = await postService.getPostById(id);
        setPost(data);
        if (data) {
          setComments(data.comments || []);
          if (user?.id) {
            const userLiked = data.rawLikes?.some(l => l.user_id === user.id);
            setIsLiked(!!userLiked);
          }
        }
      } catch (error) {
        console.error('Error loading post details:', error);
      } finally {
        setIsLoading(false);
      }
    };

    const checkBookmarkStatus = async () => {
      try {
        const response = await api.get('/bookmarks');
        if (response.data.success) {
          const bookmarked = response.data.data.some(b => String(b.post_id) === String(id));
          setIsBookmarked(bookmarked);
        }
      } catch (err) {
        console.error('Error fetching bookmark status:', err);
      }
    };

    if (id) {
      fetchPost();
      if (isAuthenticated) {
        checkBookmarkStatus();
      }
    }
  }, [id, user?.id, isAuthenticated]);

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

  const currentUserId = user?.id || user?.user_id;
  const postAuthorId = post?.author?.id || post?.author?.user_id || post?.user_id || post?.author_id;
  const isAuthor = Boolean(
    isAuthenticated &&
    currentUserId &&
    postAuthorId &&
    String(currentUserId) === String(postAuthorId)
  );

  const handleLike = async () => {
    if (!isAuthenticated) {
      toast.error('กรุณาสมัครสมาชิกเพื่อกดถูกใจ');
      return;
    }
    if (isLiking) return;
    try {
      setIsLiking(true);
      const response = await postService.likePost(post.id);
      setIsLiked(response.isLiked);
      setPost(prev => ({
        ...prev,
        likes: response.isLiked ? prev.likes + 1 : Math.max(0, prev.likes - 1)
      }));
      if (response.isLiked) {
        toast.success('ถูกใจโพสต์แล้ว');
      } else {
        toast('ยกเลิกการถูกใจ', { icon: '💔' });
      }
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
      return;
    }
    if (isBookmarking) return;
    try {
      setIsBookmarking(true);
      const response = await postService.bookmarkPost(post.id);
      setIsBookmarked(response.isBookmarked);
      if (response.isBookmarked) {
        toast.success('เพิ่มบุ๊คมาร์กเรียบร้อย');
      } else {
        toast('นำบุ๊คมาร์กออกแล้ว', { icon: '🗑️' });
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
      title: 'คุณต้องการลบโพสต์นี้ใช่หรือไม่?',
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
    if (!newCommentText.trim()) return;

    try {
      setIsSubmittingComment(true);
      const response = await postService.createComment(post.id, newCommentText.trim());

      if (response && response.success) {
        const commentData = response.data;
        const newComment = {
          id: commentData.id,
          content: commentData.content,
          createdAt: new Date(commentData.created_at).toLocaleDateString('th-TH', { hour: '2-digit', minute: '2-digit' }) + ' - ' + new Date(commentData.created_at).toLocaleDateString('th-TH', { year: 'numeric', month: 'short', day: 'numeric' }),
          user: {
            id: user.id,
            username: user.username || 'ผู้ใช้งาน',
            avatar: user.avatar || user.profile_image || 'https://ui-avatars.com/api/?name=' + (user.username || 'User')
          }
        };

        // Update local state
        setComments(prev => [newComment, ...prev]);
        setNewCommentText('');
        toast.success('ส่งความคิดเห็นเรียบร้อยแล้ว');

        // Broadcast to other clients in real-time
        const channel = supabase.channel(`post-comments:${id}`);
        channel.send({
          type: 'broadcast',
          event: 'new-comment',
          payload: newComment
        });
      } else {
        toast.error(response?.message || 'เกิดข้อผิดพลาดในการส่งความคิดเห็น');
      }
    } catch (error) {
      console.error('Error submitting comment:', error);
      toast.error('ไม่สามารถส่งความคิดเห็นได้ในขณะนี้');
    } finally {
      setIsSubmittingComment(false);
    }
  };

  if (isLoading) {
    return <div className="text-center py-20 text-slate-500 font-medium">กำลังโหลดข้อมูล...</div>;
  }
  
  if (!post) {
    return <div className="text-center py-20 text-slate-500 font-medium">ไม่พบโพสต์ที่คุณต้องการ</div>;
  }

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">

      {/* Header Actions */}
      <div className="flex items-center justify-between mb-6">
        <Link to="/home" className="inline-flex items-center gap-2 text-slate-500 hover:text-primary transition-colors font-medium">
          <ChevronLeft className="h-5 w-5" /> กลับไปหน้าหลัก
        </Link>
        <div className="flex items-center gap-2">
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
        <div className="w-full aspect-video sm:h-[400px] bg-slate-100 relative">
          <img src={post.coverImage} alt={post.title} className="w-full h-full object-cover" />
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
                <img src={post.author.avatar} alt={post.author.name} className="w-12 h-12 rounded-full border-2 border-white shadow-sm" />
                <div>
                  <p className="font-bold text-slate-900">{post.author.name}</p>
                  <p className="text-xs font-medium text-slate-500">{post.author.role}</p>
                </div>
              </div>

              <div className="flex items-center gap-6 text-sm font-medium text-slate-500">
                <span className="flex items-center gap-1.5"><Calendar className="h-4 w-4" /> {post.createdAt}</span>
                <span className="flex items-center gap-1.5"><Eye className="h-4 w-4" /> {post.views} ครั้ง</span>
              </div>
            </div>
          </div>

          {/* Hashtags */}
          <div className="flex flex-wrap gap-2 mb-8">
            {(post.hashtags || []).map(tag => (
              <span key={tag} className="px-3 py-1 bg-blue-50 text-primary rounded-full text-sm font-semibold flex items-center gap-1">
                <Tag className="h-3.5 w-3.5" /> {tag}
              </span>
            ))}
          </div>

          {/* Details (Rich Text) */}
          <div className="prose prose-slate max-w-none prose-p:text-slate-600 prose-headings:text-slate-900 prose-a:text-primary mb-10">
            <div dangerouslySetInnerHTML={{ __html: post.details || post.content || '' }} />
          </div>

          {/* PDF Section */}
          {post.pdf && (
            <div className="mb-10 p-6 bg-slate-50 border border-slate-200 rounded-2xl">
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
                    download
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
          )}

          {/* Image Gallery */}
          {post.images && post.images.length > 0 && (
            <div className="mb-10">
              <h3 className="text-lg font-bold text-slate-900 mb-4">รูปภาพประกอบ ({post.images.length})</h3>
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

          {/* Comments Section */}
          <div className="border-t border-slate-100 my-8 pt-8">
            <h3 className="text-xl font-bold text-slate-900 flex items-center gap-2 mb-6">
              <MessageSquare className="h-5 w-5 text-primary" /> ความคิดเห็น ({comments.length})
            </h3>

            {/* Comment Form */}
            <form onSubmit={handleSubmitComment} className="flex gap-4 items-start mb-8">
              <img
                src={user?.avatar || user?.profile_image || 'https://ui-avatars.com/api/?name=' + (user?.username || 'User')}
                alt={user?.username || 'User'}
                className="w-10 h-10 rounded-full border border-slate-200"
              />
              <div className="flex-1">
                <textarea
                  value={newCommentText}
                  onChange={(e) => setNewCommentText(e.target.value)}
                  placeholder="เขียนความคิดเห็นที่เป็นประโยชน์..."
                  rows={3}
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-colors text-sm resize-none"
                />
                <div className="flex justify-end mt-2">
                  <button
                    type="submit"
                    disabled={isSubmittingComment || !newCommentText.trim()}
                    className={`px-5 py-2.5 rounded-xl font-bold text-white transition-all flex items-center gap-2 text-sm shadow-sm ${!newCommentText.trim() ? 'bg-slate-300 cursor-not-allowed' : 'bg-primary hover:bg-blue-600 hover:shadow'}`}
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
                comments.map((comment) => (
                  <div key={comment.id} className="flex gap-4 items-start pb-6 border-b border-slate-50 last:border-b-0 last:pb-0 group">
                    <img
                      src={comment.user?.avatar || comment.user?.profile_image || 'https://ui-avatars.com/api/?name=' + (comment.user?.username || 'User')}
                      alt={comment.user?.username}
                      className="w-10 h-10 rounded-full border border-slate-100 flex-shrink-0"
                    />
                    <div className="flex-1 bg-slate-50/50 hover:bg-slate-50 rounded-2xl p-4 transition-colors">
                      <div className="flex items-center justify-between mb-2">
                        <span className="font-bold text-slate-900 text-sm">{comment.user?.username}</span>
                        <span className="text-xs text-slate-400 font-medium">{comment.createdAt}</span>
                      </div>
                      <p className="text-slate-600 text-sm whitespace-pre-line leading-relaxed">{comment.content}</p>
                    </div>
                  </div>
                ))
              )}
            </div>
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
