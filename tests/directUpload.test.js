import test from 'node:test';
import assert from 'node:assert/strict';
import { postService } from '../src/services/post.service.js';
import api from '../src/utils/api.js';

test('getUploadSignature requests signature from /posts/upload-signature with type query', async () => {
  const originalGet = api.get;
  try {
    let capturedUrl = '';
    let capturedParams = null;

    api.get = async (url, options) => {
      capturedUrl = url;
      capturedParams = options?.params;
      return {
        data: {
          success: true,
          data: {
            signature: 'sig_12345',
            timestamp: 1700000000,
            apiKey: 'mock_key',
            cloudName: 'mock_cloud',
            folder: 'share-ed/posts/covers',
            uploadUrl: 'https://api.cloudinary.com/v1_1/mock_cloud/auto/upload'
          }
        }
      };
    };

    const sigData = await postService.getUploadSignature('cover');
    assert.equal(capturedUrl, '/posts/upload-signature');
    assert.deepEqual(capturedParams, { type: 'cover' });
    assert.equal(sigData.signature, 'sig_12345');
    assert.equal(sigData.folder, 'share-ed/posts/covers');
    assert.equal(sigData.uploadUrl, 'https://api.cloudinary.com/v1_1/mock_cloud/auto/upload');
  } finally {
    api.get = originalGet;
  }
});

test('uploadDirectToCloudinary posts signed FormData directly to Cloudinary uploadUrl', async () => {
  const originalGet = api.get;
  const originalFetch = globalThis.fetch;

  try {
    api.get = async () => ({
      data: {
        success: true,
        data: {
          signature: 'sig_cover_abc',
          timestamp: 1700000100,
          apiKey: 'key_abc',
          cloudName: 'demo_cloud',
          folder: 'share-ed/posts/covers',
          uploadUrl: 'https://api.cloudinary.com/v1_1/demo_cloud/auto/upload'
        }
      }
    });

    let uploadedUrl = '';
    let uploadedFormData = null;

    globalThis.fetch = async (url, options) => {
      uploadedUrl = url;
      uploadedFormData = options?.body;
      return {
        ok: true,
        json: async () => ({
          secure_url: 'https://res.cloudinary.com/demo_cloud/image/upload/v1/share-ed/posts/covers/test.png'
        })
      };
    };

    const mockFile = new Blob(['mock image content'], { type: 'image/png' });
    mockFile.name = 'cover.png';

    const resultUrl = await postService.uploadDirectToCloudinary(mockFile, 'cover');

    assert.equal(uploadedUrl, 'https://api.cloudinary.com/v1_1/demo_cloud/auto/upload');
    assert.equal(resultUrl, 'https://res.cloudinary.com/demo_cloud/image/upload/v1/share-ed/posts/covers/test.png');
    assert.equal(uploadedFormData.get('signature'), 'sig_cover_abc');
    assert.equal(uploadedFormData.get('api_key'), 'key_abc');
    assert.equal(uploadedFormData.get('folder'), 'share-ed/posts/covers');
    assert.equal(uploadedFormData.get('timestamp'), '1700000100');
  } finally {
    api.get = originalGet;
    globalThis.fetch = originalFetch;
  }
});

test('uploadMultipleDirectToCloudinary uploads all files concurrently and returns URLs', async () => {
  const originalGet = api.get;
  const originalFetch = globalThis.fetch;

  try {
    api.get = async () => ({
      data: {
        success: true,
        data: {
          signature: 'sig_media_multi',
          timestamp: 1700000200,
          apiKey: 'key_multi',
          cloudName: 'demo_cloud',
          folder: 'share-ed/posts/media',
          uploadUrl: 'https://api.cloudinary.com/v1_1/demo_cloud/auto/upload'
        }
      }
    });

    let fetchCount = 0;
    globalThis.fetch = async () => {
      fetchCount++;
      const count = fetchCount;
      return {
        ok: true,
        json: async () => ({
          secure_url: `https://res.cloudinary.com/demo_cloud/image/upload/v1/share-ed/posts/media/img_${count}.png`
        })
      };
    };

    const file1 = new Blob(['img 1'], { type: 'image/png' });
    const file2 = new Blob(['img 2'], { type: 'image/png' });

    const resultUrls = await postService.uploadMultipleDirectToCloudinary([file1, file2], 'media');

    assert.equal(fetchCount, 2);
    assert.equal(resultUrls.length, 2);
    assert.ok(resultUrls.some(url => url.includes('img_1.png')));
    assert.ok(resultUrls.some(url => url.includes('img_2.png')));
  } finally {
    api.get = originalGet;
    globalThis.fetch = originalFetch;
  }
});

test('uploadDirectToCloudinary throws informative error if Cloudinary returns an error', async () => {
  const originalGet = api.get;
  const originalFetch = globalThis.fetch;

  try {
    api.get = async () => ({
      data: {
        success: true,
        data: {
          signature: 'sig_err',
          timestamp: 1700000300,
          apiKey: 'key_err',
          folder: 'share-ed/posts/covers',
          uploadUrl: 'https://api.cloudinary.com/v1_1/demo_cloud/auto/upload'
        }
      }
    });

    globalThis.fetch = async () => ({
      ok: false,
      status: 400,
      json: async () => ({
        error: { message: 'Invalid Signature 123456' }
      })
    });

    await assert.rejects(
      async () => {
        await postService.uploadDirectToCloudinary(new Blob(['bad']), 'cover');
      },
      /Invalid Signature 123456/
    );
  } finally {
    api.get = originalGet;
    globalThis.fetch = originalFetch;
  }
});
