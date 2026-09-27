import { io, Socket } from 'socket.io-client';
import { getAccessToken } from './api';

let socket: Socket | null = null;

export function connectSocket(): Socket {
  const token = getAccessToken();
  const socketUrl = import.meta.env.VITE_SOCKET_URL || window.location.origin;

  if (socket) {
    socket.auth = { token };
    if (!socket.connected) {
      socket.connect();
    }
    return socket;
  }

  socket = io(socketUrl, {
    auth: {
      token,
    },
    transports: ['websocket', 'polling'],
    autoConnect: true,
    reconnection: true,
  });

  socket.on('connect', () => {
    console.log('[Socket.IO] Connected to WebSocket server - ID:', socket?.id);
  });

  socket.on('connect_error', (err) => {
    console.error('[Socket.IO] Connection error:', err.message);
  });

  socket.on('disconnect', (reason) => {
    console.log('[Socket.IO] Disconnected:', reason);
  });

  return socket;
}

export function getSocket(): Socket | null {
  return socket;
}

export function disconnectSocket() {
  if (socket) {
    socket.disconnect();
    socket = null;
  }
}
