import { prisma } from '../config/database';
import { NotFoundError } from '../utils/errors';

export class ClientService {
  static async getAllClients() {
    return prisma.client.findMany({
      include: {
        _count: {
          select: { projects: true },
        },
      },
      orderBy: { name: 'asc' },
    });
  }

  static async getClientById(id: string) {
    const client = await prisma.client.findUnique({
      where: { id },
      include: {
        projects: {
          include: {
            projectManager: {
              select: { id: true, name: true, email: true },
            },
          },
        },
      },
    });

    if (!client) {
      throw new NotFoundError('Client not found');
    }

    return client;
  }

  static async createClient(data: { name: string; contactEmail: string; contactPhone?: string; company?: string }) {
    return prisma.client.create({
      data,
    });
  }

  static async updateClient(id: string, data: { name?: string; contactEmail?: string; contactPhone?: string; company?: string }) {
    const existing = await prisma.client.findUnique({ where: { id } });
    if (!existing) {
      throw new NotFoundError('Client not found');
    }

    return prisma.client.update({
      where: { id },
      data,
    });
  }

  static async deleteClient(id: string) {
    const existing = await prisma.client.findUnique({ where: { id } });
    if (!existing) {
      throw new NotFoundError('Client not found');
    }

    await prisma.client.delete({ where: { id } });
    return { message: 'Client deleted successfully' };
  }
}
