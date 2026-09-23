import { useEffect } from 'react';
import {
  Bell, Heart, MessageSquare, Info, Check, Trash2, ArrowLeft,
  Bookmark, UserPlus, Newspaper, X, ShieldAlert, RotateCcw,
} from 'lucide-react';
import { Link, useNavigate } from 'react-router';
import useNotificationStore from '@/store/notificationStore';

export default function Notifications() {
  const {
    notifications,
    fetchNotifications,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    clearAll,
    isLoading, error, isMutating,
  } = useNotificationStore();
  const navigate = useNavigate();

  useEffect(() => {
    fetchNotifications();
  }, [fetchNotifications]);

  const unreadCount = notifications.filter((n) => !n.isRead).length;

  // ── Helpers ────────────────────────────────────────────────────────────────
  const formatRelativeTime = (iso) => {
    if (!iso) return '';
    const diff = Date.now() - new Date(iso).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return 'เมื่อสักครู่';
    if (mins < 60) return `${mins} นาทีที่แล้ว`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return `${hrs} ชั่วโมงที่แล้ว`;
    const days = Math.floor(hrs / 24);
    if (days < 7) return `${days} วันที่แล้ว`;
    return new Date(iso).toLocaleDateString('th-TH', { day: 'numeric', month: 'short', year: 'numeric' });
  };

  const getNotificationIcon = (type) => {
    const cls = 'h-5 w-5';
    switch (type) {
      case 'LIKE':
      case 'NEW_LIKE': return <Heart className={`${cls} text-pink-500`} />;
      case 'COMMENT':
      case 'NEW_COMMENT': return <MessageSquare className={`${cls} text-blue-500`} />;
      case 'FOLLOW':
      case 'NEW_FOLLOWER': return <UserPlus className={`${cls} text-green-500`} />;
      case 'NEW_POST': return <Newspaper className={`${cls} text-purple-500`} />;
      case 'BOOKMARK':
      case 'BOOKMARK_REMOVED': return <Bookmark className={`${cls} text-amber-500`} />;
      case 'POST_SUSPENDED':
      case 'POST_REPORTED': return <ShieldAlert className={`${cls} text-rose-500`} />;
      case 'POST_RESTORED': return <RotateCcw className={`${cls} text-emerald-500`} />;
      case 'POST_REMOVED': return <Trash2 className={`${cls} text-slate-500`} />;
      case 'SYSTEM':   return <Info className={`${cls} text-indigo-500`} />;
      default:         return <Bell className={`${cls} text-slate-500`} />;
    }
  };

  const getBgColor = (type) => {
    const map = {
      LIKE: 'bg-pink-50',
      NEW_LIKE: 'bg-pink-50',
      COMMENT: 'bg-blue-50',
      NEW_COMMENT: 'bg-blue-50',
      FOLLOW: 'bg-green-50',
      NEW_FOLLOWER: 'bg-green-50',
      NEW_POST: 'bg-purple-50',
      BOOKMARK: 'bg-amber-50',
      BOOKMARK_REMOVED: 'bg-amber-50',
      POST_SUSPENDED: 'bg-rose-50',
      POST_REPORTED: 'bg-rose-50',
      POST_RESTORED: 'bg-emerald-50',
      POST_REMOVED: 'bg-slate-100',
      SYSTEM: 'bg-indigo-50',
    };
    return map[type] || 'bg-slate-50';
  };

  const getActionLabel = (type) => {
    if (type === 'POST_SUSPENDED') return 'ดูโพสต์ที่ถูกระงับ →';
    if (type === 'POST_RESTORED') return 'ดูโพสต์ที่คืนสถานะ →';
    if (type === 'POST_REMOVED') return 'ดูโพสต์ที่ถูกลบ →';
    if (type === 'POST_REPORTED') return 'ดูโพสต์ที่ถูกรายงาน →';
    return 'ดูรายละเอียด →';
  };

  // Group by date label
  const groupByDate = (items) => {
    const groups = {};
    items.forEach((n) => {
      const date = new Date(n.createdAt);
      const today = new Date();
      const yesterday = new Date(today);
      yesterday.setDate(today.getDate() - 1);

      let label;
      if (date.toDateString() === today.toDateString()) {
        label = 'วันนี้';
      } else if (date.toDateString() === yesterday.toDateString()) {
        label = 'เมื่อวาน';
      } else {
        label = date.toLocaleDateString('th-TH', { weekday: 'long', day: 'numeric', month: 'long' });
      }
      if (!groups[label]) groups[label] = [];
      groups[label].push(n);
    });
    return groups;
  };

  const grouped = groupByDate(notifications);

  return (
    <div className="min-h-screen bg-slate-50 pt-8 pb-20">
      <div className="max-w-3xl mx-auto px-4 sm:px-6">

        {/* Header */}
        <div className="mb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate(-1)}
              className="p-2 bg-white rounded-full text-slate-500 hover:text-primary shadow-sm hover:shadow transition-all"
            >
              <ArrowLeft className="h-5 w-5" />
            </button>
            <div>
              <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight flex items-center gap-2">
                การแจ้งเตือน
                {unreadCount > 0 && (
                  <span className="bg-red-500 text-white text-sm font-bold px-2.5 py-0.5 rounded-full">
                    {unreadCount} ใหม่
                  </span>
                )}
              </h1>
              <p className="text-sm text-slate-500 mt-0.5">
                {notifications.length} รายการทั้งหมด
              </p>
            </div>
          </div>

          {notifications.length > 0 && (
            <div className="flex items-center gap-2">
              {unreadCount > 0 && (
                <button
                  disabled={isMutating} onClick={() => markAllAsRead()}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-white text-slate-600 hover:text-primary text-sm font-semibold rounded-lg border border-slate-200 shadow-sm transition-colors"
                >
                  <Check className="h-4 w-4" /> อ่านทั้งหมด
                </button>
              )}
              <button
                disabled={isMutating} onClick={() => { if (window.confirm("ลบการแจ้งเตือนทั้งหมดหรือไม่?")) clearAll(); }}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-white text-slate-600 hover:text-red-500 text-sm font-semibold rounded-lg border border-slate-200 shadow-sm transition-colors"
              >
                <Trash2 className="h-4 w-4" /> ล้างทั้งหมด
              </button>
            </div>
          )}
        </div>

        {error && <div role="alert" className="mb-4 rounded-xl bg-red-50 p-4 text-red-700">{error} <button className="underline" onClick={fetchNotifications}>ลองอีกครั้ง</button></div>}
        {/* Content */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden min-h-[400px]">
          {isLoading && notifications.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-[400px] text-slate-400 gap-3">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
              <p>กำลังโหลดข้อมูล...</p>
            </div>
          ) : notifications.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-[500px] text-slate-400 gap-4">
              <div className="w-24 h-24 bg-slate-50 rounded-full flex items-center justify-center mb-2">
                <Bell className="h-12 w-12 text-slate-300" />
              </div>
              <h2 className="text-xl font-bold text-slate-700">ไม่มีการแจ้งเตือน</h2>
              <p className="text-sm">คุณดูการแจ้งเตือนครบหมดแล้ว เยี่ยมไปเลย!</p>
              <Link
                to="/explore"
                className="mt-4 px-6 py-2.5 bg-primary text-white font-bold rounded-xl hover:bg-blue-600 transition-colors shadow-md shadow-blue-200"
              >
                ไปหาเนื้อหาอ่านกันเถอะ
              </Link>
            </div>
          ) : (
            <div>
              {Object.entries(grouped).map(([label, items]) => (
                <div key={label}>
                  {/* Date group header */}
                  <div className="px-5 py-2.5 bg-slate-50 border-b border-slate-100 sticky top-0">
                    <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">{label}</p>
                  </div>

                  {/* Notification items */}
                  <div className="divide-y divide-slate-100">
                    {items.map((notif) => (
                      <div
                        key={notif.id}
                        role={notif.link ? 'link' : undefined}
                        tabIndex={notif.link ? 0 : undefined}
                        onClick={() => {
                          if (!notif.isRead) markAsRead(notif.id);
                          if (notif.link) navigate(notif.link);
                        }}
                        onKeyDown={(event) => {
                          if (notif.link && (event.key === 'Enter' || event.key === ' ')) {
                            event.preventDefault();
                            event.currentTarget.click();
                          }
                        }}
                        className={`group relative p-5 sm:p-6 flex gap-4 sm:items-start transition-colors ${notif.link ? 'cursor-pointer' : ''} ${
                          !notif.isRead ? 'bg-blue-50/20' : 'hover:bg-slate-50'
                        }`}
                      >
                        {/* Icon */}
                        <div className={`p-3 rounded-full w-fit flex-shrink-0 ${getBgColor(notif.type)} ${
                          !notif.isRead ? 'shadow-sm ring-1 ring-slate-100' : ''
                        }`}>
                          {getNotificationIcon(notif.type)}
                        </div>

                        {/* Text content */}
                        <div className="flex-1 min-w-0 text-left">
                          <div className="flex items-start justify-between gap-4">
                            <h3 className={`text-base ${!notif.isRead ? 'font-bold text-slate-900' : 'font-semibold text-slate-700'}`}>
                              {notif.title}
                            </h3>
                            <span className="text-xs font-medium text-slate-400 whitespace-nowrap pt-0.5">
                              {formatRelativeTime(notif.createdAt)}
                            </span>
                          </div>
                          <p className={`mt-1 text-sm leading-relaxed ${!notif.isRead ? 'text-slate-700' : 'text-slate-500'}`}>
                            {notif.message}
                          </p>
                          {notif.link && (
                            <span className="inline-flex mt-2 text-sm font-bold text-primary hover:text-blue-700 transition-colors">
                              {getActionLabel(notif.type)}
                            </span>
                          )}
                        </div>

                        {/* Actions: unread dot + delete */}
                        <div className="flex flex-col items-center gap-2 flex-shrink-0 ml-2">
                          {!notif.isRead && (
                            <div className="w-2.5 h-2.5 bg-blue-500 rounded-full shadow-sm ring-4 ring-blue-50 mt-1"></div>
                          )}
                          <button
                            onClick={(event) => {
                              event.stopPropagation();
                              deleteNotification(notif.id);
                            }}
                            className="opacity-100 sm:opacity-0 sm:group-hover:opacity-100 focus:opacity-100 transition-opacity p-1.5 rounded-lg hover:bg-red-50 text-slate-400 hover:text-red-500"
                            disabled={isMutating} aria-label="ลบการแจ้งเตือน" title="ลบการแจ้งเตือน"
                          >
                            <X className="h-4 w-4" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

