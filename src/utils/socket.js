import { io } from 'socket.io-client';

const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || (import.meta.env.VITE_API_BASE_URL
  ? import.meta.env.VITE_API_BASE_URL.replace(/\/api\/v1\/?$/, '')
  : 'https://share-ed-backend-6jer.onrender.com');
let socketInstance = null;
let owner = null;
export function getSocket() { return socketInstance; }
export function connectSocket(userId) {
  if (socketInstance && owner === userId) return socketInstance;
  disconnectSocket();
  owner = userId;
  const socket = io(SOCKET_URL, {
    auth: callback => callback({ userId, token: localStorage.getItem('access_token') }),
    reconnection: true, reconnectionDelay: 2000, reconnectionDelayMax: 30000, timeout: 10000,
  });
  socket.on('connect', () => socket.emit('join', userId));
  socketInstance = socket;
  return socket;
}
export function disconnectSocket() {
  socketInstance?.disconnect();
  socketInstance = null;
  owner = null;
}
