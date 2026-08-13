import { BookOpen, MessageCircle, Info, Shield, Users } from 'lucide-react';
import useHeroThemeStore from "@/store/heroThemeStore";
import { getGlassColor, rgbToRgba } from "@/utils/colorUtils";

export default function Footer() {
  const isDarkHero = useHeroThemeStore((state) => state.isDarkHero);
  const heroColor = useHeroThemeStore((state) => state.heroColor);
  const glassColor = getGlassColor(heroColor, isDarkHero);
  
  const borderClass = isDarkHero ? "border-white/10" : "border-slate-200";
  const titleClass = isDarkHero ? "text-white" : "text-slate-800";
  const textClass = isDarkHero ? "text-slate-300" : "text-slate-500";
  const linkClass = isDarkHero ? "text-slate-200 hover:text-white" : "text-slate-700 hover:text-primary";
  const iconBox1Class = isDarkHero ? "bg-white/10 text-indigo-300" : "bg-indigo-50 text-indigo-600";
  const iconBox2Class = isDarkHero ? "bg-white/10 text-yellow-300" : "bg-yellow-50 text-yellow-600";
  
  return (
    <footer 
      className={`border-t mt-auto backdrop-blur-xl transition-colors duration-500 ${borderClass} ${!isDarkHero ? 'bg-white' : ''}`}
      style={isDarkHero ? { backgroundColor: rgbToRgba(glassColor, 95) } : {}}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3 md:py-4">
        <div className="flex flex-col md:flex-row justify-between items-center gap-10 md:gap-4">

          {/* Logo & Copyright */}
          <div className="flex flex-col items-center md:items-start text-center md:text-left">
            <div className="flex items-center gap-2 mb-2">
              <BookOpen className={`h-8 w-8 ${isDarkHero ? 'text-white' : 'text-primary'}`} />
              <span className={`font-bold text-2xl tracking-tight ${titleClass}`}>SHARE-ED</span>
            </div>
            <p className={`text-sm font-medium ${textClass}`}>พื้นที่สำหรับแบ่งปันความรู้ดีๆ <br /> เพื่อการศึกษาไทย</p>
          </div>

          {/* Links Grid */}
          <div className="flex flex-row justify-center md:justify-end gap-6 md:gap-12 w-full md:w-auto text-sm">

            {/* Column 2 */}
            <div className="flex items-center gap-3">
              <div className={`p-1.5 rounded-lg ${iconBox1Class}`}>
                <MessageCircle className="h-4 w-4" />
              </div>
              <div className="flex flex-col">
                <a href="#" className={`font-bold transition-colors leading-tight ${linkClass}`}>ติดต่อแอดมิน</a>
                <span className={`text-xs ${textClass}`}>share_ed@gmail.com</span>
              </div>
            </div>

            {/* Column 3 */}
            <div className="flex items-center gap-3">
              <div className={`p-1.5 rounded-lg ${iconBox2Class}`}>
                <Info className="h-4 w-4" />
              </div>
              <div className="flex flex-col">
                <a href="#" className={`font-bold transition-colors leading-tight ${linkClass}`}>เกี่ยวกับเรา</a>
              </div>
            </div>

          </div>
        </div>
      </div>
    </footer>
  );
}
