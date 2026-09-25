import { useEffect, useMemo, useState } from "react";
import { AlertTriangle, CheckCircle2, Clock3, Eye, FileWarning, Search, ShieldAlert, Trash2 } from "lucide-react";
import { Link } from "react-router";
import Swal from "sweetalert2";
import toast from "react-hot-toast";
import useReportStore from "@/store/reportStore";
import { REPORT_THRESHOLD } from "@/constants/moderation";
import { sanitizePostContent } from "@/utils/sanitizePostContent";
import { subscribeSocketEvent } from "@/utils/socket";

const STATUS_LABELS = { ACTIVE: "ยังเผยแพร่อยู่", UNACTIVED: "ถูกระงับชั่วคราว" };
const getReportCount = (post) => post?._count?.reports ?? post?.reports?.length ?? 0;
const formatDate = (value) => value
  ? new Date(value).toLocaleString("th-TH", { dateStyle: "medium", timeStyle: "short" })
  : "ไม่ระบุเวลา";

function PostConsoleSkeleton() {
  return (
    <div className="space-y-4">
      {[1, 2, 3].map((i) => (
        <article
          key={i}
          className="overflow-hidden rounded-3xl border border-slate-200 bg-white p-5 sm:p-6 shadow-sm animate-pulse"
        >
          <div className="flex flex-col lg:flex-row gap-6">
            <div className="h-48 lg:h-44 lg:w-64 rounded-2xl bg-slate-200 shrink-0" />
            <div className="flex-1 space-y-4">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                <div className="space-y-2 w-full max-w-md">
                  <div className="flex items-center gap-2">
                    <div className="h-6 w-24 rounded-full bg-slate-200" />
                    <div className="h-6 w-28 rounded-full bg-slate-200" />
                  </div>
                  <div className="h-7 w-3/4 rounded-xl bg-slate-200" />
                  <div className="h-4 w-40 rounded-lg bg-slate-100" />
                </div>
                <div className="h-9 w-24 rounded-xl bg-slate-200 shrink-0" />
              </div>
              <div className="grid gap-4 border-y border-slate-100 py-4 md:grid-cols-2">
                <div className="space-y-2">
                  <div className="h-3 w-28 rounded bg-slate-200" />
                  <div className="flex gap-2">
                    <div className="h-6 w-20 rounded-lg bg-slate-100" />
                    <div className="h-6 w-16 rounded-lg bg-slate-100" />
                  </div>
                </div>
                <div className="space-y-2">
                  <div className="h-3 w-24 rounded bg-slate-200" />
                  <div className="h-4 w-36 rounded bg-slate-100" />
                </div>
              </div>
              <div className="flex flex-col sm:flex-row justify-end gap-2 pt-1">
                <div className="h-10 w-28 rounded-xl bg-slate-200" />
                <div className="h-10 w-36 rounded-xl bg-slate-200" />
                <div className="h-10 w-32 rounded-xl bg-slate-200" />
              </div>
            </div>
          </div>
        </article>
      ))}
    </div>
  );
}

export default function PostConsole() {
  const { reports, fetchReports, reviewPost, isLoading, isReviewing, error } = useReportStore();
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");

  useEffect(() => {
    fetchReports({ force: true }).catch(() => {});

    // เวลามีการรายงานใหม่หรือมีการอัปเดตจากผู้ดูแลท่านอื่น ให้รีเฟรชข้อมูลอัตโนมัติ
    const unsubCreated = subscribeSocketEvent("report_created", () => {
      fetchReports({ force: true }).catch(() => {});
    });
    const unsubReviewed = subscribeSocketEvent("report_reviewed", () => {
      fetchReports({ force: true }).catch(() => {});
    });

    // ตรวจสอบและรีเฟรชเมื่อผู้ใช้สลับแท็บกลับมา
    const handleVisibilityChange = () => {
      if (document.visibilityState === "visible") {
        fetchReports({ force: true }).catch(() => {});
      }
    };
    document.addEventListener("visibilitychange", handleVisibilityChange);

    return () => {
      unsubCreated();
      unsubReviewed();
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, [fetchReports]);

  const filteredReports = useMemo(() => {
    const query = search.trim().toLowerCase();
    return reports.filter((post) => {
      const status = String(post.post_status || post.postStatus || "ACTIVE").toUpperCase();
      const matchesStatus = statusFilter === "ALL" || status === statusFilter;
      const matchesSearch = !query || [post.title, post.author?.username, post.author?.email]
        .filter(Boolean).some((value) => String(value).toLowerCase().includes(query));
      return matchesStatus && matchesSearch;
    });
  }, [reports, search, statusFilter]);
  const totalReports = reports.reduce((sum, post) => sum + getReportCount(post), 0);

  const handleAction = async (post, action) => {
    const copy = {
      APPROVE: ["ยืนยันว่าโพสต์นี้ปลอดภัย?", "รายงานทั้งหมดจะถูกล้างและโพสต์จะกลับมาเผยแพร่", "อนุมัติและปิดรายงาน", "อนุมัติโพสต์แล้ว", "#16a34a"],
      SUSPEND: ["ระงับโพสต์นี้ชั่วคราว?", "ผู้ใช้งานทั่วไปจะไม่สามารถเข้าถึงโพสต์ระหว่างรอตรวจสอบต่อได้", "ระงับโพสต์", "ระงับโพสต์แล้ว", "#d97706"],
      DELETE: ["ลบโพสต์นี้โดยตรง?", "โพสต์และไฟล์ทั้งหมดจะถูกลบทันทีอย่างถาวรและไม่สามารถกู้คืนได้", "ลบโพสต์โดยตรง", "ลบโพสต์ถาวรแล้ว", "#e11d48"],
    }[action];
    const confirmation = await Swal.fire({
      icon: "warning", title: copy[0], text: copy[1], showCancelButton: true,
      confirmButtonText: copy[2], cancelButtonText: "ยกเลิก", confirmButtonColor: copy[4],
    });
    if (!confirmation.isConfirmed) return;
    try {
      await reviewPost(post.id, action);
      toast.success(copy[3]);
      // เวลามีการกระทำหรือข้อมูลเปลี่ยน ให้รีหน้าอัตโนมัติ
      setTimeout(() => {
        window.location.reload();
      }, 700);
    } catch (actionError) {
      toast.error(actionError.response?.data?.message || "ดำเนินการไม่สำเร็จ กรุณาลองใหม่");
    }
  };

  return (
    <main className="mx-auto w-full max-w-7xl px-4 pb-16 sm:px-6 lg:px-8">
      <section className="mb-8 overflow-hidden rounded-3xl bg-slate-900 p-6 text-white shadow-xl sm:p-8">
        <div className="flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <div className="mb-3 inline-flex items-center gap-2 rounded-full bg-rose-500/15 px-3 py-1 text-sm font-bold text-rose-300"><ShieldAlert className="h-4 w-4" /> Report Console</div>
            <h1 className="text-2xl font-extrabold sm:text-3xl">จัดการรีพอร์ต</h1>
            <p className="mt-2 text-sm text-slate-300">ตรวจสอบโพสต์ที่ได้รับรายงานครบ {REPORT_THRESHOLD} ครั้ง</p>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="rounded-2xl bg-white/10 px-5 py-4 text-center"><p className="text-3xl font-extrabold text-rose-300">{reports.length}</p><p className="mt-1 text-xs text-slate-300">โพสต์รอตรวจสอบ</p></div>
            <div className="rounded-2xl bg-white/10 px-5 py-4 text-center"><p className="text-3xl font-extrabold text-amber-300">{totalReports}</p><p className="mt-1 text-xs text-slate-300">รายงานทั้งหมด</p></div>
          </div>
        </div>
      </section>

      <section className="mb-6 flex flex-col gap-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:flex-row">
        <label className="relative flex-1"><Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" /><input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="ค้นหาชื่อโพสต์หรือเจ้าของโพสต์" className="w-full rounded-xl border border-slate-200 py-2.5 pl-10 pr-4 text-sm outline-none focus:border-primary" /></label>
        <select value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)} className="rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-medium text-slate-700 outline-none focus:border-primary"><option value="ALL">ทุกสถานะ</option><option value="ACTIVE">ยังเผยแพร่อยู่</option><option value="UNACTIVED">ถูกระงับชั่วคราว</option></select>
      </section>

      {error && <div className="mb-6 rounded-2xl border border-rose-200 bg-rose-50 p-4 text-sm font-medium text-rose-700">{error}</div>}
      {isLoading && reports.length === 0 ? (
        <PostConsoleSkeleton />
      ) : filteredReports.length === 0 ? (
        <div className="flex min-h-64 flex-col items-center justify-center rounded-3xl border border-slate-200 bg-white p-8 text-center shadow-sm"><CheckCircle2 className="mb-4 h-14 w-14 text-emerald-500" /><h2 className="text-xl font-extrabold text-slate-800">ไม่มีรีพอร์ตที่รอตรวจสอบ</h2><p className="mt-2 text-sm text-slate-500">โพสต์จะปรากฏเมื่อได้รับรายงานครบ {REPORT_THRESHOLD} ครั้ง</p></div>
      ) : (
        <div className="space-y-4">
          {filteredReports.map((post) => {
            const status = String(post.post_status || post.postStatus || "ACTIVE").toUpperCase();
            const reasons = [...new Set((post.reports || []).map((report) => report.reason).filter(Boolean))];
            const coverImage = post.cover_image || post.coverImage || post.cover_image_url;
            const statusClass = status === "ACTIVE" ? "bg-emerald-50 text-emerald-700" : "bg-amber-50 text-amber-700";
            return (
              <article key={post.id} className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
                <div className="flex flex-col lg:flex-row">
                  <div className="h-48 bg-slate-100 lg:h-auto lg:w-64">{coverImage ? <img src={coverImage} alt="" className="h-full w-full object-cover" /> : <div className="flex h-full items-center justify-center text-slate-300"><FileWarning className="h-14 w-14" /></div>}</div>
                  <div className="flex-1 p-5 sm:p-6">
                    <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                      <div className="min-w-0"><div className="mb-2 flex flex-wrap items-center gap-2"><span className="inline-flex items-center gap-1 rounded-full bg-rose-50 px-2.5 py-1 text-xs font-bold text-rose-600"><AlertTriangle className="h-3.5 w-3.5" /> {getReportCount(post)} รายงาน</span><span className={`rounded-full px-2.5 py-1 text-xs font-bold ${statusClass}`}>{STATUS_LABELS[status] || status}</span></div><h2 className="truncate text-xl font-extrabold text-slate-900">{post.title || "โพสต์ไม่มีชื่อ"}</h2><p className="mt-1 text-sm text-slate-500">โดย {post.author?.username || post.author?.email || "ไม่พบข้อมูลเจ้าของโพสต์"}</p></div>
                      <Link to={`/post/${encodeURIComponent(post.id)}`} className="inline-flex shrink-0 items-center gap-2 rounded-xl border border-slate-200 px-4 py-2 text-sm font-bold text-slate-600 hover:border-primary hover:text-primary hover:bg-slate-50 transition-all"><Eye className="h-4 w-4" /> ดูโพสต์</Link>
                    </div>
                    <div className="mt-5 grid gap-4 border-y border-slate-100 py-4 md:grid-cols-2">
                      <div><p className="mb-2 text-xs font-bold uppercase text-slate-400">เหตุผลที่ถูกรายงาน</p><div className="flex flex-wrap gap-2">{reasons.length ? reasons.map((reason) => <span key={reason} className="rounded-lg bg-slate-100 px-2.5 py-1 text-xs text-slate-700">{reason}</span>) : <span className="text-sm text-slate-400">ไม่ระบุเหตุผล</span>}</div></div>
                      <div><p className="mb-2 text-xs font-bold uppercase text-slate-400">รายงานล่าสุด</p><p className="flex items-center gap-2 text-sm text-slate-600"><Clock3 className="h-4 w-4 text-slate-400" />{formatDate(post.reports?.at(-1)?.created_at || post.updated_at)}</p></div>
                    </div>
                    {post.content && <details className="mt-4 rounded-xl bg-slate-50 px-4 py-3"><summary className="cursor-pointer text-sm font-bold text-slate-700">ดูเนื้อหาโพสต์ในหน้าตรวจสอบ</summary><div className="post-details-content mt-3 max-h-72 overflow-y-auto border-t border-slate-200 pt-3 text-sm leading-7 text-slate-600" dangerouslySetInnerHTML={{ __html: sanitizePostContent(post.content) }} /></details>}
                    <div className="mt-5 flex flex-col gap-2 sm:flex-row sm:justify-end">
                      {status === "ACTIVE" && <button type="button" onClick={() => handleAction(post, "SUSPEND")} disabled={isReviewing} className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-2.5 text-sm font-bold text-amber-700 hover:bg-amber-100 transition-colors disabled:opacity-50 cursor-pointer">ระงับชั่วคราว</button>}
                      <button type="button" onClick={() => handleAction(post, "APPROVE")} disabled={isReviewing} className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-2.5 text-sm font-bold text-emerald-700 hover:bg-emerald-100 transition-colors disabled:opacity-50 cursor-pointer">อนุมัติและปิดรายงาน</button>
                      <button type="button" onClick={() => handleAction(post, "DELETE")} disabled={isReviewing} className="inline-flex items-center justify-center gap-2 rounded-xl bg-rose-600 hover:bg-rose-700 px-4 py-2.5 text-sm font-bold text-white transition-colors disabled:opacity-50 cursor-pointer"><Trash2 className="h-4 w-4" /> ลบโพสต์โดยตรง</button>
                    </div>
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      )}
    </main>
  );
}
