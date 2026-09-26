import api from '../utils/api.js';
import { supabase } from '../utils/supabase.js';
import { translateUploadError } from '../constants/uploadConstants.js';
import { parseRetryAfter } from '../utils/uploadQueue.js';

/**
 * Standardize an error from backend or provider to contain code, status, retryAfter, and Thai message
 */
function normalizeUploadError(error, defaultMsg = 'เกิดข้อผิดพลาดในการอัปโหลดไฟล์') {
  const status = error?.response?.status || error?.status || null;
  const code = error?.response?.data?.code || error?.code || 'UPLOAD_ERROR';
  const retryAfter = parseRetryAfter(error?.response);

  const thaiMsg = translateUploadError(error, error?.response?.data?.message || error?.message || defaultMsg);
  const err = new Error(thaiMsg);
  err.code = code;
  err.status = status;
  err.retryAfter = retryAfter;
  err.response = error?.response;
  err.originalError = error;
  return err;
}

export const uploadWorkspaceService = {
  /**
   * 1. Create or Reuse an Upload Session
   * POST /api/v1/posts/upload-sessions
   * @param {string} draftId - UUID
   * @param {object} [options] - { signal }
   * @returns {Promise<{ session_id: string, draft_id: string, status: string, expires_at: string, limits: object }>}
   */
  createOrReuseSession: async (draftId, options = {}) => {
    const started = performance.now();
    try {
      const response = await api.post(
        '/posts/upload-sessions',
        { draft_id: draftId },
        {
          headers: {
            'Idempotency-Key': draftId,
          },
          signal: options.signal,
          timeout: 15000,
        }
      );

      const sessionCreateMs = Math.round(performance.now() - started);
      if (response.data?.success && response.data?.data) {
        return {
          ...response.data.data,
          session_create_ms: sessionCreateMs,
        };
      }
      throw new Error(response.data?.message || 'ไม่สามารถสร้าง Upload Session ได้');
    } catch (error) {
      console.error('Error creating/reusing upload session:', error?.message);
      throw normalizeUploadError(error, 'ไม่สามารถสร้าง Upload Session ได้');
    }
  },

  /**
   * 2. Request Signed Upload Per File
   * POST /api/v1/posts/upload-sessions/:sessionId/files/sign
   * @param {string} sessionId
   * @param {object} fileMeta - { clientFileId, assetType, originalName, contentType, size }
   * @param {object} [options] - { signal }
   * @returns {Promise<object>} Sign credentials from backend
   */
  signFile: async (sessionId, fileMeta, options = {}) => {
    const started = performance.now();
    try {
      const payload = {
        client_file_id: fileMeta.clientFileId,
        asset_type: fileMeta.assetType, // 'COVER' | 'IMAGE' | 'PDF'
        original_name: fileMeta.originalName,
        content_type: fileMeta.contentType,
        size: fileMeta.size,
      };

      const response = await api.post(
        `/posts/upload-sessions/${sessionId}/files/sign`,
        payload,
        {
          signal: options.signal,
          timeout: 15000,
        }
      );

      const signMs = Math.round(performance.now() - started);
      const data = response.data?.data || response.data;
      if (data?.asset_id || data?.id) {
        return {
          ...data,
          asset_id: data.asset_id || data.id,
          sign_file_ms: signMs,
        };
      }
      throw new Error(response.data?.message || 'ไม่สามารถขอสิทธิ์อัปโหลดไฟล์ได้');
    } catch (error) {
      console.error('Error signing upload file:', error?.message);
      throw normalizeUploadError(error, 'ไม่สามารถขอสิทธิ์อัปโหลดไฟล์ได้');
    }
  },

  /**
   * 3. Upload image directly to Cloudinary using signed parameters from backend
   * @param {File} file
   * @param {object} signData
   * @param {object} [options] - { signal, onProgress }
   * @returns {Promise<object>} Cloudinary response metadata
   */
  uploadToCloudinary: async (file, signData, options = {}) => {
    const started = performance.now();
    if (!signData?.upload_url && !signData?.uploadUrl) {
      throw new Error('ไม่พบ URL สำหรับอัปโหลดรูปภาพ');
    }

    const uploadUrl = signData.upload_url || signData.uploadUrl;
    const params = {
      ...(signData.params || {}),
      ...(signData.upload_params || {}),
      ...(signData.uploadParams || {}),
    };

    const apiKey = signData.api_key || signData.apiKey || params.api_key || params.apiKey;
    const timestamp = signData.timestamp || params.timestamp;
    const signature = signData.signature || params.signature;
    const uploadPreset = signData.upload_preset || signData.uploadPreset || params.upload_preset || params.uploadPreset;
    const folder = signData.folder || params.folder;
    const publicId = signData.public_id || signData.publicId || params.public_id || params.publicId;

    const formData = new FormData();
    formData.append('file', file);

    if (apiKey) formData.append('api_key', String(apiKey));
    if (timestamp) formData.append('timestamp', String(timestamp));
    if (signature) formData.append('signature', String(signature));
    if (uploadPreset) formData.append('upload_preset', String(uploadPreset));
    if (folder) formData.append('folder', String(folder));
    if (publicId) formData.append('public_id', String(publicId));

    const rawFormats = signData.allowed_formats || params.allowed_formats;
    if (rawFormats) {
      const formats = Array.isArray(rawFormats) ? rawFormats.join(',') : String(rawFormats);
      formData.append('allowed_formats', formats);
    }

    const handledKeys = new Set([
      'file', 'api_key', 'apiKey', 'timestamp', 'signature',
      'upload_preset', 'uploadPreset', 'folder', 'public_id',
      'publicId', 'allowed_formats', 'allowedFormats',
    ]);
    for (const [k, v] of Object.entries(params)) {
      if (!handledKeys.has(k) && v !== undefined && v !== null && v !== '') {
        formData.append(k, String(v));
      }
    }

    return new Promise((resolve, reject) => {
      const xhr = new XMLHttpRequest();
      xhr.open('POST', uploadUrl);

      if (options.signal) {
        options.signal.addEventListener('abort', () => {
          xhr.abort();
          const abortErr = new Error('การอัปโหลดไฟล์ถูกยกเลิก');
          abortErr.code = 'ERR_CANCELED';
          abortErr.name = 'CanceledError';
          reject(abortErr);
        });
      }

      xhr.timeout = 120000; // 2 minutes

      if (xhr.upload && options.onProgress) {
        xhr.upload.onprogress = (event) => {
          if (event.lengthComputable) {
            const percent = Math.round((event.loaded / event.total) * 100);
            options.onProgress(percent);
          }
        };
      }

      xhr.onload = () => {
        const uploadMs = Math.round(performance.now() - started);
        if (xhr.status >= 200 && xhr.status < 300) {
          try {
            const result = JSON.parse(xhr.responseText);
            const metadata = {
              public_id: result.public_id,
              version: result.version,
              signature: result.signature,
              secure_url: result.secure_url,
              resource_type: result.resource_type,
              format: result.format,
              bytes: result.bytes,
              original_name: file.name,
              provider_upload_ms: uploadMs,
            };

            const required = ['public_id', 'version', 'signature', 'secure_url'];
            if (required.some(key => metadata[key] === undefined || metadata[key] === null || metadata[key] === '')) {
              throw new Error('Cloudinary ส่งข้อมูลยืนยันไฟล์กลับมาไม่ครบถ้วน');
            }
            resolve(metadata);
          } catch (parseErr) {
            reject(normalizeUploadError(parseErr, 'เกิดข้อผิดพลาดในการประมวลผลผลลัพธ์ Cloudinary'));
          }
        } else {
          let errorMsg = `อัปโหลดรูปภาพไม่สำเร็จ (${xhr.status})`;
          try {
            const parsed = JSON.parse(xhr.responseText);
            if (parsed?.error?.message) errorMsg = parsed.error.message;
          } catch {}
          const err = new Error(errorMsg);
          err.status = xhr.status;
          err.code = xhr.status === 429 ? 'RATE_LIMITED' : 'STORAGE_PROVIDER_ERROR';
          reject(normalizeUploadError(err, errorMsg));
        }
      };

      xhr.onerror = () => {
        const err = new Error('ไม่สามารถเชื่อมต่อกับ Cloudinary ได้');
        err.code = 'NETWORK_ERROR';
        reject(normalizeUploadError(err));
      };

      xhr.ontimeout = () => {
        const err = new Error('การอัปโหลดรูปภาพหมดเวลา');
        err.code = 'ETIMEDOUT';
        reject(normalizeUploadError(err));
      };

      xhr.send(formData);
    });
  },

  /**
   * 4. Upload PDF directly to Supabase Storage Private Bucket using uploadToSignedUrl
   * @param {File} file
   * @param {object} signData - { bucket, path, token }
   * @param {object} [options] - { signal, onProgress }
   * @returns {Promise<{ bucket: string, path: string, provider_upload_ms: number }>}
   */
  uploadPdfToSupabase: async (file, signData, options = {}) => {
    const started = performance.now();
    const { bucket, path, token } = signData || {};
    if (!bucket || !path || !token) {
      throw new Error('ข้อมูลสำหรับอัปโหลด PDF ไปยัง Supabase ไม่สมบูรณ์');
    }

    const timeout = AbortSignal.timeout(120000);
    const combinedSignal = options.signal ? AbortSignal.any([options.signal, timeout]) : timeout;

    if (combinedSignal.aborted) {
      const err = new Error('การอัปโหลดไฟล์ถูกยกเลิกหรือหมดเวลา');
      err.code = 'ABORT_ERROR';
      throw err;
    }

    const uploadPromise = supabase.storage
      .from(bucket)
      .uploadToSignedUrl(path, token, file, {
        contentType: 'application/pdf',
        upsert: true,
      });

    const abortPromise = new Promise((_, reject) => {
      combinedSignal.addEventListener('abort', () => {
        const err = new Error('การอัปโหลดไฟล์ถูกยกเลิกหรือหมดเวลา');
        err.code = 'ABORT_ERROR';
        reject(err);
      });
    });

    try {
      if (options.onProgress) options.onProgress(50);
      const result = await Promise.race([uploadPromise, abortPromise]);

      if (result?.error) {
        throw result.error;
      }

      if (options.onProgress) options.onProgress(100);
      const uploadMs = Math.round(performance.now() - started);

      return {
        bucket,
        path,
        provider_upload_ms: uploadMs,
      };
    } catch (err) {
      console.error('Supabase PDF upload error:', err);
      throw normalizeUploadError(err, 'ไม่สามารถอัปโหลดไฟล์ PDF ได้');
    }
  },

  /**
   * 5. Complete File Upload and Trigger Backend Verification
   * POST /api/v1/posts/upload-sessions/:sessionId/files/:assetId/complete
   * @param {string} sessionId
   * @param {string} assetId
   * @param {object} clientPayload - metadata from provider
   * @param {object} [options] - { signal }
   * @returns {Promise<object>} Verified asset data from backend
   */
  completeFile: async (sessionId, assetId, clientPayload, options = {}) => {
    const started = performance.now();
    try {
      const response = await api.post(
        `/posts/upload-sessions/${sessionId}/files/${assetId}/complete`,
        clientPayload,
        {
          signal: options.signal,
          timeout: 20000,
        }
      );

      const verificationMs = Math.round(performance.now() - started);
      const data = response.data?.data || response.data;
      return {
        ...data,
        verification_ms: verificationMs,
      };
    } catch (error) {
      console.error('Error completing file verification:', error?.message);
      throw normalizeUploadError(error, 'การตรวจสอบไฟล์ล้มเหลว กรุณาลองใหม่อีกครั้ง');
    }
  },

  /**
   * 6. Poll for verification if asset status is VERIFYING
   * @param {string} sessionId
   * @param {string} assetId
   * @param {object} [options] - { signal, maxAttempts, pollIntervalMs }
   * @returns {Promise<object>} Verified asset
   */
  waitForVerification: async (sessionId, assetId, options = {}) => {
    const maxAttempts = options.maxAttempts || 8;
    let delay = options.pollIntervalMs || 1000;

    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
      if (options.signal?.aborted) {
        const err = new Error('การตรวจสอบไฟล์ถูกยกเลิก');
        err.code = 'ERR_CANCELED';
        throw err;
      }

      try {
        const session = await uploadWorkspaceService.getSession(sessionId, { signal: options.signal });
        const asset = (session?.assets || []).find(a => (a.id === assetId || a.asset_id === assetId));

        if (asset) {
          if (asset.status === 'VERIFIED') {
            return asset;
          }
          if (asset.status === 'FAILED') {
            const err = new Error(asset.verification_error || 'ไฟล์ไม่ผ่านการตรวจสอบ');
            err.code = 'UPLOAD_VERIFICATION_FAILED';
            throw err;
          }
        }
      } catch (err) {
        if (err.code === 'UPLOAD_VERIFICATION_FAILED' || err.code === 'ERR_CANCELED') throw err;
      }

      await new Promise(res => setTimeout(res, delay));
      delay = Math.min(4000, delay * 1.5);
    }

    const timeoutErr = new Error('การตรวจสอบไฟล์ใช้เวลานานเกินกำหนด กรุณาลองใหม่อีกครั้ง');
    timeoutErr.code = 'UPLOAD_VERIFICATION_FAILED';
    throw timeoutErr;
  },

  /**
   * 7. Get Upload Session Status
   * GET /api/v1/posts/upload-sessions/:sessionId
   * @param {string} sessionId
   * @param {object} [options] - { signal }
   * @returns {Promise<object>} Session status & assets
   */
  getSession: async (sessionId, options = {}) => {
    try {
      const response = await api.get(`/posts/upload-sessions/${sessionId}`, {
        signal: options.signal,
        timeout: 10000,
      });
      return response.data?.data || response.data;
    } catch (error) {
      throw normalizeUploadError(error, 'ไม่สามารถเรียกดูสถานะ Upload Session ได้');
    }
  },

  /**
   * 8. Delete / Cancel Individual File
   * DELETE /api/v1/posts/upload-sessions/:sessionId/files/:assetId
   * @param {string} sessionId
   * @param {string} assetId
   * @param {object} [options] - { signal }
   */
  cancelFile: async (sessionId, assetId, options = {}) => {
    try {
      await api.delete(`/posts/upload-sessions/${sessionId}/files/${assetId}`, {
        signal: options.signal,
        timeout: 10000,
      });
      return { success: true };
    } catch (error) {
      console.warn('cancelFile failed (idempotent non-blocking):', error?.message);
      return { success: false, error };
    }
  },

  /**
   * 9. Delete / Cancel Entire Upload Session
   * DELETE /api/v1/posts/upload-sessions/:sessionId
   * @param {string} sessionId
   * @param {object} [options] - { signal }
   */
  cancelSession: async (sessionId, options = {}) => {
    try {
      await api.delete(`/posts/upload-sessions/${sessionId}`, {
        signal: options.signal,
        timeout: 10000,
      });
      return { success: true };
    } catch (error) {
      console.warn('cancelSession failed (idempotent non-blocking):', error?.message);
      return { success: false, error };
    }
  },
};
