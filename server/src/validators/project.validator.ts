import { z } from 'zod';

export const createProjectSchema = z.object({
  name: z.string().min(2, 'Project name must be at least 2 characters'),
  description: z.string().min(5, 'Description must be at least 5 characters'),
  clientId: z.string().uuid('Invalid client ID format'),
  projectManagerId: z.string().uuid('Invalid project manager ID format').optional(), // Admin can specify PM, PM defaults to self
});

export const updateProjectSchema = z.object({
  name: z.string().min(2).optional(),
  description: z.string().min(5).optional(),
  clientId: z.string().uuid().optional(),
  projectManagerId: z.string().uuid().optional(),
});
