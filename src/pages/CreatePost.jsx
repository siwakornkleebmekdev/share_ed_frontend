import { useState, useEffect, useRef, useMemo } from 'react';
import { useNavigate } from 'react-router';
import {
  UploadCloud,
  File,
  X,
  GraduationCap,
  Tag,
  AlignLeft,
  BookOpen,
  Save,
  Image as ImageIcon,
  Plus,
  Eye,
  FileText,
  Loader2,
} from 'lucide-react';
import toast from 'react-hot-toast';
import Swal from 'sweetalert2';
import ContentEditor from '@/components/posts/ContentEditor';
import UploadWorkspaceItem from '@/components/posts/UploadWorkspaceItem';
import { postService } from '../services/post.service';
import { categoryService, isValidCategoryUuid } from '../services/category.service';
import { uploadWorkspaceService } from '../services/uploadWorkspace.service';
import { useUploadWorkspace } from '../hooks/useUploadWorkspace';
import { getDefaultDraftCoverFile } from '../utils/draftCover';
import {
  validatePdfFile,
  translateUploadError,
  formatFileSize,
  MAX_PDF_SIZE_LABEL,
  isUploadWorkspaceV2Enabled,
} from '../constants/uploadConstants';

const SUGGESTED_TAGS = ['#AI', '#เรียนรู้ไปด้วยกัน', '#เตรียมสอบ', '#TCAS67', '#สรุปย่อ', '#แชร์ความรู้', '#เด็กซิ่ว', '#สรุปชีท'];
const DIRECT_UPLOAD_ENABLED = import.meta.env.VITE_DIRECT_UPLOAD_ENABLED !== 'false';

export default function CreatePost() {
  const navigate = useNavigate();
  const isV2 = isUploadWorkspaceV2Enabled();
  const workspace = useUploadWorkspace({ mode: 'create', isEnabled: isV2 });

  const submitting = useRef(false);
  const uploadCache = useRef(null);
  const uploadAbortController = useRef(null);
  const draftCover = useRef(null);
  const idempotencyKey = useRef(null);

  // Legacy state (used when isV2 is false)
  const [coverImage, setCoverImage] = useState(null);
  const [pdfFile, setPdfFile] = useState(null);
  const [isPdfUploading, setIsPdfUploading] = useState(false);
  const [images, setImages] = useState([]);

  // Memoize legacy preview URLs
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

  // Form Fields
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

  // Legacy File Handlers
  const handleCoverUploadLegacy = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const allowedTypes = ['image/jpeg', 'image/png', 'image/jpg', 'image/webp'];
    const allowedExtensions = ['jpg', 'jpeg', 'png', 'webp'];
    const fileExtension = file.name ? file.name.split('.').pop().toLowerCase() : '';
    const fileType = file.type ? file.type.toLowerCase() : '';

    const isValidType = allowedTypes.includes(fileType) || allowedExtensions.includes(fileExtension);
    if (!isValidType) {
      toast.error('สามารถอัปโหลดไฟล์ .jpg,.jpeg,.png,.webp เท่านั้น');
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

  const handlePdfUploadLegacy = (e) => {
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

  const cancelPdfUploadLegacy = () => {
    uploadAbortController.current?.abort();
  };

  const handleImagesUploadLegacy = (e) => {
    const files = Array.from(e.target.files);
    if (!files.length) return;

    const allowedTypes = ['image/jpeg', 'image/png', 'image/jpg', 'image/webp'];
    const allowedExtensions = ['jpg', 'jpeg', 'png', 'webp'];

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
      toast.error('สามารถอัปโหลดไฟล์ .jpg,.jpeg,.png,.webp เท่านั้น');
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

  const removeImageLegacy = (index) => {
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

  // ==========================================
  // Submission Handlers
  // ==========================================

  // Upload Workspace V2 Submission
  const handleSubmitV2 = async (status = 'ACTIVE') => {
    if (submitting.current) return;
    setFieldErrors({});
    const newErrors = {};
    const isDraft = status === 'DRAFT';

    if (workspace.isAnyUploading) {
      toast('กำลังเตรียมไฟล์ให้พร้อม กรุณารอสักครู่...', { icon: '⏳' });
      return;
    }

    if (workspace.hasFailedFiles) {
      setFieldErrors({ media: 'มีไฟล์ที่อัปโหลดไม่สำเร็จ กรุณาลบไฟล์นั้นหรือลองใหม่' });
      return;
    }

    if (!isDraft && isContentUploading) {
      setFieldErrors({ content: 'กรุณารอให้อัปโหลดรูปในรายละเอียดเพิ่มเติมเสร็จก่อนเผยแพร่' });
      return;
    }

    // Publish validations
    if (!isDraft) {
      if (!title.trim()) newErrors.title = 'กรุณากรอกชื่อหัวข้อสรุปความรู้';
      else if (title.length > 100) newErrors.title = 'ชื่อหัวข้อต้องมีความยาวไม่เกิน 100 ตัวอักษร';
      if (!level) newErrors.level = 'กรุณาเลือกระดับชั้น';
      if (!summary.trim()) newErrors.summary = 'กรุณากรอกบทสรุปย่อ';
      if (!categoryId && !categoryName) newErrors.category = 'กรุณาเลือกหมวดหมู่วิชา';
      if (!content.replace(/<[^>]*>/g, '').replace(/&nbsp;/g, ' ').trim()) {
        newErrors.content = 'กรุณากรอกรายละเอียดเพิ่มเติม';
      }

      if (!workspace.coverFile) {
        newErrors.cover = 'กรุณาอัปโหลดรูปภาพหน้าปก';
      } else if (workspace.coverFile.status !== 'VERIFIED') {
        newErrors.cover = 'กรุณารอให้อัปโหลดรูปภาพหน้าปกเสร็จสมบูรณ์';
      }

      if (workspace.mediaFiles.length === 0) {
        newErrors.media = 'กรุณาแนบรูปภาพประกอบหรือเอกสาร PDF อย่างน้อย 1 ไฟล์';
      } else if (workspace.mediaFiles.some(m => m.status !== 'VERIFIED')) {
        newErrors.media = 'มีไฟล์ที่ยังไม่พร้อมใช้งาน กรุณารอหรือลองใหม่อีกครั้ง';
      }
    }

    if (Object.keys(newErrors).length > 0) {
      setFieldErrors(newErrors);
      return;
    }

    submitting.current = true;
    const savingToastId = toast.loading('กำลังบันทึกโพสต์...');

    try {
      // Resolve category
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

      const activeSessionId = await workspace.ensureSession();

      // For draft without cover, automatically upload default draft cover
      let coverAssetId = workspace.coverAssetId;
      if (!coverAssetId && isDraft) {
        if (!draftCover.current) draftCover.current = await getDefaultDraftCoverFile();
        const defaultCover = draftCover.current;
        const clientFileId = crypto.randomUUID();
        const signData = await uploadWorkspaceService.signFile(activeSessionId, {
          clientFileId,
          assetType: 'COVER',
          originalName: defaultCover.name,
          contentType: defaultCover.type,
          size: defaultCover.size,
        });
        const uploadRes = await uploadWorkspaceService.uploadToCloudinary(defaultCover, signData);
        const verified = await uploadWorkspaceService.completeFile(activeSessionId, signData.asset_id, uploadRes);
        coverAssetId = verified.id || signData.asset_id;
      }

      const postPayload = {
        title: title.trim() || 'Untitled draft',
        summary: summary.trim(),
        content: content || '<p></p>',
        education_level: backendLevel,
        post_status: isDraft ? 'DRAFT' : 'ACTIVE',
        tags: hashtags,
        category_id: validCatId,
        upload_session_id: activeSessionId,
        cover_asset_id: coverAssetId,
        media_asset_ids: workspace.mediaAssetIds,
        idempotency_key: workspace.idempotencyKey,
      };

      const result = await postService.createPost(postPayload);
      Swal.close();

      if (result.success) {
        workspace.clearDraftSession();
        if (isDraft) {
          navigate('/profile?tab=drafts');
          Swal.fire({
            icon: 'success',
            title: 'บันทึกสำเร็จ!',
            text: 'บันทึกแบบร่างเรียบร้อยแล้ว',
            confirmButtonColor: '#3b82f6',
          });
        } else {
          const createdId = result.data?.id;
          navigate(createdId ? `/post/${createdId}` : '/explore');
          Swal.fire({
            icon: 'success',
            title: 'สำเร็จ!',
            text: 'สร้างโพสต์สรุปความรู้เรียบร้อยแล้ว',
            confirmButtonColor: '#3b82f6',
          });
        }
      } else {
        throw new Error(result.message || 'เกิดข้อผิดพลาดในการบันทึกข้อมูล');
      }
    } catch (error) {
      Swal.close();
      console.error('Error creating post V2:', error);
      const errMsg = translateUploadError(
        error,
        error.response?.data?.message || error.message || 'ไม่สามารถบันทึกโพสต์ได้'
      );
      Swal.fire({
        icon: 'error',
        title: 'เกิดข้อผิดพลาด',
        text: errMsg,
        confirmButtonColor: '#3b82f6',
      });
    } finally {
      toast.dismiss(savingToastId);
      submitting.current = false;
    }
  };

  // Legacy Submission
  const handleSubmitLegacy = async (status = 'ACTIVE') => {
    if (submitting.current) return;
    setFieldErrors({});
    const newErrors = {};
    const isDraft = status === 'DRAFT';
    if (!isDraft && isContentUploading) {
      setFieldErrors({ content: 'กรุณารอให้อัปโหลดรูปในรายละเอียดเพิ่มเติมเสร็จก่อนเผยแพร่' });
      return;
    }

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
        const sessionIsUsable =
          cached?.uploads?.uploadSessionExpiresAt &&
          Date.parse(cached.uploads.uploadSessionExpiresAt) > Date.now() + 30000;
        const sameFiles =
          cached &&
          sessionIsUsable &&
          cached.files.length === files.length &&
          files.every((file, index) => file === cached.files[index]);
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
            confirmButtonColor: '#3b82f6',
          });
        } else {
          const createdId = result.data?.id;
          navigate(createdId ? `/post/${createdId}` : '/explore');
          Swal.fire({
            icon: 'success',
            title: 'สำเร็จ!',
            text: 'สร้างโพสต์สรุปความรู้เรียบร้อยแล้ว',
            confirmButtonColor: '#3b82f6',
          });
        }
      } else {
        throw new Error(result.message || 'เกิดข้อผิดพลาดในการบันทึกข้อมูล');
      }
    } catch (error) {
      Swal.close();
      console.error('Error creating post:', error);
      const errMsg = translateUploadError(
        error,
        error.response?.data?.message || error.message || 'ไม่สามารถเชื่อมต่อกับเซิร์ฟเวอร์ได้'
      );
      Swal.fire({
        icon: 'error',
        title: 'เกิดข้อผิดพลาด',
        text: errMsg,
        confirmButtonColor: '#3b82f6',
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

  const handleSubmit = (status = 'ACTIVE') => {
    if (isV2) {
      return handleSubmitV2(status);
    }
    return handleSubmitLegacy(status);
  };

  // Cancel Create Post Action
  const handleCancelCreatePost = async () => {
    if (isV2 && (workspace.coverFile || workspace.mediaFiles.length > 0)) {
      const confirm = await Swal.fire({
        title: 'ยกเลิกการสร้างโพสต์?',
        text: 'ข้อมูลและไฟล์ที่อัปโหลดไว้ในแบบร่างนี้จะถูกยกเลิก',
        icon: 'warning',
        showCancelButton: true,
        confirmButtonText: 'ยืนยันยกเลิก',
        cancelButtonText: 'กลับไปแก้ไขต่อ',
        confirmButtonColor: '#ef4444',
      });
      if (!confirm.isConfirmed) return;
      await workspace.cancelDraftSession();
    }
    navigate('/home');
  };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-14">
      {/* Header Form */}
      <div className="bg-white rounded-[24px] shadow-sm border border-slate-100 overflow-hidden">
        <div className="p-6 sm:p-10 border-b border-slate-100 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-slate-50/50">
          <div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
              สร้างโพสต์สรุปความรู้
            </h1>
            <p className="text-slate-500 text-sm mt-1 font-normal">
              แบ่งปันความรู้ของคุณให้เพื่อนๆ ได้เรียนรู้ไปด้วยกัน
            </p>
          </div>
          {isV2 && (
            <div className="flex items-center gap-2 text-xs font-medium text-slate-500 bg-white px-3 py-1.5 rounded-lg border border-slate-200">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span>Upload Workspace พร้อมใช้งาน</span>
            </div>
          )}
        </div>

        <div className="p-6 sm:p-10 space-y-8">
          {/* Main Form Fields: Cover Image & Title / Level */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-start">
            {/* Cover Image Section */}
            <div className="md:col-span-1">
              <label className="flex items-center justify-between text-base font-bold text-slate-800 mb-1">
                <span>
                  รูปปก <span className="text-rose-500">*</span>
                </span>
                <span className="text-xs font-normal text-slate-500">ไม่เกิน 2 MB</span>
              </label>
              <p className="text-xs text-slate-400 mb-3">
                แนะนำอัตราส่วน 16:9 (เช่น 1280×720px) เพื่อให้แสดงผลสวยที่สุด
              </p>

              {isV2 ? (
                /* V2 Cover Area */
                workspace.coverFile ? (
                  <UploadWorkspaceItem
                    item={workspace.coverFile}
                    isCover={true}
                    onRemove={workspace.removeCover}
                    onRetry={workspace.retryFile}
                    onPreview={openPreview}
                  />
                ) : (
                  <label
                    className={`flex flex-col items-center justify-center w-full aspect-video border-2 border-dashed rounded-2xl hover:bg-slate-50 cursor-pointer transition-all ${fieldErrors.cover
                      ? 'border-red-500 hover:border-red-500'
                      : 'border-slate-300 hover:border-primary'
                      }`}
                  >
                    <ImageIcon className="h-10 w-10 text-slate-400 mb-3" />
                    <span className="text-sm font-medium text-slate-500">คลิกเพื่ออัปโหลดรูปปก</span>
                    <span className="text-xs text-slate-400 mt-1">
                      อัตราส่วน 16:9 (1280×720px) ขนาดไม่เกิน 2 MB
                    </span>
                    <input
                      test-data="cover-file-input"
                      type="file"
                      className="hidden"
                      accept=".jpg,.jpeg,.png,.webp"
                      onChange={(e) => {
                        const file = e.target.files[0];
                        if (file) workspace.setCover(file);
                        e.target.value = '';
                      }}
                    />
                  </label>
                )
              ) : (
                /* Legacy Cover Area */
                !coverImage ? (
                  <label
                    className={`flex flex-col items-center justify-center w-full aspect-video border-2 border-dashed rounded-2xl hover:bg-slate-50 cursor-pointer transition-all ${fieldErrors.cover
                      ? 'border-red-500 hover:border-red-500'
                      : 'border-slate-300 hover:border-primary'
                      }`}
                  >
                    <ImageIcon className="h-10 w-10 text-slate-400 mb-3" />
                    <span className="text-sm font-medium text-slate-500">คลิกเพื่ออัปโหลดรูปปก</span>
                    <span className="text-xs text-slate-400 mt-1">
                      อัตราส่วน 16:9 (1280×720px) ขนาดไม่เกิน 2 MB
                    </span>
                    <input
                      test-data="cover-file-input"
                      type="file"
                      className="hidden"
                      accept=".jpg,.jpeg,.png,.webp"
                      onChange={handleCoverUploadLegacy}
                    />
                  </label>
                ) : (
                  <div className="relative w-full aspect-video rounded-2xl overflow-hidden border border-slate-200 group">
                    <img
                      src={coverPreviewUrl}
                      alt="Cover"
                      className="w-full h-full object-cover object-center rounded-2xl cursor-pointer transition-transform duration-300 group-hover:scale-[1.02]"
                      onClick={() => openPreview(coverPreviewUrl, 'image')}
                    />
                    <button
                      test-data="remove-cover-button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setCoverImage(null);
                      }}
                      className="absolute top-3 right-3 p-1.5 bg-white/90 backdrop-blur-sm text-slate-500 hover:text-rose-500 hover:bg-rose-50 rounded-full transition-all z-10 shadow-sm border border-slate-200 hover:border-rose-200"
                      title="ลบรูปปก"
                    >
                      <X className="h-5 w-5" />
                    </button>
                    <div className="absolute inset-0 bg-black/30 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none rounded-2xl">
                      <Eye className="h-8 w-8" />
                    </div>
                  </div>
                )
              )}

              {fieldErrors.cover && (
                <p className="mt-1.5 text-xs text-red-500 font-medium" role="alert">
                  {fieldErrors.cover}
                </p>
              )}
            </div>

            {/* Title & Level Section */}
            <div className="md:col-span-1">
              <label className="flex items-center justify-between text-base font-bold text-slate-800 mb-3">
                <span>
                  ชื่อหัวข้อสรุป <span className="text-rose-500">*</span>
                </span>
                <span
                  className={`text-xs font-semibold ${title.length >= 100 ? 'text-rose-500' : 'text-slate-400'
                    }`}
                >
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
                  <GraduationCap className="h-5 w-5 text-slate-400" /> ระดับชั้น{' '}
                  <span className="text-rose-500">*</span>
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
                  <option value="" disabled>
                    เลือกระดับชั้น
                  </option>
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

          {/* Summary Section */}
          <div>
            <label className="flex items-center justify-between text-base font-bold text-slate-800 mb-3">
              <span className="flex items-center gap-2">
                <FileText className="h-5 w-5 text-slate-400" /> บทสรุปย่อ (Summary){' '}
                <span className="text-rose-500">*</span>
              </span>
              <span
                className={`text-xs font-semibold ${summary.length >= 200 ? 'text-rose-500' : 'text-slate-400'
                  }`}
              >
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
              <Tag className="h-5 w-5 text-slate-400" /> หมวดหมู่วิชาและแฮชแท็ก{' '}
              <span className="text-rose-500">*</span>
            </label>
            <div
              onClick={() => setShowModal(true)}
              className={`p-5 border border-dashed hover:border-primary rounded-2xl bg-white hover:bg-blue-50/10 cursor-pointer transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-4 ${fieldErrors.category ? 'border-red-500 bg-red-50/10' : 'border-slate-200'
                }`}
            >
              <div className="flex flex-col gap-2">
                {categoryName ? (
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-sm font-bold text-slate-400">วิชาที่เลือก:</span>
                    <span className="px-3 py-1 bg-primary/10 text-primary font-bold text-xs rounded-full">
                      {categoryName}
                    </span>
                  </div>
                ) : (
                  <span className="text-sm text-rose-500 font-medium">กรุณาเลือกหมวดหมู่วิชา *</span>
                )}

                {hashtags.length > 0 ? (
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-sm font-bold text-slate-400">แฮชแท็ก:</span>
                    <div className="flex flex-wrap gap-1.5">
                      {hashtags.map(tag => (
                        <span
                          key={tag}
                          className="px-2.5 py-0.5 bg-slate-100 text-slate-600 rounded-md text-xs font-semibold border border-slate-200"
                        >
                          {tag}
                        </span>
                      ))}
                    </div>
                  </div>
                ) : (
                  <span className="text-sm text-slate-400">
                    ยังไม่มีแฮชแท็ก (สามารถเพิ่มแท็กช่วยให้ค้นหาง่ายขึ้น)
                  </span>
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
              <p className="mt-1.5 text-xs text-red-500 font-medium" role="alert">
                {fieldErrors.category}
              </p>
            )}
          </div>

          {/* Rich Text Editor */}
          <div>
            <label className="flex items-center gap-2 text-base font-bold text-slate-800 mb-3">
              <AlignLeft className="h-5 w-5 text-slate-400" /> รายละเอียดเพิ่มเติม{' '}
              <span className="text-rose-500">*</span>
            </label>
            <ContentEditor
              value={content}
              onUploadingChange={setIsContentUploading}
              error={fieldErrors.content}
              onChange={(value) => {
                setContent(value);
                if (
                  fieldErrors.content &&
                  value.replace(/<[^>]*>/g, '').replace(/&nbsp;/g, ' ').trim()
                ) {
                  setFieldErrors(prev => ({ ...prev, content: null }));
                }
              }}
            />
          </div>

          {/* File Uploads (Split left/right) */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 pt-8 border-t border-slate-100">
            {/* Left: PDF */}
            <div>
              <label className="flex items-center justify-between text-base font-bold text-slate-800 mb-3">
                <span>ไฟล์เอกสาร PDF (ถ้ามี)</span>
                <span className="text-xs font-normal text-slate-500">{MAX_PDF_SIZE_LABEL}</span>
              </label>

              {isV2 ? (
                /* V2 PDF Area */
                workspace.pdfFileItem ? (
                  <UploadWorkspaceItem
                    item={workspace.pdfFileItem}
                    onRemove={workspace.removeMediaFile}
                    onRetry={workspace.retryFile}
                    onPreview={openPreview}
                  />
                ) : (
                  <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed border-slate-300 rounded-2xl hover:border-primary hover:bg-slate-50 cursor-pointer transition-all">
                    <UploadCloud className="h-8 w-8 text-slate-400 mb-2" />
                    <span className="text-sm font-medium text-slate-500">อัปโหลดไฟล์ PDF</span>
                    <span className="text-xs text-slate-400 mt-0.5">{MAX_PDF_SIZE_LABEL}</span>
                    <input
                      test-data="pdf-file-input"
                      type="file"
                      className="hidden"
                      accept=".pdf,application/pdf"
                      onChange={(e) => {
                        const file = e.target.files[0];
                        if (file) workspace.addMediaFiles([file]);
                        e.target.value = '';
                      }}
                    />
                  </label>
                )
              ) : (
                /* Legacy PDF Area */
                isPdfUploading ? (
                  <div className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed border-primary/40 bg-blue-50/50 rounded-2xl">
                    <Loader2 className="h-8 w-8 text-primary animate-spin mb-2" />
                    <span className="text-sm font-medium text-primary">กำลังอัปโหลด PDF...</span>
                    <button
                      test-data="cancel-pdf-upload-button"
                      type="button"
                      onClick={cancelPdfUploadLegacy}
                      className="mt-2 text-xs font-bold text-rose-600 hover:text-rose-700 cursor-pointer"
                    >
                      ยกเลิกการอัปโหลด
                    </button>
                  </div>
                ) : !pdfFile ? (
                  <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed border-slate-300 rounded-2xl hover:border-primary hover:bg-slate-50 cursor-pointer transition-all">
                    <UploadCloud className="h-8 w-8 text-slate-400 mb-2" />
                    <span className="text-sm font-medium text-slate-500">อัปโหลดไฟล์ PDF</span>
                    <span className="text-xs text-slate-400 mt-0.5">{MAX_PDF_SIZE_LABEL}</span>
                    <input
                      test-data="pdf-file-input"
                      type="file"
                      className="hidden"
                      accept=".pdf,application/pdf"
                      onChange={handlePdfUploadLegacy}
                    />
                  </label>
                ) : (
                  <div
                    className="flex items-center justify-between p-4 bg-blue-50 border border-blue-100 rounded-2xl group cursor-pointer hover:bg-blue-100/50 transition-colors"
                    onClick={() => openPreview(pdfFile, 'pdf')}
                  >
                    <div className="flex items-center gap-4 truncate">
                      <File className="h-8 w-8 text-primary flex-shrink-0" />
                      <div className="truncate">
                        <p className="font-bold text-slate-800 text-sm truncate group-hover:text-primary transition-colors">
                          {pdfFile.name}
                        </p>
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
                )
              )}
            </div>

            {/* Right: Media Images */}
            <div>
              <label className="flex items-center justify-between text-base font-bold text-slate-800 mb-3">
                <span>
                  รูปภาพประกอบ (
                  {isV2 ? workspace.imageFileItems.length : images.length}/15){' '}
                  <span className="text-rose-500">*</span>
                </span>
                <span className="text-xs font-normal text-slate-500">ไม่เกินรูปละ 2 MB</span>
              </label>

              {isV2 ? (
                /* V2 Media Images List */
                <div className="space-y-3">
                  {workspace.imageFileItems.map((item) => (
                    <UploadWorkspaceItem
                      key={item.clientFileId}
                      item={item}
                      onRemove={workspace.removeMediaFile}
                      onRetry={workspace.retryFile}
                      onPreview={openPreview}
                    />
                  ))}

                  {workspace.mediaFiles.length < 15 && (
                    <label className="flex items-center justify-center gap-2 p-3 border-2 border-dashed border-slate-300 hover:border-primary hover:bg-slate-50 rounded-xl cursor-pointer transition-colors text-slate-600 text-sm font-semibold">
                      <Plus className="w-4 h-4 text-slate-400" />
                      <span>เพิ่มรูปภาพประกอบ</span>
                      <input
                        test-data="other-images-file-input"
                        type="file"
                        className="hidden"
                        accept=".jpg,.jpeg,.png,.webp"
                        multiple
                        onChange={(e) => {
                          workspace.addMediaFiles(e.target.files);
                          e.target.value = '';
                        }}
                      />
                    </label>
                  )}
                </div>
              ) : (
                /* Legacy Media Images Grid */
                <div className="flex flex-wrap gap-4 pt-1">
                  {imagePreviews.map((item, idx) => (
                    <div
                      key={idx}
                      className="relative w-20 h-20 rounded-xl border border-slate-200 overflow-visible group"
                    >
                      <img
                        src={item.previewUrl}
                        alt={`img-${idx}`}
                        className="w-full h-full object-cover rounded-xl cursor-pointer"
                        onClick={() => openPreview(item.previewUrl, 'image')}
                      />
                      <button
                        test-data={`remove-supporting-image-button-${idx}`}
                        onClick={(e) => {
                          e.stopPropagation();
                          removeImageLegacy(idx);
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

                  <div className="relative group/btn inline-block">
                    <label
                      className={`w-20 h-20 border-2 border-dashed rounded-xl flex flex-col items-center justify-center transition-all ${images.length >= 15
                        ? 'border-slate-200 bg-slate-100 cursor-not-allowed opacity-60'
                        : fieldErrors.media
                          ? 'border-red-500 hover:border-red-500 hover:bg-slate-50 cursor-pointer'
                          : 'border-slate-300 hover:border-primary hover:bg-slate-50 cursor-pointer'
                        }`}
                    >
                      <Plus className="h-6 w-6 text-slate-400" />
                      <input
                        test-data="supporting-images-file-input"
                        type="file"
                        className="hidden"
                        accept=".jpg,.jpeg,.png,.webp"
                        multiple
                        onChange={handleImagesUploadLegacy}
                        disabled={images.length >= 15}
                      />
                    </label>
                    {images.length >= 15 && (
                      <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-max max-w-xs px-3 py-1.5 bg-slate-800 text-white text-xs rounded-lg opacity-0 group-hover/btn:opacity-100 transition-opacity pointer-events-none z-20 whitespace-normal text-center shadow-lg">
                        ไม่สามารถเพิ่มรูปได้เนื่องจากครบจำนวนแล้ว
                      </div>
                    )}
                  </div>
                </div>
              )}

              {fieldErrors.media && (
                <p className="mt-2 text-xs font-medium text-rose-500" role="alert">
                  {fieldErrors.media}
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Action Bar */}
        <div className="sticky bottom-0 z-40 bg-slate-50 p-6 sm:px-12 sm:py-8 border-t border-slate-100 flex flex-col sm:flex-row justify-between items-center gap-4 rounded-b-[24px] shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)]">
          <button
            test-data="cancel-create-post-button"
            type="button"
            onClick={handleCancelCreatePost}
            className="w-full sm:w-auto px-6 py-4 rounded-xl font-bold text-slate-600 bg-white border border-slate-200 hover:bg-slate-50 transition-colors shadow-sm cursor-pointer"
          >
            ยกเลิก
          </button>
          <div className="flex flex-col sm:flex-row gap-4 w-full sm:w-auto">
            <button
              test-data="save-draft-button"
              type="button"
              disabled={
                isV2
                  ? workspace.isAnyUploading || isContentUploading || submitting.current
                  : isPdfUploading || isContentUploading || submitting.current
              }
              onClick={() => handleSubmit('DRAFT')}
              className="w-full sm:w-auto px-6 py-4 rounded-xl font-bold text-primary bg-blue-50 border border-blue-100 hover:bg-blue-100 transition-colors flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Save className="h-5 w-5" />
              <span>บันทึกแบบร่าง</span>
            </button>
            <button
              test-data="publish-post-button"
              type="button"
              disabled={
                isV2
                  ? workspace.isAnyUploading || isContentUploading || submitting.current
                  : isPdfUploading || isContentUploading || submitting.current
              }
              onClick={() => handleSubmit('ACTIVE')}
              className="w-full sm:w-auto px-8 py-4 rounded-xl font-bold text-white bg-primary hover:bg-blue-600 transition-colors shadow-md hover:shadow-lg hover:-translate-y-0.5 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {isV2 && workspace.isAnyUploading && (
                <Loader2 className="h-4 w-4 animate-spin shrink-0" />
              )}
              <span>
                {isV2 && workspace.isAnyUploading ? 'กำลังเตรียมไฟล์ให้พร้อม...' : 'โพสต์สรุปความรู้'}
              </span>
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
              <button
                test-data="close-category-tags-modal-button"
                onClick={() => setShowModal(false)}
                className="p-2 text-slate-400 hover:bg-slate-200 hover:text-slate-800 rounded-full transition-colors cursor-pointer"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="p-6 flex flex-col gap-6 overflow-y-auto max-h-[70vh]">
              {/* Category Select */}
              <div>
                <label className="flex items-center gap-2 text-base font-bold text-slate-800 mb-3">
                  <BookOpen className="h-5 w-5 text-primary" /> หมวดหมู่วิชา{' '}
                  <span className="text-rose-500">*</span>
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
                  <option value="" disabled>
                    เลือกหมวดหมู่วิชา
                  </option>
                  {categoriesList.map((cat) => (
                    <option key={cat.id} value={cat.id}>
                      {cat.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Hashtag Management */}
              <div>
                <div className="flex justify-between items-center mb-3">
                  <label className="flex items-center gap-2 text-base font-bold text-slate-800">
                    <Tag className="h-5 w-5 text-primary" /> แฮชแท็ก ({hashtags.length}/3)
                  </label>
                  <span className="text-xs text-slate-400">กด Enter เพื่อเพิ่มแท็ก</span>
                </div>

                <div className="flex flex-wrap gap-2 p-3 bg-slate-50 border border-slate-200 rounded-2xl min-h-[56px] items-center focus-within:border-primary focus-within:bg-white transition-all">
                  {hashtags.map((tag) => (
                    <span
                      key={tag}
                      className="inline-flex items-center gap-1.5 px-3 py-1 bg-white border border-slate-200 text-slate-700 rounded-xl text-sm font-semibold shadow-xs"
                    >
                      {tag}
                      <button
                        type="button"
                        onClick={() => handleRemoveHashtag(tag)}
                        className="text-slate-400 hover:text-rose-500 transition-colors cursor-pointer"
                      >
                        <X className="h-3.5 w-3.5" />
                      </button>
                    </span>
                  ))}
                  {hashtags.length < 3 && (
                    <input
                      test-data="hashtag-input"
                      ref={tagInputRef}
                      type="text"
                      value={hashtagInput}
                      onChange={(e) => handleHashtagInputChange(e.target.value)}
                      onKeyDown={handleKeyDownHashtag}
                      placeholder={hashtags.length === 0 ? 'พิมพ์แท็ก เช่น TCAS67' : ''}
                      className="flex-1 min-w-[120px] bg-transparent border-none outline-none text-sm text-slate-700 placeholder:text-slate-400"
                    />
                  )}
                </div>

                {hashtagError && (
                  <p className="mt-2 text-xs text-rose-500 font-medium">{hashtagError}</p>
                )}

                {/* Suggested Tags */}
                <div className="mt-4">
                  <span className="text-xs font-bold text-slate-400 block mb-2">
                    แท็กแนะนำที่น่าสนใจ:
                  </span>
                  <div className="flex flex-wrap gap-2">
                    {SUGGESTED_TAGS.map((tag) => (
                      <button
                        key={tag}
                        type="button"
                        onClick={() => toggleSuggestedTag(tag)}
                        className={`text-xs px-3 py-1.5 rounded-lg border font-medium transition-all cursor-pointer ${hashtags.includes(tag)
                          ? 'bg-primary text-white border-primary shadow-xs'
                          : 'bg-white text-slate-600 border-slate-200 hover:border-primary/50 hover:bg-slate-50'
                          }`}
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
                className="px-6 py-2.5 bg-primary text-white font-bold rounded-xl text-sm hover:bg-blue-600 transition-colors shadow-sm cursor-pointer"
              >
                เสร็จสิ้น
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Preview for Images / PDF */}
      {previewFile && (
        <div
          className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200"
          onClick={closePreview}
        >
          <div
            className="relative bg-white rounded-2xl overflow-hidden max-w-4xl max-h-[90vh] w-full flex flex-col shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-4 border-b border-slate-100 flex justify-between items-center bg-slate-50">
              <span className="text-sm font-bold text-slate-700">ดูตัวอย่างไฟล์</span>
              <button
                onClick={closePreview}
                className="p-1.5 text-slate-400 hover:bg-slate-200 hover:text-slate-800 rounded-full transition-colors cursor-pointer"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="p-4 flex items-center justify-center flex-1 overflow-auto bg-slate-100/50">
              {previewFile.type === 'pdf' ? (
                <iframe
                  src={previewFile.url}
                  className="w-full h-[70vh] rounded-xl border border-slate-200 bg-white"
                  title="PDF Preview"
                />
              ) : (
                <img
                  src={previewFile.url}
                  alt="Preview"
                  className="max-h-[75vh] max-w-full object-contain rounded-xl"
                />
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
