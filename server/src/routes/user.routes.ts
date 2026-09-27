import { Router } from 'express';
import { UserService } from '../services/user.service';
import { requireAuth } from '../middleware/auth.middleware';
import { requireRole } from '../middleware/rbac.middleware';
import { validate } from '../middleware/validation.middleware';
import { createUserSchema, updateUserSchema } from '../validators/user.validator';
import { sendSuccess } from '../utils/response';
import { Role } from '@prisma/client';

const router = Router();

router.use(requireAuth);

router.get('/', async (_req, res, next) => {
  try {
    const users = await UserService.getAllUsers();
    return sendSuccess(res, users);
  } catch (err) {
    next(err);
  }
});

router.post('/', requireRole(Role.ADMIN), validate(createUserSchema), async (req, res, next) => {
  try {
    const user = await UserService.createUser(req.body);
    return sendSuccess(res, user, 201, 'User created');
  } catch (err) {
    next(err);
  }
});

router.patch('/:id', requireRole(Role.ADMIN), validate(updateUserSchema), async (req, res, next) => {
  try {
    const user = await UserService.updateUser(req.params.id, req.body);
    return sendSuccess(res, user);
  } catch (err) {
    next(err);
  }
});

router.delete('/:id', requireRole(Role.ADMIN), async (req, res, next) => {
  try {
    const result = await UserService.deleteUser(req.params.id);
    return sendSuccess(res, result);
  } catch (err) {
    next(err);
  }
});

export default router;
