import { Router } from 'express';
import { ProjectService } from '../services/project.service';
import { requireAuth } from '../middleware/auth.middleware';
import { requireRole } from '../middleware/rbac.middleware';
import { validate } from '../middleware/validation.middleware';
import { createProjectSchema, updateProjectSchema } from '../validators/project.validator';
import { sendSuccess } from '../utils/response';
import { AuthRequest } from '../types';
import { Role } from '@prisma/client';

const router = Router();

router.use(requireAuth);

router.get('/', async (req: AuthRequest, res, next) => {
  try {
    const projects = await ProjectService.getAllProjects(req.user!);
    return sendSuccess(res, projects);
  } catch (err) {
    next(err);
  }
});

router.get('/:id', async (req: AuthRequest, res, next) => {
  try {
    const project = await ProjectService.getProjectById(req.params.id, req.user!);
    return sendSuccess(res, project);
  } catch (err) {
    next(err);
  }
});

router.post('/', requireRole(Role.ADMIN, Role.PROJECT_MANAGER), validate(createProjectSchema), async (req: AuthRequest, res, next) => {
  try {
    const project = await ProjectService.createProject(req.body, req.user!);
    return sendSuccess(res, project, 201, 'Project created');
  } catch (err) {
    next(err);
  }
});

router.patch('/:id', requireRole(Role.ADMIN, Role.PROJECT_MANAGER), validate(updateProjectSchema), async (req: AuthRequest, res, next) => {
  try {
    const project = await ProjectService.updateProject(req.params.id, req.body, req.user!);
    return sendSuccess(res, project);
  } catch (err) {
    next(err);
  }
});

router.delete('/:id', requireRole(Role.ADMIN, Role.PROJECT_MANAGER), async (req: AuthRequest, res, next) => {
  try {
    const result = await ProjectService.deleteProject(req.params.id, req.user!);
    return sendSuccess(res, result);
  } catch (err) {
    next(err);
  }
});

export default router;
