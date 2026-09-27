import { Router } from 'express';
import { TaskService } from '../services/task.service';
import { requireAuth } from '../middleware/auth.middleware';
import { requireRole } from '../middleware/rbac.middleware';
import { validate } from '../middleware/validation.middleware';
import { createTaskSchema, updateTaskSchema, updateTaskStatusSchema } from '../validators/task.validator';
import { sendSuccess } from '../utils/response';
import { AuthRequest } from '../types';
import { Role } from '@prisma/client';

const router = Router();

router.use(requireAuth);

router.get('/', async (req: AuthRequest, res, next) => {
  try {
    const result = await TaskService.getTasks(req.user!, req.query as any);
    return sendSuccess(res, result);
  } catch (err) {
    next(err);
  }
});

router.get('/:id', async (req: AuthRequest, res, next) => {
  try {
    const task = await TaskService.getTaskById(req.params.id, req.user!);
    return sendSuccess(res, task);
  } catch (err) {
    next(err);
  }
});

router.post('/', requireRole(Role.ADMIN, Role.PROJECT_MANAGER), validate(createTaskSchema), async (req: AuthRequest, res, next) => {
  try {
    const task = await TaskService.createTask(req.body, req.user!);
    return sendSuccess(res, task, 201, 'Task created');
  } catch (err) {
    next(err);
  }
});

router.patch('/:id', requireRole(Role.ADMIN, Role.PROJECT_MANAGER), validate(updateTaskSchema), async (req: AuthRequest, res, next) => {
  try {
    const task = await TaskService.updateTask(req.params.id, req.body, req.user!);
    return sendSuccess(res, task);
  } catch (err) {
    next(err);
  }
});

router.patch('/:id/status', validate(updateTaskStatusSchema), async (req: AuthRequest, res, next) => {
  try {
    const { status } = req.body;
    const task = await TaskService.updateTaskStatus(req.params.id, status, req.user!);
    return sendSuccess(res, task, 200, 'Task status updated');
  } catch (err) {
    next(err);
  }
});

export default router;
