import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router';
import { Clock3, FileText, RotateCcw } from 'lucide-react';
import Swal from 'sweetalert2';
import toast from 'react-hot-toast';
import { postService } from '@/services/post.service';

const remainingTime = (deadline, now) => {
  const seconds = Math.max(0, Math.ceil((Date.parse(deadline) - now) / 1000));
  return `${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, '0')}`;
};

export default function RecoverPosts() {
  const navigate = useNavigate();
  const [posts, setPosts] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [restoringId, setRestoringId] = useState(null);
  const [now, setNow] = useState(Date.now());

  useEffect(() => {
    let active = true;
    postService.getRecoverablePosts()
      .then((items) => { if (active) setPosts(items); })
      .catch((requestError) => {
        if (active) setError(requestError.response?.data?.message || 'ไม่สามารถโหลดโพสต์ที่กู้คืนได้');
      })
      .finally(() => { if (active) setIsLoading(false); });
    const timer = window.setInterval(() => setNow(Date.now()), 1000);
    return () => { active = false; window.clearInterval(timer); };
  }, []);

  const recoverablePosts = posts.filter((post) => Date.parse(post.recoverable_until) > now);

  const handleRestore = async (post) => {
    const result = await Swal.fire({
      title: 'กู้คืนโพสต์นี้?',
      text: `“${post.title}” จะกลับไปสถานะก่อนลบ`,
      icon: 'question',
      showCancelButton: true,
      confirmButtonText: 'กู้คืนโพสต์',
      cancelButtonText: 'ยกเลิก',
      confirmButtonColor: '#2563eb',
    });
    if (!result.isConfirmed) return;

    setRestoringId(post.id);
    try {
      await postService.restoreOwnPost(post.id);
      setPosts((current) => current.filter((item) => item.id !== post.id));
      toast.success('กู้คืนโพสต์สำเร็จ');
      navigate(`/post/${encodeURIComponent(post.id)}`);
    } catch (requestError) {
      toast.error(requestError.response?.data?.message || 'ไม่สามารถกู้คืนโพสต์ได้');
      if (requestError.response?.status === 410) {
        setPosts((current) => current.filter((item) => item.id !== post.id));
      }
    } finally {
      setRestoringId(null);
    }
  };

  return (
    <main className="mx-auto min-h-[60vh] max-w-4xl px-4 py-10 sm:px-6">
      <h1 className="text-2xl font-extrabold text-slate-900">กู้คืนโพสต์ของฉัน</h1>
      <p className="mt-2 text-sm text-slate-500">โพสต์ที่คุณลบเองสามารถกู้คืนได้ภายใน 5 นาทีหลังลบ</p>

      {error && <p role="alert" className="mt-6 rounded-xl bg-rose-50 p-4 text-rose-700">{error}</p>}
      {isLoading ? (
        <p className="mt-8 text-slate-500">กำลังโหลดโพสต์...</p>
      ) : recoverablePosts.length === 0 && !error ? (
        <div className="mt-8 rounded-2xl border border-slate-200 bg-white p-10 text-center">
          <FileText className="mx-auto h-10 w-10 text-slate-400" />
          <p className="mt-3 font-semibold text-slate-700">ไม่มีโพสต์ที่กู้คืนได้ในตอนนี้</p>
          <Link to="/profile" className="mt-4 inline-block font-semibold text-primary hover:underline">กลับไปโปรไฟล์</Link>
        </div>
      ) : (
        <div className="mt-8 space-y-4">
          {recoverablePosts.map((post) => (
            <article key={post.id} className="flex flex-col gap-4 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:flex-row sm:items-center">
              {post.cover_image && <img src={post.cover_image} alt="" className="h-28 w-full rounded-xl object-cover sm:w-40" />}
              <div className="min-w-0 flex-1">
                <h2 className="truncate text-lg font-bold text-slate-900">{post.title}</h2>
                <p className="mt-2 flex items-center gap-1.5 text-sm font-semibold text-amber-700">
                  <Clock3 className="h-4 w-4" /> เหลือ {remainingTime(post.recoverable_until, now)}
                </p>
              </div>
              <button
                type="button"
                onClick={() => handleRestore(post)}
                disabled={restoringId !== null}
                className="inline-flex items-center justify-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-sm font-bold text-white hover:bg-blue-600 disabled:opacity-50"
              >
                <RotateCcw className="h-4 w-4" /> {restoringId === post.id ? 'กำลังกู้คืน...' : 'กู้คืนโพสต์'}
              </button>
            </article>
          ))}
        </div>
      )}
    </main>
  );
}
