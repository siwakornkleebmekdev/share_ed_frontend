import { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router';
import { FileText, Download, Heart, MessageCircle, Share2, Tag, ChevronLeft, Calendar, Eye, Bookmark, X, Trash2 } from 'lucide-react';
import { postService } from '@/services/post.service';
import useAuthStore from '@/store/authStore';
import Swal from 'sweetalert2';

export default function PostDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const [isLiked, setIsLiked] = useState(false);
  const [isBookmarked, setIsBookmarked] = useState(false);

  const [previewImage, setPreviewImage] = useState(null);

  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  const [post, setPost] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchPost = async () => {
      try {
        setIsLoading(true);
        const data = await postService.getPostById(id);
        setPost(data);
        
        if (data && user) {
          const userLiked = data.rawLikes?.some(l => l.user_id === user.id);
          setIsLiked(!!userLiked);
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
          const bookmarked = response.data.data.some(b => b.post_id === id);
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
  }, [id, user, isAuthenticated]);

  const isAuthor = user && post && post.author && (user.id === post.author.id || user.user_id === post.author.id);

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

  if (isLoading) {
    return <div className="text-center py-20 text-slate-500 font-medium">กำลังโหลดข้อมูล...</div>;
  }
  
  if (!post) {
    return <div className="text-center py-20 text-slate-500 font-medium">ไม่พบโพสต์ที่คุณต้องการ</div>;
  }

  const handleLike = async () => {
    if (!isAuthenticated) {
      toast.error('กรุณาสมัครสมาชิกเพื่อกดถูกใจ');
      return;
    }
    try {
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
    }
  };

  const handleBookmark = async () => {
    if (!isAuthenticated) {
      toast.error('กรุณาสมัครสมาชิกเพื่อบันทึกโพสต์');
      return;
    }
    try {
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
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">

      {/* Header Actions */}
      <div className="flex items-center justify-between mb-6">
        <Link to="/home" className="inline-flex items-center gap-2 text-slate-500 hover:text-primary transition-colors font-medium">
          <ChevronLeft className="h-5 w-5" /> กลับไปหน้าหลัก
        </Link>
        {isAuthenticated && user?.id === post.author?.id && (
          <Link to={`/post/edit/${post.id}`} className="inline-flex items-center gap-2 px-4 py-2 bg-blue-50 hover:bg-blue-100 text-primary border border-blue-100 rounded-xl text-sm font-bold shadow-sm transition-all">
            <Edit3 className="h-4 w-4" /> แก้ไขโพสต์
          </Link>
        )}
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
                {isAuthor && (
                  <button
                    onClick={handleDelete}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-rose-50 border border-rose-100 hover:bg-rose-100 text-rose-600 rounded-xl font-bold transition-colors shadow-sm cursor-pointer ml-2"
                    title="ลบโพสต์"
                  >
                    <Trash2 className="h-4 w-4" /> ลบโพสต์
                  </button>
                )}
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
            <div className="mb-10">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                  <FileText className="h-5 w-5 text-primary" /> ไฟล์เอกสารแนบ ({post.pdf.name})
                </h3>
                <a href={post.pdf.url} target="_blank" rel="noreferrer" className="px-5 py-2.5 bg-blue-50 text-primary border border-blue-100 rounded-xl font-bold shadow-sm hover:bg-primary hover:text-white transition-all flex items-center gap-2 text-sm">
                  <Download className="h-4 w-4" /> ดาวน์โหลด ({post.pdf.size || 'PDF'})
                </a>
              </div>
              
              {/* Embedded PDF Viewer */}
              <div className="w-full h-[600px] sm:h-[800px] rounded-2xl border border-slate-200 overflow-hidden bg-slate-100 shadow-inner relative">
                <iframe
                  src={`${post.pdf.url}#toolbar=0`}
                  className="w-full h-full border-0"
                  title="PDF Document Viewer"
                />
              </div>
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

        </div>

        {/* Action Footer */}
        <div className="bg-slate-50 border-t border-slate-100 p-6 sm:px-10 sm:py-6 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3 w-full sm:w-auto">
            <button
              onClick={handleLike}
              className={`flex-1 sm:flex-none flex items-center justify-center gap-2 px-6 py-3 rounded-xl font-bold transition-colors shadow-sm border ${isLiked ? 'bg-rose-50 text-rose-500 border-rose-100' : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-100'}`}
            >
              <Heart className={`h-5 w-5 ${isLiked ? 'fill-rose-500' : ''}`} /> {post.likes}
            </button>
            <button className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-6 py-3 bg-white border border-slate-200 text-slate-600 rounded-xl font-bold hover:bg-slate-100 transition-colors shadow-sm">
              <MessageCircle className="h-5 w-5" /> 12
            </button>
          </div>

          <div className="flex items-center gap-3 w-full sm:w-auto">
            <button
              onClick={handleBookmark}
              className={`flex items-center justify-center p-3 rounded-xl font-bold transition-colors shadow-sm border ${isBookmarked ? 'bg-amber-50 text-amber-500 border-amber-100' : 'bg-white text-slate-400 border-slate-200 hover:bg-slate-100'}`}
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
