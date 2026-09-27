import { Router } from 'express';
import { ActivityService } from '../services/activity.service';
import { requireAuth } from '../middleware/auth.middleware';
import { sendSuccess } from '../utils/response';
import { AuthRequest } from '../types';

const router = Router();

router.use(requireAuth);

router.get('/', async (req: AuthRequest, res, next) => {
  try {
    const limit = req.query.limit ? parseInt(req.query.limit as string, 10) : 20;
    const activities = await ActivityService.getRecentActivities(req.user!, limit);
    return sendSuccess(res, activities);
  } catch (err) {
    next(err);
  }
});

export default router;
