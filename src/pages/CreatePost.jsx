import { useState, useEffect, useRef, useMemo } from 'react';
import { useNavigate } from 'react-router';
import { UploadCloud, File, X, GraduationCap, Tag, AlignLeft, BookOpen, PenTool, Save, Image as ImageIcon, Plus, Eye, FileText, Loader2 } from 'lucide-react';
import toast from 'react-hot-toast';
import Swal from 'sweetalert2';
import ContentEditor from '@/components/posts/ContentEditor';
import { postService } from '../services/post.service';
import { categoryService, isValidCategoryUuid } from '../services/category.service';
import { getDefaultDraftCoverFile } from '../utils/draftCover';
import {
  validatePdfFile,
  translateUploadError,
  formatFileSize,
  MAX_PDF_SIZE_LABEL,
} from '../constants/uploadConstants';

const SUGGESTED_TAGS = ['#AI', '#เรียนรู้ไปด้วยกัน', '#เตรียมสอบ', '#TCAS67', '#สรุปย่อ', '#แชร์ความรู้', '#เด็กซิ่ว', '#สรุปชีท'];
const DIRECT_UPLOAD_ENABLED = import.meta.env.VITE_DIRECT_UPLOAD_ENABLED !== 'false';

export default function CreatePost() {
  const navigate = useNavigate();
  const submitting = useRef(false);
  const uploadCache = useRef(null);
  const uploadAbortController = useRef(null);
  const draftCover = useRef(null);
  const idempotencyKey = useRef(null);
  const [coverImage, setCoverImage] = useState(null);
  const [pdfFile, setPdfFile] = useState(null);
  const [isPdfUploading, setIsPdfUploading] = useState(false);
  const [images, setImages] = useState([]);

  // Memoize preview URLs to prevent repeated network fetching / memory leak on re-renders
  const coverPreviewUrl = useMemo(() => {
    if (!coverImage) return null;
    return URL.createObjectURL(coverImage);
  }, [coverImage]);

  useEffect(() => {
    return () => {
      if (coverPreviewUrl) URL.revokeObjectURL(coverPreviewUrl);
    };
  }, [coverPreviewUrl]);

  const imagePreviews = useMemo(() => {
    return images.map(img => ({
      file: img,
      previewUrl: URL.createObjectURL(img)
    }));
  }, [images]);

  useEffect(() => {
    return () => {
      imagePreviews.forEach(item => URL.revokeObjectURL(item.previewUrl));
    };
  }, [imagePreviews]);

  const [title, setTitle] = useState('');
  const [summary, setSummary] = useState('');
  const [content, setContent] = useState('');
  const [isContentUploading, setIsContentUploading] = useState(false);

  const [categoriesList, setCategoriesList] = useState([]);
  const [categoryId, setCategoryId] = useState('');
  const [categoryName, setCategoryName] = useState('');
  const [level, setLevel] = useState('');

  const [hashtags, setHashtags] = useState([]);
  const [hashtagInput, setHashtagInput] = useState('');
  const [hashtagError, setHashtagError] = useState('');
  const tagInputRef = useRef(null);

  const [showModal, setShowModal] = useState(false);
  const [previewFile, setPreviewFile] = useState(null); // { type: 'image' | 'pdf', url: string, isBlob?: boolean }
  const [fieldErrors, setFieldErrors] = useState({});

  // Fetch categories on mount
  useEffect(() => {
    const loadCategories = async () => {
      try {
        const list = await categoryService.getAllCategories();
        setCategoriesList(list);
      } catch (err) {
        console.error('Error fetching categories:', err);
      }
    };
    loadCategories();
  }, []);

  const handleCategorySelect = (selectedId) => {
    const found = categoriesList.find(c => c.id === selectedId || c.name === selectedId);
    if (found) {
      setCategoryId(found.id);
      setCategoryName(found.name);
    } else {
      setCategoryId(selectedId);
      setCategoryName(selectedId);
    }
    if (fieldErrors.category) {
      setFieldErrors(prev => ({ ...prev, category: null }));
    }
  };

  // File Handlers
  const handleCoverUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const allowedTypes = ['image/jpeg', 'image/png', 'image/jpg'];
    const allowedExtensions = ['jpg', 'jpeg', 'png'];
    const fileExtension = file.name ? file.name.split('.').pop().toLowerCase() : '';
    const fileType = file.type ? file.type.toLowerCase() : '';

    const isValidType = allowedTypes.includes(fileType) || allowedExtensions.includes(fileExtension);

    if (!isValidType) {
      toast.error('สามารถอัปโหลดไฟล์ .jpg,.jpeg,.png เท่านั้น');
      e.target.value = '';
      return;
    }

    if (file.size > 2 * 1024 * 1024) {
      toast.error('รูปปกต้องมีขนาดไม่เกิน 2 MB');
      e.target.value = '';
      return;
    }
    setCoverImage(file);
    if (fieldErrors.cover) {
      setFieldErrors(prev => ({ ...prev, cover: null }));
    }
  };

  const handlePdfUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const validation = validatePdfFile(file);
    if (!validation.valid) {
      toast.error(validation.error);
      e.target.value = '';
      return;
    }

    setPdfFile(file);
    uploadCache.current = null;
    e.target.value = '';
  };

  const cancelPdfUpload = () => {
    uploadAbortController.current?.abort();
  };

  const handleImagesUpload = (e) => {
    const files = Array.from(e.target.files);
    if (!files.length) return;

    const allowedTypes = ['image/jpeg', 'image/png', 'image/jpg'];
    const allowedExtensions = ['jpg', 'jpeg', 'png'];

    let newImages = [...images];
    let hasOversized = false;
    let hasInvalidType = false;
    let reachedLimit = false;

    for (const file of files) {
      if (newImages.length >= 15) {
        reachedLimit = true;
        break;
      }

      const fileExtension = file.name ? file.name.split('.').pop().toLowerCase() : '';
      const fileType = file.type ? file.type.toLowerCase() : '';
      const isValidType = allowedTypes.includes(fileType) || allowedExtensions.includes(fileExtension);

      if (!isValidType) {
        hasInvalidType = true;
        continue;
      }

      if (file.size > 2 * 1024 * 1024) {
        hasOversized = true;
        continue;
      }
      newImages.push(file);
    }

    if (reachedLimit) {
      toast.error('คุณสามารถอัปโหลดรูปภาพประกอบได้สูงสุด 15 รูปเท่านั้น');
    }

    if (hasInvalidType) {
      toast.error('สามารถอัปโหลดไฟล์ .jpg,.jpeg,.png เท่านั้น');
    }

    if (hasOversized) {
      toast.error('รูปภาพประกอบต้องมีขนาดไม่เกิน 2 MB');
    }

    setImages(newImages);
    if (newImages.length > 0) {
      setFieldErrors(prev => ({ ...prev, media: null }));
    }
    e.target.value = '';
  };

  const removeImage = (index) => {
    setImages(images.filter((_, i) => i !== index));
  };

  const openPreview = (fileOrUrl, type) => {
    if (typeof fileOrUrl === 'string') {
      setPreviewFile({ type, url: fileOrUrl });
    } else if (fileOrUrl instanceof File || fileOrUrl instanceof Blob) {
      setPreviewFile({ type, url: URL.createObjectURL(fileOrUrl), isBlob: true });
    }
  };

  const closePreview = () => {
    if (previewFile?.isBlob && previewFile?.url) {
      URL.revokeObjectURL(previewFile.url);
    }
    setPreviewFile(null);
  };

  // Hashtag Handlers
  const handleAddHashtag = (customValue = null) => {
    const valueToAdd = customValue !== null ? customValue : hashtagInput;
    if (!valueToAdd || valueToAdd.trim() === '') return;

    const rawTags = valueToAdd.split(/[\s,;]+/);
    const newTags = [...hashtags];
    let error = '';

    rawTags.forEach(rawTag => {
      const tagName = rawTag.trim().replace(/^#/, '');
      if (!tagName) return;

      if (!/^[\p{L}\p{M}\p{N}]+$/u.test(tagName)) {
        error = 'แท็กต้องไม่มีอักษรพิเศษ';
        return;
      }

      if (tagName.length > 10) {
        error = 'แท็กต้องมีความยาวไม่เกิน 10 ตัวอักษร';
        return;
      }

      const tag = `#${tagName}`;
      if (!newTags.includes(tag)) {
        if (newTags.length >= 3) {
          error = 'ไม่สามารถเพิ่มเกิน 3 อัน';
          return;
        }
        newTags.push(tag);
      }
    });

    setHashtags(newTags);
    setHashtagError(error);
    if (!error || newTags.length >= 3) setHashtagInput('');
  };

  const handleHashtagInputChange = (value) => {
    if (value.endsWith(',') || value.endsWith(' ') || value.endsWith(';')) {
      handleAddHashtag(value);
      return;
    }

    const cleanVal = value.replace(/^#/, '');
    if (cleanVal.length > 10) {
      setHashtagError('แท็กต้องมีความยาวไม่เกิน 10 ตัวอักษร');
      return;
    }

    if (value && !/^#?[\p{L}\p{M}\p{N}]*$/u.test(value)) {
      setHashtagError('แท็กต้องไม่มีอักษรพิเศษ');
      return;
    }

    setHashtagError('');
    setHashtagInput(value);
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
    setHashtagError('');
  };

  const toggleSuggestedTag = (tag) => {
    if (hashtags.includes(tag)) {
      setHashtags(hashtags.filter(t => t !== tag));
      setHashtagError('');
    } else if (hashtags.length >= 3) {
      setHashtagError('ไม่สามารถเพิ่มเกิน 3 อัน');
    } else {
      setHashtags([...hashtags, tag]);
      setHashtagError('');
    }
  };

  const handleSubmit = async (status = 'ACTIVE') => {
    if (submitting.current) return;
    setFieldErrors({});
    const newErrors = {};
    const isDraft = status === 'DRAFT';
    if (!isDraft && isContentUploading) {
      setFieldErrors({ content: 'กรุณารอให้อัปโหลดรูปในรายละเอียดเพิ่มเติมเสร็จก่อนเผยแพร่' });
      return;
    }

    // Drafts may be saved at any point. Publish validation only runs for ACTIVE posts.
    if (!isDraft) {
      if (!title.trim()) newErrors.title = 'กรุณากรอกชื่อหัวข้อสรุปความรู้';
      else if (title.length > 100) newErrors.title = 'ชื่อหัวข้อต้องมีความยาวไม่เกิน 100 ตัวอักษร';
      if (!level) newErrors.level = 'กรุณาเลือกระดับชั้น';
      if (!summary.trim()) newErrors.summary = 'กรุณากรอกบทสรุปย่อ';
      if (!categoryId && !categoryName) newErrors.category = 'กรุณาเลือกหมวดหมู่วิชา';
      if (!content.replace(/<[^>]*>/g, '').replace(/&nbsp;/g, ' ').trim()) {
        newErrors.content = 'กรุณากรอกรายละเอียดเพิ่มเติม';
      }

      if (!coverImage) {
        newErrors.cover = 'กรุณาอัปโหลดรูปภาพหน้าปก';
      }

      if (!pdfFile && (!images || images.length === 0)) {
        newErrors.media = 'กรุณาแนบรูปภาพประกอบอย่างน้อย 1 รูป';
      }
    }

    if (Object.keys(newErrors).length > 0) {
      setFieldErrors(newErrors);
      return;
    }

    submitting.current = true;
    if (pdfFile) setIsPdfUploading(true);
    const uploadController = new AbortController();
    uploadAbortController.current = uploadController;
    const savingToastId = toast.loading(pdfFile ? 'กำลังอัปโหลด PDF...' : 'กำลังบันทึกโพสต์...');
    try {
      // Resolve category and education level
      let validCatId = isValidCategoryUuid(categoryId) ? categoryId : null;
      if (!validCatId && categoryName) {
        const matchInList = categoriesList.find(c => c.name === categoryName && isValidCategoryUuid(c.id));
        if (matchInList) {
          validCatId = matchInList.id;
        }
      }

      let backendLevel = 'UNIVERSITY';
      if (level === 'มัธยมศึกษาตอนต้น') backendLevel = 'MIDDLE_SCHOOL';
      else if (level === 'มัธยมศึกษาตอนปลาย') backendLevel = 'HIGH_SCHOOL';

      if (!coverImage && isDraft && !draftCover.current) draftCover.current = await getDefaultDraftCoverFile();
      const coverFile = coverImage || draftCover.current;
      let postPayload;
      let directAssets = null;

      if (DIRECT_UPLOAD_ENABLED) {
        const files = [coverFile, pdfFile, ...images];
        const cached = uploadCache.current;
        const sessionIsUsable = cached?.uploads?.uploadSessionExpiresAt
          && Date.parse(cached.uploads.uploadSessionExpiresAt) > Date.now() + 30000;
        const sameFiles = cached && sessionIsUsable && cached.files.length === files.length
          && files.every((file, index) => file === cached.files[index]);
        const uploads = sameFiles
          ? cached.uploads
          : await postService.uploadPostFilesDirect({
            coverImage: coverFile,
            pdfFile,
            images,
            signal: uploadController.signal,
          });
        if (pdfFile) setIsPdfUploading(false);
        uploadCache.current = { files, uploads };
        const { coverUpload, mediaUploads, pdfUpload, uploadSessionId } = uploads;
        directAssets = [coverUpload, ...mediaUploads];
        if (!idempotencyKey.current) idempotencyKey.current = crypto.randomUUID();

        postPayload = {
          title: title.trim() || 'Untitled draft',
          summary: summary.trim(),
          content: content || '<p></p>',
          education_level: backendLevel,
          post_status: isDraft ? 'DRAFT' : 'ACTIVE',
          tags: hashtags,
          category_id: validCatId,
          category: categoryName,
          cover_upload: coverUpload,
          media_uploads: mediaUploads,
          pdf_upload: pdfUpload,
          upload_session_id: uploadSessionId,
          idempotency_key: idempotencyKey.current,
        };
      } else {
        const pdfUpload = pdfFile
          ? await postService.uploadPdfToSupabase(pdfFile, { signal: uploadController.signal })
          : null;
        if (pdfFile) setIsPdfUploading(false);
        if (!idempotencyKey.current) idempotencyKey.current = crypto.randomUUID();
        postPayload = new FormData();
        postPayload.append('title', title.trim() || 'Untitled draft');
        postPayload.append('summary', summary.trim());
        postPayload.append('content', content || '<p></p>');
        postPayload.append('education_level', backendLevel);
        postPayload.append('post_status', isDraft ? 'DRAFT' : 'ACTIVE');
        postPayload.append('tags', JSON.stringify(hashtags));
        if (validCatId) postPayload.append('category_id', validCatId);
        if (categoryName) postPayload.append('category', categoryName);
        if (coverFile) postPayload.append('cover_image', coverFile);
        if (pdfUpload) {
          postPayload.append('pdf_upload', JSON.stringify(pdfUpload));
          postPayload.append('upload_session_id', pdfUpload.upload_session_id);
          postPayload.append('idempotency_key', idempotencyKey.current);
        }
        images.forEach(image => postPayload.append('media_files', image));
      }

      let result;
      try {
        result = await postService.createPost(postPayload);
      } catch (error) {
        // A network/5xx error may occur after the database committed. Only clean
        // up definitive client rejection; never delete possibly attached assets.
        if (directAssets && error.response?.status >= 400 && error.response.status < 500) {
          uploadCache.current = null;
          await postService.cleanupDirectUploads(directAssets);
        }
        throw error;
      }
      Swal.close();

      if (result.success) {
        uploadCache.current = null;
        idempotencyKey.current = null;
        if (isDraft) {
          navigate('/profile?tab=drafts');
          Swal.fire({
            icon: 'success',
            title: 'บันทึกสำเร็จ!',
            text: 'บันทึกแบบร่างเรียบร้อยแล้ว',
            confirmButtonColor: '#3b82f6'
          });
          return;
        }
        Swal.fire({
          icon: 'success',
          title: 'โพสต์สำเร็จ!',
          text: 'โพสต์สรุปความรู้เรียบร้อยแล้ว',
          confirmButtonColor: '#3b82f6'
        }).then(() => {
          navigate('/home');
        });
      } else {
        throw new Error(result.message || 'เกิดข้อผิดพลาดในการบันทึกข้อมูล');
      }
    } catch (error) {
      Swal.close();
      console.error('Error submitting post:', error);
      const errMsg = translateUploadError(error, error.response?.data?.message || error.message || 'ไม่สามารถเชื่อมต่อกับเซิร์ฟเวอร์ได้');
      Swal.fire({
        icon: 'error',
        title: 'เกิดข้อผิดพลาด',
        text: errMsg,
        confirmButtonColor: '#3b82f6'
      });
    } finally {
      toast.dismiss(savingToastId);
      if (uploadAbortController.current === uploadController) {
        uploadAbortController.current = null;
      }
      submitting.current = false;
      setIsPdfUploading(false);
    }
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
              <label className="flex items-center justify-between text-base font-bold text-slate-800 mb-1">
                <span>รูปปก <span className="text-rose-500">*</span></span>
                <span className="text-xs font-normal text-slate-500">ไม่เกิน 2 MB</span>
              </label>
              <p className="text-xs text-slate-400 mb-3">แนะนำอัตราส่วน 16:9 (เช่น 1280×720px) เพื่อให้แสดงผลสวยที่สุด</p>
              {!coverImage ? (
                <label className={`flex flex-col items-center justify-center w-full aspect-video border-2 border-dashed rounded-2xl hover:bg-slate-50 cursor-pointer transition-all ${fieldErrors.cover ? 'border-red-500 hover:border-red-500' : 'border-slate-300 hover:border-primary'}`}>
                  <ImageIcon className="h-10 w-10 text-slate-400 mb-3" />
                  <span className="text-sm font-medium text-slate-500">คลิกเพื่ออัปโหลดรูปปก</span>
                  <span className="text-xs text-slate-400 mt-1">อัตราส่วนที่แนะนำ 16:9 (1280×720px) รูปภาพขนาดไม่เกิน 2 Mb</span>
                  <input test-data="cover-file-input" type="file" className="hidden" accept=".jpg,.jpeg,.png" onChange={handleCoverUpload} />
                </label>
              ) : (
                <div className="relative w-full aspect-video rounded-2xl overflow-hidden border border-slate-200 group">
                  <img
                    src={coverPreviewUrl}
                    alt="Cover"
                    className="w-full h-full object-cover object-center rounded-2xl cursor-pointer transition-transform duration-300 group-hover:scale-[1.02]"
                    onClick={() => openPreview(coverPreviewUrl, 'image')}
                  />
                  <button test-data="remove-cover-button" onClick={(e) => { e.stopPropagation(); setCoverImage(null); }} className="absolute top-3 right-3 p-1.5 bg-white/90 backdrop-blur-sm text-slate-500 hover:text-rose-500 hover:bg-rose-50 rounded-full transition-all z-10 shadow-sm border border-slate-200 hover:border-rose-200" title="ลบรูปปก">
                    <X className="h-5 w-5" />
                  </button>
                  {/* Hover Overlay */}
                  <div className="absolute inset-0 bg-black/30 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none rounded-2xl">
                    <Eye className="h-8 w-8" />
                  </div>
                </div>
              )}
              {fieldErrors.cover && (
                <p className="mt-1.5 text-xs text-red-500 font-medium" role="alert">{fieldErrors.cover}</p>
              )}
            </div>

            <div className="md:col-span-1">
              <label className="flex items-center justify-between text-base font-bold text-slate-800 mb-3">
                <span>ชื่อหัวข้อสรุป <span className="text-rose-500">*</span></span>
                <span className={`text-xs font-semibold ${title.length >= 100 ? 'text-rose-500' : 'text-slate-400'}`}>
                  {title.length}/100 ตัวอักษร
                </span>
              </label>
              <input
                test-data="post-title-input"
                type="text"
                maxLength={100}
                value={title}
                onChange={(e) => {
                  setTitle(e.target.value.slice(0, 100));
                  if (fieldErrors.title) setFieldErrors(prev => ({ ...prev, title: null }));
                }}
                className={`w-full px-5 py-4 rounded-xl border focus:outline-none transition-colors text-base ${fieldErrors.title
                  ? 'border-red-500 focus:ring-2 focus:ring-red-500/20 focus:border-red-500'
                  : 'border-slate-200 focus:ring-2 focus:ring-primary/20 focus:border-primary'
                  }`}
                placeholder="เช่น สรุปสูตรฟิสิกส์ ม.4 เทอม 1"
              />
              {fieldErrors.title && (
                <p className="mt-1.5 text-xs text-red-500 font-medium">{fieldErrors.title}</p>
              )}

              <div className="mt-6">
                <label className="flex items-center gap-2 text-base font-bold text-slate-800 mb-3">
                  <GraduationCap className="h-5 w-5 text-slate-400" /> ระดับชั้น <span className="text-rose-500">*</span>
                </label>
                <select
                  test-data="education-level-select"
                  value={level}
                  onChange={(e) => {
                    setLevel(e.target.value);
                    if (fieldErrors.level) setFieldErrors(prev => ({ ...prev, level: null }));
                  }}
                  className={`w-full px-5 py-4 rounded-xl border focus:outline-none transition-colors bg-white font-medium text-slate-700 text-base ${fieldErrors.level
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
            </div>
          </div>

          {/* Summary */}
          <div>
            <label className="flex items-center justify-between text-base font-bold text-slate-800 mb-3">
              <span className="flex items-center gap-2">
                <FileText className="h-5 w-5 text-slate-400" /> บทสรุปย่อ (Summary) <span className="text-rose-500">*</span>
              </span>
              <span className={`text-xs font-semibold ${summary.length >= 200 ? 'text-rose-500' : 'text-slate-400'}`}>
                {summary.length}/200 ตัวอักษร
              </span>
            </label>
            <textarea
              test-data="post-summary-input"
              value={summary}
              onChange={(e) => {
                setSummary(e.target.value.slice(0, 200));
                if (fieldErrors.summary) setFieldErrors(prev => ({ ...prev, summary: null }));
              }}
              className={`w-full px-5 py-4 rounded-xl border focus:outline-none transition-colors text-base min-h-[100px] resize-y bg-white ${fieldErrors.summary
                ? 'border-red-500 focus:ring-2 focus:ring-red-500/20 focus:border-red-500'
                : 'border-slate-200 focus:ring-2 focus:ring-primary/20 focus:border-primary'
                }`}
              placeholder="อธิบายสั้นๆ เกี่ยวกับไฟล์สรุปนี้ (จะนำไปแสดงบนการ์ดในหน้ารายการ) เช่น สรุปฟิสิกส์ ม.4 เทอม 1 เหมาะกับทบทวนสอบกลางภาค..."
              rows={3}
            />
            {fieldErrors.summary && (
              <p className="mt-1.5 text-xs text-red-500 font-medium">{fieldErrors.summary}</p>
            )}
          </div>

          {/* Subject & Hashtags Section */}
          <div>
            <label className="flex items-center gap-2 text-base font-bold text-slate-800 mb-3">
              <Tag className="h-5 w-5 text-slate-400" /> หมวดหมู่วิชาและแฮชแท็ก <span className="text-rose-500">*</span>
            </label>
            <div
              onClick={() => {
                setShowModal(true);
              }}
              className={`p-5 border border-dashed hover:border-primary rounded-2xl bg-white hover:bg-blue-50/10 cursor-pointer transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-4 ${fieldErrors.category ? 'border-red-500 bg-red-50/10' : 'border-slate-200'
                }`}
            >
              <div className="flex flex-col gap-2">
                {categoryName ? (
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-sm font-bold text-slate-400">วิชาที่เลือก:</span>
                    <span className="px-3 py-1 bg-primary/10 text-primary font-bold text-xs rounded-full">{categoryName}</span>
                  </div>
                ) : (
                  <span className="text-sm text-rose-500 font-medium">กรุณาเลือกหมวดหมู่วิชา *</span>
                )}

                {hashtags.length > 0 ? (
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-sm font-bold text-slate-400">แฮชแท็ก:</span>
                    <div className="flex flex-wrap gap-1.5">
                      {hashtags.map(tag => (
                        <span key={tag} className="px-2.5 py-0.5 bg-slate-100 text-slate-600 rounded-md text-xs font-semibold border border-slate-200">
                          {tag}
                        </span>
                      ))}
                    </div>
                  </div>
                ) : (
                  <span className="text-sm text-slate-400">ยังไม่มีแฮชแท็ก (สามารถเพิ่มแท็กช่วยให้ค้นหาง่ายขึ้น)</span>
                )}
              </div>
              <button
                test-data="category-tags-settings-button"
                type="button"
                className="px-5 py-2.5 bg-primary/10 hover:bg-primary/20 text-primary font-bold rounded-xl text-sm transition-colors flex items-center gap-2 self-start sm:self-auto cursor-pointer"
              >
                <Plus className="h-4 w-4" />
                ตั้งค่าวิชาและแท็ก
              </button>
            </div>
            {fieldErrors.category && (
              <p className="mt-1.5 text-xs text-red-500 font-medium" role="alert">{fieldErrors.category}</p>
            )}
          </div>

          {/* Rich Text Editor */}
          <div>
            <label className="flex items-center gap-2 text-base font-bold text-slate-800 mb-3">
              <AlignLeft className="h-5 w-5 text-slate-400" /> รายละเอียดเพิ่มเติม <span className="text-rose-500">*</span>
            </label>
            <ContentEditor value={content} onUploadingChange={setIsContentUploading} error={fieldErrors.content} onChange={(value) => { setContent(value); if (fieldErrors.content && value.replace(/<[^>]*>/g, '').replace(/&nbsp;/g, ' ').trim()) setFieldErrors(prev => ({ ...prev, content: null })); }} />
          </div>

          {/* File Uploads (Split left/right) */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 pt-8 border-t border-slate-100">
            {/* Left: PDF */}
            <div>
              <label className="flex items-center justify-between text-base font-bold text-slate-800 mb-3">
                <span>ไฟล์เอกสาร PDF (ถ้ามี)</span>
                <span className="text-xs font-normal text-slate-500">{MAX_PDF_SIZE_LABEL}</span>
              </label>
              {isPdfUploading ? (
                <div className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed border-primary/40 bg-blue-50/50 rounded-2xl">
                  <Loader2 className="h-8 w-8 text-primary animate-spin mb-2" />
                  <span className="text-sm font-medium text-primary">กำลังอัปโหลด PDF...</span>
                  <button test-data="cancel-pdf-upload-button" type="button" onClick={cancelPdfUpload} className="mt-2 text-xs font-bold text-rose-600 hover:text-rose-700 cursor-pointer">
                    ยกเลิกการอัปโหลด
                  </button>
                </div>
              ) : !pdfFile ? (
                <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed border-slate-300 rounded-2xl hover:border-primary hover:bg-slate-50 cursor-pointer transition-all">
                  <UploadCloud className="h-8 w-8 text-slate-400 mb-2" />
                  <span className="text-sm font-medium text-slate-500">อัปโหลดไฟล์ PDF</span>
                  <span className="text-xs text-slate-400 mt-0.5">{MAX_PDF_SIZE_LABEL}</span>
                  <input test-data="pdf-file-input" type="file" className="hidden" accept=".pdf,application/pdf" onChange={handlePdfUpload} />
                </label>
              ) : (
                <div className="flex items-center justify-between p-4 bg-blue-50 border border-blue-100 rounded-2xl group cursor-pointer hover:bg-blue-100/50 transition-colors" onClick={() => openPreview(pdfFile, 'pdf')}>
                  <div className="flex items-center gap-4 truncate">
                    <File className="h-8 w-8 text-primary flex-shrink-0" />
                    <div className="truncate">
                      <p className="font-bold text-slate-800 text-sm truncate group-hover:text-primary transition-colors">{pdfFile.name}</p>
                      <p className="text-xs text-slate-500">{formatFileSize(pdfFile.size)}</p>
                    </div>
                  </div>
                  <button
                    test-data="remove-pdf-button"
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setPdfFile(null);
                      uploadCache.current = null;
                    }}
                    className="p-2 bg-white text-slate-500 hover:text-rose-500 hover:bg-rose-50 rounded-full transition-all flex-shrink-0 z-10 shadow-sm border border-slate-200 hover:border-rose-200 cursor-pointer"
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
                <span>รูปภาพประกอบ ({images.length}/15) <span className="text-rose-500">*</span></span>
                <span className="text-xs font-normal text-slate-500">ไม่เกินรูปละ 2 MB</span>
              </label>

              <div className="flex flex-wrap gap-4 pt-1">
                {imagePreviews.map((item, idx) => (
                  <div key={idx} className="relative w-20 h-20 rounded-xl border border-slate-200 overflow-visible group">
                    <img
                      src={item.previewUrl}
                      alt={`img-${idx}`}
                      className="w-full h-full object-cover rounded-xl cursor-pointer"
                      onClick={() => openPreview(item.previewUrl, 'image')}
                    />
                    <button
                      test-data={`remove-supporting-image-button-${idx}`}
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
                  <label className={`w-20 h-20 border-2 border-dashed rounded-xl flex flex-col items-center justify-center transition-all ${images.length >= 15
                    ? 'border-slate-200 bg-slate-100 cursor-not-allowed opacity-60'
                    : fieldErrors.media
                      ? 'border-red-500 hover:border-red-500 hover:bg-slate-50 cursor-pointer'
                      : 'border-slate-300 hover:border-primary hover:bg-slate-50 cursor-pointer'
                    }`}>
                    <Plus className="h-6 w-6 text-slate-400" />
                    <input
                      test-data="supporting-images-file-input"
                      type="file"
                      className="hidden"
                      accept=".jpg,.jpeg,.png"
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
              {fieldErrors.media && (
                <p className="mt-2 text-xs font-medium text-rose-500" role="alert">{fieldErrors.media}</p>
              )}
            </div>
          </div>

        </div>

        {/* Actions */}
        <div className="sticky bottom-0 z-40 bg-slate-50 p-6 sm:px-12 sm:py-8 border-t border-slate-100 flex flex-col sm:flex-row justify-between items-center gap-4 rounded-b-[24px] shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)]">
          <button test-data="cancel-create-post-button" onClick={() => navigate('/home')} className="w-full sm:w-auto px-6 py-4 rounded-xl font-bold text-slate-600 bg-white border border-slate-200 hover:bg-slate-50 transition-colors shadow-sm cursor-pointer">
            ยกเลิก
          </button>
          <div className="flex flex-col sm:flex-row gap-4 w-full sm:w-auto">
            <button
              test-data="save-draft-button"
              type="button"
              disabled={isPdfUploading || isContentUploading || submitting.current}
              onClick={() => handleSubmit('DRAFT')}
              className="w-full sm:w-auto px-6 py-4 rounded-xl font-bold text-primary bg-blue-50 border border-blue-100 hover:bg-blue-100 transition-colors flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Save className="h-5 w-5" />
              บันทึกแบบร่าง
            </button>
            <button
              test-data="publish-post-button"
              type="button"
              disabled={isPdfUploading || isContentUploading || submitting.current}
              onClick={() => handleSubmit('ACTIVE')}
              className="w-full sm:w-auto px-8 py-4 rounded-xl font-bold text-white bg-primary hover:bg-blue-600 transition-colors shadow-md hover:shadow-lg hover:-translate-y-0.5 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
            >
              โพสต์สรุปความรู้
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
              <button test-data="close-category-tags-modal-button" onClick={() => setShowModal(false)} className="p-2 text-slate-400 hover:bg-slate-200 hover:text-slate-800 rounded-full transition-colors">
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
                  test-data="category-select"
                  value={categoryId || categoryName}
                  onChange={(e) => handleCategorySelect(e.target.value)}
                  className={`w-full px-5 py-3.5 rounded-xl border focus:outline-none transition-colors bg-white font-medium text-slate-700 text-base cursor-pointer ${fieldErrors.category
                    ? 'border-red-500 focus:ring-2 focus:ring-red-500/20 focus:border-red-500'
                    : 'border-slate-200 focus:ring-2 focus:ring-primary/20 focus:border-primary'
                    }`}
                >
                  <option value="" disabled>เลือกหมวดหมู่วิชา</option>
                  {categoriesList.map((cat) => (
                    <option key={cat.id} value={cat.id}>
                      {cat.name}
                    </option>
                  ))}
                </select>
                {fieldErrors.category && (
                  <p className="mt-1.5 text-xs text-red-500 font-medium" role="alert">{fieldErrors.category}</p>
                )}
              </div>

              {/* Hashtags Input */}
              <div>
                <label className="flex items-center gap-2 text-base font-bold text-slate-800 mb-3">
                  <Tag className="h-5 w-5 text-primary" /> แฮชแท็ก (Hashtags)
                </label>

                {/* Tag Container acting like an input field */}
                <div
                  onClick={() => tagInputRef.current?.focus()}
                  className={`flex flex-wrap items-center gap-1.5 p-1.5 px-2.5 border rounded-xl focus-within:ring-2 transition-colors min-h-[44px] bg-white cursor-text ${hashtagError ? 'border-rose-400 focus-within:ring-rose-100 focus-within:border-rose-500' : 'border-slate-200 focus-within:ring-primary/20 focus-within:border-primary'}`}
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
                    test-data="hashtag-input"
                    ref={tagInputRef}
                    type="text"
                    value={hashtagInput}
                    onChange={(e) => handleHashtagInputChange(e.target.value)}
                    onKeyDown={handleKeyDownHashtag}
                    onBlur={() => handleAddHashtag()}
                    className="flex-1 min-w-[120px] outline-none border-none py-0.5 px-1.5 text-sm bg-transparent text-slate-800 placeholder-slate-400 focus:ring-0 focus:outline-none"
                    placeholder={hashtags.length === 0 ? "พิมพ์แท็กที่ต้องการแล้วกด Enter หรือ Space..." : "เพิ่มแฮชแท็ก..."}
                  />
                </div>
                {hashtagError && (
                  <p className="mt-1.5 text-xs font-medium text-rose-500" role="alert">{hashtagError}</p>
                )}
                <p className="mt-1.5 text-xs text-slate-400">เพิ่มได้สูงสุด 3 แท็ก, ความยาวไม่เกิน 10 ตัวอักษร และใช้ได้เฉพาะตัวอักษรหรือตัวเลข</p>

                {/* Suggested Tags Area */}
                <div className="mt-4 pt-4 border-t border-slate-100">
                  <label className="flex items-center gap-2 text-xs font-bold text-slate-500 mb-2">
                    แท็กยอดนิยม (คลิกเพื่อเลือก)
                  </label>
                  <div className="flex flex-wrap gap-1.5">
                    {SUGGESTED_TAGS.map((tag, index) => (
                      <button
                        test-data={`suggested-hashtag-button-${index}`}
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
                test-data="confirm-category-tags-button"
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
              <button test-data="close-file-preview-button" onClick={closePreview} className="p-2 text-slate-400 hover:bg-slate-200 hover:text-slate-800 rounded-full transition-colors">
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
