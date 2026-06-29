import { useState } from 'react';
import { UploadCloud, File, X, GraduationCap, Tag, AlignLeft, BookOpen, PenTool, Save, Image as ImageIcon, Plus, Eye } from 'lucide-react';
import toast from 'react-hot-toast';
import Swal from 'sweetalert2';
import ReactQuill from 'react-quill-new';
import 'react-quill-new/dist/quill.snow.css';

const SUGGESTED_TAGS = ['#AI', '#เรียนรู้ไปด้วยกัน', '#เตรียมสอบ', '#TCAS67', '#สรุปย่อ', '#แชร์ความรู้', '#เด็กซิ่ว', '#สรุปชีท'];

export default function CreatePost() {
  const [coverImage, setCoverImage] = useState(null);
  const [pdfFile, setPdfFile] = useState(null);
  const [images, setImages] = useState([]);

  const [title, setTitle] = useState('');
  const [details, setDetails] = useState('');

  const [category, setCategory] = useState('');
  const [level, setLevel] = useState('');

  const [hashtags, setHashtags] = useState([]);
  const [hashtagInput, setHashtagInput] = useState('');

  const [showModal, setShowModal] = useState(false);
  const [previewFile, setPreviewFile] = useState(null); // { type: 'image' | 'pdf', url: string }

  // File Handlers
  const handleCoverUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    if (file.size > 2 * 1024 * 1024) {
      Swal.fire({
        icon: 'error',
        title: 'ขนาดไฟล์เกิน',
        text: 'รูปปกต้องมีขนาดไม่เกิน 2 MB',
        confirmButtonColor: '#3b82f6'
      });
      return;
    }
    setCoverImage(file);
  };

  const handlePdfUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    if (file.size > 20 * 1024 * 1024) {
      Swal.fire({
        icon: 'error',
        title: 'ขนาดไฟล์เกิน',
        text: 'ไฟล์ PDF ต้องมีขนาดไม่เกิน 20 MB',
        confirmButtonColor: '#3b82f6'
      });
      return;
    }
    setPdfFile(file);
  };

  const handleImagesUpload = (e) => {
    const files = Array.from(e.target.files);
    if (!files.length) return;

    let newImages = [...images];
    let hasOversized = false;

    for (const file of files) {
      if (newImages.length >= 15) {
        Swal.fire({
          icon: 'warning',
          title: 'ข้อจำกัดจำนวนรูป',
          text: 'คุณสามารถอัปโหลดรูปภาพประกอบได้สูงสุด 15 รูปเท่านั้น',
          confirmButtonColor: '#3b82f6'
        });
        break;
      }
      if (file.size > 5 * 1024 * 1024) {
        hasOversized = true;
        continue;
      }
      newImages.push(file);
    }

    if (hasOversized) {
      Swal.fire({
        icon: 'warning',
        title: 'ขนาดไฟล์เกิน',
        text: 'รูปภาพบางรูปมีขนาดเกิน 5 MB และถูกข้ามไป',
        confirmButtonColor: '#3b82f6'
      });
    }

    setImages(newImages);
  };

  const removeImage = (index) => {
    setImages(images.filter((_, i) => i !== index));
  };

  const openPreview = (file, type) => {
    setPreviewFile({ type, url: URL.createObjectURL(file) });
  };

  const closePreview = () => {
    setPreviewFile(null);
  };

  // Hashtag Handlers
  const handleAddHashtag = (e) => {
    e.preventDefault();
    if (hashtagInput.trim() !== '') {
      let tag = hashtagInput.trim();
      if (!tag.startsWith('#')) tag = '#' + tag;
      if (!hashtags.includes(tag)) {
        setHashtags([...hashtags, tag]);
      }
      setHashtagInput('');
    }
  };

  const handleKeyDownHashtag = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleAddHashtag(e);
    }
  };

  const handleRemoveHashtag = (tagToRemove) => {
    setHashtags(hashtags.filter(tag => tag !== tagToRemove));
  };

  const addSuggestedTag = (tag) => {
    if (!hashtags.includes(tag)) {
      setHashtags([...hashtags, tag]);
    }
  };

  const handlePublish = () => {
    if (!title || !category || !level || !pdfFile) {
      toast.error('กรุณากรอกข้อมูลที่จำเป็นให้ครบถ้วน (รวมถึงไฟล์ PDF)');
      return;
    }
    toast.success('โพสต์สรุปความรู้เรียบร้อยแล้ว!');
  };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-14">
      <div className="mb-10 text-center sm:text-left">
        <h1 className="text-3xl sm:text-4xl font-extrabold text-slate-900 flex items-center justify-center sm:justify-start gap-4">
          <PenTool className="h-8 w-8 sm:h-10 sm:w-10 text-primary" />
          แบ่งปันความรู้ของคุณ
        </h1>
        <p className="text-slate-500 mt-3 text-lg">อัปโหลดชีทสรุป แนวข้อสอบ หรือเนื้อหาที่เป็นประโยชน์ให้เพื่อนๆ</p>
      </div>

      <div className="bg-white rounded-[24px] shadow-sm border border-slate-100">
        <div className="p-8 sm:p-12 flex flex-col gap-8">

          {/* Title & Cover */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-start">
            <div className="md:col-span-1">
              <label className="flex items-center justify-between text-base font-bold text-slate-800 mb-3">
                <span>รูปปก <span className="text-rose-500">*</span></span>
                <span className="text-xs font-normal text-slate-500">ไม่เกิน 2 MB</span>
              </label>
              {!coverImage ? (
                <label className="flex flex-col items-center justify-center w-full aspect-video border-2 border-dashed border-slate-300 rounded-2xl hover:border-primary hover:bg-slate-50 cursor-pointer transition-all">
                  <ImageIcon className="h-10 w-10 text-slate-400 mb-3" />
                  <span className="text-sm font-medium text-slate-500">คลิกเพื่ออัปโหลดรูปปก</span>
                  <input type="file" className="hidden" accept="image/*" onChange={handleCoverUpload} />
                </label>
              ) : (
                <div className="relative w-full aspect-video rounded-2xl overflow-visible border border-slate-200 group">
                  <img src={URL.createObjectURL(coverImage)} alt="Cover" className="w-full h-full object-cover rounded-2xl cursor-pointer" onClick={() => openPreview(coverImage, 'image')} />
                  <button onClick={(e) => { e.stopPropagation(); setCoverImage(null); }} className="absolute -top-3 -right-3 p-1.5 bg-white text-slate-500 hover:text-rose-500 hover:bg-rose-50 rounded-full transition-all z-10 shadow-sm border border-slate-200 hover:border-rose-200" title="ลบรูปปก">
                    <X className="h-5 w-5" />
                  </button>
                  {/* Hover Overlay */}
                  <div className="absolute inset-0 bg-black/40 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none rounded-2xl">
                    <Eye className="h-8 w-8" />
                  </div>
                </div>
              )}
            </div>

            <div className="md:col-span-1">
              <label className="flex items-center gap-2 text-base font-bold text-slate-800 mb-3">
                ชื่อหัวข้อสรุป <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full px-5 py-4 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-colors text-base"
                placeholder="เช่น สรุปสูตรฟิสิกส์ ม.4 เทอม 1"
              />

              <div className="mt-6">
                <button
                  onClick={() => setShowModal(true)}
                  className="w-full px-5 py-4 rounded-xl border border-dashed border-primary bg-blue-50 text-primary font-bold hover:bg-blue-100 transition-colors flex items-center justify-center gap-2"
                >
                  <BookOpen className="h-5 w-5" />
                  {category && level ? `วิชา: ${category} | ระดับ: ${level}` : 'เลือกหมวดหมู่และระดับชั้น *'}
                </button>
              </div>
            </div>
          </div>

          {/* Hashtags */}
          <div>
            <label className="flex items-center gap-2 text-base font-bold text-slate-800 mb-3">
              <Tag className="h-5 w-5 text-slate-400" /> แฮชแท็ก
            </label>
            <div className="flex flex-wrap gap-2 mb-3">
              {hashtags.map(tag => (
                <span key={tag} className="px-3 py-1.5 bg-blue-50 text-primary rounded-full text-sm font-semibold flex items-center gap-1.5 border border-blue-100 animate-in zoom-in-95 duration-200">
                  {tag}
                  <button onClick={() => handleRemoveHashtag(tag)} className="hover:text-rose-500 transition-colors">
                    <X className="h-3 w-3" />
                  </button>
                </span>
              ))}
            </div>
            <div className="flex gap-2">
              <input
                type="text"
                value={hashtagInput}
                onChange={(e) => setHashtagInput(e.target.value)}
                onKeyDown={handleKeyDownHashtag}
                className="flex-1 px-5 py-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-colors text-base"
                placeholder="พิมพ์แฮชแท็กแล้วกด Enter..."
              />
              <button
                onClick={handleAddHashtag}
                className="px-6 py-3 bg-slate-900 text-white rounded-xl font-bold hover:bg-slate-800 transition-colors flex-shrink-0"
              >
                เพิ่มแท็ก
              </button>
            </div>

            {/* Suggested Tags Area */}
            <div className="mt-4 pt-4 border-t border-slate-100">
              <label className="flex items-center gap-2 text-sm font-bold text-slate-500 mb-3">
                แท็กยอดนิยม (คลิกเพื่อเพิ่ม)
              </label>
              <div className="flex flex-wrap gap-2">
                {SUGGESTED_TAGS.map(tag => (
                  <button
                    key={tag}
                    onClick={() => addSuggestedTag(tag)}
                    className={`px-3 py-1.5 rounded-full text-xs font-bold border transition-all ${hashtags.includes(tag) ? 'bg-primary text-white border-primary shadow-sm' : 'bg-white text-slate-500 border-slate-200 hover:border-primary hover:text-primary'}`}
                  >
                    {tag}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Rich Text Editor */}
          <div>
            <label className="flex items-center gap-2 text-base font-bold text-slate-800 mb-3">
              <AlignLeft className="h-5 w-5 text-slate-400" /> รายละเอียดเพิ่มเติม
            </label>
            <div className="border border-slate-200 rounded-xl overflow-hidden bg-white">
              <ReactQuill
                theme="snow"
                value={details}
                onChange={setDetails}
                className="h-48 pb-10"
                placeholder="อธิบายเพิ่มเติมเกี่ยวกับเนื้อหา เทคนิคการจำ หรือที่มา..."
              />
            </div>
          </div>

          {/* File Uploads (Split left/right) */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 pt-8 border-t border-slate-100">
            {/* Left: PDF */}
            <div>
              <label className="flex items-center justify-between text-base font-bold text-slate-800 mb-3">
                <span>ไฟล์เอกสาร PDF <span className="text-rose-500">*</span></span>
                <span className="text-xs font-normal text-slate-500">ไม่เกิน 20 MB</span>
              </label>
              {!pdfFile ? (
                <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed border-slate-300 rounded-2xl hover:border-primary hover:bg-slate-50 cursor-pointer transition-all">
                  <UploadCloud className="h-8 w-8 text-slate-400 mb-2" />
                  <span className="text-sm font-medium text-slate-500">อัปโหลดไฟล์ PDF</span>
                  <input type="file" className="hidden" accept=".pdf" onChange={handlePdfUpload} />
                </label>
              ) : (
                <div className="flex items-center justify-between p-4 bg-blue-50 border border-blue-100 rounded-2xl group cursor-pointer hover:bg-blue-100/50 transition-colors" onClick={() => openPreview(pdfFile, 'pdf')}>
                  <div className="flex items-center gap-4 truncate">
                    <File className="h-8 w-8 text-primary flex-shrink-0" />
                    <div className="truncate">
                      <p className="font-bold text-slate-800 text-sm truncate group-hover:text-primary transition-colors">{pdfFile.name}</p>
                      <p className="text-xs text-slate-500">{(pdfFile.size / (1024 * 1024)).toFixed(2)} MB</p>
                    </div>
                  </div>
                  <button onClick={(e) => { e.stopPropagation(); setPdfFile(null); }} className="p-2 bg-white text-slate-500 hover:text-rose-500 hover:bg-rose-50 rounded-full transition-all flex-shrink-0 z-10 shadow-sm border border-slate-200 hover:border-rose-200" title="ลบไฟล์ PDF">
                    <X className="h-5 w-5" />
                  </button>
                </div>
              )}
            </div>

            {/* Right: Images */}
            <div>
              <label className="flex items-center justify-between text-base font-bold text-slate-800 mb-3">
                <span>รูปภาพประกอบ ({images.length}/15)</span>
                <span className="text-xs font-normal text-slate-500">ไม่เกินรูปละ 5 MB</span>
              </label>

              <div className="flex flex-wrap gap-4 pt-1">
                {images.map((img, idx) => (
                  <div key={idx} className="relative w-20 h-20 rounded-xl border border-slate-200 overflow-visible group">
                    <img
                      src={URL.createObjectURL(img)}
                      alt={`img-${idx}`}
                      className="w-full h-full object-cover rounded-xl cursor-pointer"
                      onClick={() => openPreview(img, 'image')}
                    />
                    <button 
                      onClick={(e) => { e.stopPropagation(); removeImage(idx); }} 
                      className="absolute -top-2 -left-2 p-1 bg-white text-slate-500 hover:text-rose-500 hover:bg-rose-50 rounded-full transition-all z-10 shadow-sm border border-slate-200 hover:border-rose-200"
                      title="ลบรูปภาพ"
                    >
                      <X className="h-3.5 w-3.5" />
                    </button>
                    {/* View Overlay */}
                    <div className="absolute inset-0 bg-black/40 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none rounded-xl">
                      <Eye className="h-6 w-6" />
                    </div>
                  </div>
                ))}

                {/* Upload Button */}
                <div className="relative group/btn inline-block">
                  <label className={`w-20 h-20 border-2 border-dashed rounded-xl flex flex-col items-center justify-center transition-all ${images.length >= 15 ? 'border-slate-200 bg-slate-100 cursor-not-allowed opacity-60' : 'border-slate-300 hover:border-primary hover:bg-slate-50 cursor-pointer'}`}>
                    <Plus className="h-6 w-6 text-slate-400" />
                    <input
                      type="file"
                      className="hidden"
                      accept="image/*"
                      multiple
                      onChange={handleImagesUpload}
                      disabled={images.length >= 15}
                    />
                  </label>
                  {/* Tooltip on Hover if Disabled */}
                  {images.length >= 15 && (
                    <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-max max-w-xs px-3 py-1.5 bg-slate-800 text-white text-xs rounded-lg opacity-0 group-hover/btn:opacity-100 transition-opacity pointer-events-none z-20 whitespace-normal text-center shadow-lg">
                      ไม่สามารถเพิ่มรูปได้เนื่องจากครบจำนวนแล้ว
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

        </div>

        {/* Actions */}
        <div className="sticky bottom-0 z-40 bg-slate-50 p-6 sm:px-12 sm:py-8 border-t border-slate-100 flex flex-col sm:flex-row justify-between items-center gap-4 rounded-b-[24px] shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)]">
          <button className="w-full sm:w-auto px-6 py-4 rounded-xl font-bold text-slate-600 bg-white border border-slate-200 hover:bg-slate-50 transition-colors shadow-sm">
            ยกเลิก
          </button>
          <div className="flex flex-col sm:flex-row gap-4 w-full sm:w-auto">
            <button onClick={() => toast.success('บันทึกแบบร่างเรียบร้อยแล้ว')} className="w-full sm:w-auto px-6 py-4 rounded-xl font-bold text-primary bg-blue-50 border border-blue-100 hover:bg-blue-100 transition-colors flex items-center justify-center gap-2">
              <Save className="h-5 w-5" />
              บันทึกแบบร่าง
            </button>
            <button onClick={handlePublish} className="w-full sm:w-auto px-8 py-4 rounded-xl font-bold text-white bg-primary hover:bg-blue-600 transition-colors shadow-md hover:shadow-lg hover:-translate-y-0.5">
              โพสต์สรุปความรู้
            </button>
          </div>
        </div>
      </div>

      {/* MODAL: Category & Level */}
      {showModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl shadow-xl w-full max-w-lg overflow-hidden flex flex-col">
            <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50">
              <h2 className="text-xl font-extrabold text-slate-900">รายละเอียดหมวดหมู่</h2>
              <button onClick={() => setShowModal(false)} className="p-2 text-slate-400 hover:bg-slate-200 hover:text-slate-800 rounded-full transition-colors">
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="p-6 flex flex-col gap-6">
              <div>
                <label className="flex items-center gap-2 text-base font-bold text-slate-800 mb-3">
                  <GraduationCap className="h-5 w-5 text-primary" /> ระดับชั้น
                </label>
                <select
                  value={level}
                  onChange={(e) => setLevel(e.target.value)}
                  className="w-full px-5 py-3.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-colors bg-white font-medium text-slate-700"
                >
                  <option value="" disabled>เลือกระดับชั้น</option>
                  <option value="มัธยมศึกษาตอนต้น">มัธยมศึกษาตอนต้น</option>
                  <option value="มัธยมศึกษาตอนปลาย">มัธยมศึกษาตอนปลาย</option>
                  <option value="มหาวิทยาลัย">มหาวิทยาลัย</option>
                </select>
              </div>

              <div>
                <label className="flex items-center gap-2 text-base font-bold text-slate-800 mb-3">
                  <BookOpen className="h-5 w-5 text-primary" /> หมวดหมู่วิชา
                </label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="w-full px-5 py-3.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-colors bg-white font-medium text-slate-700"
                >
                  <option value="" disabled>เลือกวิชา</option>
                  <option value="คณิตศาสตร์">คณิตศาสตร์</option>
                  <option value="วิทยาศาสตร์">วิทยาศาสตร์</option>
                  <option value="ฟิสิกส์">ฟิสิกส์</option>
                  <option value="เคมี">เคมี</option>
                  <option value="ชีววิทยา">ชีววิทยา</option>
                  <option value="ภาษาอังกฤษ">ภาษาอังกฤษ</option>
                  <option value="สังคมศึกษา">สังคมศึกษา</option>
                  <option value="ภาษาไทย">ภาษาไทย</option>
                </select>
              </div>
            </div>

            <div className="p-6 border-t border-slate-100 bg-slate-50 flex justify-end">
              <button
                onClick={() => setShowModal(false)}
                className="px-6 py-3 bg-primary text-white rounded-xl font-bold hover:bg-blue-600 transition-all shadow-md hover:shadow-lg"
              >
                บันทึกและปิด
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: File Preview */}
      {previewFile && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 sm:p-8 bg-slate-900/80 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl overflow-hidden shadow-2xl w-full h-full max-w-6xl max-h-[90vh] flex flex-col">
            <div className="p-4 border-b border-slate-100 flex justify-between items-center bg-slate-50 flex-shrink-0">
              <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                {previewFile.type === 'pdf' ? <File className="h-5 w-5 text-primary" /> : <ImageIcon className="h-5 w-5 text-primary" />}
                ดูตัวอย่างไฟล์
              </h2>
              <button onClick={closePreview} className="p-2 text-slate-400 hover:bg-slate-200 hover:text-slate-800 rounded-full transition-colors">
                <X className="h-6 w-6" />
              </button>
            </div>

            <div className="flex-1 bg-slate-100 overflow-auto flex items-center justify-center relative p-4">
              {previewFile.type === 'image' ? (
                <img src={previewFile.url} alt="Preview" className="max-w-full max-h-full object-contain rounded-lg shadow-sm" />
              ) : (
                <iframe src={previewFile.url} className="w-full h-full rounded-lg shadow-sm bg-white border-0" title="PDF Preview" />
              )}
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
