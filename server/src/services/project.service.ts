import { prisma } from '../config/database';
import { ForbiddenError, NotFoundError } from '../utils/errors';
import { JwtPayload } from '../types';
import { Role } from '@prisma/client';

export class ProjectService {
  static async getAllProjects(user: JwtPayload) {
    if (user.role === Role.ADMIN) {
      return prisma.project.findMany({
        include: {
          client: { select: { id: true, name: true, company: true } },
          projectManager: { select: { id: true, name: true, email: true } },
          _count: { select: { tasks: true } },
        },
        orderBy: { createdAt: 'desc' },
      });
    }

    if (user.role === Role.PROJECT_MANAGER) {
      return prisma.project.findMany({
        where: { projectManagerId: user.userId },
        include: {
          client: { select: { id: true, name: true, company: true } },
          projectManager: { select: { id: true, name: true, email: true } },
          _count: { select: { tasks: true } },
        },
        orderBy: { createdAt: 'desc' },
      });
    }

    // DEVELOPER role: only projects with assigned tasks
    return prisma.project.findMany({
      where: {
        tasks: {
          some: { developerId: user.userId },
        },
      },
      include: {
        client: { select: { id: true, name: true, company: true } },
        projectManager: { select: { id: true, name: true, email: true } },
        _count: { select: { tasks: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  static async getProjectById(id: string, user: JwtPayload) {
    const project = await prisma.project.findUnique({
      where: { id },
      include: {
        client: true,
        projectManager: { select: { id: true, name: true, email: true } },
        tasks: {
          include: {
            developer: { select: { id: true, name: true, email: true } },
          },
          orderBy: { createdAt: 'desc' },
        },
        activityLogs: {
          take: 10,
          orderBy: { createdAt: 'desc' },
          include: {
            actor: { select: { id: true, name: true, role: true } },
          },
        },
      },
    });

    if (!project) {
      throw new NotFoundError('Project not found');
    }

    // Role-based visibility enforcement
    if (user.role === Role.PROJECT_MANAGER && project.projectManagerId !== user.userId) {
      throw new ForbiddenError('You do not have permission to view another Project Manager\'s project');
    }

    if (user.role === Role.DEVELOPER) {
      const hasAssignedTask = project.tasks.some((t) => t.developerId === user.userId);
      if (!hasAssignedTask) {
        throw new ForbiddenError('You do not have permission to view this project');
      }
      // Filter tasks array so Developer only sees assigned tasks
      project.tasks = project.tasks.filter((t) => t.developerId === user.userId);
    }

    return project;
  }

  static async createProject(
    data: { name: string; description: string; clientId: string; projectManagerId?: string },
    user: JwtPayload
  ) {
    if (user.role !== Role.ADMIN && user.role !== Role.PROJECT_MANAGER) {
      throw new ForbiddenError('Developers cannot create projects');
    }

    const pmId = user.role === Role.ADMIN ? (data.projectManagerId || user.userId) : user.userId;

    const project = await prisma.project.create({
      data: {
        name: data.name,
        description: data.description,
        clientId: data.clientId,
        projectManagerId: pmId,
      },
      include: {
        client: true,
        projectManager: { select: { id: true, name: true, email: true } },
      },
    });

    // Create activity log
    await prisma.activityLog.create({
      data: {
        projectId: project.id,
        actorId: user.userId,
        action: 'PROJECT_CREATED',
        message: `${user.name} created new project "${project.name}"`,
      },
    });

    return project;
  }

  static async updateProject(
    id: string,
    data: { name?: string; description?: string; clientId?: string; projectManagerId?: string },
    user: JwtPayload
  ) {
    const existing = await prisma.project.findUnique({ where: { id } });
    if (!existing) {
      throw new NotFoundError('Project not found');
    }

    if (user.role === Role.PROJECT_MANAGER && existing.projectManagerId !== user.userId) {
      throw new ForbiddenError('You can only update projects that you manage');
    }

    if (user.role === Role.DEVELOPER) {
      throw new ForbiddenError('Developers cannot modify project settings');
    }

    const updated = await prisma.project.update({
      where: { id },
      data,
      include: {
        client: true,
        projectManager: { select: { id: true, name: true, email: true } },
      },
    });

    await prisma.activityLog.create({
      data: {
        projectId: updated.id,
        actorId: user.userId,
        action: 'PROJECT_UPDATED',
        message: `${user.name} updated project details for "${updated.name}"`,
      },
    });

    return updated;
  }

  static async deleteProject(id: string, user: JwtPayload) {
    const existing = await prisma.project.findUnique({ where: { id } });
    if (!existing) {
      throw new NotFoundError('Project not found');
    }

    if (user.role === Role.PROJECT_MANAGER && existing.projectManagerId !== user.userId) {
      throw new ForbiddenError('You can only delete projects that you manage');
    }

    if (user.role === Role.DEVELOPER) {
      throw new ForbiddenError('Developers cannot delete projects');
    }

    await prisma.project.delete({ where: { id } });
    return { message: 'Project deleted successfully' };
  }
}
