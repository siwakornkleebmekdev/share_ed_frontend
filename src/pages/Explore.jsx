import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router';
import { LayoutGrid, List, SlidersHorizontal, Search, X } from 'lucide-react';
import PostCard from '@/components/PostCard';
import { postService } from '@/services/post.service';
import { Loader2 } from 'lucide-react';

export default function Explore() {
  const [posts, setPosts] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchParams] = useSearchParams();
  const initialSubject = searchParams.get('subject');
  const initialLevel = searchParams.get('level');

  const [viewMode, setViewMode] = useState('grid');
  const [mobileFilterOpen, setMobileFilterOpen] = useState(false);
  const [selectedLevels, setSelectedLevels] = useState(initialLevel ? [initialLevel] : []);
  const [selectedSubjects, setSelectedSubjects] = useState(initialSubject ? [initialSubject] : []);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    const subjectParam = searchParams.get('subject');
    if (subjectParam) {
      setSelectedSubjects(prev => {
        if (!prev.includes(subjectParam)) return [...prev, subjectParam];
        return prev;
      });
    }

    const levelParam = searchParams.get('level');
    if (levelParam) {
      setSelectedLevels(prev => {
        if (!prev.includes(levelParam)) return [...prev, levelParam];
        return prev;
      });
    }
  }, [searchParams]);

  useEffect(() => {
    const fetchPosts = async () => {
      try {
        setIsLoading(true);
        const fetchedPosts = await postService.getAllPosts();
        setPosts(fetchedPosts);
      } catch (error) {
        console.error('Error loading posts:', error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchPosts();
  }, []);

  const toggleLevel = (level) => {
    setSelectedLevels(prev => 
      prev.includes(level) ? prev.filter(l => l !== level) : [...prev, level]
    );
  };

  const toggleSubject = (subject) => {
    setSelectedSubjects(prev => 
      prev.includes(subject) ? prev.filter(s => s !== subject) : [...prev, subject]
    );
  };

  const filteredPosts = posts.filter(post => {
    const matchSearch = post.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
                        post.subject.toLowerCase().includes(searchQuery.toLowerCase());
    const matchLevel = selectedLevels.length === 0 || selectedLevels.includes(post.level);
    const matchSubject = selectedSubjects.length === 0 || selectedSubjects.includes(post.subject);
    
    return matchSearch && matchLevel && matchSubject;
  });

  const FilterContent = () => (
    <div className="space-y-6">
      <div>
        <h3 className="font-semibold text-slate-800 mb-3">ระดับการศึกษา</h3>
        <div className="space-y-2">
          {['มัธยมศึกษาตอนต้น', 'มัธยมศึกษาตอนปลาย', 'มหาวิทยาลัย'].map(level => (
            <label key={level} className="flex items-center gap-2 cursor-pointer group">
              <input 
                type="checkbox" 
                checked={selectedLevels.includes(level)}
                onChange={() => toggleLevel(level)}
                className="w-4 h-4 rounded border-slate-300 text-primary focus:ring-primary transition-colors" 
              />
              <span className="text-slate-600 text-sm group-hover:text-slate-900 transition-colors">{level}</span>
            </label>
          ))}
        </div>
      </div>
      <div>
        <h3 className="font-semibold text-slate-800 mb-3">หมวดหมู่วิชา</h3>
        <div className="space-y-2">
          {['คณิตศาสตร์', 'ฟิสิกส์', 'เคมี', 'ชีววิทยา', 'ภาษาอังกฤษ', 'สังคมศึกษา'].map(subject => (
            <label key={subject} className="flex items-center gap-2 cursor-pointer group">
              <input 
                type="checkbox" 
                checked={selectedSubjects.includes(subject)}
                onChange={() => toggleSubject(subject)}
                className="w-4 h-4 rounded border-slate-300 text-primary focus:ring-primary transition-colors" 
              />
              <span className="text-slate-600 text-sm group-hover:text-slate-900 transition-colors">{subject}</span>
            </label>
          ))}
        </div>
      </div>
    </div>
  );

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Search & Toolbar */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
        <div className="relative w-full max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
          <input 
            type="text" 
            placeholder="ค้นหาสรุปวิชาอะไรดี?" 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-colors bg-white shadow-sm"
          />
        </div>
        
        <div className="flex items-center gap-3 w-full sm:w-auto">
          <button 
            onClick={() => setMobileFilterOpen(true)}
            className="lg:hidden flex-1 sm:flex-none flex items-center justify-center gap-2 px-4 py-2.5 bg-white border border-slate-200 rounded-xl text-slate-700 font-medium shadow-sm hover:bg-slate-50 transition-colors"
          >
            <SlidersHorizontal className="h-5 w-5" />
            ตัวกรอง
          </button>
          
          <div className="flex p-1 bg-slate-100 rounded-xl">
            <button 
              onClick={() => setViewMode('grid')}
              className={`p-2 rounded-lg transition-colors ${viewMode === 'grid' ? 'bg-white shadow-sm text-primary' : 'text-slate-500 hover:text-slate-700'}`}
              title="Grid View"
            >
              <LayoutGrid className="h-5 w-5" />
            </button>
            <button 
              onClick={() => setViewMode('list')}
              className={`p-2 rounded-lg transition-colors ${viewMode === 'list' ? 'bg-white shadow-sm text-primary' : 'text-slate-500 hover:text-slate-700'}`}
              title="List View"
            >
              <List className="h-5 w-5" />
            </button>
          </div>
        </div>
      </div>

      <div className="flex gap-8">
        {/* Desktop Sidebar */}
        <div className="hidden lg:block w-64 flex-shrink-0">
          <div className="sticky top-24 bg-white p-6 rounded-2xl shadow-soft border border-slate-100">
            <div className="flex items-center gap-2 font-bold text-slate-800 text-lg mb-6 pb-4 border-b border-slate-100">
              <SlidersHorizontal className="h-5 w-5 text-primary" /> ตัวกรอง
            </div>
            <FilterContent />
          </div>
        </div>

        {/* Main Content */}
        <div className="flex-1">
          {isLoading ? (
            <div className="flex justify-center py-20">
              <Loader2 className="h-10 w-10 text-primary animate-spin" />
            </div>
          ) : (
            <div className={viewMode === 'grid' 
              ? "grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-6" 
              : "flex flex-col gap-4"
            }>
              {filteredPosts.length > 0 ? (
                filteredPosts.map(post => (
                  <PostCard key={post.id} post={post} viewMode={viewMode} />
                ))
              ) : (
                <div className="col-span-full py-12 text-center text-slate-500 bg-white rounded-xl border border-slate-100 shadow-sm flex flex-col items-center justify-center">
                  <Search className="h-10 w-10 text-slate-300 mb-3" />
                  <p className="font-medium">ไม่พบโพสต์ที่ตรงกับตัวกรอง</p>
                  <button onClick={() => { setSearchQuery(''); setSelectedLevels([]); setSelectedSubjects([]); }} className="mt-3 text-sm text-primary hover:underline">ล้างตัวกรองทั้งหมด</button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Mobile Filter Drawer / Bottom Sheet */}
      {mobileFilterOpen && (
        <div className="fixed inset-0 z-50 lg:hidden flex">
          <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm" onClick={() => setMobileFilterOpen(false)} />
          <div className="relative mt-auto sm:mt-0 sm:ml-auto w-full sm:w-80 h-[75vh] sm:h-full bg-white rounded-t-3xl sm:rounded-none sm:rounded-l-3xl shadow-2xl flex flex-col animate-in slide-in-from-bottom sm:slide-in-from-right duration-300">
            <div className="p-4 border-b border-slate-100 flex items-center justify-between">
              <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                <SlidersHorizontal className="h-5 w-5 text-primary" /> ตัวกรอง
              </h2>
              <button onClick={() => setMobileFilterOpen(false)} className="p-2 text-slate-400 hover:text-slate-600 rounded-full hover:bg-slate-100 transition-colors">
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="p-6 overflow-y-auto flex-1">
              <FilterContent />
            </div>
            <div className="p-4 border-t border-slate-100 bg-white">
              <button onClick={() => setMobileFilterOpen(false)} className="w-full py-3 bg-primary text-white font-bold rounded-xl hover:bg-blue-600 transition-colors shadow-sm">
                ดูผลลัพธ์
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
