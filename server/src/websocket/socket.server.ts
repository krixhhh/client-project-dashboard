import { Server as HttpServer } from 'http';
import { Server, Socket } from 'socket.io';
import { verifyAccessToken } from '../utils/jwt';
import { JwtPayload } from '../types';
import { env } from '../config/env';
import { Role } from '@prisma/client';
import { prisma } from '../config/database';

interface AuthenticatedSocket extends Socket {
  user?: JwtPayload;
}

let io: Server | null = null;
const onlineUsersMap = new Map<string, { socketId: string; user: JwtPayload; connectedAt: Date }>();

export function initSocketServer(httpServer: HttpServer): Server {
  io = new Server(httpServer, {
    cors: {
      origin: env.CLIENT_URL,
      credentials: true,
    },
  });

  // Authentication Middleware for Socket.IO
  io.use((socket: AuthenticatedSocket, next) => {
    const token = socket.handshake.auth?.token || socket.handshake.headers.authorization?.split(' ')[1];

    if (!token) {
      return next(new Error('Authentication token missing'));
    }

    try {
      const payload = verifyAccessToken(token);
      socket.user = payload;
      next();
    } catch (err) {
      return next(new Error('Invalid or expired socket authentication token'));
    }
  });

  io.on('connection', async (socket: AuthenticatedSocket) => {
    const user = socket.user!;
    console.log(`[Socket] Client connected: ${user.name} (${user.role}) - ID: ${socket.id}`);

    onlineUsersMap.set(socket.id, {
      socketId: socket.id,
      user,
      connectedAt: new Date(),
    });

    // Automatically join role-appropriate rooms
    socket.join(`user:${user.userId}`);

    if (user.role === Role.ADMIN) {
      socket.join('admin');
    } else if (user.role === Role.PROJECT_MANAGER) {
      // Join rooms for all projects PM manages
      const pmProjects = await prisma.project.findMany({
        where: { projectManagerId: user.userId },
        select: { id: true },
      });
      pmProjects.forEach((p) => {
        socket.join(`project:${p.id}`);
      });
    }

    // Broadcast presence update
    broadcastPresence();

    socket.on('get_presence', () => {
      broadcastPresence();
    });

    // Client requests joining explicit project room (with authorization check!)
    socket.on('join_project_room', async (projectId: string) => {
      try {
        if (!projectId) return;

        const project = await prisma.project.findUnique({ where: { id: projectId } });
        if (!project) return;

        let canJoin = false;
        if (user.role === Role.ADMIN) {
          canJoin = true;
        } else if (user.role === Role.PROJECT_MANAGER && project.projectManagerId === user.userId) {
          canJoin = true;
        } else if (user.role === Role.DEVELOPER) {
          const hasAssignedTask = await prisma.task.findFirst({
            where: { projectId, developerId: user.userId },
          });
          if (hasAssignedTask) canJoin = true;
        }

        if (canJoin) {
          socket.join(`project:${projectId}`);
          console.log(`[Socket] ${user.name} authorized & joined project:${projectId}`);
        } else {
          console.warn(`[Socket] Unauthorized room join attempt by ${user.name} for project:${projectId}`);
          socket.emit('socket_error', { message: 'Unauthorized project room access' });
        }
      } catch (err) {
        console.error('[Socket] Join project room error:', err);
      }
    });

    socket.on('disconnect', () => {
      console.log(`[Socket] Client disconnected: ${user.name} - ID: ${socket.id}`);
      onlineUsersMap.delete(socket.id);
      broadcastPresence();
    });
  });

  return io;
}

export function getIO(): Server {
  if (!io) {
    throw new Error('Socket.IO server has not been initialized');
  }
  return io;
}

function broadcastPresence() {
  if (!io) return;

  const onlineUsersList = Array.from(onlineUsersMap.values()).map((entry) => ({
    userId: entry.user.userId,
    name: entry.user.name,
    email: entry.user.email,
    role: entry.user.role,
    connectedAt: entry.connectedAt,
  }));

  // Unique users count
  const uniqueUserIds = new Set(onlineUsersList.map((u) => u.userId));

  io.emit('user.presence', {
    count: uniqueUserIds.size,
    users: onlineUsersList,
  });
}

export function getOnlineUsersCount(): number {
  const uniqueUserIds = new Set(Array.from(onlineUsersMap.values()).map((e) => e.user.userId));
  return uniqueUserIds.size;
}

export function getOnlineUsers() {
  const map = new Map();
  for (const entry of onlineUsersMap.values()) {
    if (!map.has(entry.user.userId)) {
      map.set(entry.user.userId, {
        userId: entry.user.userId,
        name: entry.user.name,
        email: entry.user.email,
        role: entry.user.role,
        connectedAt: entry.connectedAt,
      });
    }
  }
  return Array.from(map.values());
}

export function emitActivity(activity: any, projectId: string, developerId?: string | null) {
  if (!io) return;

  // 1. Emit to admin room
  io.to('admin').emit('activity.created', activity);

  // 2. Emit to project room (PMs and authorized members)
  io.to(`project:${projectId}`).emit('activity.created', activity);

  // 3. Emit to assigned developer room if applicable
  if (developerId) {
    io.to(`user:${developerId}`).emit('activity.created', activity);
  }
}

export function emitNotification(notification: any, recipientId: string) {
  if (!io) return;
  io.to(`user:${recipientId}`).emit('notification.created', notification);
}

export function emitUnreadCount(userId: string, unreadCount: number) {
  if (!io) return;
  io.to(`user:${userId}`).emit('notification.unreadCount', { unreadCount });
}
