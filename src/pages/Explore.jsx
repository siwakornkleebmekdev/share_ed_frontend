import { useState, useEffect, useMemo } from 'react';
import { useSearchParams } from 'react-router';
import { LayoutGrid, List, SlidersHorizontal, Search, X } from 'lucide-react';
import PostCard from '@/components/PostCard';
import { postService } from '@/services/post.service';
import { categoryService } from '@/services/category.service';
import { Loader2 } from 'lucide-react';

const normalizeSearchText = (value) =>
  String(value ?? '').normalize('NFKC').toLocaleLowerCase('th-TH').trim();

const getTagName = (tag) => {
  if (typeof tag === 'string') return tag;
  return tag?.tag?.tag_name || tag?.tag_name || tag?.name || '';
};

export default function Explore() {
  const [posts, setPosts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchParams] = useSearchParams();
  const initialSubject = searchParams.get('subject');
  const initialLevel = searchParams.get('level');
  const initialSearch = searchParams.get('search') || searchParams.get('q') || '';
  const initialTag = searchParams.get('tag');

  const [viewMode, setViewMode] = useState('grid');
  const [mobileFilterOpen, setMobileFilterOpen] = useState(false);
  const [selectedLevels, setSelectedLevels] = useState(initialLevel ? [initialLevel] : []);
  const [selectedSubjects, setSelectedSubjects] = useState(initialSubject ? [initialSubject] : []);
  const [selectedTags, setSelectedTags] = useState(initialTag ? [initialTag.replace(/^#+/, '')] : []);
  const [searchQuery, setSearchQuery] = useState(initialSearch);

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

    const searchParam = searchParams.get('search') || searchParams.get('q');
    if (searchParam) {
      setSearchQuery(searchParam);
    }

    const tagParam = searchParams.get('tag');
    if (tagParam) {
      const normalizedTag = tagParam.replace(/^#+/, '');
      setSelectedTags(prev => prev.includes(normalizedTag) ? prev : [...prev, normalizedTag]);
    }
  }, [searchParams]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setIsLoading(true);
        const [fetchedPosts, fetchedCats] = await Promise.all([
          postService.getAllPosts(),
          categoryService.getAllCategories()
        ]);
        setPosts(fetchedPosts || []);
        setCategories(fetchedCats || []);
      } catch (error) {
        console.error('Error loading explore data:', error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchData();
  }, []);

  const toggleLevel = (level) => {
    setSelectedLevels(prev => 
      prev.includes(level) ? prev.filter(l => l !== level) : [...prev, level]
    );
  };

  const toggleSubject = (subjectName) => {
    setSelectedSubjects(prev => 
      prev.includes(subjectName) ? prev.filter(s => s !== subjectName) : [...prev, subjectName]
    );
  };

  const toggleTag = (tagName) => {
    setSelectedTags(prev => {
      const isSelected = prev.some(tag => normalizeSearchText(tag) === normalizeSearchText(tagName));
      return isSelected
        ? prev.filter(tag => normalizeSearchText(tag) !== normalizeSearchText(tagName))
        : [...prev, tagName];
    });
  };

  const popularTags = useMemo(() => {
    const tagCounts = new Map();

    posts.forEach(post => {
      const tags = [...(Array.isArray(post.tags) ? post.tags : []), ...(Array.isArray(post.hashtags) ? post.hashtags : [])];
      const uniquePostTags = new Set(
        tags.map(getTagName).map(tag => tag.replace(/^#+/, '').trim()).filter(Boolean)
      );

      uniquePostTags.forEach(tag => {
        const key = normalizeSearchText(tag);
        const current = tagCounts.get(key);
        tagCounts.set(key, { name: current?.name || tag, count: (current?.count || 0) + 1 });
      });
    });

    return [...tagCounts.values()]
      .sort((tagA, tagB) => tagB.count - tagA.count || tagA.name.localeCompare(tagB.name, 'th'))
      .slice(0, 12)
  }, [posts]);

  const filteredPosts = posts.filter(post => {
    const q = normalizeSearchText(searchQuery);
    const tagQuery = q.replace(/^#+/, '') || q;
    const postTags = [...(Array.isArray(post.tags) ? post.tags : []), ...(Array.isArray(post.hashtags) ? post.hashtags : [])]
      .map(getTagName)
      .map(tag => normalizeSearchText(tag).replace(/^#+/, ''))
      .filter(Boolean);

    const matchSearch = !q ||
      normalizeSearchText(post.title).includes(q) ||
      normalizeSearchText(post.subject).includes(q) ||
      normalizeSearchText(post.description).includes(q) ||
      normalizeSearchText(post.author).includes(q) ||
      postTags.some(tag => tag.includes(tagQuery));

    const matchLevel = selectedLevels.length === 0 || selectedLevels.includes(post.level);
    const matchSubject = selectedSubjects.length === 0 || 
      selectedSubjects.includes(post.subject) ||
      (post.category?.name && selectedSubjects.includes(post.category.name)) ||
      postTags.some(tag => selectedSubjects.some(subject => normalizeSearchText(subject) === tag));
    const matchTag = selectedTags.length === 0 || selectedTags.some(selectedTag =>
      postTags.includes(normalizeSearchText(selectedTag).replace(/^#+/, ''))
    );
    
    return matchSearch && matchLevel && matchSubject && matchTag;
  });

  // Unique list of subject names from categories or posts
  const subjectList = categories.length > 0 
    ? categories.map(c => c.name) 
    : ['คณิตศาสตร์', 'ฟิสิกส์', 'เคมี', 'ชีววิทยา', 'วิทยาศาสตร์', 'ภาษาอังกฤษ', 'สังคมศึกษา', 'ภาษาไทย', 'คอมพิวเตอร์และเทคโนโลยี', 'ทั่วไป'];

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
                className="w-4 h-4 rounded border-slate-300 text-primary focus:ring-primary transition-colors cursor-pointer" 
              />
              <span className="text-slate-600 text-sm group-hover:text-slate-900 transition-colors">{level}</span>
            </label>
          ))}
        </div>
      </div>
      <div>
        <h3 className="font-semibold text-slate-800 mb-3">หมวดหมู่วิชา</h3>
        <div className="space-y-2 max-h-[360px] overflow-y-auto pr-1">
          {subjectList.map(subject => (
            <label key={subject} className="flex items-center gap-2 cursor-pointer group">
              <input 
                type="checkbox" 
                checked={selectedSubjects.includes(subject)}
                onChange={() => toggleSubject(subject)}
                className="w-4 h-4 rounded border-slate-300 text-primary focus:ring-primary transition-colors cursor-pointer" 
              />
              <span className="text-slate-600 text-sm group-hover:text-slate-900 transition-colors truncate">{subject}</span>
            </label>
          ))}
        </div>
      </div>
      {popularTags.length > 0 && (
        <div>
          <h3 className="font-semibold text-slate-800 mb-3">แท็กยอดนิยม</h3>
          <div className="flex max-h-48 flex-wrap content-start gap-2 overflow-y-auto overscroll-contain pr-2 [scrollbar-color:#cbd5e1_transparent] [scrollbar-width:thin]">
            {popularTags.map(tag => {
              const isSelected = selectedTags.some(selectedTag => normalizeSearchText(selectedTag) === normalizeSearchText(tag.name));
              return (
                <button
                  key={tag.name}
                  type="button"
                  onClick={() => toggleTag(tag.name)}
                  aria-pressed={isSelected}
                  className={`inline-flex max-w-full items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-semibold transition-colors ${isSelected
                    ? 'border-primary bg-primary text-white shadow-sm'
                    : 'border-slate-200 bg-slate-50 text-slate-600 hover:border-primary/40 hover:bg-blue-50 hover:text-primary'
                  }`}
                >
                  <span className="truncate">#{tag.name}</span>
                  <span className={`text-[10px] ${isSelected ? 'text-blue-100' : 'text-slate-400'}`}>{tag.count}</span>
                </button>
              );
            })}
          </div>
        </div>
      )}
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
            placeholder="ค้นหาชื่อ เนื้อหา ผู้เขียน หรือ #แท็ก"
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
                  <button onClick={() => { setSearchQuery(''); setSelectedLevels([]); setSelectedSubjects([]); setSelectedTags([]); }} className="mt-3 text-sm text-primary hover:underline">ล้างตัวกรองทั้งหมด</button>
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
