import { z } from 'zod';

export const createClientSchema = z.object({
  name: z.string().min(2, 'Client name must be at least 2 characters'),
  contactEmail: z.string().email('Invalid contact email format'),
  contactPhone: z.string().optional(),
  company: z.string().optional(),
});

export const updateClientSchema = z.object({
  name: z.string().min(2).optional(),
  contactEmail: z.string().email().optional(),
  contactPhone: z.string().optional(),
  company: z.string().optional(),
});
