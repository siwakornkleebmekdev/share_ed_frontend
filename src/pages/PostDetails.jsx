import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router';
import { FileText, Download, Heart, MessageCircle, Share2, Tag, ChevronLeft, Calendar, Eye, Bookmark, X } from 'lucide-react';
import { postService } from '@/services/post.service';

export default function PostDetails() {
  const { id } = useParams();
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
      } catch (error) {
        console.error('Error loading post details:', error);
      } finally {
        setIsLoading(false);
      }
    };
    if (id) {
      fetchPost();
    }
  }, [id]);

  if (isLoading) {
    return <div className="text-center py-20 text-slate-500 font-medium">กำลังโหลดข้อมูล...</div>;
  }
  
  if (!post) {
    return <div className="text-center py-20 text-slate-500 font-medium">ไม่พบโพสต์ที่คุณต้องการ</div>;
  }

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">

      {/* Back Button */}
      <Link to="/home" className="inline-flex items-center gap-2 text-slate-500 hover:text-primary transition-colors mb-6 font-medium">
        <ChevronLeft className="h-5 w-5" /> กลับไปหน้าหลัก
      </Link>

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
              onClick={() => setIsLiked(!isLiked)}
              className={`flex-1 sm:flex-none flex items-center justify-center gap-2 px-6 py-3 rounded-xl font-bold transition-colors shadow-sm border ${isLiked ? 'bg-rose-50 text-rose-500 border-rose-100' : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-100'}`}
            >
              <Heart className={`h-5 w-5 ${isLiked ? 'fill-rose-500' : ''}`} /> {isLiked ? post.likes + 1 : post.likes}
            </button>
            <button className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-6 py-3 bg-white border border-slate-200 text-slate-600 rounded-xl font-bold hover:bg-slate-100 transition-colors shadow-sm">
              <MessageCircle className="h-5 w-5" /> 12
            </button>
          </div>

          <div className="flex items-center gap-3 w-full sm:w-auto">
            <button
              onClick={() => setIsBookmarked(!isBookmarked)}
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
