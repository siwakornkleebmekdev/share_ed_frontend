import { useEffect, useMemo, useRef, useState } from 'react';
import ReactQuill from 'react-quill-new';
import 'react-quill-new/dist/quill.snow.css';
import { AlignCenter, AlignLeft, AlignRight, ImagePlus, LoaderCircle, RotateCcw } from 'lucide-react';
import { postService } from '@/services/post.service';

const MAX_IMAGES = 15;
const MAX_SIZE = 10 * 1024 * 1024;
const imageTypes = ['image/jpeg', 'image/png', 'image/webp'];
const editorFormats = [
  'header', 'bold', 'italic', 'underline', 'strike',
  'color', 'background', 'list', 'indent', 'align',
  'blockquote', 'link', 'image',
];
const Quill = ReactQuill.Quill;
const BaseImage = Quill.import('formats/image');

// Quill normally remembers only src/width/height for images.  Registering this
// small extension makes alignment part of the editor value as well, so it is
// not lost when the controlled React value renders again.
class AlignedImage extends BaseImage {
  static formats(domNode) {
    const formats = super.formats(domNode);
    const alignment = domNode.getAttribute('data-align');
    return alignment ? { ...formats, align: alignment } : formats;
  }

  format(name, value) {
    if (name === 'align') {
      if (!value) {
        this.domNode.removeAttribute('data-align');
        this.domNode.style.marginLeft = '';
        this.domNode.style.marginRight = '';
        return;
      }
      this.domNode.setAttribute('data-align', value);
      this.domNode.style.display = value === 'left' ? 'inline' : 'block';
      this.domNode.style.cssFloat = value === 'left' ? 'left' : '';
      this.domNode.style.marginLeft = value === 'right' || value === 'center' ? 'auto' : '0px';
      this.domNode.style.marginRight = value === 'left' ? '16px' : (value === 'center' ? 'auto' : '0px');
      this.domNode.style.marginBottom = value === 'left' ? '8px' : '';
      return;
    }
    super.format(name, value);
  }
}

Quill.register(AlignedImage, true);
const WidthStyle = Quill.import('attributors/style/width');
if (WidthStyle) {
  Quill.register(WidthStyle, true);
}

export default function ContentEditor({ value, onChange, error, onUploadingChange }) {
  const quillRef = useRef(null);
  const fileRef = useRef(null);
  const [uploads, setUploads] = useState([]);
  const [validationError, setValidationError] = useState('');
  const [selectedImage, setSelectedImage] = useState(null);
  const [selectionRect, setSelectionRect] = useState(null);
  const draggedImageRef = useRef(null);
  const selectedImageRef = useRef(null);
  const imageCount = ((value || '').match(/<img\b/gi) || []).length;

  const upload = async (file) => {
    // Do not add impossible-to-retry validation failures to the upload list.
    // Otherwise selecting the same oversized image keeps duplicating errors.
    if (!imageTypes.includes(file.type) || file.size > MAX_SIZE) {
      setValidationError('รองรับ JPEG, PNG และ WebP ขนาดไม่เกิน 10 MB กรุณาเลือกรูปที่เล็กลงแล้วลองอีกครั้ง');
      return;
    }
    if (imageCount + uploads.filter(item => !item.error).length >= MAX_IMAGES) {
      setValidationError('เพิ่มรูปในรายละเอียดได้สูงสุด 15 รูป');
      return;
    }
    setValidationError('');
    if (!imageTypes.includes(file.type) || file.size > MAX_SIZE) {
      setUploads(items => [...items, { id: crypto.randomUUID(), file, error: 'รองรับ JPEG, PNG และ WebP ขนาดไม่เกิน 10 MB' }]);
      return;
    }
    if (imageCount + uploads.filter(item => !item.error).length >= MAX_IMAGES) {
      setUploads(items => [...items, { id: crypto.randomUUID(), file, error: 'เพิ่มรูปในรายละเอียดได้สูงสุด 15 รูป' }]);
      return;
    }
    const id = crypto.randomUUID();
    setUploads(items => [...items, { id, file, progress: 0 }]);
    onUploadingChange?.(true);
    try {
      const url = await postService.uploadDirectToCloudinary(file, 'content');
      const quill = quillRef.current?.getEditor();
      const range = quill?.getSelection(true) || { index: quill?.getLength() || 0 };
      quill?.insertEmbed(range.index, 'image', url, 'user');
      quill?.setSelection(range.index + 1, 0);
      setUploads(items => items.filter(item => item.id !== id));
    } catch {
      setUploads(items => items.map(item => item.id === id ? { ...item, error: 'อัปโหลดรูปไม่สำเร็จ กรุณาลองใหม่' } : item));
    } finally {
      onUploadingChange?.(false);
    }
  };

  const pickFiles = (files) => Array.from(files || []).forEach(upload);
  const modules = useMemo(() => ({
    toolbar: {
      container: [
        [{ header: [1, 2, 3, false] }],
        ['bold', 'italic', 'underline', 'strike'],
        [{ color: [] }, { background: [] }],
        [{ list: 'ordered' }, { list: 'bullet' }, { indent: '-1' }, { indent: '+1' }],
        [{ align: [] }],
        ['blockquote', 'link', 'image'],
        ['clean'],
      ],
      handlers: { image: () => fileRef.current?.click() },
    },
    history: { delay: 500, maxStack: 100, userOnly: true },
    clipboard: { matchVisual: false },
  }), []);

  useEffect(() => {
    const quill = quillRef.current?.getEditor();
    if (!quill) return undefined;
    const root = quill.root;
    const clearImageSelection = () => {
      root.querySelectorAll('img').forEach(img => img.classList.remove('ring-2', 'ring-primary'));
      selectedImageRef.current = null;
      setSelectedImage(null);
      setSelectionRect(null);
    };
    const selectImage = (event) => {
      root.querySelectorAll('img').forEach(img => img.classList.remove('ring-2', 'ring-primary'));
      if (event.target?.tagName !== 'IMG') {
        clearImageSelection();
        return;
      }
      event.target.classList.add('ring-2', 'ring-primary');
      event.target.draggable = true;
      selectedImageRef.current = event.target;
      setSelectedImage(event.target);
      setSelectionRect(event.target.getBoundingClientRect());
    };
    const dragStart = (event) => {
      if (event.target?.tagName !== 'IMG') return;
      draggedImageRef.current = event.target;
      event.dataTransfer.effectAllowed = 'move';
    };
    const clearFromOutsideClick = (event) => {
      if (root.contains(event.target)) return;
      if (event.target.closest?.('.content-image-action-button, .content-image-resize-handle')) return;
      clearImageSelection();
    };
    root.addEventListener('click', selectImage);
    root.addEventListener('dragstart', dragStart);
    document.addEventListener('mousedown', clearFromOutsideClick);
    root.querySelectorAll('img').forEach(img => { img.draggable = true; });
    return () => {
      root.removeEventListener('click', selectImage);
      root.removeEventListener('dragstart', dragStart);
      document.removeEventListener('mousedown', clearFromOutsideClick);
    };
  }, [value]);

  useEffect(() => {
    const updateHandlePosition = () => {
      const image = selectedImageRef.current;
      if (!image?.isConnected) {
        selectedImageRef.current = null;
        setSelectedImage(null);
        setSelectionRect(null);
        return;
      }
      setSelectionRect(image.getBoundingClientRect());
    };
    window.addEventListener('resize', updateHandlePosition);
    window.addEventListener('scroll', updateHandlePosition, true);
    return () => {
      window.removeEventListener('resize', updateHandlePosition);
      window.removeEventListener('scroll', updateHandlePosition, true);
    };
  }, []);

  const startResize = (event) => {
    event.preventDefault();
    event.stopPropagation();
    const image = selectedImageRef.current;
    const quill = quillRef.current?.getEditor();
    const editorRect = quill?.root.getBoundingClientRect();
    if (!image || !editorRect) return;
    const startX = event.clientX;
    const startWidth = image.getBoundingClientRect().width;
    const imageIndex = quill.getIndex(Quill.find(image));
    let finalWidth = startWidth;
    const previousUserSelect = document.body.style.userSelect;
    document.body.style.userSelect = 'none';
    const resize = (moveEvent) => {
      const nextWidth = Math.max(editorRect.width * 0.15, Math.min(editorRect.width, startWidth + moveEvent.clientX - startX));
      finalWidth = Math.round(nextWidth);
      image.style.width = `${finalWidth}px`;
      image.style.maxWidth = '100%';
      image.style.height = 'auto';
      setSelectionRect(image.getBoundingClientRect());
    };
    const finish = () => {
      document.body.style.userSelect = previousUserSelect;
      // Width is a supported Image format in Quill.  Saving it through the
      // editor (rather than only changing the DOM) keeps it after React rerenders.
      if (Number.isInteger(imageIndex)) {
        quill.formatText(imageIndex, 1, 'width', String(finalWidth), 'user');
      } else {
        onChange(quill.root.innerHTML || value);
      }
      requestAnimationFrame(() => {
        const currentImage = selectedImageRef.current;
        if (currentImage?.isConnected) setSelectionRect(currentImage.getBoundingClientRect());
      });
      window.removeEventListener('mousemove', resize);
      window.removeEventListener('mouseup', finish);
    };
    window.addEventListener('mousemove', resize);
    window.addEventListener('mouseup', finish, { once: true });
  };

  const alignSelectedImage = (alignment) => {
    const image = selectedImageRef.current;
    const quill = quillRef.current?.getEditor();
    if (!image || !quill) return;

    image.setAttribute('data-align', alignment);
    image.style.display = alignment === 'left' ? 'inline' : 'block';
    image.style.cssFloat = alignment === 'left' ? 'left' : '';
    image.style.marginLeft = alignment === 'right' || alignment === 'center' ? 'auto' : '0px';
    image.style.marginRight = alignment === 'left' ? '16px' : (alignment === 'center' ? 'auto' : '0px');
    image.style.marginBottom = alignment === 'left' ? '8px' : '';
    image.classList.remove('ring-2', 'ring-primary');
    const nextValue = quill.root.innerHTML;
    image.classList.add('ring-2', 'ring-primary');
    onChange(nextValue);

    requestAnimationFrame(() => {
      if (selectedImageRef.current?.isConnected) setSelectionRect(selectedImageRef.current.getBoundingClientRect());
    });
  };

  const handleDrop = (event) => {
    event.stopPropagation();
    const files = event.dataTransfer?.files;
    if (files?.length) { event.preventDefault(); pickFiles(files); return; }
    const image = draggedImageRef.current;
    if (!image) return;
    event.preventDefault();
    const quill = quillRef.current?.getEditor();
    const source = quill?.getIndex(Quill.find(image));
    const targetBlot = Quill.find(event.target, true);
    let target = targetBlot ? quill.getIndex(targetBlot) : quill.getLength();
    if (event.target?.tagName === 'IMG' && event.clientY > event.target.getBoundingClientRect().top + event.target.height / 2) target += 1;
    if (Number.isInteger(source)) {
      const src = image.getAttribute('src');
      const width = image.getAttribute('width') || image.style.width;
      const alignment = image.getAttribute('data-align');
      const marginLeft = image.style.marginLeft;
      const marginRight = image.style.marginRight;
      quill.deleteText(source, 1, 'user');
      if (target > source) target -= 1;
      quill.insertEmbed(target, 'image', src, 'user');
      const inserted = [...quill.root.querySelectorAll('img')].reverse().find(img => img.getAttribute('src') === src);
      if (inserted) {
        if (width) {
          inserted.style.width = width;
          inserted.style.maxWidth = '100%';
          inserted.style.height = 'auto';
        }
        inserted.style.display = 'block';
        inserted.style.marginLeft = marginLeft;
        inserted.style.marginRight = marginRight;
      }
      quill.setSelection(target + 1, 0);
      if (width) quill.formatText(target, 1, 'width', width, 'user');
      if (alignment) quill.formatText(target, 1, 'align', alignment, 'user');
      if (!width && !alignment) onChange(quill.root.innerHTML);
    }
    draggedImageRef.current = null;
    selectedImageRef.current = null;
    setSelectedImage(null);
    setSelectionRect(null);
  };

  return <div test-data="post-content-input" onDropCapture={handleDrop} onDragOverCapture={(event) => event.preventDefault()} onPaste={(e) => { const files = Array.from(e.clipboardData?.items || []).filter(item => item.type.startsWith('image/')).map(item => item.getAsFile()); if (files.length) { e.preventDefault(); pickFiles(files); } }}>
    <div className={`border rounded-xl overflow-hidden bg-white focus-within:ring-2 focus-within:ring-primary/20 focus-within:border-primary transition-all ${error ? 'border-rose-500' : 'border-slate-200'}`}>
      <ReactQuill ref={quillRef} theme="snow" value={value || ''} onChange={onChange} modules={modules} formats={editorFormats} className="content-editor min-h-48 border-0" placeholder="อธิบายเพิ่มเติมเกี่ยวกับเนื้อหา เทคนิคการจำ หรือที่มา..." />
    </div>
    {selectedImage && <div className="mt-2 flex flex-wrap items-center gap-1.5 text-xs text-slate-500">
      <span className="mr-1 font-medium">จัดตำแหน่งรูป:</span>
      <button type="button" title="จัดรูปชิดซ้าย" onClick={() => alignSelectedImage('left')} className="content-image-action-button"><AlignLeft className="h-4 w-4" /> ซ้าย</button>
      <button type="button" title="จัดรูปกึ่งกลาง" onClick={() => alignSelectedImage('center')} className="content-image-action-button"><AlignCenter className="h-4 w-4" /> กึ่งกลาง</button>
      <button type="button" title="จัดรูปชิดขวา" onClick={() => alignSelectedImage('right')} className="content-image-action-button"><AlignRight className="h-4 w-4" /> ขวา</button>
    </div>}
    <input test-data="content-image-file-input" ref={fileRef} className="hidden" type="file" accept="image/jpeg,image/png,image/webp" onChange={(e) => { pickFiles(e.target.files); e.target.value = ''; }} />
    {selectedImage && selectionRect && <button type="button" aria-label="ลากเพื่อปรับขนาดรูปภาพ" onMouseDown={startResize} className="content-image-resize-handle fixed z-50 h-4 w-4 cursor-se-resize rounded-sm border-2 border-white bg-primary shadow" style={{ left: selectionRect.right - 8, top: selectionRect.bottom - 8 }} />}
    <p className="mt-2 text-xs text-slate-500 flex items-center gap-1"><ImagePlus className="h-3.5 w-3.5" /> เพิ่มรูปจากปุ่มใน toolbar, ลากไฟล์ หรือวางจาก clipboard (JPEG/PNG/WebP, ไม่เกิน 10 MB)</p>
    {validationError && <p className="mt-2 text-xs font-medium text-rose-500" role="alert">{validationError}</p>}
    {uploads.map(item => <div key={item.id} className={`mt-2 text-xs ${item.error ? 'text-rose-500' : 'text-primary'} flex items-center gap-2`}>
      {item.error ? <><span>{item.error}</span><button type="button" className="underline" onClick={() => { setUploads(items => items.filter(x => x.id !== item.id)); upload(item.file); }}><RotateCcw className="inline h-3.5 w-3.5" /> ลองใหม่</button></> : <><LoaderCircle className="h-3.5 w-3.5 animate-spin" /> กำลังอัปโหลด {item.file.name}</>}
    </div>)}
    {error && <p className="mt-2 text-xs font-medium text-rose-500" role="alert">{error}</p>}
  </div>;
}
