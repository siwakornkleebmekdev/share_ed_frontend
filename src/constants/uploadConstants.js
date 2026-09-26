// Central Upload Constants & Helpers for Post Media & Upload Workspace V2

export const MAX_PDF_SIZE_BYTES = 20 * 1024 * 1024; // 20 MB
export const MAX_PDF_SIZE_LABEL = 'PDF ไม่เกิน 20 MB';
export const ALLOWED_PDF_MIME_TYPES = ['application/pdf', 'application/x-pdf'];
export const ALLOWED_PDF_EXTENSIONS = ['pdf'];

export const MAX_IMAGE_SIZE_BYTES = 2 * 1024 * 1024; // 2 MB
export const MAX_IMAGE_SIZE_LABEL = 'ไม่เกิน 2 MB';
export const MAX_SUPPORTING_IMAGES_COUNT = 5;
export const ALLOWED_IMAGE_MIME_TYPES = ['image/jpeg', 'image/png', 'image/jpg', 'image/webp', 'image/apng'];
export const ALLOWED_IMAGE_EXTENSIONS = ['jpg', 'jpeg', 'png', 'webp', 'apng'];

export const MAX_MEDIA_FILES_COUNT = 15;
export const MAX_TOTAL_POST_BYTES = 50 * 1024 * 1024; // 50 MB
export const MAX_TOTAL_POST_LABEL = 'ขนาดรวมสูงสุด 50 MB';

// Upload Workspace V2 is intentionally dormant. Create/Edit Post always use
// the established Cloudinary + Supabase signed-upload flow.
export function isUploadWorkspaceV2Enabled() {
  return false;
}

// Authoritative Backend Error Code Mapping (Thai UX)
export const BACKEND_ERROR_MAP = {
  INVALID_UPLOAD_SESSION: 'เซสชันอัปโหลดไม่ถูกต้อง กรุณาลองใหม่',
  UPLOAD_SESSION_EXPIRED: 'สิทธิ์อัปโหลดหมดอายุ กรุณาลองใหม่',
  UPLOAD_SESSION_FORBIDDEN: 'คุณไม่มีสิทธิ์ใช้งานไฟล์ชุดนี้',
  UPLOAD_ASSET_NOT_FOUND: 'ไม่พบไฟล์ที่อัปโหลด',
  UPLOAD_ASSET_CONFLICT: 'ไฟล์นี้ถูกใช้งานแล้ว กรุณาเลือกไฟล์ใหม่',
  INVALID_IMAGE: 'ไฟล์รูปภาพไม่ถูกต้อง',
  INVALID_PDF: 'ไฟล์นี้ไม่ใช่ PDF ที่ถูกต้อง',
  PDF_TOO_LARGE: 'ไฟล์ PDF ต้องไม่เกิน 20 MB',
  TOTAL_UPLOAD_TOO_LARGE: 'ขนาดไฟล์รวมเกินกำหนด',
  UPLOAD_VERIFICATION_FAILED: 'ไม่สามารถตรวจสอบไฟล์ได้ กรุณาลองใหม่',
  STORAGE_PROVIDER_ERROR: 'ระบบจัดเก็บไฟล์ขัดข้อง กรุณาลองใหม่',
  CLOUDINARY_CONFIG_ERROR: 'ระบบอัปโหลดรูปภาพยังไม่พร้อม กรุณาติดต่อผู้ดูแลระบบ',
  RATE_LIMITED: 'มีการอัปโหลดถี่เกินไป กรุณารอสักครู่',
  UNAUTHORIZED: 'กรุณาเข้าสู่ระบบใหม่',
  AUTH_SESSION_MISSING: 'กรุณาเข้าสู่ระบบก่อนดำเนินการ',
  PDF_STORAGE_ERROR: 'ระบบจัดเก็บไฟล์ PDF ขัดข้อง กรุณาลองใหม่',
  PDF_OBJECT_NOT_FOUND: 'ไม่พบไฟล์ PDF ในระบบจัดเก็บ',
  DOWNLOAD_FAILED: 'ไม่สามารถดาวน์โหลดไฟล์ได้',
  ABORT_ERROR: 'การอัปโหลดไฟล์ถูกยกเลิกหรือหมดเวลา',
  NETWORK_ERROR: 'ไม่สามารถเชื่อมต่อกับเซิร์ฟเวอร์ได้ กรุณาตรวจสอบอินเทอร์เน็ต',
};

// Non-retryable error codes: client validation, unauthorized, or definitive errors
export const NON_RETRYABLE_ERROR_CODES = new Set([
  'INVALID_IMAGE',
  'INVALID_PDF',
  'PDF_TOO_LARGE',
  'TOTAL_UPLOAD_TOO_LARGE',
  'UPLOAD_SESSION_FORBIDDEN',
  'UNAUTHORIZED',
  'AUTH_SESSION_MISSING',
  'UPLOAD_ASSET_NOT_FOUND',
  'UPLOAD_ASSET_CONFLICT',
  'INVALID_UPLOAD_SESSION',
  'POST_VALIDATION_FAILED',
]);

/**
 * Checks if an upload error is eligible for retry (network error, timeout, 429, 5xx)
 * @param {Error|object} error
 * @returns {boolean}
 */
export function isRetryableError(error) {
  if (!error) return false;

  const status = error.response?.status || error.status;
  const code = error.response?.data?.code || error.code;

  // Never retry non-retryable backend codes
  if (code && NON_RETRYABLE_ERROR_CODES.has(code)) {
    return false;
  }

  // Never retry 400, 401, 403, 404, 409
  if (status && [400, 401, 403, 404, 409].includes(status)) {
    return false;
  }

  // 429 Rate limited is retryable (respecting Retry-After)
  if (status === 429 || code === 'RATE_LIMITED') {
    return true;
  }

  // 5xx Server errors are retryable
  if (status && status >= 500 && status < 600) {
    return true;
  }

  // Network drops or timeouts
  if (code === 'ECONNABORTED' || code === 'ETIMEDOUT' || error.message?.includes('Network Error') || error.message?.includes('timeout')) {
    return true;
  }

  return false;
}

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
    if (backendMsg.includes('INVALID_PDF') || backendMsg.includes('ไม่ใช่ PDF')) {
      return BACKEND_ERROR_MAP.INVALID_PDF;
    }
    if (backendMsg.includes('UPLOAD_SESSION_EXPIRED') || backendMsg.includes('หมดอายุ')) {
      return BACKEND_ERROR_MAP.UPLOAD_SESSION_EXPIRED;
    }
    if (backendMsg.includes('UPLOAD_SESSION_FORBIDDEN') || backendMsg.includes('ไม่มีสิทธิ์')) {
      return BACKEND_ERROR_MAP.UPLOAD_SESSION_FORBIDDEN;
    }
    if (backendMsg.includes('TOTAL_UPLOAD_TOO_LARGE') || backendMsg.includes('ขนาดไฟล์รวมเกิน')) {
      return BACKEND_ERROR_MAP.TOTAL_UPLOAD_TOO_LARGE;
    }
    if (backendMsg.includes('aborted') || backendMsg.includes('canceled') || backendMsg.includes('timeout')) {
      return BACKEND_ERROR_MAP.ABORT_ERROR;
    }
    if (backendMsg.includes('Network Error')) {
      return BACKEND_ERROR_MAP.NETWORK_ERROR;
    }
    return backendMsg;
  }

  return fallbackMessage;
}

/**
 * Validates an Image file client-side before any network request or upload.
 * @param {File} file
 * @param {boolean} [isCover=false]
 * @returns {{ valid: boolean, error?: string, code?: string }}
 */
export function validateImageFile(file, isCover = false) {
  if (!file) {
    return { valid: false, error: isCover ? 'กรุณาเลือกรูปภาพหน้าปก' : 'กรุณาเลือกไฟล์รูปภาพ', code: 'INVALID_IMAGE' };
  }

  const fileName = file.name || '';
  const lastDot = fileName.lastIndexOf('.');
  const ext = lastDot !== -1 ? fileName.slice(lastDot + 1).toLowerCase() : '';
  const mimeType = (file.type || '').toLowerCase();

  const isExtValid = ALLOWED_IMAGE_EXTENSIONS.includes(ext);
  const isMimeValid = ALLOWED_IMAGE_MIME_TYPES.includes(mimeType) || !mimeType;

  if (!isExtValid || !isMimeValid) {
    return {
      valid: false,
      error: isCover
        ? 'รูปภาพหน้าปกต้องเป็นไฟล์ .jpg, .jpeg, .png หรือ .webp เท่านั้น'
        : 'รูปภาพต้องเป็นไฟล์ .jpg, .jpeg, .png หรือ .webp เท่านั้น',
      code: 'INVALID_IMAGE',
    };
  }

  if (file.size <= 0) {
    return { valid: false, error: 'ขนาดไฟล์รูปภาพไม่ถูกต้อง (ไฟล์ว่างเปล่า)', code: 'INVALID_IMAGE' };
  }

  if (file.size > MAX_IMAGE_SIZE_BYTES) {
    return {
      valid: false,
      error: isCover ? 'รูปหน้าปกต้องมีขนาดไม่เกิน 2 MB' : 'รูปภาพประกอบต้องมีขนาดไม่เกิน 2 MB',
      code: 'INVALID_IMAGE',
    };
  }

  return { valid: true };
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

  if (!ALLOWED_PDF_EXTENSIONS.includes(ext) || !ALLOWED_PDF_MIME_TYPES.includes(mimeType)) {
    return { valid: false, error: 'ไฟล์นี้ไม่ใช่ PDF ที่ถูกต้อง', code: 'INVALID_PDF' };
  }

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
