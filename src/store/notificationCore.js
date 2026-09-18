import { create } from 'zustand';

const POST_TYPES = new Set(['LIKE', 'NEW_LIKE', 'COMMENT', 'NEW_COMMENT', 'NEW_POST', 'BOOKMARK', 'BOOKMARK_REMOVED']);
const FOLLOW_TYPES = new Set(['FOLLOW', 'NEW_FOLLOWER']);

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

/**
 * ตำแหน่งบนหน้าเว็บ: ทุกลิงก์บนรายการแจ้งเตือน (เมื่อคลิกที่การแจ้งเตือนใน Navbar หรือหน้า /notifications)
 * หน้าที่: คำนวณหา URL ปลายทางที่ต้องเปิด เช่น ลิงก์ไปยังหน้าโพสต์ (`/post/:id`) หรือหน้าโปรไฟล์ (`/profile/:id`)
 *         ตามประเภทของการแจ้งเตือน (เช่น ไลก์, คอมเมนต์, มีคนติดตาม)
 */
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
    'fromUser', 'from_user', 'userId', 'user_id',
  ]);
  const generatedLink = POST_TYPES.has(type) && postId
    ? `/post/${encodeURIComponent(postId)}`
    : FOLLOW_TYPES.has(type) && actorId
      ? `/profile/${encodeURIComponent(actorId)}`
      : null;
  return { link: explicitLink || generatedLink, postId, actorId };
}

/**
 * ตำแหน่งบนหน้าเว็บ: รายการแจ้งเตือนแต่ละแถวที่แสดงผลบนหน้าจอ (ทั้งไอคอน, ข้อความ, วันเวลา, รูปโปรไฟล์ของผู้กระทำ)
 * หน้าที่: แปลงโครงสร้างข้อมูลการแจ้งเตือนที่ได้จาก API หรือ Socket ให้เป็นฟอร์แมตมาตรฐานเดียวกัน
 *         พร้อมกำหนดข้อความภาษาไทยเริ่มต้นตามประเภท (LIKE, COMMENT, FOLLOW ฯลฯ)
 */
export function normalize(n) {
  if (!n || typeof n !== 'object' || (n.id ?? n._id) == null) return null;
  const type = String(n.type || n.notification_type || 'SYSTEM').trim().replace(/[\s-]+/g, '_').toUpperCase();
  const labels = {
    LIKE: 'มีคนถูกใจโพสต์ของคุณ', NEW_LIKE: 'มีคนถูกใจโพสต์ของคุณ',
    COMMENT: 'ความคิดเห็นใหม่', NEW_COMMENT: 'ความคิดเห็นใหม่',
    FOLLOW: 'มีคนติดตามคุณ', NEW_FOLLOWER: 'มีคนติดตามคุณ',
    NEW_POST: 'โพสต์ใหม่จากคนที่คุณติดตาม', SYSTEM: 'การแจ้งเตือนจากระบบ',
    BOOKMARK: 'มีคนบุ๊กมาร์กโพสต์ของคุณ', BOOKMARK_REMOVED: 'มีคนยกเลิกบุ๊กมาร์กโพสต์ของคุณ',
  };
  const { link, postId, actorId } = getNotificationTarget(n, type);
  const read = n.isRead ?? n.is_read ?? false;
  return {
    id: String(n.id ?? n._id), type, title: n.title || labels[type] || 'การแจ้งเตือน',
    message: n.message || n.content || '', isRead: read === true || read === 'true' || read === 1,
    link, postId, actorId,
    createdAt: Number.isNaN(Date.parse(n.createdAt || n.created_at)) ? new Date(0).toISOString() : new Date(n.createdAt || n.created_at).toISOString(),
    actorName: n.actorName || n.actor?.username || null,
    actorAvatar: n.actorAvatar || n.actor?.avatarUrl || n.actor?.avatar_url || null,
  };
}
const sorted = (items) => [...new Map(items.filter(Boolean).map(n => [n.id, n])).values()].sort((a, b) => Date.parse(b.createdAt) - Date.parse(a.createdAt));

/**
 * =========================================================================
 * ตำแหน่งบนหน้าเว็บ:
 *   1. แถบนำทางด้านบน (Navbar): แสดงไอคอนกระดิ่ง, ตัวเลขป้ายแดงแจ้งเตือน, รายการแจ้งเตือนล่าสุดใน Dropdown
 *   2. หน้าการแจ้งเตือนหลัก (/notifications): แสดงรายการแจ้งเตือนทั้งหมดแบบแยกตามวัน
 *   3. ตัวควบคุมหลักของเว็บ (App.jsx): เริ่มเชื่อมต่อ Realtime Socket เมื่อล็อกอิน และตัดการเชื่อมต่อเมื่อล็อกเอาท์
 * 
 * หน้าที่: Factory Function สำหรับสร้าง Zustand Store จัดการ State ของระบบแจ้งเตือนทั้งหมด
 *         รองรับการดึงข้อมูลจาก API, การรับ-ส่งข้อมูล Realtime ผ่าน WebSocket, การกดอ่าน และการลบแจ้งเตือน
 * =========================================================================
 */
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

      /**
       * ตำแหน่งบนหน้าเว็บ: จุดป้ายตัวเลขสีแดง (Badge) บนไอคอนกระดิ่งใน Navbar และข้อความ "X ใหม่" ในหัวข้อหน้า Notifications
       * หน้าที่: คำนวณนับจำนวนการแจ้งเตือนที่ยังไม่ได้อ่าน (`!isRead`) ทั้งหมดใน store
       */
      unreadCount: () => get().notifications.filter(n => !n.isRead).length,

      /**
       * ตำแหน่งบนหน้าเว็บ: เรียกใช้ตอนเปิดหน้าเว็บ, เปิดเมนูแจ้งเตือนใน Navbar หรือเปิดหน้า /notifications
       * หน้าที่: ส่งคำขอไปยัง Backend API เพื่อดึงข้อมูลการแจ้งเตือนทั้งหมดของผู้ใช้มาเก็บไว้ใน store
       */
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

      /**
       * ตำแหน่งบนหน้าเว็บ: ทำงานในระดับระบบ (App.jsx) ทันทีที่ผู้ใช้เข้าสู่ระบบสำเร็จ
       * หน้าที่: เชื่อมต่อ WebSocket กับ Socket.io เซิร์ฟเวอร์ เพื่อรับฟังอีเวนต์แจ้งเตือนสด Realtime 
       *         (`new_notification`, `notification_removed`) และรีเฟรชข้อมูลอัตโนมัติเมื่อหน้าต่างเบราว์เซอร์กลับมา Active
       */
      connectRealtime: (userId) => {
        get().disconnectRealtime();
        const session = epoch;
        const socket = realtime.connectSocket(userId);
        const refresh = () => { if (session === epoch) get().fetchNotifications(); };
        const receive = payload => { if (session === epoch) get().addNotification(payload?.data ?? payload); };
        const remove = payload => { if (session === epoch) get().removeNotification(payload?.data ?? payload); };
        socket.on('new_notification', receive);
        socket.on('notification_removed', remove);
        socket.on('connect', refresh);
        const timer = setInterval(refresh, 60000);
        globalThis.window?.addEventListener('online', refresh);
        globalThis.window?.addEventListener('focus', refresh);
        cleanup = () => {
          clearInterval(timer);
          socket.off('new_notification', receive);
          socket.off('notification_removed', remove);
          socket.off('connect', refresh);
          globalThis.window?.removeEventListener('online', refresh);
          globalThis.window?.removeEventListener('focus', refresh);
        };
        refresh();
      },

      /**
       * ตำแหน่งบนหน้าเว็บ: ทำงานในระดับระบบ (App.jsx) เมื่อผู้ใช้กดปุ่ม "ออกจากระบบ" (Logout)
       * หน้าที่: ตัดการเชื่อมต่อ WebSocket, เคลียร์ตัวจับเวลาและ Event Listeners พร้อมล้างข้อมูลการแจ้งเตือนใน store
       */
      disconnectRealtime: () => {
        epoch++; revision++; flight = null;
        cleanup(); cleanup = () => {};
        realtime.disconnectSocket();
        set({ notifications: [], isLoading: false, isMutating: false, error: null });
      },

      /**
       * ตำแหน่งบนหน้าเว็บ: เมื่อผู้ใช้คลิกที่รายการแจ้งเตือนแต่ละแถว (ทั้งใน Dropdown ของ Navbar และหน้า /notifications)
       * หน้าที่: ส่ง API อัปเดตสถานะการแจ้งเตือนเป็นอ่านแล้ว และเปลี่ยนสถานะ `isRead: true` ใน store ทันที
       */
      markAsRead: id => mutate(() => service.markAsRead(id), items => items.map(n => n.id === String(id) ? { ...n, isRead: true } : n)),

      /**
       * ตำแหน่งบนหน้าเว็บ: ปุ่ม "อ่านทั้งหมด" (ไอคอน Check) บนส่วนหัวของเมนูแจ้งเตือนใน Navbar และหน้า /notifications
       * หน้าที่: ส่งคำขอ API เพื่ออัปเดตการแจ้งเตือนทั้งหมดของผู้ใช้ให้เป็นสถานะอ่านแล้ว
       */
      markAllAsRead: () => {
        const ids = new Set(get().notifications.map(n => n.id));
        return mutate(() => service.markAllAsRead(), items => items.map(n => ids.has(n.id) ? { ...n, isRead: true } : n));
      },

      /**
       * ตำแหน่งบนหน้าเว็บ: ปุ่มไอคอนรูปถังขยะ/ปุ่มลบ ท้ายแถวรายการแจ้งเตือนแต่ละแถว
       * หน้าที่: ส่งคำขอ API ลบการแจ้งเตือนรายการนั้นออกจากฐานข้อมูล และนำออกจากรายการที่แสดงบนหน้าเว็บ
       */
      deleteNotification: id => mutate(() => service.deleteNotification(id), items => items.filter(n => n.id !== String(id))),

      /**
       * ตำแหน่งบนหน้าเว็บ: ทำงานผ่านระบบ Realtime WebSocket เมื่อมีการกระทำที่ทำให้การแจ้งเตือนหายไป (เช่น มีคนยกเลิกการกดถูกใจ Unlike)
       * หน้าที่: คัดกรองและลบการแจ้งเตือนที่เกี่ยวข้องออกจาก store แบบทันทีโดยไม่ต้องกดรีเฟรชหน้าเว็บ
       */
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

      /**
       * ตำแหน่งบนหน้าเว็บ: ปุ่ม "ล้างทั้งหมด" (ไอคอน Trash) ที่ส่วนหัวของหน้า /notifications
       * หน้าที่: ยิง API ลบการแจ้งเตือนทั้งหมดของผู้ใช้ และล้างรายการแจ้งเตือนทั้งหมดใน store
       */
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

      /**
       * ตำแหน่งบนหน้าเว็บ: รายการแจ้งเตือนใน Navbar และหน้า /notifications ขณะกำลังเปิดใช้งานหน้าเว็บอยู่
       * หน้าที่: รับข้อมูลการแจ้งเตือนใหม่ที่ส่งมาจาก Socket เซิร์ฟเวอร์ แล้วแทรกขึ้นมาไว้บนสุดของรายการแบบ Realtime
       */
      addNotification: raw => {
        const n = normalize(raw);
        if (!n) return;
        revision++;
        set(state => {
          const existing = state.notifications.find(item => item.id === n.id);
          return { notifications: sorted([...state.notifications.filter(item => item.id !== n.id), { ...n, isRead: n.isRead || existing?.isRead || false }]) };
        });
      },
    };
  });
}

