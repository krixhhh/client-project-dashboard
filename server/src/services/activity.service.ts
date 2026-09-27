import { prisma } from '../config/database';
import { JwtPayload } from '../types';
import { Role, Prisma } from '@prisma/client';

export class ActivityService {
  static async getRecentActivities(user: JwtPayload, limit = 20) {
    const take = Math.max(1, Math.min(100, limit));

    const where: Prisma.ActivityLogWhereInput = {};

    if (user.role === Role.ADMIN) {
      // Admin sees all global activities
    } else if (user.role === Role.PROJECT_MANAGER) {
      // PM sees activities in projects they manage
      where.project = {
        projectManagerId: user.userId,
      };
    } else if (user.role === Role.DEVELOPER) {
      // Developer sees activities for tasks assigned to them OR actions they performed
      where.OR = [
        { task: { developerId: user.userId } },
        { actorId: user.userId },
      ];
    }

    const activities = await prisma.activityLog.findMany({
      where,
      take,
      orderBy: { createdAt: 'desc' },
      include: {
        actor: { select: { id: true, name: true, role: true } },
        project: { select: { id: true, name: true } },
        task: { select: { id: true, title: true, status: true } },
      },
    });

    return activities;
  }
}
