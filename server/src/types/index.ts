import { Request } from 'express';
import { Role } from '@prisma/client';

export interface JwtPayload {
  userId: string;
  email: string;
  role: Role;
  name: string;
}

export interface AuthRequest extends Request {
  user?: JwtPayload;
}

export interface TaskQueryParams {
  status?: string;
  priority?: string;
  projectId?: string;
  developerId?: string;
  dueFrom?: string;
  dueTo?: string;
  search?: string;
  page?: string;
  limit?: string;
}
