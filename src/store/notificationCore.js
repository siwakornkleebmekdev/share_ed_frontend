import { create } from 'zustand';

const POST_TYPES = new Set(['LIKE', 'NEW_LIKE', 'COMMENT', 'NEW_COMMENT', 'NEW_POST', 'BOOKMARK', 'BOOKMARK_REMOVED', 'POST_SUSPENDED', 'POST_RESTORED', 'POST_REMOVED', 'POST_REPORTED']);
const FOLLOW_TYPES = new Set(['FOLLOW', 'NEW_FOLLOWER']);
const THAI_TEXT = /[\u0E00-\u0E7F]/;
const THAI_TITLES = {
  LIKE: 'มีคนถูกใจโพสต์ของคุณ',
  NEW_LIKE: 'มีคนถูกใจโพสต์ของคุณ',
  COMMENT: 'ความคิดเห็นใหม่',
  NEW_COMMENT: 'ความคิดเห็นใหม่',
  FOLLOW: 'มีคนติดตามคุณ',
  NEW_FOLLOWER: 'มีคนติดตามคุณ',
  NEW_POST: 'โพสต์ใหม่จากคนที่คุณติดตาม',
  SYSTEM: 'การแจ้งเตือนจากระบบ',
  BOOKMARK: 'มีคนบันทึกโพสต์ของคุณ',
  BOOKMARK_REMOVED: 'มีคนยกเลิกการบันทึกโพสต์ของคุณ',
  POST_SUSPENDED: 'โพสต์ของคุณถูกระงับ',
  POST_RESTORED: 'โพสต์ของคุณได้รับการคืนสถานะ',
  POST_REMOVED: 'โพสต์ของคุณถูกลบ',
  POST_REPORTED: 'มีโพสต์ถูกรายงาน',
  ACHIEVEMENT_COMPLETED: 'ปลดล็อกความสำเร็จใหม่!',
};

function asId(value) {
  if (typeof value === 'string' || typeof value === 'number') return String(value);
  if (!value || typeof value !== 'object') return null;
  return asId(value.id ?? value._id ?? value.uuid ?? value.userId ?? value.user_id ?? value.postId ?? value.post_id);
}

function findId(sources, keys) {
  for (const source of sources) {
    if (!source || typeof source !== 'object') continue;
    for (const key of keys) {
      const id = asId(source[key]);
      if (id) return id;
    }
  }
  return null;
}

function safeInternalLink(value) {
  if (typeof value !== 'string') return null;
  const link = value.trim();
  if (/^(post|profile)\//.test(link)) return `/${link}`;
  return /^\/(?!\/)/.test(link) && !/[\\\s]/.test(link) ? link : null;
}

function getNestedValue(sources, keys) {
  for (const source of sources) {
    if (!source || typeof source !== 'object') continue;
    for (const key of keys) {
      const value = source[key];
      if (typeof value === 'string' && value.trim()) return value.trim();
    }
  }
  return null;
}

function inferActorNameFromText(values) {
  const patterns = [
    /^new post from\s+(.+?)(?:[.!]|$)/i,
    /^(.+?)\s+(?:has\s+)?(?:liked|commented|followed|published|created|shared|posted|bookmarked)\b/i,
    /^(.+?)\s+(?:ได้)?(?:กดถูกใจ|แสดงความคิดเห็น|เริ่มติดตาม|ติดตาม|เผยแพร่|สร้าง|แชร์|บันทึก)/,
  ];
  for (const value of values) {
    if (typeof value !== 'string') continue;
    for (const pattern of patterns) {
      const match = value.trim().match(pattern);
      const candidate = match?.[1]?.trim().replace(/^['“"]|['”"]$/g, '');
      if (
        candidate &&
        candidate.length <= 80 &&
        !/^(someone|a user|user|ผู้ใช้|ผู้ใช้คนหนึ่ง)$/i.test(candidate)
      ) {
        return candidate;
      }
    }
  }
  return null;
}

export function localizeNotificationContent(n, type) {
  const sources = [n, n.data, n.metadata, n.meta, n.payload, n.context, n.target].filter(Boolean);
  const actorSources = [
    ...sources,
    ...sources.flatMap(source => [
      source.actor, source.sender, source.follower, source.author, source.owner, source.user,
      source.fromUser, source.from_user, source.createdBy, source.created_by,
      source.triggeredBy, source.triggered_by, source.relatedUser, source.related_user,
    ]),
  ].filter(Boolean);
  const postSources = [
    ...sources,
    ...sources.flatMap(source => [source.post, source.targetPost, source.target_post]),
  ].filter(Boolean);
  const achievementSources = [
    ...sources,
    ...sources.flatMap(source => [source.achievement, source.milestone, source.reward, source.reward_item, source.rewardItem]),
  ].filter(Boolean);
  const actorName = getNestedValue(sources, [
    'actorName', 'actor_name', 'senderName', 'sender_name', 'followerName', 'follower_name',
    'authorName', 'author_name', 'authorUsername', 'author_username',
    'actorUsername', 'actor_username', 'senderUsername', 'sender_username',
    'createdByName', 'created_by_name', 'triggeredByName', 'triggered_by_name', 'username',
  ]) || getNestedValue(actorSources.slice(sources.length), [
    'displayName', 'display_name', 'username', 'name',
  ]) || inferActorNameFromText(
    sources.flatMap(source => [source.message, source.content, source.title]).filter(Boolean),
  );
  const postTitle = getNestedValue(sources, [
    'postTitle', 'post_title', 'targetTitle', 'target_title',
  ]) || getNestedValue(postSources.slice(sources.length), ['title']);
  const achievementTitle = getNestedValue(sources, [
    'achievementTitle', 'achievement_title', 'milestoneTitle', 'milestone_title',
    'achievementName', 'achievement_name', 'milestoneName', 'milestone_name',
    'rewardName', 'reward_name', 'itemName', 'item_name',
  ]) || getNestedValue(achievementSources.slice(sources.length), ['title', 'name', 'item_name']);
  const backendMessage = getNestedValue(sources, ['message', 'content']);
  const actor = actorName || 'ผู้ใช้คนหนึ่ง';
  const post = postTitle ? ` “${postTitle}”` : 'ของคุณ';

  const messages = {
    LIKE: `${actor} ถูกใจโพสต์${post}`,
    NEW_LIKE: `${actor} ถูกใจโพสต์${post}`,
    COMMENT: `${actor} แสดงความคิดเห็นในโพสต์${post}`,
    NEW_COMMENT: `${actor} แสดงความคิดเห็นในโพสต์${post}`,
    FOLLOW: `${actor} เริ่มติดตามคุณ`,
    NEW_FOLLOWER: `${actor} เริ่มติดตามคุณ`,
    NEW_POST: postTitle
      ? `${actor} เผยแพร่โพสต์ใหม่ “${postTitle}”`
      : `${actor} เผยแพร่โพสต์ใหม่`,
    BOOKMARK: `${actor} บันทึกโพสต์${post}`,
    BOOKMARK_REMOVED: `${actor} ยกเลิกการบันทึกโพสต์${post}`,
    ACHIEVEMENT_COMPLETED: (backendMessage && THAI_TEXT.test(backendMessage))
      ? backendMessage
      : (achievementTitle
        ? `คุณปลดล็อกความสำเร็จ “${achievementTitle}” เรียบร้อยแล้ว เข้าไปรับรางวัลได้เลย`
        : 'คุณปลดล็อกความสำเร็จใหม่เรียบร้อยแล้ว เข้าไปรับรางวัลได้เลย'),
  };
  return {
    title: THAI_TITLES[type] || 'การแจ้งเตือน',
    message:
      messages[type] ||
      (backendMessage && THAI_TEXT.test(backendMessage)
        ? backendMessage
        : type === 'SYSTEM'
          ? 'คุณมีข้อความแจ้งเตือนใหม่จากระบบ'
          : type === 'ACHIEVEMENT_COMPLETED'
            ? 'คุณปลดล็อกความสำเร็จใหม่เรียบร้อยแล้ว เข้าไปรับรางวัลได้เลย'
            : 'คุณมีการแจ้งเตือนใหม่'),
    actorName,
  };
}

export function getNotificationTarget(n, normalizedType) {
  if (!n || typeof n !== 'object') return { link: null, postId: null, actorId: null };
  const type = normalizedType || String(n.type || n.notification_type || 'SYSTEM').trim().replace(/[\s-]+/g, '_').toUpperCase();
  const sources = [n, n.data, n.metadata, n.meta, n.payload, n.context, n.target].filter(Boolean);
  const explicitLink = sources
    .map(source => safeInternalLink(source.link || source.url || source.actionUrl || source.action_url || source.targetUrl || source.target_url))
    .find(Boolean) || null;
  const postId = findId(sources, [
    'postId', 'post_id', 'post', 'targetPost', 'target_post', 'relatedPostId', 'related_post_id',
    'resourceId', 'resource_id', 'entityId', 'entity_id', 'referenceId', 'reference_id', 'targetId', 'target_id',
  ]);
  const actorId = findId(sources, [
    'followerId', 'follower_id', 'actorId', 'actor_id', 'senderId', 'sender_id', 'fromUserId', 'from_user_id',
    'triggeredById', 'triggered_by_id', 'relatedUserId', 'related_user_id', 'actor', 'sender', 'follower',
    'authorId', 'author_id', 'createdById', 'created_by_id', 'fromUser', 'from_user', 'author',
    'createdBy', 'created_by', 'triggeredBy', 'triggered_by', 'relatedUser', 'related_user', 'userId', 'user_id',
  ]);
  const generatedLink = POST_TYPES.has(type) && postId
    ? `/post/${encodeURIComponent(postId)}`
    : FOLLOW_TYPES.has(type) && actorId
      ? `/profile/${encodeURIComponent(actorId)}`
      : type === 'ACHIEVEMENT_COMPLETED'
        ? '/achievements'
        : null;
  const link = FOLLOW_TYPES.has(type) && generatedLink
    ? generatedLink
    : explicitLink || generatedLink;
  return { link, postId, actorId };
}

export function normalize(n) {
  if (!n || typeof n !== 'object' || (n.id ?? n._id) == null) return null;
  const type = String(n.type || n.notification_type || 'SYSTEM').trim().replace(/[\s-]+/g, '_').toUpperCase();
  const localized = localizeNotificationContent(n, type);
  const { link, postId, actorId } = getNotificationTarget(n, type);
  const read = n.isRead ?? n.is_read ?? false;
  return {
    id: String(n.id ?? n._id), type, title: localized.title,
    message: localized.message, isRead: read === true || read === 'true' || read === 1,
    link, postId, actorId,
    createdAt: Number.isNaN(Date.parse(n.createdAt || n.created_at)) ? new Date(0).toISOString() : new Date(n.createdAt || n.created_at).toISOString(),
    actorName: localized.actorName,
    actorAvatar: n.actorAvatar || n.actor?.avatarUrl || n.actor?.avatar_url || null,
  };
}
const sorted = (items) => [...new Map(items.filter(Boolean).map(n => [n.id, n])).values()].sort((a, b) => Date.parse(b.createdAt) - Date.parse(a.createdAt));

export function createNotificationStore(service, realtime) {
  let epoch = 0, revision = 0, flight = null, cleanup = () => {};
  return create((set, get) => {
    const mutate = async (operation, apply) => {
      if (get().isMutating) return false;
      const session = epoch;
      revision++;
      set({ isMutating: true, error: null });
      try {
        await operation();
        if (session !== epoch) return false;
        revision++;
        set(state => ({ notifications: apply(state.notifications) }));
        return true;
      } catch {
        if (session === epoch) set({ error: 'บันทึกการแจ้งเตือนไม่สำเร็จ กรุณาลองอีกครั้ง' });
        return false;
      } finally {
        if (session === epoch) set({ isMutating: false });
      }
    };
    return {
      notifications: [], isLoading: false, isMutating: false, error: null,
      unreadCount: () => get().notifications.filter(n => !n.isRead).length,
      fetchNotifications: () => {
        if (flight) return flight;
        if (get().isMutating) return Promise.resolve();
        const session = epoch, version = revision;
        set({ isLoading: true });
        const request = (async () => {
          try {
            const response = await service.getNotifications();
            const raw = response?.data?.notifications ?? response?.data ?? response?.notifications ?? response;
            if (!Array.isArray(raw)) throw new Error('Invalid notification response');
            if (session === epoch && version === revision) set({ notifications: sorted(raw.map(normalize)), error: null });
          } catch {
            if (session === epoch) set({ error: 'โหลดการแจ้งเตือนไม่สำเร็จ กรุณาลองอีกครั้ง' });
          } finally {
            if (session === epoch) { flight = null; set({ isLoading: false }); }
          }
        })();
        flight = request;
        return request;
      },
      connectRealtime: (userId) => {
        get().disconnectRealtime();
        const session = epoch;
        const socket = realtime.connectSocket(userId);
        const refresh = () => { if (session === epoch) get().fetchNotifications(); };
        const receive = payload => { if (session === epoch) get().addNotification(payload?.data ?? payload); };
        const remove = payload => { if (session === epoch) get().removeNotification(payload?.data ?? payload); };
        const receiveAchievement = payload => {
          if (session === epoch) {
            get().fetchNotifications();
            globalThis.window?.dispatchEvent(new CustomEvent('achievement_completed', { detail: payload?.data ?? payload }));
          }
        };
        socket.on('new_notification', receive);
        socket.on('notification_removed', remove);
        socket.on('achievement_completed', receiveAchievement);
        socket.on('achievement_unlocked', receiveAchievement);
        socket.on('milestone_completed', receiveAchievement);
        socket.on('connect', refresh);
        const timer = setInterval(refresh, 60000);
        globalThis.window?.addEventListener('online', refresh);
        globalThis.window?.addEventListener('focus', refresh);
        cleanup = () => {
          clearInterval(timer);
          socket.off('new_notification', receive);
          socket.off('notification_removed', remove);
          socket.off('achievement_completed', receiveAchievement);
          socket.off('achievement_unlocked', receiveAchievement);
          socket.off('milestone_completed', receiveAchievement);
          socket.off('connect', refresh);
          globalThis.window?.removeEventListener('online', refresh);
          globalThis.window?.removeEventListener('focus', refresh);
        };
        refresh();
      },
      disconnectRealtime: () => {
        epoch++; revision++; flight = null;
        cleanup(); cleanup = () => {};
        realtime.disconnectSocket();
        set({ notifications: [], isLoading: false, isMutating: false, error: null });
      },
      markAsRead: id => mutate(() => service.markAsRead(id), items => items.map(n => n.id === String(id) ? { ...n, isRead: true } : n)),
      markAllAsRead: () => {
        const ids = new Set(get().notifications.map(n => n.id));
        return mutate(() => service.markAllAsRead(), items => items.map(n => ids.has(n.id) ? { ...n, isRead: true } : n));
      },
      deleteNotification: id => mutate(() => service.deleteNotification(id), items => items.filter(n => n.id !== String(id))),
      removeNotification: payload => {
        if (!payload || typeof payload !== 'object') return;
        const notificationId = asId(payload.notificationId ?? payload.notification_id);
        const type = String(payload.type || '').trim().replace(/[\s-]+/g, '_').toUpperCase();
        const actorId = asId(payload.actorId ?? payload.actor_id);
        const postId = asId(payload.postId ?? payload.post_id);
        revision++;
        set(state => ({
          notifications: state.notifications.filter(notification => {
            if (notificationId && notification.id === notificationId) return false;
            return !(
              !notificationId &&
              (type === 'LIKE' || type === 'NEW_LIKE') &&
              (notification.type === 'LIKE' || notification.type === 'NEW_LIKE') &&
              actorId && notification.actorId === actorId &&
              postId && notification.postId === postId
            );
          }),
        }));
      },
      clearAll: () => {
        const session = epoch;
        const ids = get().notifications.map(n => n.id);
        return mutate(async () => {
          const results = await Promise.allSettled(ids.map(id => service.deleteNotification(id)));
          const removed = new Set(ids.filter((_, i) => results[i].status === 'fulfilled'));
          // Apply confirmed deletes only, even if some requests failed.
          if (session === epoch) set(state => ({ notifications: state.notifications.filter(n => !removed.has(n.id)) }));
          if (results.some(r => r.status === 'rejected')) throw new Error('Partial delete');
        }, items => items);
      },
      addNotification: raw => {
        const n = normalize(raw);
        if (!n) return;
        revision++;
        set(state => {
          const existing = state.notifications.find(item => item.id === n.id);
          return { notifications: sorted([...state.notifications.filter(item => item.id !== n.id), { ...n, isRead: n.isRead || existing?.isRead || false }]) };
        });
        if (n.type === 'ACHIEVEMENT_COMPLETED') {
          globalThis.window?.dispatchEvent(new CustomEvent('achievement_completed', { detail: n }));
        }
      },
    };
  });
}
