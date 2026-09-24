import { Link } from "react-router";
import {
  BookOpen,
  Sparkles,
  Target,
  Compass,
  Award,
  ShieldCheck,
  Users,
  Heart,
  ArrowRight,
  GraduationCap,
  Share2,
  CheckCircle2,
  Lightbulb,
  Layers,
  HelpCircle,
} from "lucide-react";
import useHeroThemeStore from "@/store/heroThemeStore";
import { useEffect } from "react";

export default function AboutUs() {
  const clearHeroImage = useHeroThemeStore((state) => state.clearHeroImage);

  useEffect(() => {
    // Reset any custom hero image when entering About Us to keep standard clean background
    clearHeroImage();
  }, [clearHeroImage]);

  const stats = [
    { label: "สรุปบทเรียนคุณภาพ", value: "3,500+", icon: BookOpen, color: "text-blue-500", bg: "bg-blue-50" },
    { label: "นักเรียนและผู้เรียนรู้", value: "10,000+", icon: Users, color: "text-emerald-500", bg: "bg-emerald-50" },
    { label: "โรงเรียนและมหาวิทยาลัย", value: "250+", icon: GraduationCap, color: "text-amber-500", bg: "bg-amber-50" },
    { label: "ยอดการส่งต่อความรู้", value: "50,000+", icon: Heart, color: "text-rose-500", bg: "bg-rose-50" },
  ];

  const features = [
    {
      title: "คลังสรุปบทเรียนครอบคลุม",
      description: "รวมสรุปเนื้อหาเข้มข้น ครอบคลุมตั้งแต่มัธยมต้น มัธยมปลาย จนถึงระดับอุดมศึกษา จากเพื่อนๆ ทั่วประเทศ",
      icon: Layers,
      color: "from-blue-500 to-cyan-500",
    },
    {
      title: "ระบบภารกิจและรางวัลความสำเร็จ",
      description: "สนุกกับการเรียนรู้ สะสมแต้มและปลดล็อกกรอบโปรไฟล์สุดพิเศษที่สะท้อนความมุ่งมั่นของคุณ",
      icon: Award,
      color: "from-amber-500 to-orange-500",
    },
    {
      title: "พื้นที่ปลอดภัย ไร้การกลั่นแกล้ง",
      description: "มีระบบกลั่นกรองรายงานและทีมผู้ดูแลที่พร้อมตรวจตรา เพื่อสร้างพื้นที่การศึกษาที่เป็นมิตรและสร้างสรรค์",
      icon: ShieldCheck,
      color: "from-emerald-500 to-teal-500",
    },
    {
      title: "โปรไฟล์และวิดเจ็ตในแบบของคุณ",
      description: "สร้างตัวตนทางการศึกษา ตกแต่งโปรไฟล์ เชื่อมต่อโซเชียล และแชร์สรุปของคุณได้อย่างง่ายดาย",
      icon: Sparkles,
      color: "from-purple-500 to-pink-500",
    },
  ];

  const faqs = [
    {
      q: "SHARE-ED ใช้งานฟรีจริงหรือไม่?",
      a: "ฟรี 100% สำหรับทุกคน! เราเชื่อว่าการศึกษาคุณภาพควรเป็นสิทธิที่ทุกคนเข้าถึงได้โดยไม่มีค่าใช้จ่าย",
    },
    {
      q: "ใครสามารถเขียนหรือแชร์สรุปบทเรียนได้บ้าง?",
      a: "นักเรียน นักศึกษา ครูอาจารย์ หรือบุคคลทั่วไปที่สนใจ สามารถสมัครสมาชิกและกดสร้างโพสต์สรุปได้ทันที",
    },
    {
      q: "กรอบรูปโปรไฟล์และเหรียญรางวัลได้มาอย่างไร?",
      a: "ได้จากการทำกิจกรรมบนระบบ เช่น การแบ่งปันสรุป การได้รับยอดถูกใจ หรือการมีส่วนร่วมในชุมชนการเรียนรู้",
    },
    {
      q: "หากพบเนื้อหาที่ไม่เหมาะสม ควรทำอย่างไร?",
      a: "สามารถกดปุ่ม 'รายงานโพสต์' ที่มุมขวาของโพสต์นั้นๆ ได้ทันที ระบบจะส่งต่อให้ทีมผู้ดูแลตรวจสอบอย่างรวดเร็ว",
    },
  ];

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800">
      {/* Hero Section */}
      <section className="relative overflow-hidden pt-12 pb-20 sm:pt-20 sm:pb-28">
        {/* Background glow effects */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-7xl h-96 bg-gradient-to-br from-blue-400/20 via-purple-300/15 to-transparent blur-3xl pointer-events-none" />
        <div className="absolute -top-24 right-10 w-80 h-80 bg-cyan-400/15 rounded-full blur-2xl pointer-events-none" />

        <div className="relative max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-blue-50 border border-blue-200/80 text-blue-700 text-xs sm:text-sm font-bold shadow-sm mb-6 animate-in fade-in slide-in-from-bottom-2">
            <Sparkles className="h-4 w-4 text-primary" />
            <span>แพลตฟอร์มแบ่งปันความรู้เพื่อการศึกษาไทย</span>
          </div>

          {/* Heading */}
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold text-slate-900 tracking-tight leading-tight">
            เรียนรู้ร่วมกัน เติบโตไปด้วยกัน <br />
            กับ <span className="bg-gradient-to-r from-primary via-blue-600 to-indigo-600 bg-clip-text text-transparent">SHARE-ED</span>
          </h1>

          {/* Subtitle */}
          <p className="mt-6 text-lg sm:text-xl text-slate-600 max-w-3xl mx-auto leading-relaxed">
            พื้นที่ที่นักเรียนและนักศึกษาไทยมารวมตัวกัน เพื่อส่งต่อสรุปบทเรียน แลกเปลี่ยนประสบการณ์ 
            และสร้างสังคมการเรียนรู้ที่เท่าเทียมและเข้าถึงได้สำหรับทุกคน
          </p>

          {/* Action Buttons */}
          <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link
              to="/explore"
              className="w-full sm:w-auto px-8 py-3.5 rounded-full bg-primary hover:bg-blue-600 text-white font-bold shadow-md hover:shadow-xl transition-all duration-200 flex items-center justify-center gap-2 text-base group"
            >
              <span>สำรวจสรุปบทเรียน</span>
              <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
            </Link>
            <Link
              to="/home"
              className="w-full sm:w-auto px-8 py-3.5 rounded-full bg-white hover:bg-slate-100 text-slate-700 font-bold border border-slate-200 shadow-sm hover:shadow transition-all duration-200 text-base"
            >
              เข้าสู่หน้าฟีดหลัก
            </Link>
          </div>
        </div>
      </section>

      {/* Stats Counter Section */}
      <section className="relative -mt-6 z-10 max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 sm:gap-6 bg-white rounded-3xl p-6 sm:p-8 shadow-xl border border-slate-100 backdrop-blur-xl">
          {stats.map((item, idx) => {
            const Icon = item.icon;
            return (
              <div key={idx} className="flex flex-col items-center text-center p-3 sm:p-4">
                <div className={`p-3 rounded-2xl ${item.bg} ${item.color} mb-3 shadow-sm`}>
                  <Icon className="h-6 w-6" />
                </div>
                <span className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
                  {item.value}
                </span>
                <span className="text-xs sm:text-sm font-medium text-slate-500 mt-1">
                  {item.label}
                </span>
              </div>
            );
          })}
        </div>
      </section>

      {/* Mission & Vision Section */}
      <section className="py-20 max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-14">
          <h2 className="text-3xl font-extrabold text-slate-900">
            เจตนารมณ์และเป้าหมายของเรา
          </h2>
          <p className="mt-3 text-slate-500 text-base max-w-xl mx-auto">
            ขับเคลื่อนด้วยความเชื่อมั่นว่าความรู้จะมีคุณค่าสูงสุดเมื่อได้รับการส่งต่อ
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-8">
          {/* Mission Card */}
          <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-blue-500/5 to-cyan-500/10 p-8 sm:p-10 border border-blue-100 shadow-sm hover:shadow-md transition-shadow">
            <div className="inline-flex p-3.5 rounded-2xl bg-primary text-white shadow-md mb-6">
              <Target className="h-7 w-7" />
            </div>
            <h3 className="text-2xl font-extrabold text-slate-900 mb-4">
              พันธกิจของเรา (Our Mission)
            </h3>
            <p className="text-slate-600 leading-relaxed text-base">
              เรามุ่งมั่นที่จะลดความเหลื่อมล้ำทางการศึกษา ด้วยการสร้างคลังความรู้ที่เปิดกว้างและเข้าถึงได้ฟรี 
              ให้นักเรียนไม่ว่าจะอยู่ที่ใดในประเทศไทย สามารถเข้าถึงสรุปบทเรียนและเทคนิคการเรียนรู้ที่มีคุณภาพได้อย่างเท่าเทียมกัน
            </p>
            <ul className="mt-6 space-y-3">
              {[
                "ส่งเสริมวัฒนธรรมการแบ่งปันความรู้ระหว่างผู้เรียน",
                "ยกระดับผลสัมฤทธิ์ทางการศึกษาด้วยสรุปที่เข้าใจง่าย",
                "สร้างชุมชนที่เกื้อกูลและเป็นแรงบันดาลใจให้กันและกัน",
              ].map((point, i) => (
                <li key={i} className="flex items-center gap-3 text-sm font-semibold text-slate-700">
                  <CheckCircle2 className="h-4 w-4 text-emerald-500 shrink-0" />
                  <span>{point}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Vision Card */}
          <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-purple-500/5 to-pink-500/10 p-8 sm:p-10 border border-purple-100 shadow-sm hover:shadow-md transition-shadow">
            <div className="inline-flex p-3.5 rounded-2xl bg-indigo-600 text-white shadow-md mb-6">
              <Compass className="h-7 w-7" />
            </div>
            <h3 className="text-2xl font-extrabold text-slate-900 mb-4">
              วิสัยทัศน์ของเรา (Our Vision)
            </h3>
            <p className="text-slate-600 leading-relaxed text-base">
              เป็นแพลตฟอร์มศูนย์กลางแห่งการเรียนรู้ร่วมกันของนักเรียนไทย (Collaborative Learning Hub) 
              ที่ไม่ได้เป็นเพียงแค่แหล่งอ่านสรุป แต่เป็นพื้นที่เสริมสร้างศักยภาพ ค้นพบแรงบันดาลใจ 
              และเชื่อมโยงเครือข่ายเพื่อนร่วมทางในการศึกษา
            </p>
            <ul className="mt-6 space-y-3">
              {[
                "สังคมแห่งการเรียนรู้ตลอดชีวิตที่ทุกคนเป็นทั้งผู้เรียนและผู้ให้",
                "นวัตกรรมการศึกษาที่เชื่อมโยงเทคโนโลยีเข้ากับการเรียนรู้จริง",
                "พื้นที่ปลอดภัยที่สนับสนุนความหลากหลายและความคิดสร้างสรรค์",
              ].map((point, i) => (
                <li key={i} className="flex items-center gap-3 text-sm font-semibold text-slate-700">
                  <CheckCircle2 className="h-4 w-4 text-purple-500 shrink-0" />
                  <span>{point}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      {/* Core Features */}
      <section className="py-16 bg-white border-y border-slate-100">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-14">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-slate-100 text-slate-600 text-xs font-bold mb-3">
              <Lightbulb className="h-3.5 w-3.5 text-amber-500" />
              <span>ทำไมต้อง SHARE-ED</span>
            </div>
            <h2 className="text-3xl font-extrabold text-slate-900">
              ฟีเจอร์เด่นที่ออกแบบเพื่อคุณ
            </h2>
            <p className="mt-3 text-slate-500 text-base max-w-xl mx-auto">
              ทุกเครื่องมือถูกพัฒนาขึ้นโดยคำนึงถึงความสะดวกของผู้เรียนและผู้เขียนสรุปเป็นสำคัญ
            </p>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {features.map((feat, idx) => {
              const Icon = feat.icon;
              return (
                <div
                  key={idx}
                  className="group rounded-3xl p-6 bg-slate-50 hover:bg-white border border-slate-200/80 hover:border-slate-300 shadow-sm hover:shadow-lg transition-all duration-300 flex flex-col justify-between"
                >
                  <div>
                    <div className={`h-12 w-12 rounded-2xl bg-gradient-to-br ${feat.color} text-white flex items-center justify-center shadow-md mb-5 group-hover:scale-110 transition-transform`}>
                      <Icon className="h-6 w-6" />
                    </div>
                    <h4 className="text-lg font-bold text-slate-900 mb-2">
                      {feat.title}
                    </h4>
                    <p className="text-sm text-slate-600 leading-relaxed">
                      {feat.description}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="py-20 max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-50 text-primary text-xs font-bold mb-3">
            <HelpCircle className="h-3.5 w-3.5" />
            <span>คำถามที่พบบ่อย</span>
          </div>
          <h2 className="text-3xl font-extrabold text-slate-900">
            มีคำถามเพิ่มเติมเกี่ยวกับ SHARE-ED?
          </h2>
        </div>

        <div className="space-y-4">
          {faqs.map((faq, i) => (
            <div
              key={i}
              className="p-6 rounded-2xl bg-white border border-slate-200/80 shadow-sm hover:border-slate-300 transition-colors"
            >
              <h4 className="text-base sm:text-lg font-bold text-slate-900 flex items-start gap-3">
                <span className="text-primary font-extrabold">Q.</span>
                <span>{faq.q}</span>
              </h4>
              <p className="mt-2.5 text-sm sm:text-base text-slate-600 pl-7 leading-relaxed">
                {faq.a}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* Call to Action Banner */}
      <section className="pb-24 max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 p-8 sm:p-14 text-white shadow-2xl text-center">
          <div className="absolute top-0 right-0 -mr-16 -mt-16 w-64 h-64 bg-white/10 rounded-full blur-2xl pointer-events-none" />
          <div className="absolute bottom-0 left-0 -ml-16 -mb-16 w-64 h-64 bg-cyan-400/20 rounded-full blur-2xl pointer-events-none" />

          <div className="relative z-10 max-w-2xl mx-auto">
            <Share2 className="h-12 w-12 mx-auto mb-4 text-cyan-300" />
            <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight">
              พร้อมที่จะเริ่มแบ่งปันและเรียนรู้หรือยัง?
            </h2>
            <p className="mt-4 text-base sm:text-lg text-blue-100 leading-relaxed">
              ร่วมเป็นส่วนหนึ่งของครอบครัว SHARE-ED วันนี้ สรุปของคุณเพียงหนึ่งบทความ อาจเปลี่ยนอนาคตการเรียนของเพื่อนอีกหลายคน
            </p>
            <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link
                to="/create"
                className="w-full sm:w-auto px-8 py-3.5 rounded-full bg-white hover:bg-slate-100 text-blue-700 font-extrabold shadow-lg hover:shadow-xl transition-all duration-200"
              >
                เริ่มเขียนสรุปบทเรียน
              </Link>
              <Link
                to="/explore"
                className="w-full sm:w-auto px-8 py-3.5 rounded-full bg-white/15 hover:bg-white/25 text-white font-bold border border-white/20 transition-all duration-200"
              >
                ค้นหาเนื้อหาที่น่าสนใจ
              </Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
