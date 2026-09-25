// Central Upload Constants & Helpers for Post Media

export const MAX_PDF_SIZE_BYTES = 20 * 1024 * 1024; // 20 MB
export const MAX_PDF_SIZE_LABEL = 'PDF ไม่เกิน 20 MB';
export const ALLOWED_PDF_MIME_TYPES = ['application/pdf'];
export const ALLOWED_PDF_EXTENSIONS = ['pdf'];

export const MAX_IMAGE_SIZE_BYTES = 2 * 1024 * 1024; // 2 MB
export const MAX_IMAGE_SIZE_LABEL = 'ไม่เกิน 2 MB';
export const ALLOWED_IMAGE_MIME_TYPES = ['image/jpeg', 'image/png', 'image/jpg', 'image/webp'];
export const ALLOWED_IMAGE_EXTENSIONS = ['jpg', 'jpeg', 'png', 'webp'];

export const MAX_MEDIA_FILES_COUNT = 15;

export const BACKEND_ERROR_MAP = {
  PDF_TOO_LARGE: 'ไฟล์ PDF ต้องไม่เกิน 20 MB',
  INVALID_PDF: 'ไฟล์นี้ไม่ใช่ PDF ที่ถูกต้อง',
  UPLOAD_SESSION_EXPIRED: 'สิทธิ์อัปโหลดหมดอายุ กรุณาลองใหม่',
  PDF_STORAGE_ERROR: 'ไม่สามารถอัปโหลด PDF ได้',
  UPLOAD_SESSION_FORBIDDEN: 'ไม่มีสิทธิ์ในการอัปโหลดไฟล์นี้',
  INVALID_UPLOAD_SESSION: 'รูปแบบ upload session ไม่ถูกต้อง',
  PDF_OBJECT_NOT_FOUND: 'ไม่พบไฟล์ PDF ในระบบจัดเก็บ',
  DOWNLOAD_FAILED: 'ไม่สามารถดาวน์โหลดไฟล์ได้',
  ABORT_ERROR: 'การอัปโหลดไฟล์ถูกยกเลิกหรือหมดเวลา',
  NETWORK_ERROR: 'ไม่สามารถเชื่อมต่อกับเซิร์ฟเวอร์ได้',
};

/**
 * Translates backend error code or message to Thai user-friendly message.
 * @param {Error|object|string} error
 * @param {string} fallbackMessage
 * @returns {string}
 */
export function translateUploadError(error, fallbackMessage = 'เกิดข้อผิดพลาดในการอัปโหลดไฟล์') {
  if (!error) return fallbackMessage;

  if (typeof error === 'string') {
    return BACKEND_ERROR_MAP[error] || error;
  }

  const code = error?.response?.data?.code || error?.code;
  if (code === 'ERR_CANCELED' || error?.name === 'CanceledError' || error?.name === 'AbortError') {
    return BACKEND_ERROR_MAP.ABORT_ERROR;
  }
  if (code && BACKEND_ERROR_MAP[code]) {
    return BACKEND_ERROR_MAP[code];
  }

  const backendMsg = error?.response?.data?.message || error?.message;
  if (backendMsg) {
    if (backendMsg.includes('PDF_TOO_LARGE') || backendMsg.includes('เกิน 20 MB')) {
      return BACKEND_ERROR_MAP.PDF_TOO_LARGE;
    }
    if (backendMsg.includes('INVALID_PDF')) {
      return BACKEND_ERROR_MAP.INVALID_PDF;
    }
    if (backendMsg.includes('UPLOAD_SESSION_EXPIRED')) {
      return BACKEND_ERROR_MAP.UPLOAD_SESSION_EXPIRED;
    }
    if (backendMsg.includes('PDF_STORAGE_ERROR')) {
      return BACKEND_ERROR_MAP.PDF_STORAGE_ERROR;
    }
    if (backendMsg.includes('aborted') || backendMsg.includes('canceled') || backendMsg.includes('timeout')) {
      return BACKEND_ERROR_MAP.ABORT_ERROR;
    }
    return backendMsg;
  }

  return fallbackMessage;
}

/**
 * Validates a PDF file client-side before any network request or upload.
 * @param {File} file
 * @returns {{ valid: boolean, error?: string, code?: string }}
 */
export function validatePdfFile(file) {
  if (!file) {
    return { valid: false, error: 'กรุณาเลือกไฟล์ PDF', code: 'INVALID_PDF' };
  }

  const fileName = file.name || '';
  const lastDot = fileName.lastIndexOf('.');
  const ext = lastDot !== -1 ? fileName.slice(lastDot + 1).toLowerCase() : '';
  const mimeType = (file.type || '').toLowerCase();

  // Accept only .pdf extension
  if (!ALLOWED_PDF_EXTENSIONS.includes(ext)) {
    return { valid: false, error: 'ไฟล์นี้ไม่ใช่ PDF ที่ถูกต้อง', code: 'INVALID_PDF' };
  }

  // Require both the .pdf extension and the browser-provided PDF MIME type.
  if (!ALLOWED_PDF_MIME_TYPES.includes(mimeType)) {
    return { valid: false, error: 'ไฟล์นี้ไม่ใช่ PDF ที่ถูกต้อง', code: 'INVALID_PDF' };
  }

  // Size validation
  if (file.size <= 0) {
    return { valid: false, error: 'ขนาดไฟล์ PDF ไม่ถูกต้อง (ไฟล์ว่างเปล่า)', code: 'INVALID_PDF' };
  }

  if (file.size > MAX_PDF_SIZE_BYTES) {
    return { valid: false, error: 'ไฟล์ PDF ต้องไม่เกิน 20 MB', code: 'PDF_TOO_LARGE' };
  }

  return { valid: true };
}

/**
 * Formats byte size to human-readable string (e.g. 1.25 MB)
 * @param {number} bytes
 * @returns {string}
 */
export function formatFileSize(bytes) {
  if (typeof bytes !== 'number' || isNaN(bytes) || bytes < 0) return '0 B';
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}
