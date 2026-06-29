import { useEffect } from 'react';
import { Bell, Heart, MessageSquare, Info, Check, Trash2, ArrowLeft } from 'lucide-react';
import { Link, useNavigate } from 'react-router';
import useNotificationStore from '@/store/notificationStore';

export default function Notifications() {
  const { notifications, fetchNotifications, markAsRead, markAllAsRead, clearAll, isLoading } = useNotificationStore();
  const navigate = useNavigate();

  useEffect(() => {
    fetchNotifications();
  }, [fetchNotifications]);

  const getNotificationIcon = (type) => {
    switch(type) {
      case 'LIKE': return <Heart className="h-5 w-5 text-pink-500" />;
      case 'COMMENT': return <MessageSquare className="h-5 w-5 text-blue-500" />;
      case 'SYSTEM': return <Info className="h-5 w-5 text-indigo-500" />;
      default: return <Bell className="h-5 w-5 text-slate-500" />;
    }
  };

  const unreadCount = notifications.filter(n => !n.isRead).length;

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
            <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight flex items-center gap-2">
              การแจ้งเตือน
              {unreadCount > 0 && (
                <span className="bg-red-500 text-white text-sm font-bold px-2.5 py-0.5 rounded-full">
                  {unreadCount} ใหม่
                </span>
              )}
            </h1>
          </div>

          {notifications.length > 0 && (
            <div className="flex items-center gap-2">
              <button 
                onClick={() => markAllAsRead()}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-white text-slate-600 hover:text-primary text-sm font-semibold rounded-lg border border-slate-200 shadow-sm transition-colors"
              >
                <Check className="h-4 w-4" /> อ่านทั้งหมด
              </button>
              <button 
                onClick={() => clearAll()}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-white text-slate-600 hover:text-red-500 text-sm font-semibold rounded-lg border border-slate-200 shadow-sm transition-colors"
              >
                <Trash2 className="h-4 w-4" /> ล้าง
              </button>
            </div>
          )}
        </div>

        {/* Content */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden min-h-[500px]">
          {isLoading ? (
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
              <Link to="/explore" className="mt-4 px-6 py-2.5 bg-primary text-white font-bold rounded-xl hover:bg-blue-600 transition-colors shadow-md shadow-blue-200">
                ไปหาเนื้อหาอ่านกันเถอะ
              </Link>
            </div>
          ) : (
            <div className="divide-y divide-slate-100">
              {notifications.map((notif) => (
                <div 
                  key={notif.id}
                  onClick={() => {
                    if(!notif.isRead) markAsRead(notif.id);
                  }}
                  className={`p-5 sm:p-6 flex flex-col sm:flex-row gap-4 sm:items-start transition-colors cursor-pointer hover:bg-slate-50 ${!notif.isRead ? 'bg-blue-50/20' : ''}`}
                >
                  <div className={`p-3 rounded-full w-fit ${!notif.isRead ? 'bg-white shadow-sm ring-1 ring-slate-100' : 'bg-slate-50'}`}>
                    {getNotificationIcon(notif.type)}
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-4">
                      <h3 className={`text-base ${!notif.isRead ? 'font-bold text-slate-900' : 'font-semibold text-slate-700'}`}>
                        {notif.title}
                      </h3>
                      <span className="text-xs font-medium text-slate-400 whitespace-nowrap pt-1">
                        {new Date(notif.createdAt).toLocaleDateString('th-TH', { 
                          hour: '2-digit', minute: '2-digit', 
                          day: 'numeric', month: 'short' 
                        })}
                      </span>
                    </div>
                    <p className={`mt-1 text-sm leading-relaxed ${!notif.isRead ? 'text-slate-700' : 'text-slate-500'}`}>
                      {notif.message}
                    </p>
                    {notif.link && (
                      <Link 
                        to={notif.link}
                        className="inline-flex mt-3 text-sm font-bold text-primary hover:text-blue-700 transition-colors"
                      >
                        ดูรายละเอียด &rarr;
                      </Link>
                    )}
                  </div>

                  {!notif.isRead && (
                    <div className="hidden sm:block mt-2">
                      <div className="w-2.5 h-2.5 bg-blue-500 rounded-full shadow-sm ring-4 ring-blue-50"></div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
