import { Router } from 'express';
import { NotificationService } from '../services/notification.service';
import { requireAuth } from '../middleware/auth.middleware';
import { sendSuccess } from '../utils/response';
import { AuthRequest } from '../types';

const router = Router();

router.use(requireAuth);

router.get('/', async (req: AuthRequest, res, next) => {
  try {
    const data = await NotificationService.getUserNotifications(req.user!.userId);
    return sendSuccess(res, data);
  } catch (err) {
    next(err);
  }
});

router.patch('/read-all', async (req: AuthRequest, res, next) => {
  try {
    const result = await NotificationService.markAllAsRead(req.user!.userId);
    return sendSuccess(res, result);
  } catch (err) {
    next(err);
  }
});

router.patch('/:id/read', async (req: AuthRequest, res, next) => {
  try {
    const result = await NotificationService.markAsRead(req.params.id, req.user!.userId);
    return sendSuccess(res, result);
  } catch (err) {
    next(err);
  }
});

export default router;
