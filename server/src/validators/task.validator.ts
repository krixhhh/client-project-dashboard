import { z } from 'zod';
import { TaskStatus, TaskPriority } from '@prisma/client';

export const createTaskSchema = z.object({
  projectId: z.string().uuid('Invalid project ID format'),
  title: z.string().min(2, 'Task title must be at least 2 characters'),
  description: z.string().min(3, 'Description must be at least 3 characters'),
  developerId: z.string().uuid().nullable().optional(),
  priority: z.nativeEnum(TaskPriority).default(TaskPriority.MEDIUM),
  status: z.nativeEnum(TaskStatus).default(TaskStatus.TODO),
  dueDate: z.string().refine((val) => !isNaN(Date.parse(val)), {
    message: 'Invalid ISO date string format for dueDate',
  }),
});

export const updateTaskSchema = z.object({
  title: z.string().min(2).optional(),
  description: z.string().min(3).optional(),
  developerId: z.string().uuid().nullable().optional(),
  priority: z.nativeEnum(TaskPriority).optional(),
  status: z.nativeEnum(TaskStatus).optional(),
  dueDate: z.string().refine((val) => !isNaN(Date.parse(val)), {
    message: 'Invalid ISO date string format for dueDate',
  }).optional(),
});

export const updateTaskStatusSchema = z.object({
  status: z.nativeEnum(TaskStatus),
});
