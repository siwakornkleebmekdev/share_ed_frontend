import test from 'node:test';
import assert from 'node:assert/strict';
import { normalize } from '../src/store/notificationCore.js';

test('builds a post link from nested notification metadata', () => {
  const notification = normalize({
    id: 'notification-1',
    type: 'new-like',
    metadata: { post: { _id: 'post-123' } },
  });

  assert.equal(notification.type, 'NEW_LIKE');
  assert.equal(notification.link, '/post/post-123');
});

test('builds a profile link from the follower stored as userId', () => {
  const notification = normalize({
    id: 'notification-2',
    type: 'NEW_FOLLOWER',
    data: { userId: 'user-456' },
  });

  assert.equal(notification.link, '/profile/user-456');
});

test('prefers the sender over a recipient userId for follow notifications', () => {
  const notification = normalize({
    id: 'notification-3',
    type: 'FOLLOW',
    userId: 'recipient',
    sender: { id: 'follower' },
  });

  assert.equal(notification.link, '/profile/follower');
});

test('keeps safe internal links and rejects external links', () => {
  assert.equal(normalize({ id: '4', link: 'post/42' }).link, '/post/42');
  assert.equal(normalize({ id: '5', link: 'https://example.com' }).link, null);
});
