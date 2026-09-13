import { TrendingUp, ArrowRight, BookOpen } from 'lucide-react';
import { Link } from 'react-router';
import { useState, useEffect } from 'react';
import { categoryService } from '@/services/category.service';

export default function Categories() {
  const [categories, setCategories] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchCats = async () => {
      try {
        setIsLoading(true);
        const list = await categoryService.getAllCategories();
        setCategories(list);
      } catch (err) {
        console.error('Error loading categories:', err);
      } finally {
        setIsLoading(false);
      }
    };
    fetchCats();
  }, []);

  return (
    <section className="py-20 bg-gradient-to-b from-white to-slate-50 border-y border-slate-100 relative overflow-hidden">
      {/* Decorative background elements */}
      <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-primary/5 rounded-full blur-3xl -z-10 translate-x-1/3 -translate-y-1/2"></div>
      <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-indigo-500/5 rounded-full blur-3xl -z-10 -translate-x-1/2 translate-y-1/2"></div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between mb-12 gap-6">
          <div className="max-w-2xl">
            <h2 className="text-4xl font-black text-slate-900 flex items-center gap-3 tracking-tight">
              <TrendingUp className="h-10 w-10 text-primary p-2 bg-blue-50 rounded-xl" /> หมวดหมู่ยอดฮิต
            </h2>
            <p className="text-slate-500 mt-4 text-lg leading-relaxed">
              สำรวจเนื้อหาที่ได้รับความนิยมสูงสุดจากผู้ใช้งานทั้งหมดในระบบ เพื่อเตรียมความพร้อมและอัปเดตความรู้ใหม่ๆ
            </p>
          </div>
          <Link to="/explore" className="text-primary font-bold flex items-center gap-2 hover:gap-3 transition-all bg-white px-5 py-2.5 rounded-full shadow-sm border border-slate-200 hover:shadow-md hover:border-blue-200">
            ดูหมวดหมู่ทั้งหมด <ArrowRight className="h-4 w-4" />
          </Link>
        </div>

        {isLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
            {[1, 2, 3].map((n) => (
              <div key={n} className="bg-white rounded-[2rem] p-8 md:p-10 border border-slate-200 animate-pulse h-64">
                <div className="w-16 h-16 bg-slate-100 rounded-2xl mb-8"></div>
                <div className="h-6 bg-slate-100 rounded-lg w-3/4 mb-3"></div>
                <div className="h-4 bg-slate-100 rounded-lg w-1/2"></div>
              </div>
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
            {categories.slice(0, 3).map((cat, index) => (
              <Link
                key={cat.id}
                to={`/explore?category_id=${encodeURIComponent(cat.id)}&subject=${encodeURIComponent(cat.name)}`}
                className="bg-white rounded-[2rem] p-8 md:p-10 border border-slate-200 hover:border-primary/40 hover:shadow-2xl hover:shadow-primary/10 hover:-translate-y-2 transition-all duration-500 cursor-pointer group text-left relative overflow-hidden flex flex-col h-full"
              >
                {/* Decorative Top Banner */}
                <div className={`absolute top-0 inset-x-0 h-2.5 transition-all duration-500 group-hover:h-3 ${index === 0 ? 'bg-gradient-to-r from-blue-500 to-cyan-400' :
                  index === 1 ? 'bg-gradient-to-r from-indigo-500 to-purple-400' :
                    'bg-gradient-to-r from-green-400 to-emerald-500'
                  }`}></div>

                <div className="flex justify-between items-start mb-8">
                  <div className={`w-16 h-16 rounded-2xl shadow-sm flex items-center justify-center transition-transform duration-500 group-hover:scale-110 group-hover:-rotate-3 ${index === 0 ? 'bg-blue-50 text-blue-600' :
                    index === 1 ? 'bg-indigo-50 text-indigo-600' :
                      'bg-green-50 text-green-600'
                    }`}>
                    <BookOpen className="h-8 w-8" />
                  </div>
                </div>

                <div className="flex-1">
                  <h3 className="font-extrabold text-slate-900 text-3xl mb-3 group-hover:text-primary transition-colors tracking-tight">
                    {cat.name}
                  </h3>
                  <p className="text-slate-500 font-medium text-lg leading-relaxed line-clamp-2">
                    {cat.description}
                  </p>
                </div>


              </Link>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
