import { PrismaClient } from '@prisma/client';
import dotenv from 'dotenv';

dotenv.config();

export const prisma = new PrismaClient({
  log: process.env.NODE_ENV === 'development' ? ['error', 'warn'] : ['error'],
});

export async function getPrismaClient(): Promise<PrismaClient> {
  try {
    await prisma.$connect();
    console.log('[Database] PostgreSQL connection established successfully.');
  } catch (err: any) {
    console.error('[Database] Connection notice:', err.message);
  }
  return prisma;
}
