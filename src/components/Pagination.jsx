export default function Pagination({ currentPage, totalPages, onPageChange, className = '', scrollTargetId }) {
  if (totalPages <= 1) return null;

  const selectPage = (page) => {
    if (page === currentPage || page < 1 || page > totalPages) return;
    onPageChange(page);
    const scrollTarget = scrollTargetId ? document.getElementById(scrollTargetId) : null;
    if (scrollTarget) {
      scrollTarget.scrollIntoView({ behavior: 'smooth', block: 'start' });
    } else {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  return (
    <nav
      className={`flex items-center justify-center gap-2 ${className}`}
      aria-label="การแบ่งหน้า"
    >
      <button
        type="button"
        onClick={() => selectPage(currentPage - 1)}
        disabled={currentPage === 1}
        aria-label="หน้าก่อนหน้า"
        className="rounded-xl border border-slate-200 bg-white px-4 py-2 font-bold text-slate-600 shadow-sm transition-colors hover:bg-slate-50 hover:text-primary disabled:cursor-not-allowed disabled:opacity-50"
      >
        ก่อนหน้า
      </button>

      <div className="mx-2 hidden gap-1 sm:flex">
        {Array.from({ length: totalPages }, (_, index) => index + 1).map((page) => {
          const isCurrent = page === currentPage;
          return (
            <button
              key={page}
              type="button"
              onClick={() => selectPage(page)}
              aria-label={`หน้า ${page}`}
              aria-current={isCurrent ? 'page' : undefined}
              className={`h-10 w-10 rounded-xl font-bold shadow-sm transition-all ${
                isCurrent
                  ? 'bg-slate-900 text-white'
                  : 'border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 hover:text-primary'
              }`}
            >
              {page}
            </button>
          );
        })}
      </div>

      <button
        type="button"
        onClick={() => selectPage(currentPage + 1)}
        disabled={currentPage === totalPages}
        aria-label="หน้าถัดไป"
        className="rounded-xl border border-slate-200 bg-white px-4 py-2 font-bold text-slate-600 shadow-sm transition-colors hover:bg-slate-50 hover:text-primary disabled:cursor-not-allowed disabled:opacity-50"
      >
        ถัดไป
      </button>
    </nav>
  );
}
