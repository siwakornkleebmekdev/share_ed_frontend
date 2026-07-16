import { useEffect, useState } from 'react';
import { Link } from 'react-router';
import { Star, FileText, Heart, Eye, User, Palette, Award, Settings, Loader2 } from 'lucide-react';
import useAuthStore from '@/store/authStore';
import { profileService } from '@/services/profile.service';

const QUICK_LINKS = [
  { to: '/settings/profile', label: 'โปรไฟล์', description: 'ข้อมูลพื้นฐาน รูปภาพ และลิงก์โซเชียล', icon: User },
  { to: '/settings/appearance', label: 'รูปลักษณ์', description: 'ธีมสีและเค้าโครงการ์ดโปรไฟล์', icon: Palette },
  { to: '/achievements', label: 'Achievements', description: 'ทำภารกิจปลดล็อกกรอบรูปและภาพพื้นหลังพิเศษ', icon: Award },
  { to: '/settings/account', label: 'ตั้งค่าบัญชี', description: 'อีเมล รหัสผ่าน และการแจ้งเตือน', icon: Settings },
];

export default function SettingsOverview() {
  const { user } = useAuthStore();
  const [stats, setStats] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    profileService.getStats()
      .then(setStats)
      .finally(() => setIsLoading(false));
  }, []);

  const statCards = [
    { label: 'แต้มสะสม', value: stats?.points, icon: Star, color: 'text-amber-500 bg-amber-50' },
    { label: 'โพสต์ทั้งหมด', value: stats?.postsCount, icon: FileText, color: 'text-blue-500 bg-blue-50' },
    { label: 'ยอดถูกใจที่ได้รับ', value: stats?.likesReceived, icon: Heart, color: 'text-rose-500 bg-rose-50' },
    { label: 'ยอดเข้าชมที่ได้รับ', value: stats?.viewsReceived, icon: Eye, color: 'text-emerald-500 bg-emerald-50' },
  ];

  return (
    <div className="max-w-5xl space-y-8">
      <div>
        <h1 className="text-2xl font-extrabold text-slate-800">ภาพรวม</h1>
        <p className="text-slate-500 mt-1">
          สวัสดี {user?.display_name || user?.username || user?.name || 'ผู้ใช้งาน'} นี่คือสรุปข้อมูลบัญชีของคุณ
        </p>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-16">
          <Loader2 className="h-8 w-8 text-primary animate-spin" />
        </div>
      ) : (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {statCards.map(card => {
            const Icon = card.icon;
            return (
              <div key={card.label} className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5">
                <div className={`h-10 w-10 rounded-xl flex items-center justify-center mb-3 ${card.color}`}>
                  <Icon className="h-5 w-5" />
                </div>
                <p className="text-2xl font-extrabold text-slate-800">{card.value ?? 0}</p>
                <p className="text-xs font-medium text-slate-500 mt-1">{card.label}</p>
              </div>
            );
          })}
        </div>
      )}

      <div>
        <h2 className="text-sm font-bold uppercase tracking-wide text-slate-400 mb-3">จัดการบัญชีของคุณ</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {QUICK_LINKS.map(link => {
            const Icon = link.icon;
            return (
              <Link
                key={link.to}
                to={link.to}
                className="flex items-start gap-4 bg-white rounded-2xl border border-slate-100 shadow-sm p-5 hover:border-primary/30 hover:shadow-md transition-all"
              >
                <div className="h-11 w-11 rounded-xl bg-slate-50 flex items-center justify-center text-slate-500 shrink-0">
                  <Icon className="h-5 w-5" />
                </div>
                <div>
                  <p className="font-bold text-slate-800">{link.label}</p>
                  <p className="text-sm text-slate-500 mt-0.5">{link.description}</p>
                </div>
              </Link>
            );
          })}
        </div>
      </div>
    </div>
  );
}
