import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router';
import { AlertCircle, ArrowLeft, Clock3, FileText, RotateCcw } from 'lucide-react';
import Swal from 'sweetalert2';
import toast from 'react-hot-toast';
import { postService } from '@/services/post.service';

const RECOVERY_WINDOW_MS = 5 * 60 * 1000;

const remainingTime = (deadline, now) => {
  const seconds = Math.max(0, Math.ceil((Date.parse(deadline) - now) / 1000));
  return `${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, '0')}`;
};

export default function RecoverPosts() {
  const navigate = useNavigate();
  const [posts, setPosts] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [errorStatus, setErrorStatus] = useState(null);
  const [restoringId, setRestoringId] = useState(null);
  const [requestVersion, setRequestVersion] = useState(0);
  const [now, setNow] = useState(Date.now());

  useEffect(() => {
    let active = true;
    setIsLoading(true);
    setErrorStatus(null);

    postService.getRecoverablePosts()
      .then((items) => {
        if (active) setPosts(Array.isArray(items) ? items : []);
      })
      .catch((requestError) => {
        if (active) setErrorStatus(requestError.response?.status || 'network');
      })
      .finally(() => {
        if (active) setIsLoading(false);
      });

    return () => { active = false; };
  }, [requestVersion]);

  useEffect(() => {
    const timer = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(timer);
  }, []);

  const recoverablePosts = posts.filter((post) => Date.parse(post.recoverable_until) > now);
  const unavailable = errorStatus === 404;
  const sessionExpired = errorStatus === 401;

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
      const status = requestError.response?.status;
      toast.error(
        status === 410
          ? 'หมดเวลากู้คืนโพสต์นี้แล้ว'
          : status === 404
            ? 'ไม่พบโพสต์นี้ในรายการที่กู้คืนได้'
            : 'กู้คืนโพสต์ไม่สำเร็จ กรุณาลองอีกครั้ง'
      );
      if (status === 404 || status === 410) {
        setPosts((current) => current.filter((item) => item.id !== post.id));
      }
    } finally {
      setRestoringId(null);
    }
  };

  return (
    <main className="mx-auto min-h-[65vh] max-w-5xl px-4 pb-16 pt-8 sm:px-6 sm:pt-12">
      <Link
        to="/profile"
        className="mb-6 inline-flex items-center gap-2 text-sm font-medium text-slate-500 transition-colors hover:text-primary"
      >
        <ArrowLeft className="h-4 w-4" />
        กลับไปโปรไฟล์
      </Link>

      <header className="rounded-3xl border border-sky-100 bg-gradient-to-br from-sky-50 via-white to-white px-6 py-7 sm:px-8 sm:py-9">
        <div className="flex flex-col gap-5 sm:flex-row sm:items-start sm:justify-between">
          <div className="flex items-start gap-4">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-primary text-white shadow-sm">
              <RotateCcw className="h-6 w-6" />
            </div>
            <div>
              <p className="text-sm font-semibold text-primary">จัดการโพสต์ของฉัน</p>
              <h1 className="mt-1 text-2xl font-extrabold tracking-tight text-slate-900 sm:text-3xl">
                กู้คืนโพสต์
              </h1>
              <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600">
                โพสต์ที่คุณลบเองจะอยู่ที่นี่ชั่วคราว เลือกกู้คืนก่อนหมดเวลาเพื่อให้โพสต์กลับไปสถานะเดิม
              </p>
            </div>
          </div>
          <div className="inline-flex w-fit shrink-0 items-center gap-2 rounded-full border border-amber-200 bg-amber-50 px-3 py-2 text-sm font-semibold text-amber-800">
            <Clock3 className="h-4 w-4" />
            กู้คืนได้ภายใน 5 นาที
          </div>
        </div>
      </header>

      <div className="mt-8 flex items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-bold text-slate-900">โพสต์ที่กู้คืนได้</h2>
          <p className="mt-1 text-sm text-slate-500">แสดงเฉพาะโพสต์ของคุณที่ยังไม่หมดเวลากู้คืน</p>
        </div>
        {!isLoading && !errorStatus && recoverablePosts.length > 0 && (
          <span className="rounded-full bg-sky-50 px-3 py-1 text-sm font-bold text-primary">
            {recoverablePosts.length} โพสต์
          </span>
        )}
      </div>

      {isLoading ? (
        <section className="mt-5 space-y-3" aria-label="กำลังโหลดโพสต์ที่กู้คืนได้">
          {[0, 1].map((item) => (
            <div key={item} className="flex animate-pulse gap-4 rounded-2xl border border-slate-100 bg-white p-4">
              <div className="h-24 w-24 shrink-0 rounded-xl bg-slate-100 sm:w-36" />
              <div className="flex-1 py-2">
                <div className="h-4 w-2/3 rounded bg-slate-100" />
                <div className="mt-4 h-3 w-1/3 rounded bg-slate-100" />
              </div>
            </div>
          ))}
        </section>
      ) : errorStatus ? (
        <section role="alert" className="mt-5 rounded-2xl border border-amber-200 bg-white px-6 py-10 text-center shadow-sm">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-amber-50 text-amber-700">
            <AlertCircle className="h-7 w-7" />
          </div>
          <h3 className="mt-4 text-lg font-bold text-slate-900">
            {sessionExpired ? 'กรุณาเข้าสู่ระบบอีกครั้ง' : 'ยังเปิดรายการกู้คืนไม่ได้'}
          </h3>
          <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-slate-600">
            {sessionExpired
              ? 'การเข้าสู่ระบบของคุณหมดอายุแล้ว เข้าสู่ระบบใหม่เพื่อดูโพสต์ที่กู้คืนได้'
              : unavailable
                ? 'ระบบกู้คืนโพสต์ยังไม่พร้อมใช้งานในขณะนี้ กรุณาลองอีกครั้งภายหลัง'
                : 'เกิดปัญหาในการโหลดรายการโพสต์ กรุณาตรวจสอบการเชื่อมต่อแล้วลองอีกครั้ง'}
          </p>
          <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
            {sessionExpired ? (
              <Link to="/login" className="inline-flex min-h-11 items-center rounded-xl bg-primary px-5 text-sm font-bold text-white hover:bg-blue-600">
                เข้าสู่ระบบ
              </Link>
            ) : (
              <button
                type="button"
                onClick={() => setRequestVersion((version) => version + 1)}
                className="inline-flex min-h-11 items-center gap-2 rounded-xl bg-primary px-5 text-sm font-bold text-white transition-colors hover:bg-blue-600"
              >
                <RotateCcw className="h-4 w-4" />
                ลองอีกครั้ง
              </button>
            )}
            <Link to="/profile" className="inline-flex min-h-11 items-center rounded-xl border border-slate-200 px-5 text-sm font-semibold text-slate-700 hover:bg-slate-50">
              กลับไปโปรไฟล์
            </Link>
          </div>
        </section>
      ) : recoverablePosts.length === 0 ? (
        <section className="mt-5 rounded-2xl border border-slate-200 bg-white px-6 py-12 text-center shadow-sm">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-sky-50 text-primary">
            <FileText className="h-7 w-7" />
          </div>
          <h3 className="mt-4 text-lg font-bold text-slate-900">ยังไม่มีโพสต์ที่กู้คืนได้</h3>
          <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-slate-500">
            หากคุณลบโพสต์เอง โพสต์จะปรากฏที่นี่เป็นเวลา 5 นาที ก่อนถูกนำออกจากรายการกู้คืน
          </p>
          <Link to="/profile" className="mt-6 inline-flex min-h-11 items-center rounded-xl bg-primary px-5 text-sm font-bold text-white hover:bg-blue-600">
            ดูโพสต์ของฉัน
          </Link>
        </section>
      ) : (
        <div className="mt-5 space-y-4">
          {recoverablePosts.map((post) => {
            const timeLeft = Date.parse(post.recoverable_until) - now;
            const isUrgent = timeLeft <= 60 * 1000;
            const progress = Math.max(0, Math.min(100, (timeLeft / RECOVERY_WINDOW_MS) * 100));

            return (
              <article key={post.id} className="flex flex-col gap-4 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:flex-row sm:items-center">
                {post.cover_image ? (
                  <img src={post.cover_image} alt="" className="h-36 w-full rounded-xl object-cover sm:h-28 sm:w-40" />
                ) : (
                  <div className="flex h-28 w-full items-center justify-center rounded-xl bg-sky-50 text-primary sm:w-40">
                    <FileText className="h-8 w-8" />
                  </div>
                )}
                <div className="min-w-0 flex-1">
                  <h3 className="truncate text-lg font-bold text-slate-900">{post.title}</h3>
                  <p className={`mt-2 flex items-center gap-1.5 text-sm font-semibold tabular-nums ${isUrgent ? 'text-rose-700' : 'text-amber-700'}`}>
                    <Clock3 className="h-4 w-4" />
                    เหลือเวลา {remainingTime(post.recoverable_until, now)}
                  </p>
                  <div className="mt-3 h-1.5 max-w-sm overflow-hidden rounded-full bg-slate-100" aria-hidden="true">
                    <div className={`h-full rounded-full ${isUrgent ? 'bg-rose-500' : 'bg-amber-400'}`} style={{ width: `${progress}%` }} />
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => handleRestore(post)}
                  disabled={restoringId !== null}
                  className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-primary px-5 text-sm font-bold text-white transition-colors hover:bg-blue-600 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  <RotateCcw className="h-4 w-4" />
                  {restoringId === post.id ? 'กำลังกู้คืน...' : 'กู้คืนโพสต์'}
                </button>
              </article>
            );
          })}
        </div>
      )}
    </main>
  );
}
