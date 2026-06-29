import { Link, useNavigate } from 'react-router';
import { BookOpen, Search, Bell, User, Heart, MessageSquare, Info, LogOut, Settings } from 'lucide-react';
import { useState, useEffect, useRef } from 'react';
import useNotificationStore from '@/store/notificationStore';
import useAuthStore from '@/store/authStore';
import { supabase } from '@/utils/supabase';
import toast from 'react-hot-toast';

export default function Navbar() {
  const [isScrolled, setIsScrolled] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const notifRef = useRef(null);
  const profileRef = useRef(null);
  const navigate = useNavigate();
  
  const { notifications, unreadCount, fetchNotifications, markAsRead } = useNotificationStore();
  const { isAuthenticated, user, logout } = useAuthStore();

  const handleLogout = async () => {
    try {
      await supabase.auth.signOut();
      logout();
      setShowProfileMenu(false);
      navigate('/login');
      toast.success('ออกจากระบบสำเร็จ');
    } catch (error) {
      toast.error('เกิดข้อผิดพลาดในการออกจากระบบ');
    }
  };

  useEffect(() => {
    fetchNotifications();
  }, [fetchNotifications]);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Click outside to close notifications and profile popup
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (notifRef.current && !notifRef.current.contains(event.target)) {
        setShowNotifications(false);
      }
      if (profileRef.current && !profileRef.current.contains(event.target)) {
        setShowProfileMenu(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const getNotificationIcon = (type) => {
    switch(type) {
      case 'LIKE': return <Heart className="h-4 w-4 text-pink-500" />;
      case 'COMMENT': return <MessageSquare className="h-4 w-4 text-blue-500" />;
      case 'SYSTEM': return <Info className="h-4 w-4 text-indigo-500" />;
      default: return <Bell className="h-4 w-4 text-slate-500" />;
    }
  };

  return (
    <div className={`fixed top-0 left-0 w-full z-50 transition-all duration-500 ease-out px-4 ${isScrolled ? 'pt-2' : 'pt-4'}`}>
      <nav 
        className={`mx-auto backdrop-blur-md transition-all duration-500 ease-out overflow-visible rounded-full border border-slate-200/50 ${
          isScrolled 
            ? 'w-[92%] max-w-5xl bg-white/95 shadow-[0_8px_30px_rgb(0,0,0,0.12)] py-2 px-6' 
            : 'w-[98%] max-w-7xl bg-white/80 shadow-sm py-2.5 px-8'
        }`}
      >
        <div className={`w-full flex justify-between items-center transition-all duration-500 ${isScrolled ? 'h-12' : 'h-14'}`}>
          <Link to="/" className="flex items-center gap-2 group flex-shrink-0">
            <BookOpen className="text-primary transition-transform duration-300 group-hover:scale-110 h-7 w-7 sm:h-8 sm:w-8" />
            <span className="font-bold text-slate-800 tracking-tight text-lg sm:text-xl">SHARE-ED</span>
          </Link>

          <div className="hidden md:flex items-center justify-center gap-4 sm:gap-6 transition-all duration-500">
            <div className="flex items-center gap-3 sm:gap-4 flex-shrink-0">
              <Link to="/home" className="text-slate-600 hover:text-primary font-bold transition-colors text-sm whitespace-nowrap">
                หน้าหลัก
              </Link>
              <Link to="/explore" className="text-slate-600 hover:text-primary font-bold transition-colors text-sm whitespace-nowrap">
                สำรวจเนื้อหา
              </Link>
              <Link to="/trending" className="text-slate-600 hover:text-primary font-bold transition-colors text-sm whitespace-nowrap">
                โพสต์ยอดนิยม
              </Link>
            </div>
          </div>

          <div className="flex items-center gap-2 sm:gap-4 flex-shrink-0">
            
            <div className="relative" ref={notifRef}>
              <button 
                onClick={() => setShowNotifications(!showNotifications)}
                className="relative p-2.5 text-slate-500 hover:text-primary bg-slate-100 hover:bg-slate-200 rounded-full transition-colors shadow-sm"
              >
                <Bell className="h-4 w-4 sm:h-5 sm:w-5" />
                {unreadCount() > 0 && (
                  <span className="absolute top-0 right-0 h-3 w-3 bg-red-500 border-2 border-white rounded-full"></span>
                )}
              </button>

              {/* Notification Dropdown */}
              {showNotifications && (
                <div className="absolute right-0 mt-3 w-80 bg-white rounded-2xl shadow-xl border border-slate-100 overflow-hidden z-50 animate-in fade-in slide-in-from-top-2">
                  <div className="p-4 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
                    <h3 className="font-bold text-slate-800 text-base">การแจ้งเตือน</h3>
                    {unreadCount() > 0 && (
                      <span className="bg-red-100 text-red-600 text-xs font-bold px-2 py-0.5 rounded-full">
                        {unreadCount()} ใหม่
                      </span>
                    )}
                  </div>
                  
                  <div className="max-h-[320px] overflow-y-auto">
                    {notifications.length === 0 ? (
                      <div className="p-8 text-center text-slate-500 flex flex-col items-center gap-2">
                        <Bell className="h-8 w-8 text-slate-300" />
                        <p className="text-sm font-medium">ยังไม่ได้รับการแจ้งเตือนใดๆ</p>
                      </div>
                    ) : (
                      <div className="divide-y divide-slate-100">
                        {notifications.slice(0, 5).map((notif) => (
                          <div 
                            key={notif.id} 
                            onClick={() => {
                              if(!notif.isRead) markAsRead(notif.id);
                            }}
                            className={`p-4 flex gap-3 hover:bg-slate-50 transition-colors cursor-pointer ${!notif.isRead ? 'bg-blue-50/30' : ''}`}
                          >
                            <div className={`mt-0.5 p-2 rounded-full h-fit flex-shrink-0 ${!notif.isRead ? 'bg-white shadow-sm' : 'bg-slate-100'}`}>
                              {getNotificationIcon(notif.type)}
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className={`text-sm mb-0.5 truncate ${!notif.isRead ? 'font-bold text-slate-800' : 'font-medium text-slate-700'}`}>
                                {notif.title}
                              </p>
                              <p className="text-xs text-slate-500 line-clamp-2 leading-relaxed">
                                {notif.message}
                              </p>
                            </div>
                            {!notif.isRead && (
                              <div className="w-2 h-2 bg-blue-500 rounded-full mt-1.5 flex-shrink-0"></div>
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                  
                  {notifications.length > 0 && (
                    <div className="p-3 border-t border-slate-100 bg-slate-50 text-center hover:bg-slate-100 transition-colors">
                      <Link 
                        to="/notifications" 
                        onClick={() => setShowNotifications(false)}
                        className="text-sm font-bold text-primary block w-full"
                      >
                        ดูการแจ้งเตือนทั้งหมด
                      </Link>
                    </div>
                  )}
                </div>
              )}
            </div>

            {isAuthenticated ? (
              <div className="relative" ref={profileRef}>
                <button 
                  onClick={() => setShowProfileMenu(!showProfileMenu)}
                  className="flex items-center justify-center p-2.5 text-slate-500 hover:text-primary bg-slate-100 hover:bg-slate-200 rounded-full transition-colors shadow-sm focus:outline-none focus:ring-2 focus:ring-primary/20" 
                  title="เมนูผู้ใช้"
                >
                  {user?.user_metadata?.avatar_url || user?.avatar ? (
                    <img src={user?.user_metadata?.avatar_url || user?.avatar} alt="Profile" className="h-4 w-4 sm:h-5 sm:w-5 rounded-full object-cover" />
                  ) : (
                    <User className="h-4 w-4 sm:h-5 sm:w-5" />
                  )}
                </button>

                {/* Profile Dropdown */}
                {showProfileMenu && (
                  <div className="absolute right-0 mt-3 w-64 bg-white rounded-2xl shadow-xl border border-slate-100 overflow-hidden z-50 animate-in fade-in slide-in-from-top-2">
                    <div className="p-4 border-b border-slate-100 bg-slate-50/50">
                      <p className="font-bold text-slate-800 truncate">
                        {user?.user_metadata?.full_name || user?.name || 'ผู้ใช้งาน'}
                      </p>
                      <p className="text-sm text-slate-500 truncate mt-0.5">
                        {user?.email || 'ไม่มีอีเมล'}
                      </p>
                    </div>
                    
                    <div className="p-2">
                      <Link 
                        to="/profile" 
                        onClick={() => setShowProfileMenu(false)}
                        className="flex items-center gap-3 w-full p-2 text-left text-sm font-medium text-slate-700 hover:bg-slate-50 hover:text-primary rounded-xl transition-colors"
                      >
                        <User className="h-4 w-4" />
                        โปรไฟล์ของฉัน
                      </Link>
                      <Link 
                        to="/settings" 
                        onClick={() => setShowProfileMenu(false)}
                        className="flex items-center gap-3 w-full p-2 text-left text-sm font-medium text-slate-700 hover:bg-slate-50 hover:text-primary rounded-xl transition-colors"
                      >
                        <Settings className="h-4 w-4" />
                        ตั้งค่าบัญชี
                      </Link>
                    </div>

                    <div className="p-2 border-t border-slate-100">
                      <button 
                        onClick={handleLogout}
                        className="flex items-center gap-3 w-full p-2 text-left text-sm font-medium text-red-600 hover:bg-red-50 rounded-xl transition-colors"
                      >
                        <LogOut className="h-4 w-4" />
                        ออกจากระบบ
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <Link to="/login" className="flex items-center gap-2 bg-primary text-white rounded-full font-bold hover:bg-blue-600 shadow-sm hover:shadow-md transition-all px-4 py-2 sm:px-5 sm:py-2.5 text-sm">
                <span className="hidden sm:inline">เข้าสู่ระบบ</span>
              </Link>
            )}
          </div>
        </div>
      </nav>
    </div>
  );
}
