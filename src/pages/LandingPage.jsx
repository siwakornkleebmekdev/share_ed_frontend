import { ArrowRight, BookMarked, Trophy, Users } from 'lucide-react';
import { Link } from 'react-router';

export default function LandingPage() {
  return (
    <main className="overflow-hidden relative">
      {/* Decorative Background Elements */}
      <div className="absolute top-0 left-0 w-full h-[500px] bg-gradient-to-b from-blue-50/50 to-transparent -z-10" />
      <div className="absolute top-20 left-10 w-32 h-32 bg-primary/5 rounded-full blur-3xl animate-pulse" />
      <div className="absolute top-40 right-20 w-48 h-48 bg-purple-500/5 rounded-full blur-3xl animate-pulse delay-700" />

      {/* Hero Section */}
      <section className="pt-24 pb-32 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto text-center relative z-10">
        <div className="inline-block mb-6 px-5 py-2 rounded-full bg-blue-50 border border-blue-100 text-primary font-bold text-sm shadow-sm animate-in fade-in slide-in-from-bottom-4 duration-700">
          ✨ แพลตฟอร์มการเรียนรู้แห่งใหม่สำหรับคุณ
        </div>
        <h1 className="text-5xl md:text-7xl font-extrabold text-slate-900 tracking-tight mb-6 animate-in fade-in slide-in-from-bottom-8 duration-700 delay-150">
          แบ่งปันความรู้ สู่ความสำเร็จ<br />
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary via-blue-500 to-cyan-400 block mt-6">
            เรียนฟรีไม่มีขีดจำกัด
          </span>
        </h1>
        <p className="mt-6 text-xl text-slate-500 max-w-3xl mx-auto mb-10 leading-relaxed animate-in fade-in slide-in-from-bottom-8 duration-700 delay-300">
          แหล่งรวบรวมสรุปเนื้อหาตั้งแต่ระดับ ม.ต้น ม.ปลาย จนถึงมหาวิทยาลัย
          พร้อมระบบสะสมความสำเร็จเพื่อปลดล็อกของรางวัลสุดพิเศษ
        </p>
        <div className="flex flex-col sm:flex-row justify-center gap-4 animate-in fade-in slide-in-from-bottom-8 duration-700 delay-500">
          <Link to="/explore" className="px-8 py-4 bg-primary text-white rounded-full font-bold text-lg hover:bg-blue-600 hover:shadow-xl hover:shadow-primary/30 hover:-translate-y-1 transition-all flex items-center justify-center gap-2 group">
            เริ่มต้นเรียนรู้ฟรี <ArrowRight className="h-5 w-5 group-hover:translate-x-1 transition-transform" />
          </Link>
          <Link to="/trending" className="px-8 py-4 bg-white text-slate-700 border border-slate-200 rounded-full font-bold text-lg hover:bg-slate-50 hover:border-slate-300 hover:shadow-md hover:-translate-y-1 transition-all flex items-center justify-center">
            ดูโพสต์ยอดนิยม
          </Link>
        </div>
      </section>

      {/* Features Section */}
      <section className="bg-white py-24 border-t border-slate-100 shadow-soft relative z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-12">

            {/* Feature 1 */}
            <div className="flex flex-col items-center text-center group animate-in fade-in slide-in-from-bottom-12 duration-700">
              <div className="h-20 w-20 bg-blue-50 text-primary rounded-[24px] flex items-center justify-center mb-6 group-hover:scale-110 group-hover:bg-primary group-hover:text-white transition-all duration-300 shadow-sm group-hover:shadow-xl group-hover:shadow-primary/20 rotate-3 group-hover:rotate-0">
                <BookMarked className="h-10 w-10" />
              </div>
              <h3 className="text-xl font-bold text-slate-900 mb-3 group-hover:text-primary transition-colors">สรุปเนื้อหาคุณภาพ</h3>
              <p className="text-slate-500 leading-relaxed">ค้นหาเอกสารสรุปบทเรียนและแนวข้อสอบจากเพื่อนๆ และรุ่นพี่ที่คัดสรรมาอย่างดี</p>
            </div>

            {/* Feature 2 */}
            <div className="flex flex-col items-center text-center group animate-in fade-in slide-in-from-bottom-12 duration-700 delay-200">
              <div className="h-20 w-20 bg-indigo-50 text-indigo-500 rounded-[24px] flex items-center justify-center mb-6 group-hover:scale-110 group-hover:bg-indigo-500 group-hover:text-white transition-all duration-300 shadow-sm group-hover:shadow-xl group-hover:shadow-indigo-500/20 -rotate-3 group-hover:rotate-0">
                <Users className="h-10 w-10" />
              </div>
              <h3 className="text-xl font-bold text-slate-900 mb-3 group-hover:text-indigo-500 transition-colors">คอมมูนิตี้แบ่งปัน</h3>
              <p className="text-slate-500 leading-relaxed">ติดตามผู้เขียนที่ชื่นชอบ พูดคุยแลกเปลี่ยนความรู้ และช่วยเหลือเพื่อนๆ อย่างอบอุ่น</p>
            </div>

            {/* Feature 3 */}
            <div className="flex flex-col items-center text-center group animate-in fade-in slide-in-from-bottom-12 duration-700 delay-300">
              <div className="h-20 w-20 bg-orange-50 text-orange-500 rounded-[24px] flex items-center justify-center mb-6 group-hover:scale-110 group-hover:bg-orange-500 group-hover:text-white transition-all duration-300 shadow-sm group-hover:shadow-xl group-hover:shadow-orange-500/20 rotate-3 group-hover:rotate-0">
                <Trophy className="h-10 w-10" />
              </div>
              <h3 className="text-xl font-bold text-slate-900 mb-3 group-hover:text-orange-500 transition-colors">ระบบรางวัลความสำเร็จ</h3>
              <p className="text-slate-500 leading-relaxed">สะสมยอดไลก์และผู้ติดตาม เพื่อปลดล็อกกรอบโปรไฟล์และของตกแต่งพิเศษ</p>
            </div>

          </div>
        </div>
      </section>
    </main>
  );
}
