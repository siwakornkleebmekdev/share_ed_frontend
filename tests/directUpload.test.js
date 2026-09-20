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
          data: {
            uploads: { cover: config('cover'), pdf: config('pdf'), media: config('media') },
            sessionId: 'session-123',
            expiresAt: '2099-01-01T00:00:00.000Z',
          }
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
    assert.equal(result.uploadSessionId, 'session-123');
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
      data: { success: true, data: {
        uploads: { cover: config('cover') },
        sessionId: 'session-123',
        expiresAt: '2099-01-01T00:00:00.000Z',
      } }
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

test('failed upload aborts active workers and does not start queued files', async () => {
  const oldPost=api.post;
  const oldFetch=globalThis.fetch;
  try {
    api.post=async()=>({data:{success:true,data:{
      uploads:{cover:config('cover'),media:config('media')},
      sessionId:'session-123',
      expiresAt:'2099-01-01T00:00:00.000Z',
    }}});
    let calls=0;
    let cancelled=0;
    globalThis.fetch=async (_url,{signal})=>{
      const index=calls++;
      if(index===0) {
        await new Promise(resolve=>setTimeout(resolve,5));
        throw new Error('upload failed');
      }
      return new Promise((_resolve,reject)=>signal.addEventListener('abort',()=>{
        cancelled++;
        reject(new Error('aborted'));
      },{once:true}));
    };
    await assert.rejects(postService.uploadPostFilesDirect({coverImage:new Blob(['cover']),images:Array.from({length:10},()=>new Blob(['image']))}),/upload failed/);
    assert.equal(calls,4);
    assert.equal(cancelled,3);
  } finally { api.post=oldPost;globalThis.fetch=oldFetch; }
});

test('cleanup uses deletion token without uploading file bytes', async () => {
  const oldFetch=globalThis.fetch;
  try {
    let called=false;
    globalThis.fetch=async(url,{body})=>{
      called=true;
      assert.equal(url,'https://api.cloudinary.com/v1_1/demo/delete_by_token');
      assert.equal(body.get('token'),'temporary-token');
      assert.equal(body.get('file'),null);
      return {ok:true};
    };
    await postService.cleanupDirectUploads([{delete_token:'temporary-token',delete_url:'https://api.cloudinary.com/v1_1/demo/delete_by_token'}]);
    assert.equal(called,true);
  } finally {globalThis.fetch=oldFetch;}
});

test('invalid files are rejected before requesting upload signatures', async () => {
  const originalPost=api.post;
  let requests=0;
  api.post=async()=>{requests++;throw new Error('must not request');};
  try {
    const cover=new Blob(['cover'],{type:'image/png'});
    await assert.rejects(postService.uploadPostFilesDirect({coverImage:cover,images:Array.from({length:16},()=>new Blob(['x']))}),/15/);
    await assert.rejects(postService.uploadPostFilesDirect({coverImage:new Blob([])}),/ไฟล์ว่าง/);
    await assert.rejects(postService.uploadPostFilesDirect({coverImage:new Blob(['x'],{type:'text/html'})}),/ชนิดไฟล์/);
    await assert.rejects(postService.uploadPostFilesDirect({coverImage:cover,images:[cover]}),/ซ้ำ/);
    await assert.rejects(postService.uploadPostFilesDirect({coverImage:new Blob([new Uint8Array(2*1024*1024+1)])}),/ขนาด/);
    assert.equal(requests,0);
  } finally {api.post=originalPost;}
});
