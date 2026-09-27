import { prisma } from '../config/database';
import { JwtPayload } from '../types';
import { Role, TaskStatus, TaskPriority } from '@prisma/client';
import { getOnlineUsersCount, getOnlineUsers } from '../websocket/socket.server';

export class DashboardService {
  static async getAdminDashboard() {
    const now = new Date();

    const [
      totalProjects,
      totalTasks,
      totalUsers,
      totalClients,
      tasksByStatus,
      tasksByPriority,
      overdueCount,
      recentActivity,
    ] = await Promise.all([
      prisma.project.count(),
      prisma.task.count(),
      prisma.user.count(),
      prisma.client.count(),
      prisma.task.groupBy({
        by: ['status'],
        _count: { status: true },
      }),
      prisma.task.groupBy({
        by: ['priority'],
        _count: { priority: true },
      }),
      prisma.task.count({
        where: {
          status: { not: TaskStatus.DONE },
          dueDate: { lt: now },
        },
      }),
      prisma.activityLog.findMany({
        take: 10,
        orderBy: { createdAt: 'desc' },
        include: {
          actor: { select: { id: true, name: true, role: true } },
          project: { select: { id: true, name: true } },
          task: { select: { id: true, title: true } },
        },
      }),
    ]);

    const statusCounts = {
      TODO: 0,
      IN_PROGRESS: 0,
      IN_REVIEW: 0,
      DONE: 0,
    };
    tasksByStatus.forEach((item) => {
      statusCounts[item.status] = item._count.status;
    });

    const priorityCounts = {
      LOW: 0,
      MEDIUM: 0,
      HIGH: 0,
      CRITICAL: 0,
    };
    tasksByPriority.forEach((item) => {
      priorityCounts[item.priority] = item._count.priority;
    });

    return {
      metrics: {
        totalProjects,
        totalTasks,
        totalUsers,
        totalClients,
        overdueTasks: overdueCount,
        onlineUsersCount: getOnlineUsersCount(),
        onlineUsers: getOnlineUsers(),
      },
      statusCounts,
      priorityCounts,
      recentActivity,
    };
  }

  static async getPMDashboard(user: JwtPayload) {
    const now = new Date();
    const endOfWeek = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);

    const pmProjects = await prisma.project.findMany({
      where: { projectManagerId: user.userId },
      select: { id: true, name: true },
    });

    const projectIds = pmProjects.map((p) => p.id);

    const [
      totalProjects,
      tasksByStatus,
      tasksByPriority,
      upcomingTasks,
      overdueTasks,
      recentActivity,
    ] = await Promise.all([
      pmProjects.length,
      prisma.task.groupBy({
        by: ['status'],
        where: { projectId: { in: projectIds } },
        _count: { status: true },
      }),
      prisma.task.groupBy({
        by: ['priority'],
        where: { projectId: { in: projectIds } },
        _count: { priority: true },
      }),
      prisma.task.findMany({
        where: {
          projectId: { in: projectIds },
          status: { not: TaskStatus.DONE },
          dueDate: { gte: now, lte: endOfWeek },
        },
        include: {
          project: { select: { id: true, name: true } },
          developer: { select: { id: true, name: true } },
        },
        orderBy: { dueDate: 'asc' },
        take: 10,
      }),
      prisma.task.count({
        where: {
          projectId: { in: projectIds },
          status: { not: TaskStatus.DONE },
          dueDate: { lt: now },
        },
      }),
      prisma.activityLog.findMany({
        where: { projectId: { in: projectIds } },
        take: 10,
        orderBy: { createdAt: 'desc' },
        include: {
          actor: { select: { id: true, name: true, role: true } },
          project: { select: { id: true, name: true } },
          task: { select: { id: true, title: true } },
        },
      }),
    ]);

    const statusCounts = { TODO: 0, IN_PROGRESS: 0, IN_REVIEW: 0, DONE: 0 };
    tasksByStatus.forEach((item) => {
      statusCounts[item.status] = item._count.status;
    });

    const priorityCounts = { LOW: 0, MEDIUM: 0, HIGH: 0, CRITICAL: 0 };
    tasksByPriority.forEach((item) => {
      priorityCounts[item.priority] = item._count.priority;
    });

    return {
      metrics: {
        totalProjects,
        totalTasks: Object.values(statusCounts).reduce((a, b) => a + b, 0),
        overdueTasks,
      },
      statusCounts,
      priorityCounts,
      upcomingTasks,
      recentActivity,
    };
  }

  static async getDeveloperDashboard(user: JwtPayload) {
    const now = new Date();

    const [
      assignedTasks,
      tasksByStatus,
      tasksByPriority,
      recentActivity,
    ] = await Promise.all([
      prisma.task.findMany({
        where: { developerId: user.userId },
        include: {
          project: { select: { id: true, name: true } },
        },
        orderBy: { dueDate: 'asc' },
      }),
      prisma.task.groupBy({
        by: ['status'],
        where: { developerId: user.userId },
        _count: { status: true },
      }),
      prisma.task.groupBy({
        by: ['priority'],
        where: { developerId: user.userId },
        _count: { priority: true },
      }),
      prisma.activityLog.findMany({
        where: {
          OR: [{ task: { developerId: user.userId } }, { actorId: user.userId }],
        },
        take: 10,
        orderBy: { createdAt: 'desc' },
        include: {
          actor: { select: { id: true, name: true, role: true } },
          project: { select: { id: true, name: true } },
          task: { select: { id: true, title: true } },
        },
      }),
    ]);

    const statusCounts = { TODO: 0, IN_PROGRESS: 0, IN_REVIEW: 0, DONE: 0 };
    tasksByStatus.forEach((item) => {
      statusCounts[item.status] = item._count.status;
    });

    const priorityCounts = { LOW: 0, MEDIUM: 0, HIGH: 0, CRITICAL: 0 };
    tasksByPriority.forEach((item) => {
      priorityCounts[item.priority] = item._count.priority;
    });

    const overdueCount = assignedTasks.filter(
      (t) => t.status !== TaskStatus.DONE && t.dueDate < now
    ).length;

    return {
      metrics: {
        assignedTasksCount: assignedTasks.length,
        overdueTasksCount: overdueCount,
        inProgressCount: statusCounts.IN_PROGRESS,
        inReviewCount: statusCounts.IN_REVIEW,
      },
      statusCounts,
      priorityCounts,
      assignedTasks,
      recentActivity,
    };
  }
}
