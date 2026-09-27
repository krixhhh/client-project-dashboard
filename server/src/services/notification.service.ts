import { prisma } from '../config/database';
import { NotFoundError, ForbiddenError } from '../utils/errors';
import { emitUnreadCount } from '../websocket/socket.server';

export class NotificationService {
  static async getUserNotifications(userId: string) {
    const notifications = await prisma.notification.findMany({
      where: { recipientId: userId },
      orderBy: { createdAt: 'desc' },
      take: 50,
    });

    const unreadCount = await prisma.notification.count({
      where: { recipientId: userId, isRead: false },
    });

    return { notifications, unreadCount };
  }

  static async markAsRead(id: string, userId: string) {
    const notif = await prisma.notification.findUnique({ where: { id } });
    if (!notif) {
      throw new NotFoundError('Notification not found');
    }

    if (notif.recipientId !== userId) {
      throw new ForbiddenError('Cannot mark another user\'s notification as read');
    }

    const updated = await prisma.notification.update({
      where: { id },
      data: {
        isRead: true,
        readAt: new Date(),
      },
    });

    const unreadCount = await prisma.notification.count({
      where: { recipientId: userId, isRead: false },
    });

    emitUnreadCount(userId, unreadCount);

    return { updated, unreadCount };
  }

  static async markAllAsRead(userId: string) {
    await prisma.notification.updateMany({
      where: { recipientId: userId, isRead: false },
      data: {
        isRead: true,
        readAt: new Date(),
      },
    });

    emitUnreadCount(userId, 0);

    return { message: 'All notifications marked as read', unreadCount: 0 };
  }
}
