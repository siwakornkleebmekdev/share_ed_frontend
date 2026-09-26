import test from 'node:test';
import assert from 'node:assert/strict';
import {
  validatePdfFile,
  validateImageFile,
  translateUploadError,
  isRetryableError,
  BACKEND_ERROR_MAP,
  MAX_PDF_SIZE_BYTES,
  MAX_IMAGE_SIZE_BYTES,
  MAX_TOTAL_POST_BYTES,
} from '../src/constants/uploadConstants.js';
import { UploadQueue, calculateBackoff, parseRetryAfter } from '../src/utils/uploadQueue.js';
import { uploadWorkspaceService } from '../src/services/uploadWorkspace.service.js';
import api from '../src/utils/api.js';

test('Upload Workspace: Client-side PDF validation enforces 20 MB and application/pdf', () => {
  // Empty / null file
  assert.equal(validatePdfFile(null).valid, false);

  // Wrong extension
  const wrongExt = new File(['hello'], 'document.docx', { type: 'application/pdf' });
  const valExt = validatePdfFile(wrongExt);
  assert.equal(valExt.valid, false);
  assert.equal(valExt.code, 'INVALID_PDF');

  // Wrong MIME
  const wrongMime = new File(['hello'], 'document.pdf', { type: 'text/plain' });
  const valMime = validatePdfFile(wrongMime);
  assert.equal(valMime.valid, false);
  assert.equal(valMime.code, 'INVALID_PDF');

  // Empty file (size 0)
  const emptyFile = new File([], 'document.pdf', { type: 'application/pdf' });
  const valEmpty = validatePdfFile(emptyFile);
  assert.equal(valEmpty.valid, false);

  // Oversized file (> 20 MB)
  const bigBlob = new Blob([new Uint8Array(MAX_PDF_SIZE_BYTES + 1024)]);
  const bigFile = new File([bigBlob], 'big.pdf', { type: 'application/pdf' });
  const valBig = validatePdfFile(bigFile);
  assert.equal(valBig.valid, false);
  assert.equal(valBig.code, 'PDF_TOO_LARGE');

  // Valid PDF
  const validBlob = new Blob([new Uint8Array(1024)]);
  const validFile = new File([validBlob], 'lesson.pdf', { type: 'application/pdf' });
  assert.equal(validatePdfFile(validFile).valid, true);
});

test('Upload Workspace: Client-side Image validation enforces 2 MB and valid image formats', () => {
  assert.equal(validateImageFile(null, true).valid, false);

  // Wrong format
  const wrongFormat = new File(['image'], 'photo.gif', { type: 'image/gif' });
  assert.equal(validateImageFile(wrongFormat, false).valid, false);

  // Oversized (> 2 MB)
  const bigImgBlob = new Blob([new Uint8Array(MAX_IMAGE_SIZE_BYTES + 100)]);
  const bigImg = new File([bigImgBlob], 'photo.jpg', { type: 'image/jpeg' });
  const valBig = validateImageFile(bigImg, false);
  assert.equal(valBig.valid, false);
  assert.equal(valBig.code, 'INVALID_IMAGE');

  // Valid JPG / PNG / WebP
  const validImg = new File([new Blob([new Uint8Array(1024)])], 'cover.png', { type: 'image/png' });
  assert.equal(validateImageFile(validImg, true).valid, true);
});

test('Upload Workspace: Thai error mapping maps all backend codes accurately', () => {
  assert.equal(
    translateUploadError('INVALID_UPLOAD_SESSION'),
    BACKEND_ERROR_MAP.INVALID_UPLOAD_SESSION
  );
  assert.equal(
    translateUploadError('UPLOAD_SESSION_EXPIRED'),
    BACKEND_ERROR_MAP.UPLOAD_SESSION_EXPIRED
  );
  assert.equal(
    translateUploadError('UPLOAD_SESSION_FORBIDDEN'),
    BACKEND_ERROR_MAP.UPLOAD_SESSION_FORBIDDEN
  );
  assert.equal(
    translateUploadError('UPLOAD_ASSET_NOT_FOUND'),
    BACKEND_ERROR_MAP.UPLOAD_ASSET_NOT_FOUND
  );
  assert.equal(
    translateUploadError('UPLOAD_ASSET_CONFLICT'),
    BACKEND_ERROR_MAP.UPLOAD_ASSET_CONFLICT
  );
  assert.equal(
    translateUploadError('INVALID_IMAGE'),
    BACKEND_ERROR_MAP.INVALID_IMAGE
  );
  assert.equal(
    translateUploadError('INVALID_PDF'),
    BACKEND_ERROR_MAP.INVALID_PDF
  );
  assert.equal(
    translateUploadError('PDF_TOO_LARGE'),
    BACKEND_ERROR_MAP.PDF_TOO_LARGE
  );
  assert.equal(
    translateUploadError('TOTAL_UPLOAD_TOO_LARGE'),
    BACKEND_ERROR_MAP.TOTAL_UPLOAD_TOO_LARGE
  );
  assert.equal(
    translateUploadError('UPLOAD_VERIFICATION_FAILED'),
    BACKEND_ERROR_MAP.UPLOAD_VERIFICATION_FAILED
  );
  assert.equal(
    translateUploadError('STORAGE_PROVIDER_ERROR'),
    BACKEND_ERROR_MAP.STORAGE_PROVIDER_ERROR
  );
  assert.equal(
    translateUploadError('RATE_LIMITED'),
    BACKEND_ERROR_MAP.RATE_LIMITED
  );
});

test('Upload Workspace: Retry policy distinguishes retryable from non-retryable errors', () => {
  // Non-retryable
  assert.equal(isRetryableError({ response: { status: 400, data: { code: 'INVALID_IMAGE' } } }), false);
  assert.equal(isRetryableError({ response: { status: 400, data: { code: 'INVALID_PDF' } } }), false);
  assert.equal(isRetryableError({ response: { status: 403, data: { code: 'UPLOAD_SESSION_FORBIDDEN' } } }), false);
  assert.equal(isRetryableError({ response: { status: 404, data: { code: 'UPLOAD_ASSET_NOT_FOUND' } } }), false);
  assert.equal(isRetryableError({ response: { status: 401, data: { code: 'UNAUTHORIZED' } } }), false);

  // Retryable
  assert.equal(isRetryableError({ response: { status: 429, data: { code: 'RATE_LIMITED' } } }), true);
  assert.equal(isRetryableError({ response: { status: 500, data: { code: 'STORAGE_PROVIDER_ERROR' } } }), true);
  assert.equal(isRetryableError({ response: { status: 502 } }), true);
  assert.equal(isRetryableError({ code: 'ECONNABORTED', message: 'timeout' }), true);
  assert.equal(isRetryableError({ message: 'Network Error' }), true);
});

test('Upload Workspace: Exponential backoff with jitter and Retry-After header parsing', () => {
  // Retry-After parsing in seconds
  const resSec = { headers: { 'retry-after': '5' } };
  assert.equal(parseRetryAfter(resSec), 5000);

  // Backoff respects Retry-After
  const backoff = calculateBackoff(1, 4000);
  assert.equal(backoff, 4000);

  // Exponential backoff increases with attempts
  const b0 = calculateBackoff(0);
  const b1 = calculateBackoff(1);
  const b2 = calculateBackoff(2);
  assert.ok(b0 >= 1000);
  assert.ok(b1 >= 2000);
  assert.ok(b2 >= 4000);
});

test('Upload Workspace: Adaptive Queue manages concurrency and tasks', async () => {
  const queue = new UploadQueue({ concurrency: 3, minConcurrency: 2, maxConcurrency: 6 });
  assert.equal(queue.getConcurrency(), 3);

  let active = 0;
  let maxActive = 0;
  const taskCount = 6;
  const results = [];

  const promises = Array.from({ length: taskCount }, (_, i) => {
    return queue.enqueue(`task-${i}`, async () => {
      active++;
      maxActive = Math.max(maxActive, active);
      await new Promise(res => setTimeout(res, 20));
      active--;
      results.push(i);
      return i;
    });
  });

  await Promise.all(promises);
  assert.equal(results.length, 6);
  assert.ok(maxActive <= 3, `Max active (${maxActive}) should not exceed initial concurrency (3)`);

  // Rate limiting decreases concurrency
  queue.onRateLimitedOrTimeout();
  assert.equal(queue.getConcurrency(), 2);
});

test('Upload Workspace Service: createOrReuseSession calls /posts/upload-sessions with Idempotency-Key', async () => {
  const originalPost = api.post;
  const draftId = 'd83e29f0-264f-4a00-9856-cb82b0e6fa71';
  let recordedUrl = null;
  let recordedBody = null;
  let recordedHeaders = null;

  api.post = async (url, body, config) => {
    recordedUrl = url;
    recordedBody = body;
    recordedHeaders = config?.headers;
    return {
      data: {
        success: true,
        data: {
          session_id: 'session-uuid-1234',
          draft_id: draftId,
          status: 'OPEN',
          expires_at: '2026-09-26T22:00:00.000Z',
          limits: {
            max_files: 15,
            max_total_bytes: 52428800,
            max_pdf_bytes: 20971520,
          },
        },
      },
    };
  };

  try {
    const session = await uploadWorkspaceService.createOrReuseSession(draftId);
    assert.equal(recordedUrl, '/posts/upload-sessions');
    assert.equal(recordedBody.draft_id, draftId);
    assert.equal(recordedHeaders['Idempotency-Key'], draftId);
    assert.equal(session.session_id, 'session-uuid-1234');
    assert.equal(session.status, 'OPEN');
    assert.ok(session.session_create_ms !== undefined);
  } finally {
    api.post = originalPost;
  }
});

test('Upload Workspace Service: signFile sends client_file_id and asset_type to backend', async () => {
  const originalPost = api.post;
  let recordedUrl = null;
  let recordedPayload = null;

  api.post = async (url, payload) => {
    recordedUrl = url;
    recordedPayload = payload;
    return {
      data: {
        success: true,
        data: {
          asset_id: 'asset-uuid-5678',
          client_file_id: payload.client_file_id,
          asset_type: payload.asset_type,
          status: 'SIGNED',
          provider: 'CLOUDINARY',
          upload_url: 'https://api.cloudinary.com/v1_1/demo/image/upload',
        },
      },
    };
  };

  try {
    const signResult = await uploadWorkspaceService.signFile('session-uuid-1234', {
      clientFileId: 'client-file-999',
      assetType: 'COVER',
      originalName: 'cover.jpg',
      contentType: 'image/jpeg',
      size: 102400,
    });

    assert.equal(recordedUrl, '/posts/upload-sessions/session-uuid-1234/files/sign');
    assert.equal(recordedPayload.client_file_id, 'client-file-999');
    assert.equal(recordedPayload.asset_type, 'COVER');
    assert.equal(signResult.asset_id, 'asset-uuid-5678');
  } finally {
    api.post = originalPost;
  }
});
