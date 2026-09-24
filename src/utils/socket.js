import { io } from 'socket.io-client';
import { supabase } from './supabase.js';

const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || (import.meta.env.VITE_API_BASE_URL
  ? import.meta.env.VITE_API_BASE_URL.replace(/\/api\/v1\/?$/, '')
  : 'https://share-ed-backend-6jer.onrender.com');
let socketInstance = null;
let owner = null;
const eventSubscribers = new Map();

function attachEventSubscribers(socket) {
  eventSubscribers.forEach((handlers, event) => {
    handlers.forEach((handler) => socket.on(event, handler));
  });
}

export function getSocket() { return socketInstance; }
export function subscribeSocketEvent(event, handler) {
  if (!eventSubscribers.has(event)) eventSubscribers.set(event, new Set());
  eventSubscribers.get(event).add(handler);
  socketInstance?.on(event, handler);

  return () => {
    socketInstance?.off(event, handler);
    const handlers = eventSubscribers.get(event);
    handlers?.delete(handler);
    if (handlers?.size === 0) eventSubscribers.delete(event);
  };
}
export function connectSocket(userId) {
  if (socketInstance && owner === userId) return socketInstance;
  disconnectSocket();
  owner = userId;
  const socket = io(SOCKET_URL, {
    auth: async callback => {
      try {
        const { data, error } = await supabase.auth.getSession();
        callback({ userId, token: error ? null : data?.session?.access_token || null });
      } catch {
        callback({ userId, token: null });
      }
    },
    reconnection: true, reconnectionDelay: 2000, reconnectionDelayMax: 30000, timeout: 10000,
  });
  attachEventSubscribers(socket);
  socket.on('connect', () => socket.emit('join', userId));
  socketInstance = socket;
  return socket;
}
export function disconnectSocket() {
  socketInstance?.disconnect();
  socketInstance = null;
  owner = null;
}
