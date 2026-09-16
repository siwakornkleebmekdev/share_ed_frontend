import test from 'node:test';
import assert from 'node:assert/strict';
import { createNotificationStore, normalize } from '../src/store/notificationCore.js';

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

test('reads the actor avatar from the backend contract', () => {
  const notification = normalize({
    id: 'actor-contract',
    type: 'LIKE',
    actorId: 'actor',
    postId: 'post',
    actor: { id: 'actor', username: 'alice', avatarUrl: 'avatar.jpg' },
  });
  assert.equal(notification.actorName, 'alice');
  assert.equal(notification.actorAvatar, 'avatar.jpg');
});

function storeWith(items) {
  const store = createNotificationStore({}, { disconnectSocket() {} });
  for (const item of items) store.getState().addNotification(item);
  return store;
}

test('removes a notification by notificationId', () => {
  const store = storeWith([
    { id: 'one', type: 'LIKE', actorId: 'a', postId: 'p' },
    { id: 'two', type: 'LIKE', actorId: 'b', postId: 'p' },
  ]);
  store.getState().removeNotification({ notificationId: 'one', type: 'LIKE', actorId: 'wrong', postId: 'wrong' });
  assert.deepEqual(store.getState().notifications.map(item => item.id), ['two']);
});

test('falls back to LIKE or NEW_LIKE actorId and postId identity', () => {
  const store = storeWith([
    { id: 'old', type: 'NEW_LIKE', actorId: 'a', postId: 'p' },
    { id: 'other-actor', type: 'LIKE', actorId: 'b', postId: 'p' },
    { id: 'other-post', type: 'LIKE', actorId: 'a', postId: 'q' },
  ]);
  store.getState().removeNotification({ type: 'LIKE', actorId: 'a', postId: 'p' });
  assert.deepEqual(store.getState().notifications.map(item => item.id).sort(), ['other-actor', 'other-post']);
});

test('notification_removed listener is registered and cleaned up', () => {
  const listeners = new Map();
  const removed = [];
  const socket = {
    on(event, handler) { listeners.set(event, handler); },
    off(event) { removed.push(event); },
  };
  const store = createNotificationStore(
    { getNotifications: async () => [] },
    { connectSocket: () => socket, disconnectSocket() {} },
  );
  store.getState().connectRealtime('recipient');
  assert.equal(typeof listeners.get('notification_removed'), 'function');
  store.getState().disconnectRealtime();
  assert.ok(removed.includes('notification_removed'));
});
