import { prisma } from '../config/database';
import { ForbiddenError, NotFoundError, BadRequestError } from '../utils/errors';
import { JwtPayload, TaskQueryParams } from '../types';
import { Role, TaskStatus, TaskPriority, Prisma } from '@prisma/client';
import { emitActivity, emitNotification } from '../websocket/socket.server';

export class TaskService {
  static async getTasks(user: JwtPayload, params: TaskQueryParams) {
    const { status, priority, projectId, developerId, dueFrom, dueTo, search, page = '1', limit = '50' } = params;

    const where: Prisma.TaskWhereInput = {};

    // 1. Role-based scoping
    if (user.role === Role.DEVELOPER) {
      where.developerId = user.userId;
    } else if (user.role === Role.PROJECT_MANAGER) {
      where.project = { projectManagerId: user.userId };
      if (developerId) {
        where.developerId = developerId;
      }
    } else if (user.role === Role.ADMIN) {
      if (developerId) {
        where.developerId = developerId;
      }
    }

    if (projectId) {
      // Validate PM access to explicit project query
      if (user.role === Role.PROJECT_MANAGER) {
        const proj = await prisma.project.findUnique({ where: { id: projectId } });
        if (!proj || proj.projectManagerId !== user.userId) {
          throw new ForbiddenError('You do not have permission to view tasks for this project');
        }
      }
      where.projectId = projectId;
    }

    // 2. Filters
    if (status && Object.values(TaskStatus).includes(status as TaskStatus)) {
      where.status = status as TaskStatus;
    }

    if (priority && Object.values(TaskPriority).includes(priority as TaskPriority)) {
      where.priority = priority as TaskPriority;
    }

    if (dueFrom || dueTo) {
      where.dueDate = {};
      if (dueFrom) where.dueDate.gte = new Date(dueFrom);
      if (dueTo) where.dueDate.lte = new Date(dueTo);
    }

    if (search) {
      where.OR = [
        { title: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
      ];
    }

    const pageNum = Math.max(1, parseInt(page, 10));
    const limitNum = Math.max(1, Math.min(100, parseInt(limit, 10)));
    const skip = (pageNum - 1) * limitNum;

    const [tasks, total] = await Promise.all([
      prisma.task.findMany({
        where,
        include: {
          project: { select: { id: true, name: true, projectManagerId: true } },
          developer: { select: { id: true, name: true, email: true } },
        },
        orderBy: { dueDate: 'asc' },
        skip,
        take: limitNum,
      }),
      prisma.task.count({ where }),
    ]);

    return {
      tasks,
      pagination: {
        total,
        page: pageNum,
        limit: limitNum,
        totalPages: Math.ceil(total / limitNum),
      },
    };
  }

  static async getTaskById(id: string, user: JwtPayload) {
    const task = await prisma.task.findUnique({
      where: { id },
      include: {
        project: { select: { id: true, name: true, projectManagerId: true } },
        developer: { select: { id: true, name: true, email: true } },
        activityLogs: {
          take: 15,
          orderBy: { createdAt: 'desc' },
          include: { actor: { select: { id: true, name: true, role: true } } },
        },
      },
    });

    if (!task) {
      throw new NotFoundError('Task not found');
    }

    // Role checks
    if (user.role === Role.DEVELOPER && task.developerId !== user.userId) {
      throw new ForbiddenError('You do not have permission to access another developer\'s task');
    }

    if (user.role === Role.PROJECT_MANAGER && task.project.projectManagerId !== user.userId) {
      throw new ForbiddenError('You do not have permission to access tasks in another PM\'s project');
    }

    return task;
  }

  static async createTask(
    data: {
      projectId: string;
      title: string;
      description: string;
      developerId?: string | null;
      priority?: TaskPriority;
      status?: TaskStatus;
      dueDate: string;
    },
    user: JwtPayload
  ) {
    if (user.role === Role.DEVELOPER) {
      throw new ForbiddenError('Developers are not authorized to create tasks');
    }

    const project = await prisma.project.findUnique({ where: { id: data.projectId } });
    if (!project) {
      throw new NotFoundError('Project not found');
    }

    if (user.role === Role.PROJECT_MANAGER && project.projectManagerId !== user.userId) {
      throw new ForbiddenError('You can only create tasks in your own projects');
    }

    const task = await prisma.task.create({
      data: {
        projectId: data.projectId,
        title: data.title,
        description: data.description,
        developerId: data.developerId || null,
        priority: data.priority || TaskPriority.MEDIUM,
        status: data.status || TaskStatus.TODO,
        dueDate: new Date(data.dueDate),
      },
      include: {
        project: { select: { id: true, name: true, projectManagerId: true } },
        developer: { select: { id: true, name: true, email: true } },
      },
    });

    // Create activity log
    const activity = await prisma.activityLog.create({
      data: {
        projectId: task.projectId,
        taskId: task.id,
        actorId: user.userId,
        action: 'TASK_CREATED',
        newValue: task.status,
        message: `${user.name} created task "${task.title}"`,
      },
      include: {
        actor: { select: { id: true, name: true, role: true } },
      },
    });

    // Real-time broadcast
    emitActivity(activity, task.projectId, task.developerId);

    // Send notification if developer assigned
    if (task.developerId) {
      const notif = await prisma.notification.create({
        data: {
          recipientId: task.developerId,
          type: 'TASK_ASSIGNED',
          title: 'New Task Assigned',
          message: `You were assigned task "${task.title}" by ${user.name}`,
          relatedProjectId: task.projectId,
          relatedTaskId: task.id,
        },
      });
      emitNotification(notif, task.developerId);
    }

    return task;
  }

  static async updateTask(
    id: string,
    data: {
      title?: string;
      description?: string;
      developerId?: string | null;
      priority?: TaskPriority;
      status?: TaskStatus;
      dueDate?: string;
    },
    user: JwtPayload
  ) {
    const existing = await prisma.task.findUnique({
      where: { id },
      include: { project: { select: { id: true, name: true, projectManagerId: true } } },
    });

    if (!existing) {
      throw new NotFoundError('Task not found');
    }

    if (user.role === Role.DEVELOPER) {
      throw new ForbiddenError('Developers cannot modify general task fields. Use status update endpoint.');
    }

    if (user.role === Role.PROJECT_MANAGER && existing.project.projectManagerId !== user.userId) {
      throw new ForbiddenError('You can only update tasks in projects you manage');
    }

    const prevDev = existing.developerId;
    const newDev = data.developerId !== undefined ? data.developerId : existing.developerId;

    const updated = await prisma.task.update({
      where: { id },
      data: {
        ...(data.title && { title: data.title }),
        ...(data.description && { description: data.description }),
        ...(data.developerId !== undefined && { developerId: data.developerId }),
        ...(data.priority && { priority: data.priority }),
        ...(data.status && { status: data.status }),
        ...(data.dueDate && { dueDate: new Date(data.dueDate) }),
      },
      include: {
        project: { select: { id: true, name: true, projectManagerId: true } },
        developer: { select: { id: true, name: true, email: true } },
      },
    });

    // Log assignment change if developer changed
    if (newDev && newDev !== prevDev) {
      const activity = await prisma.activityLog.create({
        data: {
          projectId: updated.projectId,
          taskId: updated.id,
          actorId: user.userId,
          action: 'TASK_ASSIGNED',
          oldValue: prevDev || undefined,
          newValue: newDev,
          message: `${user.name} assigned "${updated.title}" to ${updated.developer?.name || 'Developer'}`,
        },
        include: { actor: { select: { id: true, name: true, role: true } } },
      });
      emitActivity(activity, updated.projectId, newDev);

      const notif = await prisma.notification.create({
        data: {
          recipientId: newDev,
          type: 'TASK_ASSIGNED',
          title: 'New Task Assignment',
          message: `You were assigned task "${updated.title}"`,
          relatedProjectId: updated.projectId,
          relatedTaskId: updated.id,
        },
      });
      emitNotification(notif, newDev);
    }

    return updated;
  }

  static async updateTaskStatus(id: string, newStatus: TaskStatus, user: JwtPayload) {
    const existing = await prisma.task.findUnique({
      where: { id },
      include: { project: { select: { id: true, name: true, projectManagerId: true } } },
    });

    if (!existing) {
      throw new NotFoundError('Task not found');
    }

    // Role checks
    if (user.role === Role.DEVELOPER && existing.developerId !== user.userId) {
      throw new ForbiddenError('You can only update status of tasks assigned to you');
    }

    if (user.role === Role.PROJECT_MANAGER && existing.project.projectManagerId !== user.userId) {
      throw new ForbiddenError('You can only update tasks in projects you manage');
    }

    const prevStatus = existing.status;
    if (prevStatus === newStatus) {
      return existing;
    }

    const updated = await prisma.task.update({
      where: { id },
      data: { status: newStatus },
      include: {
        project: { select: { id: true, name: true, projectManagerId: true } },
        developer: { select: { id: true, name: true, email: true } },
      },
    });

    // 1. Create Activity Log
    const activity = await prisma.activityLog.create({
      data: {
        projectId: updated.projectId,
        taskId: updated.id,
        actorId: user.userId,
        action: 'STATUS_CHANGED',
        oldValue: prevStatus,
        newValue: newStatus,
        message: `${user.name} moved "${updated.title}" from ${prevStatus.replace('_', ' ')} -> ${newStatus.replace('_', ' ')}`,
      },
      include: {
        actor: { select: { id: true, name: true, role: true } },
      },
    });

    // 2. Emit real-time WebSocket activity event
    emitActivity(activity, updated.projectId, updated.developerId);

    // 3. Notify Project Manager if developer moved task to IN_REVIEW
    if (newStatus === TaskStatus.IN_REVIEW && user.role === Role.DEVELOPER) {
      const pmId = existing.project.projectManagerId;
      const notif = await prisma.notification.create({
        data: {
          recipientId: pmId,
          type: 'TASK_IN_REVIEW',
          title: 'Task Ready for Review',
          message: `${user.name} moved task "${updated.title}" to In Review`,
          relatedProjectId: updated.projectId,
          relatedTaskId: updated.id,
        },
      });
      emitNotification(notif, pmId);
    }

    return updated;
  }
}
