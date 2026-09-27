import { Router } from 'express';
import { AuthService } from '../services/auth.service';
import { validate } from '../middleware/validation.middleware';
import { loginSchema } from '../validators/auth.validator';
import { requireAuth } from '../middleware/auth.middleware';
import { sendSuccess } from '../utils/response';
import { AuthRequest } from '../types';

const router = Router();

router.post('/login', validate(loginSchema), async (req, res, next) => {
  try {
    const { email, password } = req.body;
    const result = await AuthService.login(email, password, res);
    return sendSuccess(res, result, 200, 'Login successful');
  } catch (err) {
    next(err);
  }
});

router.post('/refresh', async (req, res, next) => {
  try {
    const refreshToken = req.cookies.refreshToken;
    const result = await AuthService.refreshToken(refreshToken, res);
    return sendSuccess(res, result, 200, 'Token refreshed');
  } catch (err) {
    next(err);
  }
});

router.post('/logout', async (req, res, next) => {
  try {
    const refreshToken = req.cookies.refreshToken;
    const result = await AuthService.logout(refreshToken, res);
    return sendSuccess(res, result, 200, 'Logged out');
  } catch (err) {
    next(err);
  }
});

router.get('/me', requireAuth, async (req: AuthRequest, res, next) => {
  try {
    const user = await AuthService.getMe(req.user!.userId);
    return sendSuccess(res, user);
  } catch (err) {
    next(err);
  }
});

export default router;
