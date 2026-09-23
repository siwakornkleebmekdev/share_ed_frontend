import { useEffect, useMemo, useState } from "react";
import { AlertTriangle, CheckCircle2, Clock3, Eye, FileWarning, RotateCcw, Search, ShieldAlert, Trash2 } from "lucide-react";
import { Link } from "react-router";
import Swal from "sweetalert2";
import toast from "react-hot-toast";
import useReportStore from "@/store/reportStore";
import { sanitizePostContent } from "@/utils/sanitizePostContent";

const STATUS_LABELS = {
  ACTIVE: "ยังเผยแพร่อยู่",
  UNACTIVED: "ถูกระงับชั่วคราว",
  DELETED: "เพิ่งลบ — เรียกคืนได้",
};

const getReportCount = (post) =>
  post?._count?.reports ?? post?.reports?.length ?? 0;

const formatDate = (value) => {
  if (!value) return "ไม่ระบุเวลา";
  return new Date(value).toLocaleString("th-TH", {
    dateStyle: "medium",
    timeStyle: "short",
  });
};

const getRecoveryDeadline = (post) => {
  const explicit = Date.parse(post.recoverable_until || post.recoverableUntil || "");
  if (Number.isFinite(explicit)) return explicit;
  const deletedAt = Date.parse(post.updated_at || post.updatedAt || "");
  return Number.isFinite(deletedAt) ? deletedAt + 5 * 60 * 1000 : 0;
};

const formatCountdown = (milliseconds) => {
  const seconds = Math.max(0, Math.ceil(milliseconds / 1000));
  const minutesPart = Math.floor(seconds / 60);
  const secondsPart = String(seconds % 60).padStart(2, "0");
  return `${minutesPart}:${secondsPart}`;
};

export default function ReportConsole() {
  const { reports, fetchReports, reviewPost, isLoading, isReviewing, error } = useReportStore();
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [now, setNow] = useState(Date.now());

  useEffect(() => {
    fetchReports({ force: true }).catch(() => {});
  }, [fetchReports]);

  useEffect(() => {
    const timer = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(timer);
  }, []);

  const visibleReports = reports.filter((post) => {
    const status = String(post.post_status || post.postStatus || "ACTIVE").toUpperCase();
    return status !== "DELETED" || getRecoveryDeadline(post) > now;
  });
  const pendingPosts = visibleReports.filter((post) =>
    String(post.post_status || post.postStatus || "ACTIVE").toUpperCase() !== "DELETED",
  );
  const recentlyDeletedPosts = visibleReports.filter((post) =>
    String(post.post_status || post.postStatus || "").toUpperCase() === "DELETED",
  );
  const filteredReports = useMemo(() => {
    const query = search.trim().toLowerCase();
    return visibleReports.filter((post) => {
      const status = String(post.post_status || post.postStatus || "ACTIVE").toUpperCase();
      const matchesStatus = statusFilter === "ALL" || status === statusFilter;
      const matchesSearch = !query || [post.title, post.author?.username, post.author?.email]
        .filter(Boolean)
        .some((value) => String(value).toLowerCase().includes(query));
      return matchesStatus && matchesSearch;
    });
  }, [visibleReports, search, statusFilter]);

  const totalReports = pendingPosts.reduce((sum, post) => sum + getReportCount(post), 0);

  const handleAction = async (post, action) => {
    const currentStatus = String(post.post_status || post.postStatus || "ACTIVE").toUpperCase();
    const isDeletedRestore = action === "RESTORE" && currentStatus === "DELETED";
    const actionCopy = {
      RESTORE: {
        title: isDeletedRestore ? "เรียกคืนโพสต์ที่เพิ่งลบ?" : "ยืนยันว่าโพสต์นี้ปลอดภัย?",
        text: isDeletedRestore
          ? "โพสต์จะกลับมาเผยแพร่อีกครั้ง การเรียกคืนทำได้ภายใน 5 นาทีหลังลบเท่านั้น"
          : "รายงานทั้งหมดของโพสต์นี้จะถูกล้างและโพสต์จะกลับมาเผยแพร่",
        confirm: isDeletedRestore ? "เรียกคืนโพสต์" : "คืนสถานะโพสต์",
        success: isDeletedRestore ? "เรียกคืนโพสต์แล้ว" : "คืนสถานะโพสต์แล้ว",
        color: "#16a34a",
      },
      SUSPEND: {
        title: "ระงับโพสต์นี้ชั่วคราว?",
        text: "ผู้ใช้งานทั่วไปจะไม่สามารถเข้าถึงโพสต์ระหว่างรอตรวจสอบต่อได้",
        confirm: "ระงับโพสต์",
        success: "ระงับโพสต์แล้ว",
        color: "#d97706",
      },
      SOFT_DELETE: {
        title: "ลบโพสต์นี้ออกจากระบบ?",
        text: "โพสต์จะถูกซ่อนออกจากระบบหลังยืนยันการตรวจสอบ",
        confirm: "ลบโพสต์",
        success: "ลบโพสต์แล้ว",
        color: "#e11d48",
      },
    }[action];

    const confirmation = await Swal.fire({
      icon: "warning",
      title: actionCopy.title,
      text: actionCopy.text,
      showCancelButton: true,
      confirmButtonText: actionCopy.confirm,
      cancelButtonText: "ยกเลิก",
      confirmButtonColor: actionCopy.color,
    });

    if (!confirmation.isConfirmed) return;

    try {
      await reviewPost(post.id, action);
      toast.success(actionCopy.success);
    } catch (actionError) {
      toast.error(actionError.response?.data?.message || "ดำเนินการไม่สำเร็จ กรุณาลองใหม่");
    }
  };

  return (
    <main className="mx-auto w-full max-w-7xl px-4 pb-16 sm:px-6 lg:px-8">
      <section className="mb-8 overflow-hidden rounded-3xl bg-slate-900 p-6 text-white shadow-xl sm:p-8">
        <div className="flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <div className="mb-3 inline-flex items-center gap-2 rounded-full bg-rose-500/15 px-3 py-1 text-sm font-bold text-rose-300">
              <ShieldAlert className="h-4 w-4" /> Report Console
            </div>
            <h1 className="text-2xl font-extrabold sm:text-3xl">ตรวจสอบโพสต์ที่ถูกรายงาน</h1>
            <p className="mt-2 text-sm text-slate-300">ตรวจเหตุผลและจัดการโพสต์ที่อาจละเมิดกฎของชุมชน</p>
          </div>
          <div className="grid grid-cols-3 gap-3">
            <div className="rounded-2xl bg-white/10 px-5 py-4 text-center backdrop-blur">
              <p className="text-3xl font-extrabold text-rose-300">{pendingPosts.length}</p>
              <p className="mt-1 text-xs font-medium text-slate-300">โพสต์รอตรวจสอบ</p>
            </div>
            <div className="rounded-2xl bg-white/10 px-5 py-4 text-center backdrop-blur">
              <p className="text-3xl font-extrabold text-amber-300">{totalReports}</p>
              <p className="mt-1 text-xs font-medium text-slate-300">รายงานทั้งหมด</p>
            </div>
            <div className="rounded-2xl bg-white/10 px-5 py-4 text-center backdrop-blur">
              <p className="text-3xl font-extrabold text-sky-300">{recentlyDeletedPosts.length}</p>
              <p className="mt-1 text-xs font-medium text-slate-300">รอเรียกคืน</p>
            </div>
          </div>
        </div>
      </section>

      <section className="mb-6 flex flex-col gap-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:flex-row">
        <label className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="ค้นหาชื่อโพสต์หรือเจ้าของโพสต์"
            className="w-full rounded-xl border border-slate-200 py-2.5 pl-10 pr-4 text-sm outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/15"
          />
        </label>
        <select
          value={statusFilter}
          onChange={(event) => setStatusFilter(event.target.value)}
          className="rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-medium text-slate-700 outline-none focus:border-primary"
        >
          <option value="ALL">ทุกสถานะ</option>
          <option value="ACTIVE">ยังเผยแพร่อยู่</option>
          <option value="UNACTIVED">ถูกระงับชั่วคราว</option>
          <option value="DELETED">เพิ่งลบและเรียกคืนได้</option>
        </select>
      </section>

      {error && (
        <div className="mb-6 rounded-2xl border border-rose-200 bg-rose-50 p-4 text-sm font-medium text-rose-700">
          {error}
        </div>
      )}

      {isLoading && visibleReports.length === 0 ? (
        <div className="flex min-h-64 items-center justify-center rounded-3xl border border-slate-200 bg-white">
          <div className="text-center text-slate-500">
            <div className="mx-auto mb-3 h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
            กำลังโหลดรายการรายงาน...
          </div>
        </div>
      ) : filteredReports.length === 0 ? (
        <div className="flex min-h-64 flex-col items-center justify-center rounded-3xl border border-slate-200 bg-white p-8 text-center shadow-sm">
          <CheckCircle2 className="mb-4 h-14 w-14 text-emerald-500" />
          <h2 className="text-xl font-extrabold text-slate-800">ไม่มีรายการใน Report Console</h2>
          <p className="mt-2 text-sm text-slate-500">โพสต์ที่ถูกรายงานหรือเพิ่งลบจะปรากฏที่หน้านี้</p>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredReports.map((post) => {
            const status = String(post.post_status || post.postStatus || "ACTIVE").toUpperCase();
            const reasons = [...new Set((post.reports || []).map((report) => report.reason).filter(Boolean))];
            const coverImage = post.cover_image || post.coverImage || post.cover_image_url;
            const recoveryRemaining = getRecoveryDeadline(post) - now;
            const statusClass = status === "ACTIVE"
              ? "bg-emerald-50 text-emerald-700"
              : status === "DELETED"
                ? "bg-sky-50 text-sky-700"
                : "bg-amber-50 text-amber-700";

            return (
              <article key={post.id} className={`overflow-hidden rounded-3xl bg-white shadow-sm transition hover:shadow-md ${status === "DELETED" ? "border-2 border-sky-200" : "border border-slate-200"}`}>
                <div className="flex flex-col lg:flex-row">
                  <div className="h-48 bg-slate-100 lg:h-auto lg:w-64">
                    {coverImage ? (
                      <img src={coverImage} alt="" className="h-full w-full object-cover" />
                    ) : (
                      <div className="flex h-full items-center justify-center text-slate-300">
                        <FileWarning className="h-14 w-14" />
                      </div>
                    )}
                  </div>

                  <div className="flex-1 p-5 sm:p-6">
                    <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                      <div className="min-w-0">
                        <div className="mb-2 flex flex-wrap items-center gap-2">
                          <span className="inline-flex items-center gap-1 rounded-full bg-rose-50 px-2.5 py-1 text-xs font-bold text-rose-600">
                            <AlertTriangle className="h-3.5 w-3.5" /> {getReportCount(post)} รายงาน
                          </span>
                          <span className={`rounded-full px-2.5 py-1 text-xs font-bold ${statusClass}`}>
                            {STATUS_LABELS[status] || status}
                          </span>
                          {status === "DELETED" && (
                            <span className="inline-flex items-center gap-1 rounded-full bg-sky-600 px-2.5 py-1 text-xs font-extrabold text-white">
                              <Clock3 className="h-3.5 w-3.5" /> เหลือ {formatCountdown(recoveryRemaining)}
                            </span>
                          )}
                        </div>
                        <h2 className="truncate text-xl font-extrabold text-slate-900">{post.title || "โพสต์ไม่มีชื่อ"}</h2>
                        <p className="mt-1 text-sm text-slate-500">
                          โดย {post.author?.username || post.author?.email || "ไม่พบข้อมูลเจ้าของโพสต์"}
                        </p>
                      </div>
                      {status === "ACTIVE" && (
                        <Link
                          to={`/post/${encodeURIComponent(post.id)}`}
                          className="inline-flex shrink-0 items-center justify-center gap-2 rounded-xl border border-slate-200 px-4 py-2 text-sm font-bold text-slate-600 transition hover:border-primary/30 hover:bg-blue-50 hover:text-primary"
                        >
                          <Eye className="h-4 w-4" /> ดูโพสต์
                        </Link>
                      )}
                    </div>

                    <div className="mt-5 grid gap-4 border-y border-slate-100 py-4 md:grid-cols-2">
                      <div>
                        <p className="mb-2 text-xs font-bold uppercase tracking-wide text-slate-400">เหตุผลที่ถูกรายงาน</p>
                        <div className="flex flex-wrap gap-2">
                          {reasons.length > 0 ? reasons.map((reason) => (
                            <span key={reason} className="rounded-lg bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-700">{reason}</span>
                          )) : <span className="text-sm text-slate-400">ไม่ระบุเหตุผล</span>}
                        </div>
                      </div>
                      <div>
                        <p className="mb-2 text-xs font-bold uppercase tracking-wide text-slate-400">รายงานล่าสุด</p>
                        <p className="flex items-center gap-2 text-sm text-slate-600">
                          <Clock3 className="h-4 w-4 text-slate-400" />
                          {formatDate(post.reports?.[post.reports.length - 1]?.created_at || post.updated_at)}
                        </p>
                      </div>
                    </div>

                    {post.content && (
                      <details className="mt-4 rounded-xl bg-slate-50 px-4 py-3">
                        <summary className="cursor-pointer text-sm font-bold text-slate-700">ดูเนื้อหาโพสต์ในหน้าตรวจสอบ</summary>
                        <div
                          className="post-details-content mt-3 max-h-72 overflow-y-auto border-t border-slate-200 pt-3 text-sm leading-7 text-slate-600"
                          dangerouslySetInnerHTML={{ __html: sanitizePostContent(post.content) }}
                        />
                      </details>
                    )}

                    <div className="mt-5 flex flex-col gap-2 sm:flex-row sm:justify-end">
                      {status === "DELETED" ? (
                        <button
                          type="button"
                          onClick={() => handleAction(post, "RESTORE")}
                          disabled={isReviewing || recoveryRemaining <= 0}
                          className="inline-flex items-center justify-center gap-2 rounded-xl bg-sky-600 px-5 py-2.5 text-sm font-bold text-white transition hover:bg-sky-700 disabled:cursor-not-allowed disabled:opacity-50"
                        >
                          <RotateCcw className="h-4 w-4" /> เรียกคืนโพสต์ ({formatCountdown(recoveryRemaining)})
                        </button>
                      ) : (
                        <>
                      {status === "ACTIVE" && (
                        <button
                          type="button"
                          onClick={() => handleAction(post, "SUSPEND")}
                          disabled={isReviewing}
                          className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-2.5 text-sm font-bold text-amber-700 transition hover:bg-amber-100 disabled:opacity-50"
                        >
                          ระงับชั่วคราว
                        </button>
                      )}
                      <button
                        type="button"
                        onClick={() => handleAction(post, "RESTORE")}
                        disabled={isReviewing}
                        className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-2.5 text-sm font-bold text-emerald-700 transition hover:bg-emerald-100 disabled:opacity-50"
                      >
                        คืนสถานะและปิดรายงาน
                      </button>
                      <button
                        type="button"
                        onClick={() => handleAction(post, "SOFT_DELETE")}
                        disabled={isReviewing}
                        className="inline-flex items-center justify-center gap-2 rounded-xl bg-rose-600 px-4 py-2.5 text-sm font-bold text-white transition hover:bg-rose-700 disabled:opacity-50"
                      >
                        <Trash2 className="h-4 w-4" /> ลบโพสต์
                      </button>
                        </>
                      )}
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
