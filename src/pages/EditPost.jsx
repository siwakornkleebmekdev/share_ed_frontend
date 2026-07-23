import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router';
import { UploadCloud, File, X, GraduationCap, Tag, AlignLeft, BookOpen, PenTool, Save, Image as ImageIcon, Plus, Eye, FileText, ChevronLeft, Trash2 } from 'lucide-react';
import toast from 'react-hot-toast';
import Swal from 'sweetalert2';
import ReactQuill from 'react-quill-new';
import 'react-quill-new/dist/quill.snow.css';
import { postService } from '@/services/post.service';
import api from '../utils/api';

const SUGGESTED_TAGS = ['#AI', '#เรียนรู้ไปด้วยกัน', '#เตรียมสอบ', '#TCAS67', '#สรุปย่อ', '#แชร์ความรู้', '#เด็กซิ่ว', '#สรุปชีท'];

export default function EditPost() {
  const { id } = useParams();
  const navigate = useNavigate();

  // Loading states
  const [isPageLoading, setIsPageLoading] = useState(true);

  // Existing assets from DB
  const [existingCoverImage, setExistingCoverImage] = useState(null);
  const [existingPdf, setExistingPdf] = useState(null);
  const [existingImages, setExistingImages] = useState([]);
  const [removeMediaIds, setRemoveMediaIds] = useState([]);

  // New uploaded files
  const [coverImage, setCoverImage] = useState(null);
  const [pdfFile, setPdfFile] = useState(null);
  const [images, setImages] = useState([]);

  // Fields
  const [title, setTitle] = useState('');
  const [summary, setSummary] = useState('');
  const [content, setContent] = useState('');
  const [category, setCategory] = useState('');
  const [level, setLevel] = useState('');
  const [hashtags, setHashtags] = useState([]);
  const [hashtagInput, setCountryInput] = useState('');
  const tagInputRef = useRef(null);
  const [fieldErrors, setFieldErrors] = useState({});

  const [showModal, setShowModal] = useState(false);
  const [previewFile, setPreviewFile] = useState(null);

  // Fetch post details on mount
  useEffect(() => {
    const fetchPostDetails = async () => {
      try {
        setIsPageLoading(true);
        const response = await postService.getPostById(id);
        if (response) {
          setTitle(response.title || '');
          setSummary(response.description || '');
          setContent(response.details || '');
          setCategory(response.category || '');
          let uiLevel = 'มหาวิทยาลัย';
          if (response.level === 'มัธยมศึกษาตอนต้น' || response.level === 'MIDDLE_SCHOOL') {
            uiLevel = 'มัธยมศึกษาตอนต้น';
          } else if (response.level === 'มัธยมศึกษาตอนปลาย' || response.level === 'HIGH_SCHOOL') {
            uiLevel = 'มัธยมศึกษาตอนปลาย';
          }
          setLevel(uiLevel);

          setHashtags(response.hashtags || []);
          setExistingCoverImage(response.coverImage || null);
        }
      } catch (error) {
        console.error('Error fetching post for editing:', error);
        toast.error('ไม่สามารถโหลดข้อมูลโพสต์ได้');
        navigate('/explore');
      } finally {
        setIsPageLoading(false);
      }
    };
    if (id) {
      fetchPostDetails();
    }
  }, [id, navigate]);

  // Load raw media mapping
  useEffect(() => {
    const fetchRawPost = async () => {
      try {
        const resObj = await api.get(`/posts/${id}`);
        const data = resObj.data;
        if (data && data.success) {
          const post = data.data;
          // Extract existing PDF
          const pdfMedia = post.media?.find(m => m.media_type === 'PDF');
          if (pdfMedia) {
            setExistingPdf({
              id: pdfMedia.id,
              name: 'เอกสารประกอบการเรียน.pdf',
              url: pdfMedia.media_url,
              size: 'PDF'
            });
          }

          // Extract existing Images
          const imgMedias = post.media?.filter(m => m.media_type === 'IMAGE') || [];
          setExistingImages(imgMedias.map(m => ({
            id: m.id,
            url: m.media_url
          })));
        }
      } catch (err) {
        console.error("Failed to load raw post media:", err);
      }
    };
    if (id) {
      fetchRawPost();
    }
  }, [id]);

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
    setExistingCoverImage(null);
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
    setExistingPdf(null);
  };

  const handleImagesUpload = (e) => {
    const files = Array.from(e.target.files);
    if (!files.length) return;

    let newImages = [...images];
    let hasOversized = false;
    const totalCount = existingImages.length + images.length;

    for (const file of files) {
      if (totalCount + newImages.length >= 15) {
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
  const handleAddHashtag = (customValue = null) => {
    const valueToAdd = customValue !== null ? customValue : hashtagInput;
    if (!valueToAdd || valueToAdd.trim() === '') return;

    const rawTags = valueToAdd.split(/[\s,;]+/);
    const newTags = [...hashtags];

    rawTags.forEach(rawTag => {
      let tag = rawTag.trim();
      if (!tag) return;
      if (!tag.startsWith('#')) {
        tag = '#' + tag;
      }
      if (!newTags.includes(tag)) {
        newTags.push(tag);
      }
    });

    setHashtags(newTags);
    setCountryInput('');
  };

  const handleKeyDownHashtag = (e) => {
    if (e.key === 'Enter' || e.key === ',' || e.key === 'Tab') {
      e.preventDefault();
      handleAddHashtag();
    } else if (e.key === 'Backspace' && hashtagInput === '' && hashtags.length > 0) {
      handleRemoveHashtag(hashtags[hashtags.length - 1]);
    }
  };

  const handleRemoveHashtag = (tagToRemove) => {
    setHashtags(hashtags.filter(tag => tag !== tagToRemove));
  };

  const toggleSuggestedTag = (tag) => {
    if (hashtags.includes(tag)) {
      setHashtags(hashtags.filter(t => t !== tag));
    } else {
      setHashtags([...hashtags, tag]);
    }
  };

  const handleDelete = async () => {
    const result = await Swal.fire({
      title: 'คุณต้องการลบโพสต์นี้ใช่หรือไม่?',
      text: 'การดำเนินการนี้จะทำการลบโพสต์แบบ Soft Delete (ซ่อนโพสต์ชั่วคราว)',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#ef4444',
      cancelButtonColor: '#64748b',
      confirmButtonText: 'ใช่, ลบเลย',
      cancelButtonText: 'ยกเลิก'
    });

    if (result.isConfirmed) {
      try {
        Swal.fire({
          title: 'กำลังลบโพสต์...',
          allowOutsideClick: false,
          didOpen: () => {
            Swal.showLoading();
          }
        });

        const response = await postService.deletePost(id);
        Swal.close();

        if (response && (response.success || response.status === 200)) {
          await Swal.fire({
            icon: 'success',
            title: 'ลบสำเร็จ!',
            text: 'โพสต์ของคุณถูกลบเรียบร้อยแล้ว',
            confirmButtonColor: '#3b82f6'
          });
          navigate('/explore');
        } else {
          throw new Error(response?.message || 'เกิดข้อผิดพลาดในการลบโพสต์');
        }
      } catch (error) {
        Swal.close();
        console.error('Error deleting post:', error);
        Swal.fire({
          icon: 'error',
          title: 'เกิดข้อผิดพลาด',
          text: error.response?.data?.message || error.message || 'ไม่สามารถเชื่อมต่อกับเซิร์ฟเวอร์ได้',
          confirmButtonColor: '#3b82f6'
        });
      }
    }
  };

  const handleSubmit = async (status = 'ACTIVE') => {
    setFieldErrors({});
    const newErrors = {};
    if (!title.trim()) newErrors.title = 'กรุณากรอกชื่อหัวข้อสรุปความรู้';
    if (!level) newErrors.level = 'กรุณาเลือกระดับชั้น';
    if (!summary.trim()) newErrors.summary = 'กรุณากรอกบทสรุปย่อ';
    if (!category) newErrors.category = 'กรุณาเลือกหมวดหมู่วิชา';

    if (Object.keys(newErrors).length > 0) {
      setFieldErrors(newErrors);
      return;
    }

    try {
      Swal.fire({
        title: 'กำลังบันทึกข้อมูลโพสต์...',
        allowOutsideClick: false,
        didOpen: () => {
          Swal.showLoading();
        }
      });

      const formData = new FormData();
      formData.append('title', title.trim());
      formData.append('summary', summary.trim());
      formData.append('content', content);
      formData.append('category', category);
      let backendLevel = 'UNIVERSITY';
      if (level === 'มัธยมศึกษาตอนต้น') backendLevel = 'MIDDLE_SCHOOL';
      else if (level === 'มัธยมศึกษาตอนปลาย') backendLevel = 'HIGH_SCHOOL';
      formData.append('education_level', backendLevel);
      formData.append('post_status', status);

      if (coverImage) {
        formData.append('cover_image', coverImage);
      }

      if (pdfFile) {
        formData.append('media_files', pdfFile);
      }

      if (images && images.length > 0) {
        images.forEach(img => {
          formData.append('media_files', img);
        });
      }

      formData.append('tags', JSON.stringify(hashtags));

      // Append media IDs to remove
      if (removeMediaIds.length > 0) {
        formData.append('remove_media_ids', JSON.stringify(removeMediaIds));
      }

      const result = await postService.updatePost(id, formData);
      Swal.close();

      if (result.success) {
        Swal.fire({
          icon: 'success',
          title: 'บันทึกการแก้ไขสำเร็จ!',
          text: 'แก้ไขโพสต์สรุปความรู้เรียบร้อยแล้ว',
          confirmButtonColor: '#3b82f6'
        }).then(() => {
          navigate(`/post/${id}`);
        });
      } else {
        throw new Error(result.message || 'เกิดข้อผิดพลาดในการบันทึกข้อมูล');
      }
    } catch (error) {
      Swal.close();
      console.error('Error updating post:', error);
      Swal.fire({
        icon: 'error',
        title: 'เกิดข้อผิดพลาด',
        text: error.response?.data?.message || error.message || 'ไม่สามารถเชื่อมต่อกับเซิร์ฟเวอร์ได้',
        confirmButtonColor: '#3b82f6'
      });
    }
  };

  if (isPageLoading) {
    return <div className="text-center py-20 text-slate-500 font-medium">กำลังโหลดข้อมูลโพสต์...</div>;
  }

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-14">

      <button onClick={() => navigate(`/post/${id}`)} className="inline-flex items-center gap-2 text-slate-500 hover:text-primary transition-colors mb-6 font-bold cursor-pointer">
        <ChevronLeft className="h-5 w-5" /> ยกเลิกการแก้ไข
      </button>

      <div className="mb-10 text-center sm:text-left">
        <h1 className="text-3xl sm:text-4xl font-extrabold text-slate-900 flex items-center justify-center sm:justify-start gap-4">
          <PenTool className="h-8 w-8 sm:h-10 sm:w-10 text-primary" />
          แก้ไขสรุปความรู้ของคุณ
        </h1>
        <p className="text-slate-500 mt-3 text-lg">ปรับปรุงเนื้อหา รายละเอียด หรือรูปภาพประกอบให้ถูกต้องสมบูรณ์ยิ่งขึ้น</p>
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
              {!coverImage && !existingCoverImage ? (
                <label className="flex flex-col items-center justify-center w-full aspect-video border-2 border-dashed border-slate-300 rounded-2xl hover:border-primary hover:bg-slate-50 cursor-pointer transition-all">
                  <ImageIcon className="h-10 w-10 text-slate-400 mb-3" />
                  <span className="text-sm font-medium text-slate-500">คลิกเพื่ออัปโหลดรูปปกใหม่</span>
                  <input type="file" className="hidden" accept="image/*" onChange={handleCoverUpload} />
                </label>
              ) : (
                <div className="relative w-full aspect-video rounded-2xl overflow-visible border border-slate-200 group">
                  <img
                    src={coverImage ? URL.createObjectURL(coverImage) : existingCoverImage}
                    alt="Cover"
                    className="w-full h-full object-cover rounded-2xl cursor-pointer"
                    onClick={() => {
                      if (coverImage) openPreview(coverImage, 'image');
                      else setPreviewFile({ type: 'image', url: existingCoverImage });
                    }}
                  />
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setCoverImage(null);
                      setExistingCoverImage(null);
                    }}
                    className="absolute -top-3 -right-3 p-1.5 bg-white text-slate-500 hover:text-rose-500 hover:bg-rose-50 rounded-full transition-all z-10 shadow-sm border border-slate-200 hover:border-rose-200"
                    title="ลบรูปปก"
                  >
                    <X className="h-5 w-5" />
                  </button>
                  <div className="absolute inset-0 bg-black/40 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none rounded-2xl">
                    <Eye className="h-8 w-8" />
                  </div>
                </div>
              )}
            </div>

            <div className="md:col-span-1 flex flex-col gap-6">
              <div>
                <label className="block text-base font-bold text-slate-800 mb-3">
                  หัวข้อกระทู้สรุปความรู้ <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => {
                    setTitle(e.target.value);
                    if (fieldErrors.title) setFieldErrors(prev => ({ ...prev, title: null }));
                  }}
                  placeholder="เช่น สรุปสูตรตรีโกณมิติ ม.5"
                  className={`w-full px-5 py-3.5 rounded-xl border focus:outline-none transition-all placeholder:text-slate-400 font-semibold text-slate-800 text-base ${
                    fieldErrors.title
                      ? 'border-red-500 focus:ring-2 focus:ring-red-500/20 focus:border-red-500'
                      : 'border-slate-200 focus:ring-2 focus:ring-primary/20 focus:border-primary'
                  }`}
                />
                {fieldErrors.title && (
                  <p className="mt-1.5 text-xs text-red-500 font-medium">{fieldErrors.title}</p>
                )}
              </div>

              <div>
                <label className="block text-base font-bold text-slate-800 mb-3">
                  บทสรุปย่อ <span className="text-rose-500">*</span>
                </label>
                <textarea
                  value={summary}
                  onChange={(e) => {
                    setSummary(e.target.value);
                    if (fieldErrors.summary) setFieldErrors(prev => ({ ...prev, summary: null }));
                  }}
                  rows="3"
                  placeholder="เขียนอธิบายคร่าวๆ เกี่ยวกับสรุปความรู้นี้..."
                  className={`w-full px-5 py-3.5 rounded-xl border focus:outline-none transition-all placeholder:text-slate-400 font-medium text-slate-600 text-base resize-none ${
                    fieldErrors.summary
                      ? 'border-red-500 focus:ring-2 focus:ring-red-500/20 focus:border-red-500'
                      : 'border-slate-200 focus:ring-2 focus:ring-primary/20 focus:border-primary'
                  }`}
                />
                {fieldErrors.summary && (
                  <p className="mt-1.5 text-xs text-red-500 font-medium">{fieldErrors.summary}</p>
                )}
              </div>
            </div>
          </div>

          <hr className="border-slate-100" />

          {/* Level & Settings trigger */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div>
              <label className="flex items-center gap-2 text-base font-bold text-slate-800 mb-3">
                <GraduationCap className="h-5 w-5 text-slate-400" /> ระดับชั้น <span className="text-rose-500">*</span>
              </label>
              <select
                value={level}
                onChange={(e) => {
                  setLevel(e.target.value);
                  if (fieldErrors.level) setFieldErrors(prev => ({ ...prev, level: null }));
                }}
                className={`w-full px-5 py-3.5 rounded-xl border focus:outline-none transition-all bg-white font-semibold text-slate-700 text-base ${
                  fieldErrors.level
                    ? 'border-red-500 focus:ring-2 focus:ring-red-500/20 focus:border-red-500'
                    : 'border-slate-200 focus:ring-2 focus:ring-primary/20 focus:border-primary'
                }`}
              >
                <option value="" disabled>เลือกระดับชั้น</option>
                <option value="มัธยมศึกษาตอนต้น">มัธยมศึกษาตอนต้น</option>
                <option value="มัธยมศึกษาตอนปลาย">มัธยมศึกษาตอนปลาย</option>
                <option value="มหาวิทยาลัย">มหาวิทยาลัย</option>
              </select>
              {fieldErrors.level && (
                <p className="mt-1.5 text-xs text-red-500 font-medium">{fieldErrors.level}</p>
              )}
            </div>

            <div className="flex flex-col justify-end">
              <button
                onClick={() => setShowModal(true)}
                className="w-full px-5 py-4 border border-slate-200 rounded-xl font-bold text-slate-700 hover:bg-slate-50 transition-all flex items-center justify-center gap-2.5 shadow-sm bg-white"
              >
                <Tag className="h-5 w-5 text-primary" />
                {category ? `วิชา: ${category}` : 'ตั้งค่าวิชาและแท็ก'}
                {hashtags.length > 0 && ` (+${hashtags.length} แท็ก)`}
              </button>
            </div>
          </div>

          <hr className="border-slate-100" />

          {/* Content (Rich Text) */}
          <div>
            <label className="flex items-center gap-2 text-base font-bold text-slate-800 mb-3">
              <AlignLeft className="h-5 w-5 text-primary" /> เนื้อหาเพิ่มเติม <span className="text-rose-500">*</span>
            </label>
            <div className="rounded-2xl border border-slate-200 overflow-hidden focus-within:ring-2 focus-within:ring-primary/20 focus-within:border-primary transition-all">
              <ReactQuill
                theme="snow"
                value={content}
                onChange={setContent}
                modules={{
                  toolbar: [
                    [{ 'header': [1, 2, 3, false] }],
                    ['bold', 'italic', 'underline', 'strike'],
                    [{ 'list': 'ordered' }, { 'list': 'bullet' }],
                    ['link', 'clean']
                  ]
                }}
                className="bg-white min-h-[300px] border-0"
              />
            </div>
          </div>

          <hr className="border-slate-100" />

          {/* Files (PDF & Images) */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* Left: PDF */}
            <div>
              <label className="flex items-center justify-between text-base font-bold text-slate-800 mb-3">
                <span>ไฟล์เอกสารประกอบ (PDF)</span>
                <span className="text-xs font-normal text-slate-500">ไม่เกิน 20 MB</span>
              </label>

              {!pdfFile && !existingPdf ? (
                <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed border-slate-300 rounded-2xl hover:border-primary hover:bg-slate-50 cursor-pointer transition-all">
                  <UploadCloud className="h-8 w-8 text-slate-400 mb-2" />
                  <span className="text-sm font-medium text-slate-500">อัปโหลดไฟล์ PDF ใหม่</span>
                  <input type="file" className="hidden" accept=".pdf" onChange={handlePdfUpload} />
                </label>
              ) : (
                <div
                  className="flex items-center justify-between p-4 bg-blue-50 border border-blue-100 rounded-2xl group cursor-pointer hover:bg-blue-100/50 transition-colors"
                  onClick={() => {
                    if (pdfFile) openPreview(pdfFile, 'pdf');
                    else setPreviewFile({ type: 'pdf', url: existingPdf.url });
                  }}
                >
                  <div className="flex items-center gap-4 truncate">
                    <File className="h-8 w-8 text-primary flex-shrink-0" />
                    <div className="truncate">
                      <p className="font-bold text-slate-800 text-sm truncate group-hover:text-primary transition-colors">
                        {pdfFile ? pdfFile.name : existingPdf.name}
                      </p>
                      <p className="text-xs text-slate-500">
                        {pdfFile ? `${(pdfFile.size / (1024 * 1024)).toFixed(2)} MB` : existingPdf.size || 'PDF'}
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setPdfFile(null);
                      setExistingPdf(null);
                      if (existingPdf && existingPdf.id) {
                        setRemoveMediaIds(prev => [...prev, existingPdf.id]);
                      }
                    }}
                    className="p-2 bg-white text-slate-500 hover:text-rose-500 hover:bg-rose-50 rounded-full transition-all flex-shrink-0 z-10 shadow-sm border border-slate-200 hover:border-rose-200"
                    title="ลบไฟล์ PDF"
                  >
                    <X className="h-5 w-5" />
                  </button>
                </div>
              )}
            </div>

            {/* Right: Images */}
            <div>
              <label className="flex items-center justify-between text-base font-bold text-slate-800 mb-3">
                <span>รูปภาพประกอบ ({existingImages.length + images.length}/15)</span>
                <span className="text-xs font-normal text-slate-500">ไม่เกินรูปละ 5 MB</span>
              </label>

              <div className="flex flex-wrap gap-4 pt-1">
                {/* Existing images from backend */}
                {existingImages.map((img, idx) => (
                  <div key={`existing-${idx}`} className="relative w-20 h-20 rounded-xl border border-slate-200 overflow-visible group">
                    <img
                      src={img.url}
                      alt={`img-${idx}`}
                      className="w-full h-full object-cover rounded-xl cursor-pointer"
                      onClick={() => setPreviewFile({ type: 'image', url: img.url })}
                    />
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setExistingImages(prev => prev.filter((_, i) => i !== idx));
                        if (img.id) {
                          setRemoveMediaIds(prev => [...prev, img.id]);
                        }
                      }}
                      className="absolute -top-2 -left-2 p-1 bg-white text-slate-500 hover:text-rose-500 hover:bg-rose-50 rounded-full transition-all z-10 shadow-sm border border-slate-200 hover:border-rose-200"
                      title="ลบรูปภาพ"
                    >
                      <X className="h-3.5 w-3.5" />
                    </button>
                    <div className="absolute inset-0 bg-black/40 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none rounded-xl">
                      <Eye className="h-6 w-6" />
                    </div>
                  </div>
                ))}

                {/* Newly uploaded images */}
                {images.map((img, idx) => (
                  <div key={`new-${idx}`} className="relative w-20 h-20 rounded-xl border border-slate-200 overflow-visible group">
                    <img
                      src={URL.createObjectURL(img)}
                      alt={`img-${idx}`}
                      className="w-full h-full object-cover rounded-xl cursor-pointer"
                      onClick={() => openPreview(img, 'image')}
                    />
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        removeImage(idx);
                      }}
                      className="absolute -top-2 -left-2 p-1 bg-white text-slate-500 hover:text-rose-500 hover:bg-rose-50 rounded-full transition-all z-10 shadow-sm border border-slate-200 hover:border-rose-200"
                      title="ลบรูปภาพ"
                    >
                      <X className="h-3.5 w-3.5" />
                    </button>
                    <div className="absolute inset-0 bg-black/40 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none rounded-xl">
                      <Eye className="h-6 w-6" />
                    </div>
                  </div>
                ))}

                {/* Upload Button */}
                <div className="relative group/btn inline-block">
                  <label className={`w-20 h-20 border-2 border-dashed rounded-xl flex flex-col items-center justify-center transition-all ${existingImages.length + images.length >= 15 ? 'border-slate-200 bg-slate-100 cursor-not-allowed opacity-60' : 'border-slate-300 hover:border-primary hover:bg-slate-50 cursor-pointer'}`}>
                    <Plus className="h-6 w-6 text-slate-400" />
                    <input
                      type="file"
                      className="hidden"
                      accept="image/*"
                      multiple
                      onChange={handleImagesUpload}
                      disabled={existingImages.length + images.length >= 15}
                    />
                  </label>
                  {existingImages.length + images.length >= 15 && (
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
          <div className="flex items-center gap-3 w-full sm:w-auto">
            <button onClick={() => navigate(`/post/${id}`)} className="w-full sm:w-auto px-6 py-4 rounded-xl font-bold text-slate-600 bg-white border border-slate-200 hover:bg-slate-50 transition-colors shadow-sm cursor-pointer">
              ยกเลิกการแก้ไข
            </button>
            <button onClick={handleDelete} className="w-full sm:w-auto px-6 py-4 rounded-xl font-bold text-rose-600 bg-rose-50 border border-rose-100 hover:bg-rose-100 transition-colors flex items-center justify-center gap-2 shadow-sm cursor-pointer">
              <Trash2 className="h-5 w-5" />
              ลบโพสต์
            </button>
          </div>
          <div className="flex flex-col sm:flex-row gap-4 w-full sm:w-auto">
            <button onClick={() => handleSubmit('DRAFT')} className="w-full sm:w-auto px-6 py-4 rounded-xl font-bold text-primary bg-blue-50 border border-blue-100 hover:bg-blue-100 transition-colors flex items-center justify-center gap-2 cursor-pointer">
              <Save className="h-5 w-5" />
              บันทึกเป็นแบบร่าง
            </button>
            <button onClick={() => handleSubmit('ACTIVE')} className="w-full sm:w-auto px-8 py-4 rounded-xl font-bold text-white bg-primary hover:bg-blue-600 transition-colors shadow-md hover:shadow-lg hover:-translate-y-0.5 cursor-pointer">
              บันทึกและโพสต์
            </button>
          </div>
        </div>
      </div>

      {/* MODAL: Category & Tags */}
      {showModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl shadow-xl w-full max-w-lg overflow-hidden flex flex-col">
            <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50">
              <h2 className="text-xl font-extrabold text-slate-900 flex items-center gap-2">
                <Tag className="h-6 w-6 text-primary" />
                ตั้งค่าวิชาและแท็ก
              </h2>
              <button onClick={() => setShowModal(false)} className="p-2 text-slate-400 hover:bg-slate-200 hover:text-slate-800 rounded-full transition-colors">
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="p-6 flex flex-col gap-6 overflow-y-auto max-h-[70vh]">
              {/* Category Select */}
              <div>
                <label className="flex items-center gap-2 text-base font-bold text-slate-800 mb-3">
                  <BookOpen className="h-5 w-5 text-primary" /> หมวดหมู่วิชา <span className="text-rose-500">*</span>
                </label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="w-full px-5 py-3.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-colors bg-white font-medium text-slate-700 text-base"
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

              {/* Hashtags Input */}
              <div>
                <label className="flex items-center gap-2 text-base font-bold text-slate-800 mb-3">
                  <Tag className="h-5 w-5 text-primary" /> แฮชแท็ก (Hashtags)
                </label>

                <div
                  onClick={() => tagInputRef.current?.focus()}
                  className="flex flex-wrap items-center gap-1.5 p-1.5 px-2.5 border border-slate-200 rounded-xl focus-within:ring-2 focus-within:ring-primary/20 focus-within:border-primary transition-colors min-h-[44px] bg-white cursor-text"
                >
                  {hashtags.map(tag => (
                    <span key={tag} className="px-2 py-0.5 bg-blue-50 text-primary rounded-lg text-xs font-semibold flex items-center gap-1 border border-blue-100/50 animate-in zoom-in-95 duration-200">
                      {tag}
                      <button type="button" onClick={(e) => { e.stopPropagation(); handleRemoveHashtag(tag); }} className="hover:text-rose-500 transition-colors cursor-pointer">
                        <X className="h-3 w-3" />
                      </button>
                    </span>
                  ))}
                  <input
                    ref={tagInputRef}
                    type="text"
                    value={hashtagInput}
                    onChange={(e) => {
                      const val = e.target.value;
                      if (val.endsWith(',') || val.endsWith(' ') || val.endsWith(';')) {
                        handleAddHashtag(val);
                      } else {
                        setCountryInput(val);
                      }
                    }}
                    onKeyDown={handleKeyDownHashtag}
                    onBlur={() => handleAddHashtag()}
                    className="flex-1 min-w-[120px] outline-none border-none py-0.5 px-1.5 text-sm bg-transparent text-slate-800 placeholder-slate-400 focus:ring-0 focus:outline-none"
                    placeholder={hashtags.length === 0 ? "พิมพ์แท็กที่ต้องการแล้วกด Enter หรือ Space..." : "เพิ่มแฮชแท็ก..."}
                  />
                </div>

                {/* Suggested Tags Area */}
                <div className="mt-4 pt-4 border-t border-slate-100">
                  <label className="flex items-center gap-2 text-xs font-bold text-slate-500 mb-2">
                    แท็กยอดนิยม (คลิกเพื่อเลือก)
                  </label>
                  <div className="flex flex-wrap gap-1.5">
                    {SUGGESTED_TAGS.map(tag => (
                      <button
                        key={tag}
                        type="button"
                        onClick={() => toggleSuggestedTag(tag)}
                        className={`px-2.5 py-1 rounded-full text-xs font-semibold border transition-all cursor-pointer ${hashtags.includes(tag) ? 'bg-primary text-white border-primary shadow-sm' : 'bg-white text-slate-500 border-slate-200 hover:border-primary hover:text-primary'}`}
                      >
                        {tag}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            <div className="p-6 border-t border-slate-100 bg-slate-50 flex justify-end">
              <button
                type="button"
                onClick={() => setShowModal(false)}
                className="px-6 py-3 bg-primary text-white rounded-xl font-bold hover:bg-blue-600 transition-all shadow-md hover:shadow-lg cursor-pointer"
              >
                ตกลง
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
