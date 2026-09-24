import assert from 'node:assert/strict';
import test from 'node:test';
import { normalize } from '../src/store/notificationCore.js';

test('notification normalization uses the backend message without throwing', () => {
  const result = normalize({
    id: 'notification-1',
    type: 'ACHIEVEMENT_COMPLETED',
    message: 'คุณปลดล็อกความสำเร็จใหม่แล้ว',
    is_read: false,
    created_at: '2026-09-24T00:00:00.000Z',
  });

  assert.equal(result.id, 'notification-1');
  assert.equal(result.message, 'คุณปลดล็อกความสำเร็จใหม่แล้ว');
  assert.equal(result.isRead, false);
});

test('ordinary realtime notifications normalize without evaluating an undeclared value', () => {
  const result = normalize({
    id: 'notification-2',
    type: 'NEW_FOLLOWER',
    message: 'สมชายเริ่มติดตามคุณ',
    actor_id: 'user-2',
    created_at: '2026-09-24T00:00:00.000Z',
  });

  assert.equal(result.type, 'NEW_FOLLOWER');
  assert.equal(result.actorId, 'user-2');
});
