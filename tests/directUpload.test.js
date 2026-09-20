import test from 'node:test';
import assert from 'node:assert/strict';
import api from '../src/utils/api.js';
import { postService } from '../src/services/post.service.js';

function config(type) {
  return {
    apiKey: 'test-key',
    signature: `request-signature-${type}`,
    uploadParams: {
      allowed_formats: type === 'pdf' ? 'pdf' : 'jpg,jpeg,png,webp',
      folder: `share-ed/users/user-1/posts/${type}`,
      timestamp: 1700000000,
    },
    uploadUrl: `https://upload.example/${type}`,
  };
}

test('post files request signatures once and upload with a maximum concurrency of four', async () => {
  const originalPost = api.post;
  const originalFetch = globalThis.fetch;
  try {
    let signatureCalls = 0;
    api.post = async (url, body) => {
      signatureCalls++;
      assert.equal(url, '/posts/upload-signatures');
      assert.deepEqual(body, { types: ['cover', 'pdf', 'media'] });
      return {
        data: {
          success: true,
          data: { uploads: { cover: config('cover'), pdf: config('pdf'), media: config('media') } }
        }
      };
    };

    let active = 0;
    let maximumActive = 0;
    let uploadNumber = 0;
    const sentForms = [];
    globalThis.fetch = async (url, options) => {
      active++;
      maximumActive = Math.max(maximumActive, active);
      sentForms.push(options.body);
      const current = uploadNumber++;
      await new Promise(resolve => setTimeout(resolve, 10));
      active--;
      const resourceType = url.endsWith('/pdf') ? 'raw' : 'image';
      const format = resourceType === 'raw' ? 'pdf' : 'png';
      return {
        ok: true,
        json: async () => ({
          public_id: `share-ed/users/user-1/posts/file-${current}${resourceType === 'raw' ? '.pdf' : ''}`,
          version: 1700000000 + current,
          signature: `response-signature-${current}`,
          secure_url: `https://res.cloudinary.com/test/${resourceType}/upload/file-${current}`,
          resource_type: resourceType,
          format,
          bytes: 1024,
        })
      };
    };

    const result = await postService.uploadPostFilesDirect({
      coverImage: new Blob(['cover']),
      pdfFile: new Blob(['pdf']),
      images: [new Blob(['1']), new Blob(['2']), new Blob(['3']), new Blob(['4'])],
    });

    assert.equal(signatureCalls, 1);
    assert.equal(uploadNumber, 6);
    assert.equal(maximumActive, 4);
    assert.equal(result.mediaUploads.length, 5);
    assert.equal(result.coverUpload.resource_type, 'image');
    assert.equal(sentForms[0].get('api_key'), 'test-key');
    assert.equal(sentForms[0].get('timestamp'), '1700000000');
    assert.match(sentForms[0].get('allowed_formats'), /png/);
  } finally {
    api.post = originalPost;
    globalThis.fetch = originalFetch;
  }
});

test('direct upload rejects incomplete Cloudinary verification metadata', async () => {
  const originalPost = api.post;
  const originalFetch = globalThis.fetch;
  try {
    api.post = async () => ({
      data: { success: true, data: { uploads: { cover: config('cover') } } }
    });
    globalThis.fetch = async () => ({
      ok: true,
      json: async () => ({ secure_url: 'https://res.cloudinary.com/test/image/upload/file.png' }),
    });
    await assert.rejects(
      postService.uploadPostFilesDirect({ coverImage: new Blob(['cover']) }),
      /ข้อมูลยืนยันไฟล์กลับมาไม่ครบ/
    );
  } finally {
    api.post = originalPost;
    globalThis.fetch = originalFetch;
  }
});
