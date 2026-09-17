import test from 'node:test';
import assert from 'node:assert/strict';
import { formatPostData, formatSinglePostData } from '../src/services/post.service.js';

const frame = {
  id: 'frame-1',
  item_name: 'กรอบทดสอบ',
  image_url: '/frames/test.svg',
};

const rawPost = {
  id: 'post-1',
  title: 'โพสต์ทดสอบ',
  summary: 'สรุป',
  education_level: 'HIGH_SCHOOL',
  created_at: '2026-09-17T00:00:00.000Z',
  author_id: 'author-1',
  author: {
    id: 'author-1',
    username: 'alice',
    current_frame_id: 'frame-1',
    current_frame: frame,
  },
};

test('post cards retain the author frame id and image data from the API', () => {
  const post = formatPostData(rawPost);
  assert.equal(post.authorFrameId, 'frame-1');
  assert.deepEqual(post.authorFrame, frame);
});

test('post details retain the author frame id and image data from the API', () => {
  const post = formatSinglePostData(rawPost);
  assert.equal(post.author_frame_id, 'frame-1');
  assert.deepEqual(post.author.current_frame, frame);
});
