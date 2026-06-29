import { BookOpen, MessageCircle, Info, Shield, Users } from 'lucide-react';

export default function Footer() {
  return (
    <footer className="bg-white border-t border-slate-200 mt-auto">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3 md:py-4">
        <div className="flex flex-col md:flex-row justify-between items-center gap-10 md:gap-4">

          {/* Logo & Copyright */}
          <div className="flex flex-col items-center md:items-start text-center md:text-left">
            <div className="flex items-center gap-2 mb-2">
              <BookOpen className="h-8 w-8 text-primary" />
              <span className="font-bold text-2xl text-slate-800 tracking-tight">SHARE-ED</span>
            </div>
            <p className="text-sm text-slate-500 font-medium">พื้นที่สำหรับแบ่งปันความรู้ดีๆ <br /> เพื่อการศึกษาไทย</p>
          </div>

          {/* Links Grid */}
          <div className="flex flex-row justify-center md:justify-end gap-6 md:gap-12 w-full md:w-auto text-sm">

            {/* Column 2 */}
            <div className="flex items-center gap-3">
              <div className="p-1.5 bg-indigo-50 text-indigo-600 rounded-lg">
                <MessageCircle className="h-4 w-4" />
              </div>
              <div className="flex flex-col">
                <a href="#" className="font-bold text-slate-700 hover:text-primary transition-colors leading-tight">ติดต่อแอดมิน</a>
                <span className="text-slate-500 text-xs">share_ed@gmail.com</span>
              </div>
            </div>

            {/* Column 3 */}
            <div className="flex items-center gap-3">
              <div className="p-1.5 bg-yellow-50 text-yellow-600 rounded-lg">
                <Info className="h-4 w-4" />
              </div>
              <div className="flex flex-col">
                <a href="#" className="font-bold text-slate-700 hover:text-primary transition-colors leading-tight">เกี่ยวกับเรา</a>
              </div>
            </div>

          </div>
        </div>
      </div>
    </footer>
  );
}
