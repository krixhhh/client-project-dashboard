import { Router } from 'express';
import { DashboardService } from '../services/dashboard.service';
import { requireAuth } from '../middleware/auth.middleware';
import { requireRole } from '../middleware/rbac.middleware';
import { sendSuccess } from '../utils/response';
import { AuthRequest } from '../types';
import { Role } from '@prisma/client';

const router = Router();

router.use(requireAuth);

router.get('/admin', requireRole(Role.ADMIN), async (_req, res, next) => {
  try {
    const data = await DashboardService.getAdminDashboard();
    return sendSuccess(res, data);
  } catch (err) {
    next(err);
  }
});

router.get('/project-manager', requireRole(Role.ADMIN, Role.PROJECT_MANAGER), async (req: AuthRequest, res, next) => {
  try {
    const data = await DashboardService.getPMDashboard(req.user!);
    return sendSuccess(res, data);
  } catch (err) {
    next(err);
  }
});

router.get('/developer', async (req: AuthRequest, res, next) => {
  try {
    const data = await DashboardService.getDeveloperDashboard(req.user!);
    return sendSuccess(res, data);
  } catch (err) {
    next(err);
  }
});

export default router;
