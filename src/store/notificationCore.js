import { create } from 'zustand';

export function normalize(n) {
  if (!n || typeof n !== 'object' || (n.id ?? n._id) == null) return null;
  const type = String(n.type || n.notification_type || 'SYSTEM').toUpperCase();
  const labels = { LIKE: 'มีคนถูกใจโพสต์ของคุณ', COMMENT: 'ความคิดเห็นใหม่', FOLLOW: 'มีคนติดตามคุณ', NEW_POST: 'โพสต์ใหม่จากคนที่คุณติดตาม', SYSTEM: 'การแจ้งเตือนจากระบบ', BOOKMARK: 'มีคนบุ๊กมาร์กโพสต์ของคุณ' };
  const link = n.link || (n.post_id ? `/post/${encodeURIComponent(n.post_id)}` : null);
  const read = n.isRead ?? n.is_read ?? false;
  return {
    id: String(n.id ?? n._id), type, title: n.title || labels[type] || 'การแจ้งเตือน',
    message: n.message || n.content || '', isRead: read === true || read === 'true' || read === 1,
    link: typeof link === 'string' && /^\/(?!\/)/.test(link) && !/[\\\s]/.test(link) ? link : null,
    createdAt: Number.isNaN(Date.parse(n.createdAt || n.created_at)) ? new Date(0).toISOString() : new Date(n.createdAt || n.created_at).toISOString(),
    actorName: n.actorName || n.actor?.username || null,
    actorAvatar: n.actorAvatar || n.actor?.avatar_url || null,
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
        socket.on('new_notification', receive);
        socket.on('connect', refresh);
        const timer = setInterval(refresh, 60000);
        globalThis.window?.addEventListener('online', refresh);
        globalThis.window?.addEventListener('focus', refresh);
        cleanup = () => {
          clearInterval(timer);
          socket.off('new_notification', receive);
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
      },
    };
  });
}

