import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import toast from 'react-hot-toast';
import {
  MAX_PDF_SIZE_BYTES,
  MAX_IMAGE_SIZE_BYTES,
  MAX_SUPPORTING_IMAGES_COUNT,
  MAX_MEDIA_FILES_COUNT,
  MAX_TOTAL_POST_BYTES,
  validateImageFile,
  validatePdfFile,
  translateUploadError,
  isRetryableError,
} from '../constants/uploadConstants.js';
import { uploadWorkspaceService } from '../services/uploadWorkspace.service.js';
import { globalUploadQueue } from '../utils/uploadQueue.js';

/**
 * Storage keys helper
 */
function getStorageKeys(mode, postId) {
  if (mode === 'edit' && postId) {
    return {
      draftIdKey: `share_ed_edit_post_${postId}_draft_id`,
      sessionIdKey: `share_ed_edit_post_${postId}_upload_session_id`,
      idempotencyKeyKey: `share_ed_edit_post_${postId}_idempotency_key`,
    };
  }
  return {
    draftIdKey: 'share_ed_post_draft_id',
    sessionIdKey: 'share_ed_upload_session_id',
    idempotencyKeyKey: 'share_ed_create_post_idempotency_key',
  };
}

export function useUploadWorkspace({ mode = 'create', postId = null, isEnabled = true } = {}) {
  const { draftIdKey, sessionIdKey, idempotencyKeyKey } = useMemo(
    () => getStorageKeys(mode, postId),
    [mode, postId]
  );

  // Draft Identity
  const [draftId] = useState(() => {
    if (typeof window === 'undefined') return crypto.randomUUID();
    let id = sessionStorage.getItem(draftIdKey);
    if (!id) {
      id = crypto.randomUUID();
      sessionStorage.setItem(draftIdKey, id);
    }
    return id;
  });

  const [idempotencyKey] = useState(() => {
    if (typeof window === 'undefined') return crypto.randomUUID();
    let key = sessionStorage.getItem(idempotencyKeyKey);
    if (!key) {
      key = crypto.randomUUID();
      sessionStorage.setItem(idempotencyKeyKey, key);
    }
    return key;
  });

  const [sessionId, setSessionId] = useState(() => {
    if (typeof window === 'undefined') return null;
    return sessionStorage.getItem(sessionIdKey) || null;
  });

  // Session limits from backend
  const [limits, setLimits] = useState({
    max_files: MAX_MEDIA_FILES_COUNT,
    max_total_bytes: MAX_TOTAL_POST_BYTES,
    max_pdf_bytes: MAX_PDF_SIZE_BYTES,
    max_image_bytes: MAX_IMAGE_SIZE_BYTES,
  });

  // Internal file states
  const [coverFile, setCoverFile] = useState(null); // File item for cover
  const [mediaFiles, setMediaFiles] = useState([]); // Array of File items for media (images + PDF)
  const [isInitializingSession, setIsInitializingSession] = useState(false);

  // Active abort controllers per clientFileId
  const abortControllersRef = useRef(new Map());
  const sessionPromiseRef = useRef(null);

  const coverFileRef = useRef(coverFile);
  coverFileRef.current = coverFile;
  const mediaFilesRef = useRef(mediaFiles);
  mediaFilesRef.current = mediaFiles;

  // Revoke Blob URLs on unmount
  useEffect(() => {
    return () => {
      if (coverFileRef.current?.previewUrl?.startsWith('blob:')) {
        URL.revokeObjectURL(coverFileRef.current.previewUrl);
      }
      mediaFilesRef.current?.forEach((m) => {
        if (m?.previewUrl?.startsWith('blob:')) {
          URL.revokeObjectURL(m.previewUrl);
        }
      });
    };
  }, []);

  /**
   * Ensure an Upload Session exists and is usable.
   * If already creating, reuse existing promise to prevent duplicate creation requests.
   */
  const ensureSession = useCallback(async () => {
    if (sessionId) return sessionId;
    if (sessionPromiseRef.current) return sessionPromiseRef.current;

    setIsInitializingSession(true);
    sessionPromiseRef.current = (async () => {
      try {
        const sessionData = await uploadWorkspaceService.createOrReuseSession(draftId);
        const newSessionId = sessionData.session_id || sessionData.id;
        sessionStorage.setItem(sessionIdKey, newSessionId);
        setSessionId(newSessionId);

        if (sessionData.limits) {
          setLimits((prev) => ({
            ...prev,
            ...sessionData.limits,
          }));
        }

        return newSessionId;
      } catch (err) {
        console.error('Failed to create/reuse upload session:', err);
        throw err;
      } finally {
        sessionPromiseRef.current = null;
        setIsInitializingSession(false);
      }
    })();

    return sessionPromiseRef.current;
  }, [draftId, sessionId, sessionIdKey]);

  /**
   * On mount, if a session ID is stored in sessionStorage, inspect session status
   * to resume verified assets or reset expired sessions.
   */
  useEffect(() => {
    if (!isEnabled || !sessionId) return;

    let isMounted = true;
    async function resumeSessionStatus() {
      try {
        const sessionData = await uploadWorkspaceService.getSession(sessionId);
        if (!isMounted) return;

        if (sessionData?.status !== 'OPEN') {
          // Session expired or committed, clear and create fresh on next action
          sessionStorage.removeItem(sessionIdKey);
          setSessionId(null);
          return;
        }

        if (sessionData.limits) {
          setLimits((prev) => ({ ...prev, ...sessionData.limits }));
        }

        // Restore verified assets that user previously completed in this session
        const assets = sessionData.assets || [];
        const verifiedAssets = assets.filter((a) => a.status === 'VERIFIED');

        if (verifiedAssets.length > 0) {
          // Separate cover and media
          const coverAsset = verifiedAssets.find((a) => a.asset_type === 'COVER');
          const otherAssets = verifiedAssets.filter((a) => a !== coverAsset);

          if (coverAsset) {
            setCoverFile((prev) => {
              if (prev) return prev;
              return {
                clientFileId: coverAsset.client_file_id || crypto.randomUUID(),
                file: null, // Restored from backend
                assetId: coverAsset.id,
                assetType: 'COVER',
                status: 'VERIFIED',
                progress: 100,
                error: null,
                errorCode: null,
                isRetryable: false,
                attempts: 1,
                originalName: coverAsset.original_name || 'cover.jpg',
                size: coverAsset.file_size || 0,
                previewUrl: coverAsset.secure_url || null,
                isRestored: true,
              };
            });
          }

          if (otherAssets.length > 0) {
            setMediaFiles((prev) => {
              if (prev.length > 0) return prev;
              return otherAssets.map((a) => ({
                clientFileId: a.client_file_id || crypto.randomUUID(),
                file: null,
                assetId: a.id,
                assetType: a.asset_type || (a.original_name?.toLowerCase().endsWith('.pdf') ? 'PDF' : 'IMAGE'),
                status: 'VERIFIED',
                progress: 100,
                error: null,
                errorCode: null,
                isRetryable: false,
                attempts: 1,
                originalName: a.original_name || 'file',
                size: a.file_size || 0,
                previewUrl: a.secure_url || null,
                isRestored: true,
              }));
            });
          }
        }
      } catch (err) {
        if (!isMounted) return;
        if (err.status === 404 || err.status === 410 || err.code === 'UPLOAD_SESSION_EXPIRED') {
          sessionStorage.removeItem(sessionIdKey);
          setSessionId(null);
        }
      }
    }

    resumeSessionStatus();
    return () => {
      isMounted = false;
    };
  }, [isEnabled, sessionId, sessionIdKey]);

  /**
   * Core single file background upload processor
   */
  const processSingleFileUpload = useCallback(
    async (item, updateStateCallback) => {
      const abortController = new AbortController();
      abortControllersRef.current.set(item.clientFileId, abortController);

      try {
        // 1. Ensure Session
        updateStateCallback(item.clientFileId, { status: 'SIGNING', progress: 10, error: null });
        const activeSessionId = await ensureSession();

        if (abortController.signal.aborted) {
          throw new Error('การอัปโหลดไฟล์ถูกยกเลิก');
        }

        // 2. Sign file
        const signData = await uploadWorkspaceService.signFile(
          activeSessionId,
          {
            clientFileId: item.clientFileId,
            assetType: item.assetType,
            originalName: item.originalName,
            contentType: item.file.type || (item.assetType === 'PDF' ? 'application/pdf' : 'image/jpeg'),
            size: item.size,
          },
          { signal: abortController.signal }
        );

        const assetId = signData.asset_id;
        updateStateCallback(item.clientFileId, {
          assetId,
          status: 'UPLOADING',
          progress: 30,
        });

        if (abortController.signal.aborted) {
          throw new Error('การอัปโหลดไฟล์ถูกยกเลิก');
        }

        // 3. Upload direct to provider
        let providerPayload = null;
        if (item.assetType === 'PDF') {
          providerPayload = await uploadWorkspaceService.uploadPdfToSupabase(item.file, signData, {
            signal: abortController.signal,
            onProgress: (pct) => {
              updateStateCallback(item.clientFileId, { progress: 30 + Math.round(pct * 0.4) });
            },
          });
        } else {
          providerPayload = await uploadWorkspaceService.uploadToCloudinary(item.file, signData, {
            signal: abortController.signal,
            onProgress: (pct) => {
              updateStateCallback(item.clientFileId, { progress: 30 + Math.round(pct * 0.4) });
            },
          });
        }

        if (abortController.signal.aborted) {
          throw new Error('การอัปโหลดไฟล์ถูกยกเลิก');
        }

        // 4. Complete and verify
        updateStateCallback(item.clientFileId, { status: 'VERIFYING', progress: 85 });

        let verifiedResult = await uploadWorkspaceService.completeFile(
          activeSessionId,
          assetId,
          providerPayload,
          { signal: abortController.signal }
        );

        if (verifiedResult.status !== 'VERIFIED') {
          // Poll if backend returned VERIFYING
          verifiedResult = await uploadWorkspaceService.waitForVerification(
            activeSessionId,
            assetId,
            { signal: abortController.signal }
          );
        }

        // 5. Success
        updateStateCallback(item.clientFileId, {
          status: 'VERIFIED',
          progress: 100,
          error: null,
          errorCode: null,
          isRetryable: false,
          previewUrl: verifiedResult.secure_url || item.previewUrl,
        });

        return verifiedResult;
      } catch (error) {
        if (abortController.signal.aborted || error.code === 'ERR_CANCELED' || error.name === 'CanceledError') {
          updateStateCallback(item.clientFileId, {
            status: 'CANCELLED',
            error: 'การอัปโหลดไฟล์ถูกยกเลิก',
          });
          return;
        }

        const thaiError = translateUploadError(error);
        const retryable = isRetryableError(error);

        updateStateCallback(item.clientFileId, {
          status: 'FAILED',
          error: thaiError,
          errorCode: error.code || 'UPLOAD_FAILED',
          isRetryable: retryable,
        });
        throw error;
      } finally {
        abortControllersRef.current.delete(item.clientFileId);
      }
    },
    [ensureSession]
  );

  /**
   * Helper to update cover file state
   */
  const updateCoverState = useCallback((_id, updates) => {
    setCoverFile((prev) => (prev ? { ...prev, ...updates } : null));
  }, []);

  /**
   * Helper to update media file state
   */
  const updateMediaState = useCallback((clientFileId, updates) => {
    setMediaFiles((prev) =>
      prev.map((item) => (item.clientFileId === clientFileId ? { ...item, ...updates } : item))
    );
  }, []);

  /**
   * Add / Replace Cover Image
   */
  const setCover = useCallback(
    (file) => {
      if (!file) return;

      const validation = validateImageFile(file, true);
      if (!validation.valid) {
        toast.error(validation.error);
        return;
      }

      // If existing cover is uploading, cancel it
      if (coverFile) {
        const existingController = abortControllersRef.current.get(coverFile.clientFileId);
        existingController?.abort();
        globalUploadQueue.cancelTask(coverFile.clientFileId);

        if (coverFile.assetId && sessionId) {
          uploadWorkspaceService.cancelFile(sessionId, coverFile.assetId);
        }

        if (coverFile.previewUrl?.startsWith('blob:')) {
          URL.revokeObjectURL(coverFile.previewUrl);
        }
      }

      const clientFileId = crypto.randomUUID();
      const previewUrl = URL.createObjectURL(file);
      const newCoverItem = {
        clientFileId,
        file,
        assetId: null,
        assetType: 'COVER',
        status: 'QUEUED',
        progress: 0,
        error: null,
        errorCode: null,
        isRetryable: false,
        attempts: 1,
        originalName: file.name,
        size: file.size,
        previewUrl,
      };

      setCoverFile(newCoverItem);

      // Start upload immediately in background
      globalUploadQueue
        .enqueue(clientFileId, () => processSingleFileUpload(newCoverItem, updateCoverState), {
          maxRetries: 3,
        })
        .catch(() => {});
    },
    [coverFile, processSingleFileUpload, sessionId, updateCoverState]
  );

  /**
   * Remove Cover Image
   */
  const removeCover = useCallback(() => {
    if (!coverFile) return;

    const controller = abortControllersRef.current.get(coverFile.clientFileId);
    controller?.abort();
    globalUploadQueue.cancelTask(coverFile.clientFileId);

    if (coverFile.assetId && sessionId) {
      uploadWorkspaceService.cancelFile(sessionId, coverFile.assetId);
    }

    if (coverFile.previewUrl?.startsWith('blob:')) {
      URL.revokeObjectURL(coverFile.previewUrl);
    }

    setCoverFile(null);
  }, [coverFile, sessionId]);

  /**
   * Add Multiple Media Files (Images and/or PDF)
   */
  const addMediaFiles = useCallback(
    (newFiles) => {
      const filesArray = Array.from(newFiles || []);
      if (filesArray.length === 0) return;

      // 1. Check max files limit
      const currentMediaCount = mediaFiles.length;
      if (currentMediaCount + filesArray.length > limits.max_files) {
        toast.error(`คุณสามารถแนบไฟล์ประกอบได้สูงสุด ${limits.max_files} ไฟล์เท่านั้น`);
        return;
      }

      // 2. Check total bytes limit
      const currentBytes =
        (coverFile?.size || 0) + mediaFiles.reduce((acc, m) => acc + (m.size || 0), 0);
      const newBytes = filesArray.reduce((acc, f) => acc + (f.size || 0), 0);
      if (currentBytes + newBytes > limits.max_total_bytes) {
        toast.error('ขนาดไฟล์รวมของโพสต์เกินกำหนด (สูงสุด 50 MB)');
        return;
      }

      // 3. Validate each file and prepare queued items
      const validItems = [];
      const hasExistingPdf = mediaFiles.some((m) => m.assetType === 'PDF');
      let remainingImageSlots = Math.max(
        0,
        MAX_SUPPORTING_IMAGES_COUNT - mediaFiles.filter((m) => m.assetType === 'IMAGE').length
      );
      let pdfEncounteredInBatch = false;
      let removedExtraImages = false;

      for (const file of filesArray) {
        const isPdf =
          file.type === 'application/pdf' ||
          file.type === 'application/x-pdf' ||
          file.name.toLowerCase().endsWith('.pdf');

        if (isPdf) {
          if (hasExistingPdf || pdfEncounteredInBatch) {
            toast.error('สามารถแนบไฟล์ PDF ได้เพียง 1 ไฟล์ต่อโพสต์');
            continue;
          }

          const pdfVal = validatePdfFile(file);
          if (!pdfVal.valid) {
            toast.error(pdfVal.error);
            continue;
          }
          pdfEncounteredInBatch = true;
        } else {
          if (remainingImageSlots === 0) {
            removedExtraImages = true;
            continue;
          }
          const imgVal = validateImageFile(file, false);
          if (!imgVal.valid) {
            toast.error(imgVal.error);
            continue;
          }
          remainingImageSlots -= 1;
        }

        // Duplicate check
        const isDuplicate = mediaFiles.some(
          (m) => m.originalName === file.name && m.size === file.size
        );
        if (isDuplicate) {
          toast.error(`ไฟล์ ${file.name} มีอยู่ในรายการแล้ว`);
          continue;
        }

        const clientFileId = crypto.randomUUID();
        const previewUrl = URL.createObjectURL(file);
        const item = {
          clientFileId,
          file,
          assetId: null,
          assetType: isPdf ? 'PDF' : 'IMAGE',
          status: 'QUEUED',
          progress: 0,
          error: null,
          errorCode: null,
          isRetryable: false,
          attempts: 1,
          originalName: file.name,
          size: file.size,
          previewUrl,
        };

        validItems.push(item);
      }

      if (removedExtraImages) {
        toast.error('อัปโหลดรูปภาพประกอบได้สูงสุด 5 รูป ระบบนำรูปส่วนเกินออกแล้ว');
      }

      if (validItems.length === 0) return;

      // Update state
      setMediaFiles((prev) => [...prev, ...validItems]);

      // Enqueue all valid items immediately into the adaptive concurrency queue
      for (const item of validItems) {
        globalUploadQueue
          .enqueue(item.clientFileId, () => processSingleFileUpload(item, updateMediaState), {
            maxRetries: 3,
          })
          .catch(() => {});
      }
    },
    [coverFile, limits.max_files, limits.max_total_bytes, mediaFiles, processSingleFileUpload, updateMediaState]
  );

  /**
   * Remove Media File
   */
  const removeMediaFile = useCallback(
    (clientFileId) => {
      const target = mediaFiles.find((m) => m.clientFileId === clientFileId);
      if (!target) return;

      const controller = abortControllersRef.current.get(clientFileId);
      controller?.abort();
      globalUploadQueue.cancelTask(clientFileId);

      if (target.assetId && sessionId) {
        uploadWorkspaceService.cancelFile(sessionId, target.assetId);
      }

      if (target.previewUrl?.startsWith('blob:')) {
        URL.revokeObjectURL(target.previewUrl);
      }

      setMediaFiles((prev) => prev.filter((m) => m.clientFileId !== clientFileId));
    },
    [mediaFiles, sessionId]
  );

  /**
   * Retry single failed file (Cover or Media) keeping the same clientFileId
   */
  const retryFile = useCallback(
    (clientFileId) => {
      // Check if it's the cover
      if (coverFile && coverFile.clientFileId === clientFileId) {
        if (!coverFile.file) {
          toast.error('กรุณาเลือกไฟล์ใหม่เพื่ออัปโหลด');
          return;
        }
        const updatedCover = {
          ...coverFile,
          status: 'QUEUED',
          error: null,
          errorCode: null,
          attempts: (coverFile.attempts || 1) + 1,
        };
        setCoverFile(updatedCover);
        globalUploadQueue
          .enqueue(clientFileId, () => processSingleFileUpload(updatedCover, updateCoverState), {
            maxRetries: 3,
          })
          .catch(() => {});
        return;
      }

      // Check media files
      const target = mediaFiles.find((m) => m.clientFileId === clientFileId);
      if (target) {
        if (!target.file) {
          toast.error('กรุณาเลือกไฟล์ใหม่เพื่ออัปโหลด');
          return;
        }
        const updatedTarget = {
          ...target,
          status: 'QUEUED',
          error: null,
          errorCode: null,
          attempts: (target.attempts || 1) + 1,
        };
        updateMediaState(clientFileId, updatedTarget);
        globalUploadQueue
          .enqueue(clientFileId, () => processSingleFileUpload(updatedTarget, updateMediaState), {
            maxRetries: 3,
          })
          .catch(() => {});
      }
    },
    [coverFile, mediaFiles, processSingleFileUpload, updateCoverState, updateMediaState]
  );

  /**
   * Explicitly cancel draft and its entire session
   */
  const cancelDraftSession = useCallback(async () => {
    // Abort all active uploads
    abortControllersRef.current.forEach((ctrl) => ctrl.abort());
    abortControllersRef.current.clear();
    globalUploadQueue.cancelAll();

    if (sessionId) {
      await uploadWorkspaceService.cancelSession(sessionId);
    }

    sessionStorage.removeItem(draftIdKey);
    sessionStorage.removeItem(sessionIdKey);
    sessionStorage.removeItem(idempotencyKeyKey);

    setCoverFile(null);
    setMediaFiles([]);
    setSessionId(null);
  }, [draftIdKey, idempotencyKeyKey, sessionId, sessionIdKey]);

  /**
   * Cleanup draft identity on successful post creation
   */
  const clearDraftSession = useCallback(() => {
    sessionStorage.removeItem(draftIdKey);
    sessionStorage.removeItem(sessionIdKey);
    sessionStorage.removeItem(idempotencyKeyKey);

    setCoverFile(null);
    setMediaFiles([]);
    setSessionId(null);
  }, [draftIdKey, idempotencyKeyKey, sessionIdKey]);

  // Derived states
  const isAnyUploading = useMemo(() => {
    const isCoverUploading = coverFile && ['QUEUED', 'SIGNING', 'UPLOADING', 'VERIFYING'].includes(coverFile.status);
    const isMediaUploading = mediaFiles.some((m) =>
      ['QUEUED', 'SIGNING', 'UPLOADING', 'VERIFYING'].includes(m.status)
    );
    return Boolean(isInitializingSession || isCoverUploading || isMediaUploading);
  }, [coverFile, isInitializingSession, mediaFiles]);

  const hasFailedFiles = useMemo(() => {
    const isCoverFailed = coverFile?.status === 'FAILED';
    const hasMediaFailed = mediaFiles.some((m) => m.status === 'FAILED');
    return Boolean(isCoverFailed || hasMediaFailed);
  }, [coverFile, mediaFiles]);

  const isAllRequiredVerified = useMemo(() => {
    const isCoverVerified = !coverFile || coverFile.status === 'VERIFIED';
    const isMediaAllVerified = mediaFiles.every((m) => m.status === 'VERIFIED');
    return Boolean(isCoverVerified && isMediaAllVerified && !isAnyUploading);
  }, [coverFile, isAnyUploading, mediaFiles]);

  const coverAssetId = useMemo(() => {
    return coverFile?.status === 'VERIFIED' ? coverFile.assetId : null;
  }, [coverFile]);

  const mediaAssetIds = useMemo(() => {
    return mediaFiles.filter((m) => m.status === 'VERIFIED' && m.assetId).map((m) => m.assetId);
  }, [mediaFiles]);

  const pdfFileItem = useMemo(() => {
    return mediaFiles.find((m) => m.assetType === 'PDF') || null;
  }, [mediaFiles]);

  const imageFileItems = useMemo(() => {
    return mediaFiles.filter((m) => m.assetType === 'IMAGE');
  }, [mediaFiles]);

  const totalBytes = useMemo(() => {
    return (coverFile?.size || 0) + mediaFiles.reduce((acc, m) => acc + (m.size || 0), 0);
  }, [coverFile, mediaFiles]);

  return {
    draftId,
    sessionId,
    idempotencyKey,
    limits,
    coverFile,
    mediaFiles,
    pdfFileItem,
    imageFileItems,
    isAnyUploading,
    hasFailedFiles,
    isAllRequiredVerified,
    coverAssetId,
    mediaAssetIds,
    totalBytes,
    setCover,
    removeCover,
    addMediaFiles,
    removeMediaFile,
    retryFile,
    cancelDraftSession,
    clearDraftSession,
    ensureSession,
  };
}
